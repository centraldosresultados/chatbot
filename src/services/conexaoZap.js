const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const { conexaoIo } = require('./socket');
const { contatosConfirmacao } = require('../config');

const conexaoBot = {
    clientBot: undefined,
    async pegaClientBot(nomeSessao) {
        return await new Promise((resolve, reject) => {
            if (this.clientBot == undefined) {
                this.clientBot = new Client({
                    authStrategy: new LocalAuth()
                })
            }
            resolve(this.clientBot)
        })
    },
    async enviarMensagem(destinatario, texto, imagem, aguardarEnvio = true) {
        if (this.clientBot == undefined || this.clientBot.info == undefined) {
            console.log('Erro ao Enviar Mensagem, não conectado');
            return { 'erro': 'WhatsApp não conectado!' }
        }
        /**
         * Funcao de envio de mensagens
         * @async 
         * @param { string } destinatario
         * @param { ?string } texto - Texto da mensagem
         * @param { ?string } [imagem] - Caminho da imagem
         * @param { ?boolean } aguardarEnvio - Esperar por retorno
         */
        const io = await conexaoIo.pegaConexao();

        let imagemEnviar;
        let textoEnviar;
        const temImagem = imagem != undefined && imagem != null;
        const temTexto = true; //texto != '';

        if (temImagem && !temTexto)
            textoEnviar = await MessageMedia.fromUrl(imagem);
        else if (temImagem && temTexto)
            imagemEnviar = await MessageMedia.fromUrl(imagem)

        if (imagemEnviar && temTexto)
            textoEnviar = { caption: texto }
        else if (!temImagem && temTexto)
            textoEnviar = texto;

        return await new Promise((resolve, reject) => {

            const numero = '55' + destinatario + '@c.us';
            // console.log('destino', numero);
            // console.log('Destinatario', destinatario);
            // console.log('Imagem', imagem);
            // console.log('Texto', texto);

            if (temImagem && temTexto) {
                this.clientBot.sendMessage(numero, imagemEnviar, textoEnviar).then(retornoMensagem => {
                    resolve(this.retornoMensagem(retornoMensagem._data.id.id))
                }).catch(error => {
                    resolve(error)
                    console.log('Erro ao enviar mensagem', error);
                });
            }
            else if (!temImagem && temTexto) {
                //console.log(textoEnviar);
                this.clientBot.sendMessage(numero, textoEnviar).then(retornoMensagem => {
                    resolve(this.retornoMensagem(retornoMensagem._data.id.id))
                }).catch(error => {
                    resolve(error)
                    console.log('Erro ao enviar mensagem', error);
                });
            }
            else if (temImagem && !temTexto) {
                this.clientBot.sendMessage(numero, imagemEnviar).then(retornoMensagem => {
                    resolve(this.retornoMensagem(retornoMensagem._data.id.id))
                }).catch(error => {
                    resolve(error)
                    console.log('Erro ao enviar mensagem', error);
                });
            }
        })
    },
    async retornoMensagem(id) {
        return await new Promise((resolve, reject) => {
            let tentativas = 0;
            const verifica = setInterval(async () => {
                let mensagem = statusMensagens.getMensagem(id);
                tentativas++;

                if (mensagem.enviado) {
                    console.log('Finalizado por envio');
                    clearInterval(verifica)
                    resolve({ sucesso: 'Mensagem Enviada', id: id })
                }

                if (tentativas > 30) {
                    console.log('Finalizado por tentativas');
                    clearInterval(verifica);
                    resolve({ erro: 'Erro ao Enviar Mensagem' });
                }
            }, 500);
        });
        //*/
    },
    async dadosMensagem(mensagem) {
        return await new promises((resolve, reject) => {
            resolve({
                origem: mensagem._data.from.split('@')[0].substring(2, 13),
                texto: mensagem._data.body,
            })
        })
    },
    async recebeMensagem(mensagem) {
        return await new Promise((resolve, reject) => {
            //console.log(mensagem);
            const origem = mensagem._data.from.split('@')[0].substring(2, 13);
            const eResposta = mensagem._data.quotedMsg != undefined && mensagem._data.quotedMsg.id != undefined;
            const telServico = contatosConfirmacao.filter(contato => contato.telefone == origem);

            if(eResposta){
                const solicitacao = Vinculacao.buscaVinculacao(mensagem._data.quotedMsg.id, origem) ;
                console.log('E Resposta', solicitacao); 
            }else{
                console.log('Não É Resposta');
            }

            // if(telServico.length > 0){
            //     console.log('tel servico');
            // }else{
            //     console.log('nao tel servico');
            // }
            // console.log(telServico);
        })
    }
}

// /**
//  * Funcao de envio de mensagens
//  * @async 
//  * @param { string } destinatario
//  * @param { ?string } texto - Texto da mensagem
//  * @param { ?string } [imagem] - Caminho da imagem
//  * @param { ?boolean } aguardarEnvio - Esperar por retorno
//  */
// async function enviarMensagem(destinatario, texto, imagem, aguardarEnvio = true) {
//     const io = await conexaoIo.pegaConexao();
//     let imagemEnviar;
//     let textoEnviar;

//     if (imagem != undefined && imagem != null)
//         imagemEnviar = await MessageMedia.fromUrl(imagem);

//     if (imagemEnviar && texto != undefined)
//         textoEnviar = { caption: texto }
//     else if (!imagemEnviar && texto != undefined)
//         textoEnviar = texto;


//     return await new Promise((resolve, reject) => {

//     })
// }

const statusMensagens = {
    mensagens: {},
    setMensagem(id, mensagem) {
        //console.log(id);
        //console.log(mensagem);
        this.mensagens[id] = mensagem;
    },
    getMensagem(id) {
        if (statusMensagens.mensagens[id] == undefined) {
            this.setMensagem(id, {
                enviado: false,
                lida: false
            })
        }

        return this.mensagens[id];
    },
    delMensagen(id) {
        for (let idM in this.mensagens) {
            if (idM != id) {
                this.setMensagem(id, this.mensagens[id])
            }
        }
        console.log(this.mensagens);
    }
}

// function atualizarMensagens(id, valores) {
//     let mensagens = buscarDadosLocais('mensagens');
//     mensagens[id] = valores;
//     salvarDadosLocais('mensagens', mensagens);
// }

// async function retornoMensagem(id) {
//     return await new Promise((resolve, reject) => {
//         let tentativas = 0;
//         const verifica = setInterval(async () => {
//             let mensagem = statusMensagens.getMensagem(id);
//             tentativas++;

//             if (mensagem.enviado) {
//                 console.log('Finalizado por envio');
//                 clearInterval(verifica)
//                 resolve({ sucesso: 'Mensagem Enviada' })
//             }

//             if (tentativas > 30) {
//                 console.log('Finalizado por tentativas');
//                 clearInterval(verifica);
//                 resolve({ erro: 'Erro ao Enviar Mensagem' });
//             }
//         }, 500);
//     });
//     //*/
// }

module.exports = {
    conexaoBot,
    //enviarMensagem,
    //retornoMensagem,
    //  atualizarMensagens,
    statusMensagens,
}