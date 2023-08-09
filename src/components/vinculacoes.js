const { getDatabase, ref, get, child, onValue } = require('firebase/database');
const { contatosConfirmacao, firebaseConfig, pegaIdContatoConfirmacao } = require('../config');
const { montaMensagemVinculacaoConfirmacao } = require('../helpers/funcoesAuxiliares');
const { salvarSolicitacaoFB } = require('../services/conexao');
const { conexaoBot } = require('../services/conexaoZap');
const { executaFuncaoClasse } = require('../services/services');
const { initializeApp } = require('firebase/app');


const conFB = initializeApp(firebaseConfig)
const db = getDatabase();
const dbRef = ref(db)
const tabela = 'vinculacoes_solicitacoes';

(async () => {
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

            }).catch(error => {
                console.log('Erro Retorno ', error);
            })
        },
        async pegaVinculacaoPendente(idM, numero) {
            if (this.vinculacoes == undefined)
                await this.populaVinculacoes();

            return this.vinculacoes.filter(v => v.idM == idM && v.numero == numero && !v.respondida && !v.autorizada)
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

                        if (dadosEnvio.placaIdentifcacao != null)
                            await conexaoBot.enviarMensagem(contatoEnviar, '', dadosEnvio.placaIdentifcacao.imagem);

                        if (dadosEnvio.relacaoSispass != null)
                            await conexaoBot.enviarMensagem(contatoEnviar, '', dadosEnvio.relacaoSispass.imagem)

                        const insere = {
                            idM: idM.id,
                            numero: contatoEnviar,
                            acao: 'confirmacaoVinculacao',
                            codigo_vinculacao: parametros,
                            autorizada: false,
                            respondida: false
                        }

                        const foi = await salvarSolicitacaoFB(insere);
                    })
                });
            });
        },
        async responderSolicitacao(solicitacao, texto, origem) {
            console.log('Confirmando Vinculacao');

            //const p = mensagem.selectedButtonId.split('_');
            //const usuarioEntrada = solicitacao.numero;
            const idUsuario = pegaIdContatoConfirmacao(origem)

            const respostaValida = texto == '1' || texto == '2';

            let autorizar = false;

            if (respostaValida) {
                autorizar = texto == '1';

                let parametros = {
                    id_usuario: idUsuario,
                    id_solicitacao: solicitacao.codigo_vinculacao,
                    autorizar: autorizar
                }

                const respConf = await executaFuncaoClasse('centralCriadores', 'confirmaSolicitacaoVinculacao', parametros, 'get');
                console.log('Resposta Confirma:', respConf);

                if (respConf.sucesso != undefined) {

                    let solicitacoesArquivar = this.vinculacoes.filter(vinc => vinc.codigo_vinculacao == solicitacao.codigo_vinculacao)
                    //console.log(solicitacoesArquivar);
                    solicitacoesArquivar.map(sol => {
                        sol.autorizada = autorizar;
                        sol.respondida = true;

                        let k = sol.keyFB;
                        //  delete sol.keyFB
                        salvarSolicitacaoFB(sol, k)
                    })

                    conexaoBot.enviarMensagem(origem, respConf.texto)
                    //console.log(solicitacoesArquivar);
                } else if (respConf.informacao != undefined) {
                    await conexaoBot.enviarMensagem(origem, respConf.informacao)
                }
            } else {
                console.log('Resposta Inválida');
                conexaoBot.enviarMensagem(origem, 'Resposta Inválida, favor responder novamente');
            }
        }
    }

    module.exports = {
        vinculacaoes
    }
})();