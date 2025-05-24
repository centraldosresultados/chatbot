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
} = require("./src/helpers/funcoesAuxiliares");

const { statusMensagens, conexaoBot } = require("./src/services/conexaoZap");
const { conexaoIo } = require("./src/services/socket");
const { vinculacaoes } = require("./src/components/vinculacoes");

const http = require('http'); // Required for serving the HTML file
const fs = require('fs'); // Required for reading the HTML file
const path = require('path'); // Required for path manipulation
const { contatosConfirmacao } = require("./src/config");

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

    // Create an HTTP server to serve the test interface
    const server = http.createServer((req, res) => {
        if (req.url === '/' || req.url === '/test-interface.html') {
            fs.readFile(path.join(__dirname, 'test-interface.html'), (err, data) => {
                if (err) {
                    res.writeHead(500);
                    res.end('Error loading test-interface.html');
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            });
        } else if (req.url === '/socket.io/socket.io.js') {
            fs.readFile(path.join(__dirname, 'node_modules/socket.io/client-dist/socket.io.js'), (err, data) => {
                if (err) {
                    res.writeHead(500);
                    res.end('Error loading socket.io.js');
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'application/javascript' });
                res.end(data);
            });
        }
        else {
            res.writeHead(404);
            res.end('Not Found');
        }
    });

    // Attach Socket.io to the HTTP server
    conexaoIo.io.attach(server);

    // Start the HTTP server
    const PORT = process.env.PORT || 3000; // Or any port you prefer
    server.listen(PORT, () => {
        console.log(`Servidor HTTP rodando na porta ${PORT}`);
        console.log(`Acesse a interface de teste em http://localhost:${PORT}/test-interface.html`);
    });


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

            /**Se a inicializacao for por solicitacao de um cliente, envia os dados do contato */
            if (tipoInicializacao == "padrao" && socket) socket.emit("mudancaStatus", contato); // Emite o status de conexão para o cliente.
        });

        /**Ao receber mensagens */
        // Evento disparado quando uma nova mensagem é recebida.
        conexaoBot.clientBot.on("message", async (message) => {
            console.log("Recebendo Mensagem");

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
        socket = socketIn; // Armazena a instância do socket do cliente conectado.

        // Evento para enviar senha provisória ao criador.
        socket.on("enviarSenhaProvisoriaCriador", async (args, callback) => {
            const dadosEnviar = montaMensagemEnvioSenha(args); // Prepara a mensagem.

            const retornoMensagem = await conexaoBot.enviarMensagem(
                args.telefone,
                dadosEnviar.texto,
                dadosEnviar.logo,
                true, // Aguarda a confirmação do envio.
            );
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
    });
})();

//*/
