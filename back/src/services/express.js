/**
 * @file Servidor Express do ChatBot da Central dos Resultados
 * @description Substitui Socket.io por REST API mantendo todas as funcionalidades
 * @version 2.0.0
 * @license MIT
 */

const express = require('express');
const cors = require('cors');
const { existsSync } = require("fs");
const QRCode = require("qrcode");
const { readFileSync } = require("fs");

const {
    montaMensagemCadastroValidacao,
    montaMensagemEnvioSenha,
    montaMensagemErroCadastroValidacao,
    montaMensagemErroEnvioSenha,
} = require("../helpers/funcoesAuxiliares");

const { statusMensagens, conexaoBot } = require("./conexaoZap");
const { vinculacaoes } = require("../components/vinculacoes");
const { notificaAdministrador, notificaConexao } = require('../helpers/notificaAdministrador');
const { contatosConfirmacao, configuracoes: config } = require("../config");
const { buscaTodosCriadores, buscarCriadoresSelecionados } = require("./conexao");
const mongoService = require("./mongodb");

// ===== CONFIGURAÇÃO EXPRESS =====
const app = express();

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ===== ESTADO DA APLICAÇÃO =====
let contato = {}; // Informações do contato WhatsApp conectado
let qrCodeAtual = null; // QR Code atual
let mensagensNovas = []; // Buffer de mensagens recebidas
let statusAtualizacoes = []; // Buffer de atualizações de status

/**
 * Monta o objeto de contato com informações do cliente do WhatsApp.
 */
const montaContato = async (clientBot) => {
    return new Promise((resolve) => {
        contato = {
            Conectado: true,
            status: "Conectado",
            telefone: clientBot.info.me.user,
        };
        resolve(contato);
    });
};

// ===== ROTAS DA API =====

/**
 * Health check
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'ChatBot WhatsApp',
        whatsappStatus: contato.status || 'Desconectado',
        timestamp: new Date().toISOString()
    });
});

/**
 * Obter status da conexão WhatsApp
 */
app.get('/api/status', (req, res) => {
    // Verificar se o WhatsApp está realmente conectado
    const realmenteConectado = !!(conexaoBot.clientBot && conexaoBot.clientBot.info);
    
    // Se não está conectado mas contato diz que sim, corrigir
    if (!realmenteConectado && contato.Conectado) {
        contato = {
            Conectado: false,
            status: "Desconectado"
        };
    }
    
    res.json({
        success: true,
        contato: contato,
        conectado: realmenteConectado,
        debug: {
            temClientBot: !!conexaoBot.clientBot,
            temInfo: !!(conexaoBot.clientBot && conexaoBot.clientBot.info)
        }
    });
});

/**
 * Obter QR Code para conexão
 */
app.get('/api/qrcode', (req, res) => {
    console.log('🔍 GET /api/qrcode - qrCodeAtual existe?', !!qrCodeAtual);
    console.log('🔍 qrCodeAtual length:', qrCodeAtual ? qrCodeAtual.length : 0);
    
    if (qrCodeAtual) {
        res.json({
            success: true,
            qrCode: qrCodeAtual,
            message: 'QR Code gerado com sucesso'
        });
    } else {
        res.json({
            success: false,
            message: 'QR Code não disponível. Inicie uma conexão primeiro.'
        });
    }
});

/**
 * Iniciar conexão com WhatsApp
 */
app.post('/api/conectar', async (req, res) => {
    try {
        const { nomeSessao = '', tipoInicializacao = 'padrao' } = req.body;
        await conectarZapBot(nomeSessao, tipoInicializacao);
        res.json({
            success: true,
            message: 'Conexão iniciada. Aguarde o QR Code.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Enviar mensagem individual
 */
app.post('/api/mensagens/enviar', async (req, res) => {
    try {
        const { numero, mensagem, imagem } = req.body;

        if (!numero || !mensagem) {
            return res.status(400).json({
                success: false,
                error: 'Número e mensagem são obrigatórios.'
            });
        }

        // Verificar se WhatsApp está conectado
        if (!conexaoBot.clientBot || !contato.Conectado) {
            return res.status(400).json({
                success: false,
                error: 'WhatsApp não está conectado. Conecte primeiro.',
                resultado: {
                    sucesso: false,
                    mensagem: 'WhatsApp não conectado'
                }
            });
        }

        console.log(`📤 Enviando mensagem para ${numero}...`);
        
        const retornoMensagem = await conexaoBot.enviarMensagem(
            numero,
            mensagem,
            imagem || undefined,
            3
        );

        console.log(`📤 Resultado do envio:`, retornoMensagem);

        res.json({
            success: true,
            resultado: retornoMensagem
        });
    } catch (error) {
        console.error(`❌ Erro ao enviar mensagem:`, error);
        res.status(500).json({
            success: false,
            error: error.message,
            resultado: {
                sucesso: false,
                mensagem: error.message
            }
        });
    }
});

/**
 * Buscar conversas do WhatsApp
 */
app.get('/api/conversas', async (req, res) => {
    try {
        if (!conexaoBot.clientBot) {
            return res.status(400).json({
                success: false,
                error: 'WhatsApp não conectado'
            });
        }

        const chats = await conexaoBot.clientBot.getChats();
        const conversas = chats.map(chat => ({
            id: chat.id._serialized,
            nome: chat.name || 'Sem nome',
            ultimaMensagem: chat.lastMessage?.body || '',
            timestamp: chat.timestamp || 0,
            naoLidas: chat.unreadCount || 0,
            tipo: chat.isGroup ? 'grupo' : 'individual'
        }));

        res.json({
            success: true,
            conversas: conversas
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Buscar mensagens de uma conversa específica
 */
app.get('/api/conversas/:chatId/mensagens', async (req, res) => {
    try {
        const { chatId } = req.params;
        const { limit = 50 } = req.query;

        if (!conexaoBot.clientBot) {
            return res.status(400).json({
                success: false,
                error: 'WhatsApp não conectado'
            });
        }

        const chat = await conexaoBot.clientBot.getChatById(chatId);
        const messages = await chat.fetchMessages({ limit: parseInt(limit) });

        const mensagens = messages.map(msg => ({
            id: msg.id.id,
            from: msg.from,
            to: msg.to,
            body: msg.body,
            timestamp: msg.timestamp,
            fromMe: msg.fromMe,
            type: msg.type,
            hasMedia: msg.hasMedia,
            ack: msg.ack
        }));

        res.json({
            success: true,
            mensagens: mensagens
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Buscar novas mensagens recebidas (para polling)
 */
app.get('/api/mensagens/novas', (req, res) => {
    const novas = [...mensagensNovas];
    mensagensNovas = []; // Limpa o buffer
    res.json({
        success: true,
        mensagens: novas
    });
});

/**
 * Buscar atualizações de status (para polling)
 */
app.get('/api/mensagens/status-updates', (req, res) => {
    const updates = [...statusAtualizacoes];
    statusAtualizacoes = []; // Limpa o buffer
    res.json({
        success: true,
        updates: updates
    });
});

/**
 * Enviar mensagem de validação
 * Equivalente ao Socket.io 'enviarValidacaoCadastro'
 */
app.post('/api/validacao/enviar', async (req, res) => {
    try {
        const { nome, telefone } = req.body;

        if (!nome || !telefone) {
            return res.status(400).json({
                success: false,
                error: 'Nome e telefone são obrigatórios.'
            });
        }

        // Monta a mensagem de validação
        const dadosEnviar = montaMensagemCadastroValidacao({ nome, telefone });
        
        // Envia a mensagem via WhatsApp
        const envio = await conexaoBot.enviarMensagem(
            telefone,
            dadosEnviar.texto,
            dadosEnviar.logo
        );

        // Salva no MongoDB independente de erro ou sucesso
        try {
            const dadosSalvar = {
                telefone: telefone,
                nome: nome,
                status_mensagem: envio.erro ? 'Erro' : 'Enviada',
                id_mensagem: envio.id || null
            };
            
            const resultadoSalvar = await mongoService.salvarValidacaoCadastro(dadosSalvar);
            console.log("Validação de cadastro salva no MongoDB:", resultadoSalvar.id);
            
            // Se a mensagem foi enviada com sucesso, iniciar monitoramento adicional
            if (envio.id && !envio.erro) {
                try {
                    console.log(`[Express] Iniciando monitoramento adicional para validação ${envio.id}`);
                    await conexaoBot.monitorarStatusMensagem(
                        envio.id, 
                        telefone, 
                        dadosEnviar.texto || '[Mensagem de validação]', 
                        5 // 5 minutos timeout
                    );
                } catch (monitorError) {
                    console.warn('[Express] Erro ao iniciar monitoramento adicional da validação:', monitorError);
                }
            }
            
        } catch (mongoError) {
            console.error("Erro ao salvar validação no MongoDB:", mongoError);
        }

        // Se houver erro, notifica os contatos de confirmação
        if (envio.erro !== undefined) {
            const { montaMensagemErroCadastroValidacao } = require('../helpers/funcoesAuxiliares');
            const { contatosConfirmacao } = require('../config');
            
            for (const item of contatosConfirmacao) {
                console.log(montaMensagemErroCadastroValidacao({ nome, telefone }));
                const dadosErro = montaMensagemErroCadastroValidacao({ nome, telefone });
                await conexaoBot.enviarMensagem(item.telefone, dadosErro.texto);
            }
        }

        res.json({
            success: !envio.erro,
            resultado: envio
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Enviar mensagem de senha
 * Equivalente ao Socket.io 'enviarSenhaProvisoriaCriador'
 */
app.post('/api/senha/enviar', async (req, res) => {
    try {
        const { nome, cpf, telefone, usuario, senha_provisoria } = req.body;

        if (!telefone) {
            return res.status(400).json({
                success: false,
                error: 'Telefone é obrigatório.'
            });
        }

        const args = { nome, cpf, telefone, usuario, senha_provisoria };
        
        // Monta a mensagem de envio de senha
        const dadosEnviar = montaMensagemEnvioSenha(args);
        
        // Envia a mensagem via WhatsApp
        const retornoMensagem = await conexaoBot.enviarMensagem(
            telefone,
            dadosEnviar.texto,
            dadosEnviar.logo,
            3 // Número de tentativas de envio
        );

        // Salvar no MongoDB independente de erro ou sucesso
        try {
            await mongoService.salvarEnvioSenha({
                telefone: telefone,
                nome: nome,
                status_mensagem: retornoMensagem.erro ? 'Erro' : 'Enviada',
                id_mensagem: retornoMensagem.id || null
            });
            console.log("Envio de senha salvo no MongoDB");
        } catch (mongoError) {
            console.error("Erro ao salvar envio de senha no MongoDB:", mongoError);
        }

        // Se houver erro, notifica os contatos de confirmação
        if (retornoMensagem.erro !== undefined) {
            const { montaMensagemErroEnvioSenha } = require('../helpers/funcoesAuxiliares');
            const { contatosConfirmacao } = require('../config');
            
            for (const item of contatosConfirmacao) {
                console.log(montaMensagemErroEnvioSenha(args));
                const dadosErro = montaMensagemErroEnvioSenha(args);
                await conexaoBot.enviarMensagem(item.telefone, dadosErro.texto);
            }
        }

        res.json({
            success: !retornoMensagem.erro,
            resultado: retornoMensagem
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Buscar todos os criadores
 */
app.get('/api/criadores', async (req, res) => {
    try {
        const criadores = await buscaTodosCriadores();
        res.json({
            success: true,
            criadores: criadores
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Buscar criadores selecionados
 */
app.post('/api/criadores/selecionados', async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({
                success: false,
                error: 'Array de IDs é obrigatório.'
            });
        }

        const criadores = await buscarCriadoresSelecionados(ids);
        res.json({
            success: true,
            criadores: criadores
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Buscar envios pendentes (validações, senhas, mensagens)
 */
app.get('/api/envios/pendentes', async (req, res) => {
    try {
        const { tipo } = req.query; // 'validacao', 'senha', 'mensagem' ou 'todos'

        let pendentes = {};

        if (!tipo || tipo === 'todos' || tipo === 'validacao') {
            pendentes.validacoes = await mongoService.buscaTodosPendentes('tb_envio_validacoes');
        }

        if (!tipo || tipo === 'todos' || tipo === 'senha') {
            pendentes.senhas = await mongoService.buscaTodosPendentes('tb_envio_senhas');
        }

        if (!tipo || tipo === 'todos' || tipo === 'mensagem') {
            pendentes.mensagens = await mongoService.buscaTodosPendentes('tb_envio_mensagens');
        }

        res.json({
            success: true,
            pendentes: pendentes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Buscar histórico de mensagens do MongoDB
 */
app.get('/api/historico/mensagens', async (req, res) => {
    try {
        const { tabela = 'tb_envio_mensagens', limit = 100, offset = 0 } = req.query;

        const historico = await mongoService.buscarHistorico(
            tabela,
            parseInt(limit),
            parseInt(offset)
        );

        res.json({
            success: true,
            historico: historico
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Notificar administrador
 */
app.post('/api/notificar/administrador', async (req, res) => {
    try {
        const { mensagem } = req.body;

        if (!mensagem) {
            return res.status(400).json({
                success: false,
                error: 'Mensagem é obrigatória.'
            });
        }

        await notificaAdministrador(mensagem);

        res.json({
            success: true,
            message: 'Notificação enviada ao administrador'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== FUNÇÃO DE CONEXÃO WHATSAPP =====

const conectarZapBot = async (nomeSessao, tipoInicializacao = "padrao") => {
    console.log("Conectando ao WhatsApp");
    await conexaoBot.pegaClientBot();

    // Evento: QR Code gerado
    conexaoBot.clientBot.on("qr", (qr) => {
        if (tipoInicializacao == "sistema") {
            console.log("Reiniciando pelo Sistema");
            return false;
        }

        console.log("Gerando QRCode");
        console.log("🔍 QR string recebida, length:", qr ? qr.length : 0);
        
        QRCode.toDataURL(qr)
            .then((base64) => {
                qrCodeAtual = base64; // Armazena o QR Code
                console.log("✅ QR Code convertido! Length:", base64.length);
                console.log("✅ qrCodeAtual setado! Disponível em GET /api/qrcode");
                console.log("🔍 Teste imediato - qrCodeAtual existe?", !!qrCodeAtual);
            })
            .catch((err) => {
                console.log("❌ Erro ao converter QR Code:", err);
            });
    });

    // Evento: WhatsApp conectado e pronto
    conexaoBot.clientBot.on("ready", async () => {
        console.log("Pronto");
        contato = await montaContato(conexaoBot.clientBot);
        qrCodeAtual = null; // Limpa o QR Code
        
        await notificaConexao(tipoInicializacao === 'sistema');
        
        // Iniciar sistema de verificação periódica de reenvios automáticos
        try {
            conexaoBot.iniciarVerificacaoPeriodicaReenvios();
        } catch (error) {
            console.error('Erro ao iniciar verificação periódica de reenvios:', error);
        }
    });

    // Evento: Mensagem recebida
    conexaoBot.clientBot.on("message", async (message) => {
        console.log("Recebendo Mensagem");

        // Adiciona ao buffer de mensagens novas (para polling)
        if (!message.fromMe) {
            const messageData = {
                id: message.id.id,
                from: message.from,
                body: message.body,
                timestamp: message.timestamp,
                type: message.type,
                hasMedia: message.hasMedia
            };
            mensagensNovas.push(messageData);

            // Limita o buffer a 100 mensagens
            if (mensagensNovas.length > 100) {
                mensagensNovas.shift();
            }
        }

        // Teste de Conexão
        if (message._data.body == "Teste Conexão") {
            const destinatarioRetorno = message._data.from
                .split("@")[0]
                .substring(2, 13);
            conexaoBot.enviarMensagem(
                destinatarioRetorno,
                "Conexão Ativa, obrigado por consultar",
            );
        }

        // Processa a mensagem
        conexaoBot.recebeMensagem(message);
    });

    // Evento: Atualização de status de mensagem
    conexaoBot.clientBot.on("message_ack", async (mensagem) => {
        const id = mensagem.id.id;
        const info = await mensagem.getInfo();

        try {
            const altera = {
                enviado: info.deliveryRemaining <= 0,
                lida: info.readRemaining <= 0,
            };

            statusMensagens.setMensagem(id, altera);

            // Adiciona ao buffer de atualizações (para polling)
            let status = 'sent';
            if (altera.lida) {
                status = 'read';
            } else if (altera.enviado) {
                status = 'delivered';
            }
            
            statusAtualizacoes.push({
                messageId: id,
                status: status,
                timestamp: Date.now()
            });

            // Limita o buffer a 100 atualizações
            if (statusAtualizacoes.length > 100) {
                statusAtualizacoes.shift();
            }

            // Atualizar status no MongoDB
            let novoStatus = 'Enviada';
            if (altera.lida) {
                novoStatus = 'Lida';
            } else if (altera.enviado) {
                novoStatus = 'Entregue';
            }

            const tabelas = ['tb_envio_validacoes', 'tb_envio_senhas', 'tb_envio_mensagens'];
            
            for (const tabela of tabelas) {
                try {
                    await mongoService.atualizarStatusMensagem(tabela, id, novoStatus);
                } catch {
                    console.log(`[MongoDB] Mensagem ${id} não encontrada em ${tabela}`);
                }
            }

        } catch (e) {
            console.error("Erro ao processar message_ack:", e);
        }
    });

    // Inicializa a conexão com o WhatsApp
    conexaoBot.clientBot.initialize();
};

// ===== INICIALIZAÇÃO =====

(async () => {
    console.log("Iniciando servidor Express");

    console.log("Criando a conexão WhatsApp");
    await conexaoBot.pegaClientBot();
    vinculacaoes.populaVinculacoes();

    // Verifica se há conexão salva localmente
    const reconectar = conexaoBot.clientBot.info == undefined && existsSync("./.wwebjs_auth");
    if (reconectar) {
        console.log("Reconectando no Recarregamento");
        await conectarZapBot("", "sistema");
    } else {
        console.log("Não Conectando");
    }

    // Inicia o servidor Express
    const PORT = config.porta || 11001;
    
    if (config.funcionamento === "local") {
        app.listen(PORT, () => {
            console.log(`🚀 Servidor Express rodando na porta ${PORT}`);
            console.log(`📋 API disponível em http://localhost:${PORT}/health`);
            console.log('\n📝 Endpoints disponíveis:');
            console.log('  GET    /health                           - Health check');
            console.log('  GET    /api/status                       - Status da conexão');
            console.log('  GET    /api/qrcode                       - Obter QR Code');
            console.log('  POST   /api/conectar                     - Iniciar conexão');
            console.log('  POST   /api/mensagens/enviar             - Enviar mensagem');
            console.log('  GET    /api/conversas                    - Listar conversas');
            console.log('  GET    /api/conversas/:id/mensagens      - Mensagens de conversa');
            console.log('  GET    /api/mensagens/novas              - Novas mensagens (polling)');
            console.log('  GET    /api/mensagens/status-updates     - Atualizações de status');
            console.log('  POST   /api/validacao/enviar             - Enviar validação');
            console.log('  POST   /api/senha/enviar                 - Enviar senha');
            console.log('  GET    /api/criadores                    - Listar criadores');
            console.log('  POST   /api/criadores/selecionados       - Buscar criadores selecionados');
            console.log('  GET    /api/envios/pendentes             - Envios pendentes');
            console.log('  GET    /api/historico/mensagens          - Histórico de mensagens');
            console.log('  POST   /api/notificar/administrador      - Notificar administrador');
            console.log('\n');
        });
    } else {
        // HTTPS para produção
        const https = require('https');
        const httpsServer = https.createServer({
            key: readFileSync("/etc/letsencrypt/live/chatbot.centraldosresultados.com/privkey.pem"),
            cert: readFileSync("/etc/letsencrypt/live/chatbot.centraldosresultados.com/fullchain.pem"),
        }, app);

        httpsServer.listen(PORT, () => {
            console.log(`🚀 Servidor Express HTTPS rodando na porta ${PORT}`);
            console.log(`📋 API disponível em https://chatbot.centraldosresultados.com/health`);
        });
    }
})();

module.exports = app;

