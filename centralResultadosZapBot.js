/**
 * Sistema de ChatBot da Central dos Resultados
 * Utilizado como integração entre inicialmente para a Central dos Criadores
 */
const {  existsSync } = require('fs')
const QRCode = require('qrcode')

const { montaMensagemCadastroValidacao, montaMensagemEnvioSenha } = require('./src/helpers/funcoesAuxiliares');

const { statusMensagens, conexaoBot } = require('./src/services/conexaoZap')
const { conexaoIo } = require('./src/services/socket');
const { vinculacaoes } = require('./src/components/vinculacoes');

let socket = undefined;
let contato = {};

const montaContato = async clientBot => {
    return new Promise((resolve, reject) => {
        contato = {
            Conectado: true,
            status: 'Conectado',
            telefone: clientBot.info.me.user
        }
        resolve(contato)
    })
}

(async () => {
    console.log('Iniciando');    
    
    console.log('Gerando conexao Socket');
    await conexaoIo.pegaConexao();
    console.log('Criando a conexao WahtsApp');
    await conexaoBot.pegaClientBot();

    vinculacaoes.populaVinculacoes();

    /**
     * Funcao que conecta ao Whatsapp
     * @param {string} nomeSessao 
     * @param {string} tipoInicializacao 
     */
    const conectarZapBot = async (nomeSessao, tipoInicializacao = 'padrao') => {
        console.log('Conectando ao WhatsApp');
        /**Gerando QRCode quando solicitado */
        await conexaoBot.pegaClientBot();

        conexaoBot.clientBot.on('qr', qr => {
            console.log('Gerando QRCode');
            QRCode.toDataURL(qr).then(base64 => {
                /**Envia ao Cliente o QRCode para conexao ao WhatsApp */
                socket.emit('qrCode', base64);
            }).catch(err => {
                console.log(err);
            })
        })

        /**Quando a Conexao com WP esta pronta */
        conexaoBot.clientBot.on('ready', async () => {
            console.log('Pronto');
            contato = await montaContato(conexaoBot.clientBot)

            /**Se a inicializacao for por solicitacao de um cliente, envia os dados do contato */
            if (tipoInicializacao == 'padrao')
                socket.emit('mudancaStatus', contato);
        })

        /**Ao receber mensagens */
        conexaoBot.clientBot.on('message', async message => {
            console.log('Recebendo Mensagem');

            /**Teste de Conexao para usuarios */
            if (message._data.body == 'Teste Conexão') {
                const destinatarioRetorno = message._data.from.split('@')[0].substring(2, 13);
                conexaoBot.enviarMensagem(destinatarioRetorno, 'Conexão Ativa, obrigado por consultar');
            }

            /**Chama a funcao para processar a mensagem recebida */
            conexaoBot.recebeMensagem(message);
        })

        /**Nas alteracoes de status das mensagens */
        conexaoBot.clientBot.on('message_ack', async (mensagem, action) => {
            const id = mensagem.id.id;
            const info = await mensagem.getInfo();

            const altera = {
                enviado: info.deliveryRemaining <= 0,
                lida: info.readRemaining <= 0
            }

            /**Altera o Status da Mensagem */
            statusMensagens.setMensagem(id, altera);
        })

        /**Inicializa a Conexao com WhatsApp */
        conexaoBot.clientBot.initialize();
        //*/
    }
    
    /**Verifica se ha conexao salva localmente, caso sim, e o Client nao esteja conectado, Conecta. */
   
    const reconectar = (conexaoBot.clientBot.info == undefined ) && existsSync('./.wwebjs_auth');
    if (reconectar) {
        console.log('Reconectando no Recarregamento');
        await conectarZapBot('', 'sistema');
    } else {
        console.log('Não Conectando');
    }

    /**Quando o Servidor socket.io é levantado */
    conexaoIo.io.on('connection', (socketIn) => {
        socket = socketIn;
        
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

            let retorno = await vinculacaoes.enviarSolicitacao(args, conexaoBot.clientBot);
            callback(retorno)
        })

        socket.on('verificarConexaoZap', (args, callback) => {
            if (conexaoBot.clientBot != undefined && conexaoBot.clientBot.info != undefined) {
                console.log('buscando contato');
                callback(contato)
            } else {
                console.log('nao conectado');
                callback({ status: 'Não Conectado!', Conectado: false, telefone: '', nome: '' })
            }
        })

        socket.on('desconectarZap', async (args, callback) => {
            console.log('Desconectando');
            conexaoBot.clientBot.logout();
            conexaoBot.clientBot.destroy();
            callback('sucesso')
        })

        socket.on('conectarZap', (nomeSessao, callback) => {
            conectarZapBot(nomeSessao)
        });
    })
})();

//*/