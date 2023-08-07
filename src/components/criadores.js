
const { executaFuncaoClasse } = require("../services/services");
const { http } = require('http')
// const mensagemEntrada = {
//     id: {
//         fromMe: false,
//         remote: '5522999134200@c.us',
//         id: '351D31336C4CFA3256E0B07DC136C4EA',
//         _serialized: 'false_5522999134200@c.us_351D31336C4CFA3256E0B07DC136C4EA'
//     },
//     body: 'Validar Cadastro',
//     type: 'reply',
//     subtype: 'buttons_response',
//     t: 1670420937,
//     notifyName: 'Silvério',
//     from: '5522999134200@c.us',
//     to: '5522981061000@c.us',
//     self: 'in',
//     ack: 1,
//     isNewMsg: true,
//     star: false,
//     kicNotified: false,
//     recvFresh: true,
//     isFromTemplate: false,
//     pollInvalidated: false,
//     latestEditMsgKey: null,
//     latestEditSenderTimestampMs: null,
//     broadcast: false,
//     quotedMsg: {
//         type: 'chat',
//         headerType: 2,
//         title: 'Ação Aguardada',
//         body: 'Valide Seu Cadastro',
//         isDynamicReplyButtonsMsg: true,
//         dynamicReplyButtons: [[Object]],
//         caption: 'Valide Seu Cadastro'
//     },
//     quotedStanzaID: '3EB0DD819D3FEAE0C83A',
//     quotedParticipant: '5522981061000@c.us',
//     mentionedJidList: [],
//     isVcardOverMmsDocument: false,
//     labels: [],
//     hasReaction: false,
//     ephemeralOutOfSync: false,
//     productHeaderImageRejected: false,
//     lastPlaybackProgress: 0,
//     isDynamicReplyButtonsMsg: false,
//     selectedButtonId: 'retValidaCad_656',
//     isMdHistoryMsg: false,
//     stickerSentTs: 0,
//     isAvatar: false,
//     requiresDirectConnection: false,
//     pttForwardedFeaturesEnabled: true
// }

montaMensagemValidaCadastro = (dados) => {
    return `
Olá ${dados.nome}
Parabéns, seu cadastro na 
*Central dos Criadores* 
foi validado com sucesso!
`;
}

montaMensagemNaoValidaCadastro = (dados) => {
    return `
Olá ${dados.nome}    
Houve algum erro tentar validar sua conta.
Tente novamente.
    `
}


function validarCadastro(mensagem, clientBot) {
    const parametros = {
        codigo_criador: mensagem.selectedButtonId.split('_')[1],
        telefone: mensagem.from.split('@')[0].substring(2, 13)
    };

    executaFuncaoClasse('centralCriadores', 'validaCadastroCriador', parametros).then(retorno => {
        if (retorno.sucesso != undefined) {
            clientBot.sendText(mensagem.from, montaMensagemValidaCadastro(retorno.dados)).then(retorno => {
                return retorno.status;
            })
        } else if (retorno.erro != undefined)
            clientBot.sendText(mensagem.from, montaMensagemNaoValidaCadastro(retorno.erro))
        else if (retorno.informacao != undefined)
            clientBot.sendText(mensagem.from, montaMensagemNaoValidaCadastro(retorno.informacao))
    })


}

function enviarResetSenha(parametros, callback) {

}

module.exports = {
    validarCadastro,
    enviarResetSenha
}