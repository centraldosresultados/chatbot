/**
 * @file Script principal do ChatBot da Central dos Resultados.
 * @description Este arquivo é responsável por inicializar o bot, conectar-se ao WhatsApp,
 * gerenciar a comunicação via Socket.io e processar as mensagens recebidas e enviadas.
 * @version 1.0.0
 * @license MIT
 */

/**
 * Sistema de ChatBot da Central dos Resultados
 * Utilizado como integração entre inicialmente para a Central dos Criadores
 */
const { existsSync } = require("fs");
const QRCode = require("qrcode");

const {
    montaMensagemCadastroValidacao,
    montaMensagemEnvioSenha,
    montaMensagemErroCadastroValidacao,
    montaMensagemErroEnvioSenha,
} = require("./src/helpers/funcoesAuxiliares");

const { statusMensagens, conexaoBot } = require("./src/services/conexaoZap");
const { conexaoIo } = require("./src/services/socket");
const { vinculacaoes } = require("./src/components/vinculacoes");
const { notificaAdministrador, notificaConexao } = require('./src/helpers/notificaAdministrador');

const { contatosConfirmacao } = require("./src/config");
const { buscaTodosCriadores, buscarCriadoresSelecionados } = require("./src/services/conexao");
const mongoService = require("./src/services/mongodb");

/** @type {import('socket.io').Socket | undefined} */
let socket = undefined; // Variável para armazenar a instância do socket conectado.
/** @type {Object} */
let contato = {}; // Objeto para armazenar informações do contato do WhatsApp conectado.

/**
 * Monta o objeto de contato com informações do cliente do WhatsApp.
 * @async
 * @param {import('whatsapp-web.js').Client} clientBot - Instância do cliente do WhatsApp.
 * @returns {Promise<Object>} Uma Promise que resolve com o objeto de contato.
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

/**
 * Função auto-executável assíncrona para inicializar o bot.
 * @async
 */
(async () => {
    console.log("Iniciando");

   // console.log(await buscaTodosCriadores());
    console.log("Gerando conexao Socket");
    // await conexaoIo.pegaConexao(); // This is now handled by attaching to the HTTP server
    console.log("Criando a conexao WahtsApp");



    await conexaoBot.pegaClientBot(); // Prepara o cliente do WhatsApp.
    vinculacaoes.populaVinculacoes(); // Carrega as vinculações pendentes.

    /**
     * Conecta ao WhatsApp, configura os eventos do cliente e inicializa a sessão.
     * @async
     * @param {string} nomeSessao - Nome da sessão do WhatsApp (atualmente não utilizado de forma significativa).
     * @param {string} [tipoInicializacao="padrao"] - Tipo de inicialização ("padrao" ou "sistema").
     *                                                "sistema" indica uma reconexão automática.
     */
    const conectarZapBot = async (nomeSessao, tipoInicializacao = "padrao") => {
        console.log("Conectando ao WhatsApp");
        /**Gerando QRCode quando solicitado */
        await conexaoBot.pegaClientBot(); // Garante que o cliente WhatsApp está pronto.

        // Evento disparado quando o QR Code é gerado para autenticação.
        conexaoBot.clientBot.on("qr", (qr) => {
            if (tipoInicializacao == "sistema") {
                console.log("Reiniciando pelo Sistema");
                return false; // Impede a emissão do QR Code em reconexões automáticas.
            }

            console.log("Gerando QRCode");
            QRCode.toDataURL(qr) // Converte o QR Code para base64.
                .then((base64) => {
                    /**Envia ao Cliente o QRCode para conexao ao WhatsApp */
                    if (socket) socket.emit("qrCode", base64); // Emite o QR Code para o cliente via Socket.io.
                })
                .catch((err) => {
                    console.log(err);
                });
        });

        /**Quando a Conexao com WP esta pronta */
        // Evento disparado quando o cliente do WhatsApp está pronto e conectado.
        conexaoBot.clientBot.on("ready", async () => {
            console.log("Pronto");
            contato = await montaContato(conexaoBot.clientBot); // Atualiza as informações de contato.
            // Notifica o administrador sobre nova conexão ou reconexão
            await notificaConexao(tipoInicializacao === 'sistema');
            // Sempre emite o status de conexão para o cliente, independente do tipo de inicialização
            if (socket) socket.emit("mudancaStatus", contato);
            
            // Iniciar sistema de verificação periódica de reenvios automáticos
            try {
                conexaoBot.iniciarVerificacaoPeriodicaReenvios();
            } catch (error) {
                console.error('Erro ao iniciar verificação periódica de reenvios:', error);
            }
        });

        /**Ao receber mensagens */
        // Evento disparado quando uma nova mensagem é recebida.
        conexaoBot.clientBot.on("message", async (message) => {
            console.log("Recebendo Mensagem");

            // Emitir mensagem recebida para o frontend em tempo real
            if (socket && !message.fromMe) {
                const messageData = {
                    id: message.id.id,
                    from: message.from,
                    body: message.body,
                    timestamp: message.timestamp,
                    type: message.type,
                    hasMedia: message.hasMedia
                };
                socket.emit('novaMensagemRecebida', messageData);
            }

            /**Teste de Conexao para usuarios */
            // Responde a mensagens de "Teste Conexão".
            if (message._data.body == "Teste Conexão") {
                const destinatarioRetorno = message._data.from
                    .split("@")[0]
                    .substring(2, 13); // Extrai o número do remetente.
                conexaoBot.enviarMensagem(
                    destinatarioRetorno,
                    "Conexão Ativa, obrigado por consultar",
                );
            }

            /**Chama a funcao para processar a mensagem recebida */
            conexaoBot.recebeMensagem(message); // Encaminha a mensagem para processamento.
        });

        /**Nas alteracoes de status das mensagens */
        // Evento disparado quando há uma atualização no status de uma mensagem enviada (ack).
        conexaoBot.clientBot.on("message_ack", async (mensagem) => {
            const id = mensagem.id.id; // ID da mensagem.
            const info = await mensagem.getInfo(); // Informações detalhadas da mensagem.

            try {
                const altera = {
                    enviado: info.deliveryRemaining <= 0, // Verifica se a mensagem foi entregue.
                    lida: info.readRemaining <= 0,    // Verifica se a mensagem foi lida.
                };

                /**Altera o Status da Mensagem */
                statusMensagens.setMensagem(id, altera); // Atualiza o status da mensagem no sistema.

                // Emitir atualização de status para o frontend
                if (socket) {
                    let status = 'sent';
                    if (altera.lida) {
                        status = 'read';
                    } else if (altera.enviado) {
                        status = 'delivered';
                    }
                    socket.emit('statusMensagemAtualizado', {
                        messageId: id,
                        status: status
                    });
                }

                // Atualizar status no MongoDB
                let novoStatus = 'Enviada';
                if (altera.lida) {
                    novoStatus = 'Lida';
                } else if (altera.enviado) {
                    novoStatus = 'Entregue';
                }

                // Tentar atualizar em todas as tabelas
                const tabelas = ['tb_envio_validacoes', 'tb_envio_senhas', 'tb_envio_mensagens'];
                
                for (const tabela of tabelas) {
                    try {
                        await mongoService.atualizarStatusMensagem(tabela, id, novoStatus);
                    } catch {
                        // Erro silencioso - nem todas as mensagens estarão em todas as tabelas
                        console.log(`[MongoDB] Mensagem ${id} não encontrada em ${tabela}`);
                    }
                }

            } catch (e) {
                console.error("Erro ao processar message_ack:", e);
            }
        });

        /**Inicializa a Conexao com WhatsApp */
        conexaoBot.clientBot.initialize(); // Inicializa a conexão com o WhatsApp.
        //*/
    };

    /**Verifica se ha conexao salva localmente, caso sim, e o Client nao esteja conectado, Conecta. */
    // Lógica para reconectar automaticamente se uma sessão autenticada existir.
    const reconectar =
        conexaoBot.clientBot.info == undefined && existsSync("./.wwebjs_auth");
    if (reconectar) {
        console.log("Reconectando no Recarregamento");
        await conectarZapBot("", "sistema"); // Tenta reconectar usando a sessão salva.
    } else {
        console.log("Não Conectando"); // Nenhuma sessão salva ou já conectado.
    }

    /**Quando o Servidor socket.io é levantado */
    // Evento disparado quando um novo cliente se conecta ao servidor Socket.io.
    conexaoIo.io.on("connection", (socketIn) => {
        console.log('[Backend] Nova conexão Socket.io estabelecida!'); // Debug
        socket = socketIn; // Armazena a instância do socket do cliente conectado.

        // Evento para enviar mensagem individual via chat
        socket.on("enviarMensagem", async (args, callback) => {
            console.log("Enviando mensagem via chat:", args);
            
            if (!args || !args.numero || !args.mensagem) {
                console.error("Erro: Dados incompletos para enviarMensagem.");
                if (callback) callback({ erro: "Número e mensagem são obrigatórios." });
                return;
            }

            const retornoMensagem = await conexaoBot.enviarMensagem(
                args.numero,
                args.mensagem,
                args.imagem || undefined, // Imagem opcional
                3 // Número de tentativas de envio
            );

            if (callback) callback(retornoMensagem); // Retorna o resultado da operação.
        });

        // Evento para obter todas as conversas do WhatsApp
        socket.on("obterConversasWhatsApp", async (args, callback) => {
            console.log("Obtendo conversas do WhatsApp...");
            
            try {
                if (!conexaoBot.clientBot || !conexaoBot.clientBot.info) {
                    if (callback) callback({ erro: "WhatsApp não conectado" });
                    return;
                }

                // Obter todos os chats
                const chats = await conexaoBot.clientBot.getChats();
                const conversas = [];

                for (const chat of chats.slice(0, 50)) { // Limitamos a 50 conversas para performance
                    try {
                        const contact = await chat.getContact();
                        const mensagens = await chat.fetchMessages({ limit: 10 }); // Últimas 10 mensagens
                        
                        const ultimaMensagem = mensagens.length > 0 ? mensagens[0] : null;
                        
                        conversas.push({
                            id: chat.id._serialized,
                            name: contact.pushname || contact.name || contact.number,
                            number: contact.number,
                            isGroup: chat.isGroup,
                            unreadCount: chat.unreadCount,
                            lastMessage: {
                                body: ultimaMensagem ? ultimaMensagem.body : '',
                                timestamp: ultimaMensagem ? ultimaMensagem.timestamp : 0,
                                fromMe: ultimaMensagem ? ultimaMensagem.fromMe : false
                            },
                            mensagens: mensagens.map(msg => ({
                                id: msg.id.id,
                                body: msg.body,
                                fromMe: msg.fromMe,
                                timestamp: msg.timestamp,
                                type: msg.type,
                                hasMedia: msg.hasMedia
                            }))
                        });
                    } catch (error) {
                        console.error("Erro ao processar chat:", error);
                    }
                }

                if (callback) callback({ sucesso: true, conversas });
            } catch (error) {
                console.error("Erro ao obter conversas:", error);
                if (callback) callback({ erro: "Erro ao obter conversas do WhatsApp" });
            }
        });

        // Evento para obter mensagens de uma conversa específica
        socket.on("obterMensagensConversa", async (args, callback) => {
            console.log("Obtendo mensagens da conversa:", args.chatId);
            
            try {
                if (!conexaoBot.clientBot || !conexaoBot.clientBot.info) {
                    if (callback) callback({ erro: "WhatsApp não conectado" });
                    return;
                }

                const chat = await conexaoBot.clientBot.getChatById(args.chatId);
                const mensagens = await chat.fetchMessages({ limit: args.limit || 50 });
                
                const mensagensFormatadas = mensagens.map(msg => ({
                    id: msg.id.id,
                    body: msg.body,
                    fromMe: msg.fromMe,
                    timestamp: msg.timestamp,
                    type: msg.type,
                    hasMedia: msg.hasMedia
                }));

                if (callback) callback({ sucesso: true, mensagens: mensagensFormatadas });
            } catch (error) {
                console.error("Erro ao obter mensagens da conversa:", error);
                if (callback) callback({ erro: "Erro ao obter mensagens da conversa" });
            }
        });

        // Evento para enviar senha provisória ao criador.
        socket.on("enviarSenhaProvisoriaCriador", async (args, callback) => {
            console.log("Argumentos recebidos para enviarSenhaProvisoriaCriador:", args);

            // Verifica se 'args.telefone' existe, pois ele é usado em conexaoBot.enviarMensagem
            if (!args || !args.telefone) {
                console.error("Erro: Telefone não fornecido para enviarSenhaProvisoriaCriador.");
                if (callback) callback({ erro: "Telefone não fornecido." });
                return;
            }

            const dadosEnviar = montaMensagemEnvioSenha(args); // Prepara a mensagem.
            // 'montaMensagemEnvioSenha' deve ser capaz de lidar com os novos campos:
            // args.nome, args.cpf, args.telefone, args.usuario, args.senha_provisoria

            const retornoMensagem = await conexaoBot.enviarMensagem(
                args.telefone, // Usando o novo campo telefone do payload
                dadosEnviar.texto,
                dadosEnviar.logo,
                3 // Número de tentativas de envio
            );

            // Salvar no MongoDB independente de erro ou sucesso
            try {
                await mongoService.salvarEnvioSenha({
                    telefone: args.telefone,
                    nome: args.nome,
                    status_mensagem: retornoMensagem.erro ? 'Erro' : 'Enviada',
                    id_mensagem: retornoMensagem.id || null
                });
                console.log("Envio de senha salvo no MongoDB");
            } catch (mongoError) {
                console.error("Erro ao salvar envio de senha no MongoDB:", mongoError);
            }

            if (retornoMensagem.erro != undefined) {
                for (const item of contatosConfirmacao) {
                    console.log(montaMensagemErroEnvioSenha(args));

                    // Envia mensagem de erro para os contatos de confirmação.
                    const dadosErro = montaMensagemErroEnvioSenha(args);
                    await conexaoBot.enviarMensagem(item.telefone, dadosErro.texto);
                }
            }

            if (callback) callback(retornoMensagem); // Retorna o resultado da operação.
        });

        // Evento para enviar validação de cadastro.
        /**
         * Evento para enviar uma mensagem de validação de cadastro para um usuário.
         * Recebe os dados do usuário (nome e telefone) e envia uma mensagem formatada
         * contendo um texto de boas-vindas e o logo da aplicação.
         *
         * @event enviarValidacaoCadastro
         * @param {object} args - Argumentos para o envio da validação.
         * @param {string} args.nome - Nome do usuário para saudação na mensagem.
         * @param {string} args.telefone - Número de telefone do destinatário (formato nacional, ex: 11999998888).
         * @param {function} callback - Função de callback que será chamada com o resultado da operação.
         * @param {object} callback.response - Objeto de resposta da tentativa de envio.
         * @param {string} [callback.response.sucesso] - Mensagem de sucesso se o envio for bem-sucedido.
         * @param {string} [callback.response.id] - ID da mensagem enviada, em caso de sucesso.
         * @param {string} [callback.response.erro] - Mensagem de erro se o envio falhar (ex: WhatsApp não conectado, erro no envio).
         */
        socket.on("enviarValidacaoCadastro", async (args, callback) => {
            const dadosEnviar = montaMensagemCadastroValidacao(args); // Prepara a mensagem.
            const envio = await conexaoBot.enviarMensagem(
                args.telefone,
                dadosEnviar.texto,
                dadosEnviar.logo,
            );

            // Salvar no MongoDB independente de erro ou sucesso
            try {
                const dadosSalvar = {
                    telefone: args.telefone,
                    nome: args.nome,
                    status_mensagem: envio.erro ? 'Erro' : 'Enviada',
                    id_mensagem: envio.id || null
                };
                
                const resultadoSalvar = await mongoService.salvarValidacaoCadastro(dadosSalvar);
                console.log("Validação de cadastro salva no MongoDB:", resultadoSalvar.id);
                
                // Se a mensagem foi enviada com sucesso, iniciar monitoramento adicional
                if (envio.id && !envio.erro) {
                    try {
                        console.log(`[Bot] Iniciando monitoramento adicional para validação ${envio.id}`);
                        await conexaoBot.monitorarStatusMensagem(
                            envio.id, 
                            args.telefone, 
                            dadosEnviar.texto || '[Mensagem de validação]', 
                            5 // 5 minutos timeout
                        );
                    } catch (monitorError) {
                        console.warn('[Bot] Erro ao iniciar monitoramento adicional da validação:', monitorError);
                    }
                }
                
            } catch (mongoError) {
                console.error("Erro ao salvar validação no MongoDB:", mongoError);
            }

            if (envio.erro != undefined) {
                for (const item of contatosConfirmacao) {
                    console.log(montaMensagemErroCadastroValidacao(args));

                    // Envia mensagem de erro para os contatos de confirmação.
                    const dadosErro = montaMensagemErroCadastroValidacao(args);
                    await conexaoBot.enviarMensagem(item.telefone, dadosErro.texto);
                }
            }

            if (callback) callback(envio); // Retorna o resultado da operação.
        });

        // Evento para enviar solicitação de vinculação.
        socket.on("enviarVinculacaoSolicitacao", async (args, callback) => {
            console.log("Enviando Solicitação de Vinculação");

            let retorno = await vinculacaoes.enviarSolicitacao(
                args,
                conexaoBot.clientBot, // Passa o cliente do WhatsApp para a função.
            );
            if (callback) callback(retorno); // Retorna o resultado da operação.
        });

        // Evento para verificar o status da conexão com o WhatsApp.
        socket.on("verificarConexaoZap", (args, callback) => {
            if (
                conexaoBot.clientBot != undefined &&
                conexaoBot.clientBot.info != undefined // Verifica se o cliente está definido e conectado.
            ) {
                console.log("buscando contato");
                if (callback) callback(contato); // Retorna as informações do contato.
            } else {
                console.log("nao conectado");
                if (callback) callback({ // Retorna status de não conectado.
                    status: "Não Conectado!",
                    Conectado: false,
                    telefone: "",
                    nome: "",
                });
            }
        });

        // Evento para desconectar do WhatsApp.
        socket.on("desconectarZap", async (args, callback) => {
            console.log("Desconectando");
            if (conexaoBot.clientBot) {
                await conexaoBot.clientBot.logout(); // Efetua o logout da sessão.
                // await conexaoBot.clientBot.destroy(); // Opcional: Destruir completamente o cliente.
                // É importante resetar o clientBot para permitir uma nova conexão QR.
                // conexaoBot.clientBot = undefined; // Comentar ou ajustar conforme a lógica de reconexão desejada.
            }
            if (callback) callback("sucesso");
        });

        // Evento para iniciar uma nova conexão com o WhatsApp (gerar QR Code).
        socket.on("conectarZap", (nomeSessao, callback) => {
            // Se já estiver conectado ou tentando conectar, pode ser necessário tratar.
            // Por exemplo, impedir múltiplas chamadas simultâneas a conectarZapBot.
            conectarZapBot(nomeSessao);
            if (callback) callback("Conectando...");
        });

        // Novo evento: Listar todos os criadores
        socket.on("listarTodosCriadores", async (args, callback) => {
            console.log("Listando todos os criadores");
            try {
                const criadores = await buscaTodosCriadores();
                if (callback) callback({ sucesso: true, dados: criadores });
            } catch (error) {
                console.error("Erro ao listar criadores:", error);
                if (callback) callback({ erro: "Erro ao buscar criadores", detalhes: error.message });
            }
        });

        // Novo evento: Enviar mensagem para todos os criadores selecionados
        socket.on("enviarMensagemParaTodos", async (args, callback) => {
            console.log("Enviando mensagem para criadores selecionados");
            console.log("Argumentos recebidos:", args);
            
            
            try {
                const { mensagem, criadores } = args;
                
                if (!mensagem || !criadores || criadores.length === 0) {
                    if (callback) callback({ erro: "Mensagem e criadores são obrigatórios" });
                    return;
                }

                // Buscar dados completos dos criadores selecionados
                const criadoresCompletos = await buscarCriadoresSelecionados(criadores);
                
                if (criadoresCompletos.length === 0) {
                    if (callback) callback({ erro: "Nenhum criador encontrado com os códigos informados" });
                    return;
                }

                let resultados = [];
                let sucessos = 0;
                let erros = 0;

                // Enviar mensagem para cada criador
                for (const criador of criadoresCompletos) {
                    try {
                        const resultado = await conexaoBot.enviarMensagem(
                            criador.telefone,
                            mensagem,
                            null, // sem imagem
                            3 // tentativas
                        );

                        const statusEnvio = resultado.erro ? 'Erro' : 'Enviada';
                        
                        // Atualizar status do criador com ID único
                        criador.status_mensagem = statusEnvio;
                        criador.id_mensagem = resultado.id || `erro_${Date.now()}_${Math.random()}`;
                        criador.resultado_envio = resultado;

                        if (resultado.erro) {
                            erros++;
                        } else {
                            sucessos++;
                        }

                        resultados.push({
                            criador: criador.nome,
                            telefone: criador.telefone,
                            status: statusEnvio,
                            id_mensagem: criador.id_mensagem,
                            detalhes: resultado
                        });

                    } catch (error) {
                        erros++;
                        const id_erro = `erro_${Date.now()}_${Math.random()}`;
                        criador.status_mensagem = 'Erro';
                        criador.id_mensagem = id_erro;
                        resultados.push({
                            criador: criador.nome,
                            telefone: criador.telefone,
                            status: 'Erro',
                            id_mensagem: id_erro,
                            detalhes: { erro: error.message }
                        });
                    }
                }

                // Salvar no MongoDB
                try {
                    await mongoService.salvarMensagemParaTodos({
                        mensagem: mensagem,
                        criadores: criadoresCompletos,
                        id_lote: `lote_${Date.now()}` // ID do lote para controle
                    });
                } catch (mongoError) {
                    console.error("Erro ao salvar no MongoDB:", mongoError);
                }

                const retorno = {
                    sucesso: true,
                    total_enviados: criadoresCompletos.length,
                    sucessos: sucessos,
                    erros: erros,
                    resultados: resultados
                };

                if (callback) callback(retorno);

            } catch (error) {
                console.error("Erro ao enviar mensagem para todos:", error);
                if (callback) callback({ erro: "Erro interno ao processar envio", detalhes: error.message });
            }
        });

        // Eventos para listagem de dados do MongoDB
        socket.on("listarValidacoesCadastro", async (args, callback) => {
            console.log('[Backend] Recebida requisição listarValidacoesCadastro'); // Debug
            try {
                const validacoes = await mongoService.listarValidacoesCadastro();
                console.log(`[Backend] Retornando ${validacoes.length} validações`); // Debug
                if (callback) callback({ sucesso: true, dados: validacoes });
            } catch (error) {
                console.error("Erro ao listar validações:", error);
                if (callback) callback({ erro: "Erro ao buscar validações", detalhes: error.message });
            }
        });

        socket.on("listarEnviosSenhas", async (args, callback) => {
            try {
                const envios = await mongoService.listarEnviosSenhas();
                if (callback) callback({ sucesso: true, dados: envios });
            } catch (error) {
                console.error("Erro ao listar envios de senhas:", error);
                if (callback) callback({ erro: "Erro ao buscar envios de senhas", detalhes: error.message });
            }
        });

        socket.on("listarMensagensEnviadas", async (args, callback) => {
            try {
                const mensagens = await mongoService.listarMensagensEnviadas();
                if (callback) callback({ sucesso: true, dados: mensagens });
            } catch (error) {
                console.error("Erro ao listar mensagens enviadas:", error);
                if (callback) callback({ erro: "Erro ao buscar mensagens enviadas", detalhes: error.message });
            }
        });

        socket.on("buscarMensagemPorId", async (args, callback) => {
            try {
                const { id } = args;
                const mensagem = await mongoService.buscarMensagemPorId(id);
                if (callback) callback({ sucesso: true, dados: mensagem });
            } catch (error) {
                console.error("Erro ao buscar mensagem por ID:", error);
                if (callback) callback({ erro: "Erro ao buscar mensagem", detalhes: error.message });
            }
        });

        socket.on("verificarNumeroWhatsApp", async (args, callback) => {
            try {
                const { numero } = args;
                
                if (!numero) {
                    if (callback) callback({ 
                        sucesso: false, 
                        erro: "Número é obrigatório" 
                    });
                    return;
                }

                console.log(`[Socket] Verificando número WhatsApp: ${numero}`);
                const resultado = await conexaoBot.verificarNumeroWhatsApp(numero);
                
                if (callback) callback(resultado);
            } catch (error) {
                console.error("Erro ao verificar número WhatsApp:", error);
                if (callback) callback({ 
                    sucesso: false, 
                    erro: "Erro ao verificar número", 
                    detalhes: error.message 
                });
            }
        });

        /**
         * Função para monitorar e tentar reconectar ao WhatsApp em caso de desconexão.
         * @param {string} nomeSessao
         * @param {string} tipoInicializacao
         */
        const monitorarDesconexao = (nomeSessao = '', tipoInicializacao = 'padrao') => {
            if (!conexaoBot.clientBot) return;
            conexaoBot.clientBot.on('disconnected', async (reason) => {
                console.error('WhatsApp desconectado:', reason);
                if (socket) socket.emit('mudancaStatus', { Conectado: false, status: 'Desconectado', motivo: reason });
                // Notifica o administrador
                await notificaAdministrador('Desconexão do WhatsApp', reason);
                setTimeout(async () => {
                    try {
                        console.log('Tentando reconectar ao WhatsApp...');
                        await conectarZapBot(nomeSessao, tipoInicializacao);
                    } catch (err) {
                        console.error('Erro ao tentar reconectar:', err);
                        await notificaAdministrador('Falha ao tentar reconectar ao WhatsApp', err.message || err);
                    }
                }, 5000);
            });
        };

        // Inicia o monitoramento de desconexão
        monitorarDesconexao();

        socket.on("verificarNumeroWhatsApp", async (args, callback) => {
            try {
                const { numero } = args;
                
                if (!numero) {
                    if (callback) callback({ 
                        sucesso: false, 
                        erro: "Número é obrigatório" 
                    });
                    return;
                }

                console.log(`[Socket] Verificando número WhatsApp: ${numero}`);
                const resultado = await conexaoBot.verificarNumeroWhatsApp(numero);
                
                if (callback) callback(resultado);
            } catch (error) {
                console.error("Erro ao verificar número WhatsApp:", error);
                if (callback) callback({ 
                    sucesso: false, 
                    erro: "Erro ao verificar número", 
                    detalhes: error.message 
                });
            }
        });

        // Reenviar mensagem com formato alternativo
        socket.on("reenviarComFormatoAlternativo", async (args, callback) => {
            console.log('[Backend] Recebida requisição reenviarComFormatoAlternativo:', args);
            
            if (!args || !args.numeroOriginal || !args.texto) {
                const erro = "Número original e texto são obrigatórios";
                console.error('[Backend] Erro:', erro);
                if (callback) callback({ erro });
                return;
            }
            
            try {
                const resultado = await conexaoBot.reenviarComFormatoAlternativo(
                    args.numeroOriginal,
                    args.texto,
                    args.imagem
                );
                
                console.log('[Backend] Resultado do reenvio:', resultado);
                if (callback) callback(resultado);
            } catch (error) {
                console.error('[Backend] Erro ao reenviar com formato alternativo:', error);
                if (callback) callback({ erro: "Erro interno do servidor", detalhes: error.message });
            }
        });

        // Reenviar validação existente com formato alternativo
        socket.on("reenviarValidacaoExistente", async (args, callback) => {
            console.log('[Backend] Recebida requisição reenviarValidacaoExistente:', args);
            
            if (!args || !args.id || !args.telefone) {
                const erro = "ID da validação e telefone são obrigatórios";
                console.error('[Backend] Erro:', erro);
                if (callback) callback({ erro });
                return;
            }
            
            try {
                // Buscar a validação no banco
                const validacoes = await mongoService.listarValidacoesCadastro();
                const validacao = validacoes.find(v => v._id.toString() === args.id);
                
                if (!validacao) {
                    const erro = "Validação não encontrada";
                    console.error('[Backend] Erro:', erro);
                    if (callback) callback({ erro });
                    return;
                }
                
                console.log(`[Backend] Encontrada validação para ${validacao.nome} (${validacao.telefone})`);
                
                // Tentar reenvio com formato alternativo
                const resultado = await conexaoBot.reenviarComFormatoAlternativo(
                    validacao.telefone,
                    `Validação de cadastro - Central dos Resultados\n\nOlá ${validacao.nome}!\n\nEste é um reenvio da validação de cadastro devido a problemas de entrega no número original.`,
                    null
                );
                
                if (resultado.sucesso) {
                    // Atualizar status no MongoDB
                    try {
                        await mongoService.salvarValidacaoCadastro({
                            telefone: resultado.numeroAlternativo,
                            nome: validacao.nome + ' (Reenvio)',
                            status_mensagem: 'Enviada',
                            id_mensagem: resultado.id
                        });
                    } catch (mongoError) {
                        console.warn('[Backend] Erro ao salvar reenvio no MongoDB:', mongoError);
                    }
                }
                
                console.log('[Backend] Resultado do reenvio de validação:', resultado);
                if (callback) callback(resultado);
            } catch (error) {
                console.error('[Backend] Erro ao reenviar validação existente:', error);
                if (callback) callback({ erro: "Erro interno do servidor", detalhes: error.message });
            }
        });

        // Evento para executar migração de dados
        socket.on("executarMigracao", async (args, callback) => {
            try {
                console.log("Executando migração de validações...");
                
                const { migrarValidacoes } = require('./migrar-validacoes');
                const resultado = await migrarValidacoes();
                
                if (callback) callback({ 
                    sucesso: true, 
                    resultado: "Migração executada com sucesso" 
                });
            } catch (error) {
                console.error("Erro na migração:", error);
                if (callback) callback({ 
                    sucesso: false, 
                    erro: error.message 
                });
            }
        });

        // Evento para verificar mensagens não monitoradas
        socket.on("verificarNaoMonitoradas", async (args, callback) => {
            try {
                console.log("Verificando mensagens não monitoradas...");
                
                const { verificarMensagensNaoMonitoradas } = require('./verificar-nao-monitoradas');
                const resultado = await verificarMensagensNaoMonitoradas();
                
                if (callback) callback({ 
                    sucesso: true, 
                    resultado: "Verificação concluída com sucesso" 
                });
            } catch (error) {
                console.error("Erro na verificação:", error);
                if (callback) callback({ 
                    sucesso: false, 
                    erro: error.message 
                });
            }
        });

        // Evento para forçar monitoramento de mensagens pendentes
        socket.on("forcarMonitoramento", async (args, callback) => {
            try {
                console.log("Forçando monitoramento de mensagens pendentes...");
                
                // Buscar mensagens que precisam de monitoramento
                const mensagensPendentes = await mongoService.buscarValidacoesPendentes();
                let contadorMonitoradas = 0;
                
                for (const mensagem of mensagensPendentes) {
                    if (mensagem.id_mensagem) {
                        try {
                            await conexaoBot.monitorarStatusMensagem(
                                mensagem.id_mensagem, 
                                mensagem.telefone, 
                                'Mensagem de validação', 
                                2 // 2 minutos timeout para verificação rápida
                            );
                            contadorMonitoradas++;
                        } catch (monitorError) {
                            console.warn(`Erro ao monitorar mensagem ${mensagem.id_mensagem}:`, monitorError);
                        }
                    }
                }
                
                if (callback) callback({ 
                    sucesso: true, 
                    resultado: `Monitoramento iniciado para ${contadorMonitoradas} mensagens` 
                });
            } catch (error) {
                console.error("Erro ao forçar monitoramento:", error);
                if (callback) callback({ 
                    sucesso: false, 
                    erro: error.message 
                });
            }
        });

        // Evento para reprocessar mensagens antigas
        socket.on("reprocessarMensagensAntigas", async (args, callback) => {
            try {
                console.log("Reprocessando mensagens antigas...");
                
                // Buscar mensagens marcadas para reenvio
                const mensagensParaReenvio = await mongoService.buscarMensagensParaReenvio();
                let contadorReenviadas = 0;
                
                for (const mensagem of mensagensParaReenvio) {
                    try {
                        const resultado = await conexaoBot.reenviarComFormatoAlternativo(
                            mensagem.telefone, 
                            'Mensagem reenviada automaticamente',
                            mensagem._id
                        );
                        
                        if (resultado.sucesso) {
                            contadorReenviadas++;
                        }
                    } catch (reenvioError) {
                        console.warn(`Erro ao reenviar mensagem ${mensagem._id}:`, reenvioError);
                    }
                }
                
                if (callback) callback({ 
                    sucesso: true, 
                    resultado: `${contadorReenviadas} mensagens reenviadas com sucesso` 
                });
            } catch (error) {
                console.error("Erro no reprocessamento:", error);
                if (callback) callback({ 
                    sucesso: false, 
                    erro: error.message 
                });
            }
        });
    });
})();

//*/

// Tratamento global de exceções para evitar que a aplicação seja derrubada por erros não tratados.
process.on('uncaughtException', async (err) => {
    console.error('Exceção não capturada:', err);
    await notificaAdministrador('Exceção não capturada', err.message || err);
});
process.on('unhandledRejection', async (reason) => {
    console.error('Promise rejeitada não tratada:', reason);
    await notificaAdministrador('Promise rejeitada não tratada', reason && reason.message ? reason.message : String(reason));
});
