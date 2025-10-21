/**
 * @file Servidor Express do ChatBot da Central dos Resultados
 * @description Substitui Socket.io por REST API mantendo todas as funcionalidades
 * @version 2.0.0
 * @license MIT
 */

import express from 'express';
import cors from 'cors';
import { existsSync, readFileSync, rmSync } from 'fs';
import https from 'https';
import QRCode from 'qrcode';

import {
    montaMensagemCadastroValidacao,
    montaMensagemEnvioSenha,
    montaMensagemErroCadastroValidacao,
    montaMensagemErroEnvioSenha,
} from "./src/helpers/funcoesAuxiliares.js";

import { conexaoBot, statusMensagens } from "./src/services/conexaoZap.js";
import { vinculacaoes } from "./src/components/vinculacoes.js";
import { notificaAdministrador, notificaConexao } from './src/helpers/notificaAdministrador.js';
import { contatosConfirmacao, configuracoes as config } from "./src/config.js";
import { buscaTodosCriadores, buscarCriadoresSelecionados } from "./src/services/conexao.js";
import mongoService from "./src/services/mongodb.js";

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
let conversasCache = {}; // Cache de conversas (substituindo getChats do whatsapp-web.js)

// Listener para mensagens recebidas (captura eventos do Baileys)
global.onMessageReceived = (msg) => {
    try {
        const chatId = msg.key.remoteJid;
        const texto = msg.message?.conversation 
            || msg.message?.extendedTextMessage?.text 
            || msg.message?.imageMessage?.caption
            || '[Mídia]';
        
        const numeroLimpo = chatId.split('@')[0].replace('55', '');
        
        // Adicionar ao cache de conversas
        if (!conversasCache[chatId]) {
            conversasCache[chatId] = {
                id: chatId,
                nome: numeroLimpo,
                ultimaMensagem: texto.substring(0, 50),
                timestamp: Date.now(),
                naoLidas: 1,
                tipo: chatId.includes('@g.us') ? 'grupo' : 'individual'
            };
        } else {
            conversasCache[chatId].ultimaMensagem = texto.substring(0, 50);
            conversasCache[chatId].timestamp = Date.now();
            if (!msg.key.fromMe) {
                conversasCache[chatId].naoLidas = (conversasCache[chatId].naoLidas || 0) + 1;
            }
        }
        
        // Adicionar ao buffer de mensagens novas para polling
        if (!msg.key.fromMe) {
            const messageData = {
                id: msg.key.id,
                from: chatId,
                body: texto,
                timestamp: msg.messageTimestamp || Date.now(),
                type: Object.keys(msg.message)[0],
                hasMedia: !!(msg.message.imageMessage || msg.message.videoMessage || msg.message.audioMessage)
            };
            mensagensNovas.push(messageData);

            // Limita o buffer a 100 mensagens
            if (mensagensNovas.length > 100) {
                mensagensNovas.shift();
            }
        }
        
        console.log(`[Express] Mensagem adicionada ao cache: ${chatId}`);
    } catch (error) {
        console.error('[Express] Erro ao processar mensagem recebida:', error);
    }
};

/**
 * Monta o objeto de contato com informações do cliente do WhatsApp (Baileys).
 */
const montaContato = async () => {
    return new Promise((resolve) => {
        contato = {
            Conectado: true,
            status: "Conectado",
            telefone: conexaoBot.connectedNumber,
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
    // Com Baileys, verificar usando connectionStatus e info
    const realmenteConectado = conexaoBot.connectionStatus === 'connected' && !!conexaoBot.info;
    
    // Se não está conectado mas contato diz que sim, corrigir
    if (!realmenteConectado && contato.Conectado) {
        contato = {
            Conectado: false,
            status: "Desconectado"
        };
    }
    
    // Se está conectado e contato não está atualizado, atualizar
    if (realmenteConectado && !contato.Conectado && conexaoBot.info) {
        contato = {
            Conectado: true,
            status: "Conectado",
            telefone: conexaoBot.connectedNumber
        };
    }
    
    res.json({
        success: true,
        contato: contato,
        conectado: realmenteConectado,
        debug: {
            connectionStatus: conexaoBot.connectionStatus,
            temSock: !!conexaoBot.sock,
            temInfo: !!conexaoBot.info,
            numero: conexaoBot.connectedNumber
        }
    });
});

/**
 * Obter QR Code para conexão
 */
app.get('/api/qrcode', async (req, res) => {
    console.log('🔍 GET /api/qrcode');
    console.log('🔍 conexaoBot.qrCodeData existe?', !!conexaoBot.qrCodeData);
    
    if (!conexaoBot.qrCodeData) {
        return res.json({
            success: false,
            message: "QR Code não disponível. Inicie uma conexão primeiro.",
            qrCode: null
        });
    }

    try {
        // Converter QR string para imagem base64
        const qrImage = await QRCode.toDataURL(conexaoBot.qrCodeData);
        
        res.json({
            success: true,
            qrCode: qrImage
        });
    } catch (error) {
        console.error('❌ Erro ao gerar QR Code:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao gerar QR Code'
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
 * Desconectar WhatsApp (sem remover credenciais)
 */
app.post('/api/disconnect', async (req, res) => {
    try {
        if (conexaoBot.sock) {
            await conexaoBot.sock.end();
            console.log('[Express] Conexão fechada (credenciais mantidas)');
        }
        
        contato = {
            Conectado: false,
            status: "Desconectado"
        };
        
        res.json({
            success: true,
            message: 'Desconectado com sucesso. Use /api/conectar para reconectar.'
        });
    } catch (error) {
        console.error('[Express] Erro ao desconectar:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao desconectar: ' + error.message
        });
    }
});

/**
 * Deslogar do WhatsApp (remove credenciais completamente)
 */
app.post('/api/logout', async (req, res) => {
    try {
        if (conexaoBot.sock) {
            await conexaoBot.sock.logout();
            console.log('[Express] Deslogado do WhatsApp (credenciais removidas)');
        }
        
        contato = {
            Conectado: false,
            status: "Desconectado"
        };
        
        // Limpar pasta de credenciais
        const authPath = './auth_info_baileys';
        if (existsSync(authPath)) {
            rmSync(authPath, { recursive: true, force: true });
        }
        
        res.json({
            success: true,
            message: 'Deslogado com sucesso. Será necessário novo QR Code.'
        });
    } catch (error) {
        console.error('[Express] Erro ao deslogar:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao deslogar: ' + error.message
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

        // Adicionar ao cache de conversas se enviado com sucesso
        if (retornoMensagem.sucesso && retornoMensagem.numero) {
            const chatId = retornoMensagem.numero; // JID completo
            const numeroLimpo = numero.replace(/\D/g, '');
            
            if (!conversasCache[chatId]) {
                conversasCache[chatId] = {
                    id: chatId,
                    nome: numeroLimpo,
                    ultimaMensagem: mensagem.substring(0, 50),
                    timestamp: Date.now(),
                    naoLidas: 0,
                    tipo: 'individual'
                };
            } else {
                conversasCache[chatId].ultimaMensagem = mensagem.substring(0, 50);
                conversasCache[chatId].timestamp = Date.now();
            }
        }

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
        if (!conexaoBot.sock || conexaoBot.connectionStatus !== 'connected') {
            return res.status(400).json({
                success: false,
                error: 'WhatsApp não conectado'
            });
        }

        // Baileys não mantém store automático - usar cache baseado em mensagens
        console.log('[Express] Retornando conversas do cache');
        
        // Converter cache de objeto para array
        const conversas = Object.values(conversasCache).sort((a, b) => {
            return (b.timestamp || 0) - (a.timestamp || 0);
        });

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

        if (!conexaoBot.sock || conexaoBot.connectionStatus !== 'connected') {
            return res.status(400).json({
                success: false,
                error: 'WhatsApp não conectado'
            });
        }

        // NOTA: Baileys não mantém store de mensagens automaticamente
        console.warn('[Express] getChatById(): Baileys não tem método built-in. Retornando array vazio.');
        const messages = [];

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
 */
app.post('/api/validacao/enviar', async (req, res) => {
    console.log("Enviando mensagem de validação");
    console.log(req.body);
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
            // Importações já feitas no topo
            
            for (const item of contatosConfirmacao) {
                console.log(montaMensagemErroCadastroValidacao({ nome, telefone }));
                const dadosErro = montaMensagemErroCadastroValidacao({ nome, telefone });
                await conexaoBot.enviarMensagem(item.telefone, dadosErro.texto);
            }
        }

        // Adicionar ao cache se enviado com sucesso
        if (envio.sucesso && envio.numero) {
            const chatId = envio.numero;
            const numeroLimpo = telefone.replace(/\D/g, '');
            
            conversasCache[chatId] = {
                id: chatId,
                nome: nome || numeroLimpo,
                ultimaMensagem: 'Validação de cadastro enviada',
                timestamp: Date.now(),
                naoLidas: 0,
                tipo: 'individual'
            };
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
            // Importações já feitas no topo
            
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
    console.log("[Express] Iniciando conexão WhatsApp via Baileys...");
    
    // Com Baileys, apenas chamamos pegaClientBot que já inicializa tudo
    // Os eventos (qr, ready, message, message_ack) são gerenciados internamente no conexaoZap.js
    await conexaoBot.pegaClientBot();
    
    console.log("[Express] Conexão WhatsApp iniciada. Aguardando QR Code ou reconexão automática.");
    console.log("[Express] Os eventos são gerenciados pelo Baileys internamente.");
};

// ===== INICIALIZAÇÃO =====

(async () => {
    console.log("Iniciando servidor Express");

    console.log("Criando a conexão WhatsApp");
    await conexaoBot.pegaClientBot();
    vinculacaoes.populaVinculacoes();

    // Verifica se há conexão salva localmente (Baileys usa auth_info_baileys)
    const reconectar = !conexaoBot.info && existsSync("./auth_info_baileys");
    if (reconectar) {
        console.log("Reconectando no Recarregamento (usando credenciais Baileys salvas)");
        await conectarZapBot("", "sistema");
    } else {
        console.log("Sem credenciais salvas. Aguardando comando de conexão manual.");
    }

    // Inicia o servidor Express
    const PORT = config.porta || 3100;
    
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

    export default app;

