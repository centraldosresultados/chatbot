const { getDatabase, ref, get, child, onValue } = require('firebase/database');
const { contatosConfirmacao, firebaseConfig } = require('../config');
const { montaMensagemVinculacaoConfirmacao } = require('../helpers/funcoesAuxiliares');
const { salvarSolicitacaoFB } = require('../services/conexao');
const { conexaoBot } = require('../services/conexaoZap');
const { executaFuncaoClasse } = require('../services/services');
const { initializeApp } = require('firebase/app');


console.log('Conexao na vinculacao', conexaoBot);
const conFB = initializeApp(firebaseConfig)
const db = getDatabase();
const dbRef = ref(db)
const tabela = 'vinculacoes_solicitacoes';

(async () => {
    console.log(conexaoBot);
    onValue(ref(db, tabela), (dados) => {
        console.log('Repopulando');
        vinculacaoes.populaVinculacoes();
    })

    const vinculacaoes = {
        vinculacoes: undefined,
        async populaVinculacoes() {
            await get(child(dbRef, tabela)).then(retorno => {
                const temp = [];

                for (let i in retorno.val()) {
                    let item = retorno.val()[i];
                    item['keyFB'] = i;
                    temp.push(item)
                }
                this.vinculacoes = temp;
                console.log(temp);
            }).catch(error => {
                console.log('Erro Retorno ', error);
            })
        },
        async pegaVinculacao(idM, numero) {
            if (this.vinculacoes == undefined)
                await this.populaVinculacoes();
            return this.vinculacoes.find(v => v.numero == numero)
        },
        async enviarSolicitacao(parametros) {

            return await new Promise((resolve, reject) => {
                executaFuncaoClasse('centralCriadores', 'buscarPassaroVinculacaoSolicitacao', parametros).then(retorno => {
                    const dados = retorno;// solicitacao[0];        
                    const dadosEnvio = montaMensagemVinculacaoConfirmacao(dados);

                    contatosConfirmacao.map(async item => {
                        const contatoEnviar = item.telefone;


                        const idM = await conexaoBot.enviarMensagem(contatoEnviar, dadosEnvio.texto);
                        console.log('Retorno Mensagem', idM);

                        const insere = {
                            idM: idM.id,
                            numero: contatoEnviar,
                            acao: 'confirmacaoVinculacao',
                            codigo_vinculacao: parametros,
                            autorizada: false
                        }

                        const foi = await salvarSolicitacaoFB(insere);

                        if (dadosEnvio.placaIdentifcacao != null)
                            await conexaoBot.enviarMensagem(contatoEnviar, '', dadosEnvio.placaIdentifcacao.imagem);

                        if (dadosEnvio.relacaoSispass != null)
                            await conexaoBot.enviarMensagem(contatoEnviar, '', dadosEnvio.relacaoSispass.imagem)


                    })
                });
            });
        }
    }

    module.exports = {
        vinculacaoes
    }
})();


/*

// async function enviarSlicitacao(parametros) {
//     console.log('Enviando Solicitação para Aprovação');

//     return await new Promise((resolve, reject) => {
//         executaFuncaoClasse('centralCriadores', 'buscarPassaroVinculacaoSolicitacao', parametros).then(retorno => {
//             const dados = retorno;// solicitacao[0];
//             const dadosEnvio = montaMensagemVinculacaoConfirmacao(dados);

//             contatosConfirmacao.map(async item => {

//                 const contatoEnviar = item.telefone;

//                 const idM = await conexaoBot.enviarMensagem(contatoEnviar, dadosEnvio.texto);

//                 console.log('Retorno Mensagem', idM);

//                 const insere = {
//                     idM: idM.id,
//                     numero: contatoEnviar,
//                     acao: 'confirmacaoVinculacao',
//                     codigo_vinculacao: parametros,
//                     autorizada: false
//                 }

//                 const foi = await salvarSolicitacaoFB(insere);

//                 if (dadosEnvio.placaIdentifcacao != null)
//                     await conexaoBot.enviarMensagem(contatoEnviar, '', dadosEnvio.placaIdentifcacao.imagem);

//                 if (dadosEnvio.relacaoSispass != null)
//                     await conexaoBot.enviarMensagem(contatoEnviar, '', dadosEnvio.relacaoSispass.imagem)



//                 //await clientBot.sendButtons(contatoEnviar + "@c.us", "Ação Aguardada", dadosEnvio.botoes, "Selecione uma Opção")



//                 // clientBot.sendText(contatoEnviar + '@c.us', dadosEnvio.texto).then(async resultadoT1 => {
//                 //     if (resultadoT1.status == 'OK') {
//                 //         if (dadosEnvio.placaIdentifcacao != null)
//                 //             await clientBot.sendImage(contatoEnviar + '@c.us', dadosEnvio.placaIdentifcacao.imagem, dadosEnvio.placaIdentifcacao.texto, dadosEnvio.placaIdentifcacao.texto)

//                 //         if (dadosEnvio.relacaoSispass != null)
//                 //             await clientBot.sendImage(contatoEnviar + '@c.us', dadosEnvio.relacaoSispass.imagem, dadosEnvio.relacaoSispass.texto, dadosEnvio.relacaoSispass.texto)

//                 //         await clientBot.sendButtons(contatoEnviar + "@c.us", "Ação Aguardada", dadosEnvio.botoes, "Selecione uma Opção")

//                 //         return true

//                 //     }
//                 // })
//                 // */
//             })
//         });
//     });
// }

// function pegaIdUsuario(telefone) {
//     let usuarioSistema = contatosConfirmacao.filter(contato => {
//         return contato.telefone == telefone
//     });

//     if (usuarioSistema[0] != undefined)
//         return usuarioSistema[0].id
//     else
//         return false;
// }

// function confirmaSolicitacao(mensagem) {
//     console.log('Confirmando Vinculacao');
//     const p = mensagem.selectedButtonId.split('_');
//     const usuarioEntrada = mensagem.from.split('@')[0];
//     const idUsuario = pegaIdUsuario(usuarioEntrada)

//     let parametros = {
//         id_usuario: idUsuario,
//         id_solicitacao: p[1]
//     }

//     if (idUsuario) {
//         executaFuncaoClasse('centralCriadores', 'confirmaSolicitacaoVinculacao', parametros, 'get').then(retorno => {
//             if (retorno.chave != undefined && retorno.chave > 0) {
//                 clientBot.sendText(mensagem.from, 'Vinculação Confirmada');
//             } else if (retorno.informacao != undefined) {
//                 clientBot.sendText(mensagem.from, retorno.informacao)
//             }
//         })
//     }
//     //*/
// }

// function recusarSolicitacao(mensagem, clientBot) {
//     console.log('Recusando Solicitacao');
//     const p = mensagem.selectedButtonId.split('_');
//     const usuarioEntrada = mensagem.from.split('@')[0];
//     const idUsuario = pegaIdUsuario(usuarioEntrada)

//     let parametros = {
//         id_usuario: idUsuario,
//         id_solicitacao: p[1]
//     }

//     executaFuncaoClasse('centralCriadores', 'recusaSolicitacaoVinculacao', parametros, 'get').then(retorno => {
//         if (retorno.chave != undefined && retorno.chave > 0) {
//             clientBot.sendText(mensagem.from, 'Vinculação Recusada');
//         } else if (retorno.informacao != undefined) {
//             clientBot.sendText(mensagem.from, retorno.informacao)
//         }
//     })
//     //*/
// }

// module.exports = {
//     enviarSlicitacao,
//     confirmaSolicitacao,
//     recusarSolicitacao
// }
//*/



