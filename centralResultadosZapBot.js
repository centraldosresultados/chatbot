const { fs, readFileSync, existsSync, rm } = require('fs')
const { Client, MessageMedia, LocalAuth, Buttons } = require('whatsapp-web.js')

const QRCode = require('qrcode')

const { configuracoes: config } = require('./src/config')
const { montaMensagemCadastroValidacao, montaMensagemEnvioSenha } = require('./src/helpers/funcoesAuxiliares');

const { buscarSolicitacaoFB } = require('./src/services/conexao')

//const { createServer } = config.funcionamento == 'local' ? require('http') : require('https');
// const httpServer = config.funcionamento == 'local' ? createServer() :
//     createServer({
//         key: readFileSync("/etc/letsencrypt/live/zapbot.centraldosresultados.com.br/privkey.pem"),
//         cert: readFileSync("/etc/letsencrypt/live/zapbot.centraldosresultados.com.br/cert.pem")
//     })
// const { Server } = require("socket.io");

// const io = new Server(httpServer, {
//     cors: {
//         origin: '*'
//     }
// })

let io = undefined;
let socket = undefined;

const { statusMensagens, conexaoBot } = require('./src/services/conexaoZap')
const { conexaoIo } = require('./src/services/socket');
const { vinculacaoes } = require('./src/components/vinculacoes');

let clientBot;
let contato = {};

const montaContato = async clientBot => {
    return new Promise((resolve, reject) => {
        contato = {
            Conectado: true,
            status: 'Conectado',
            // nome: clientBot.info.pushname,
            telefone: clientBot.info.me.user
        }
        resolve(contato)
    })
}

(async () => {
    console.log('Iniciando');
    io = await conexaoIo.pegaConexao();

    const conectarZapBot = async (nomeSessao, tipoInicializacao = 'padrao') => {
        clientBot = await conexaoBot.pegaClientBot('');
        //console.log(clientBot);/*

        clientBot.on('qr', qr => {
            QRCode.toDataURL(qr).then(base64 => {
                //console.log('enviando qrcode');
                socket.emit('qrCode', base64);
            }).catch(err => {
                console.log(err);
            })
        })

        clientBot.on('ready', async () => {
            console.log('Pronto');
            await montaContato(clientBot)
            if (tipoInicializacao == 'padrao')
                socket.emit('mudancaStatus', montaContato(clientBot));

            //conexaoBot.enviarMensagem('22999134200', 'Teste de Mensagem');

            // const vinc = await vinculacaoes.pegaVinculacao('3EB0EB081859FB930E594B', '22999134200')
            // console.log('Vinculacao', vinc);

            setTimeout(() => {
                vinculacaoes.enviarSolicitacao(4)
            }, 300);



            //enviarSlicitacao(4)

        })

        clientBot.on('message', async message => {
            console.log('Recebendo Mensagem', message);

            if (message._data.body == 'Teste Conexão') {
                const destinatarioRetorno = message._data.from.split('@')[0].substring(2, 13);
                conexaoBot.enviarMensagem(destinatarioRetorno, 'Conexão Ativa, obrigado por consultar');
            }

            conexaoBot.recebeMensagem(message);
        })

        clientBot.on('message_ack', async (mensagem, action) => {
            const id = mensagem.id.id;
            const info = await mensagem.getInfo();

            const altera = {
                enviado: info.deliveryRemaining <= 0,
                lida: info.readRemaining <= 0
            }

            statusMensagens.setMensagem(id, altera);
        })

        clientBot.initialize();
        //*/
    }

    if (clientBot == undefined && existsSync('./.wwebjs_auth')) {
        console.log('Reconectando no Recarregamento');
        //conexaoBot.recebeMensagem('22999134200')
        //buscarSolicitacaoFB('2_22999134200')
        //enviarSlicitacao(4)
        conectarZapBot('', 'sistema');





    } else {
        console.log('Não Conectando');
    }

    io.on('connection', (socketIn) => {
        socket = socketIn;

        console.log('Conectado');

        socket.on('enviarSenhaProvisoriaCriador', async (args, callback) => {
            const dadosEnviar = montaMensagemEnvioSenha(args);

            const retornoMensagem = await conexaoBot.enviarMensagem(args.telefone, dadosEnviar.texto, dadosEnviar.logo, true);
            callback(retornoMensagem)
        })

        socket.on('enviarValidacaoCadastro', async (args, callback) => {
            const dadosEnviar = montaMensagemCadastroValidacao(args);
            const envio = await conexaoBot.enviarMensagem(args.telefone, dadosEnviar.texto, dadosEnviar.logo)

            callback(envio)
        })


        socket.on('enviarVinculacaoSolicitacao', async (args, callback) => {
            console.log('Enviando Solicitação de Vinculação');

            let retorno = await enviarSlicitacao(args, clientBot);
            callback(retorno)
        })

        socket.on('verificarConexaoZap', (args, callback) => {
            if (clientBot != undefined && clientBot.info != undefined) {
                console.log('buscando contato');
                callback(contato)
            } else {
                console.log('nao conectado');
                callback({ status: 'Não Conectado!', Conectado: false, telefone: '', nome: '' })
            }
        })

        socket.on('desconectarZap', async (args, callback) => {
            console.log('Desconectando');
            clientBot.logout();
            clientBot.destroy();
            callback('sucesso')
        })

        socket.on('conectarZap', (nomeSessao, callback) => {
            conectarZapBot(nomeSessao)
        });
    })
})();

//*/