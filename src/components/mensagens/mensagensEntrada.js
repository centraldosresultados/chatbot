// const { confirmaSolicitacao, recusarSolicitacao } = require('../vinculacoes');
// const { enviarResetSenha, validarCadastro} = require('../criadores')

// const recebeMensagem = (mensagem) => {



//     if (mensagem.type == 'reply' && mensagem.subtype == 'buttons_response') {
//         const temp = mensagem.selectedButtonId.split('_');
        
//         let acao = temp[0];
//         let subAcao = temp[2];        

//         if (acao == 'retVinc') {
//             if (subAcao == 1)
//                 confirmaSolicitacao(mensagem, clientBot)
//             else if(subAcao == 0)
//                 recusarSolicitacao(mensagem, clientBot);
//         }else if(acao == 'retValidaCad'){
//             validarCadastro(mensagem, clientBot)
//         }
//     }
// }

// module.exports = {
//     recebeMensagem
// }