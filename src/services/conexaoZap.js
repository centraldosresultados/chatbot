const { Client, MessageMedia, LocalAuth } = require("whatsapp-web.js");
const { conexaoIo } = require("./socket");
const { pegaIdContatoConfirmacao } = require("../config");
//const { vinculacaoes } = require('../components/vinculacoes');

(async () => {
  /**
   * @namespace conexaoBot
   * @description Objeto principal para gerenciar a conexão e as interações com o WhatsApp.
   */
  const conexaoBot = {
    /** @type {Client | undefined} clientBot - Instância do cliente WhatsApp. */
    clientBot: undefined,
    /**
     * @async
     * @memberof conexaoBot
     * @function pegaClientBot
     * @description Obtém ou inicializa a instância do cliente WhatsApp.
     * @returns {Promise<Client>} Promessa que resolve com a instância do cliente.
     */
    async pegaClientBot() {
      return await new Promise((resolve) => {
        if (this.clientBot == undefined) {
          this.clientBot = new Client({
            authStrategy: new LocalAuth(),
            webVersionCache: {
              type: "remote",
              remotePath:
                "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
            },
            puppeteer: {
              //headless: 'new',
              args: ["--no-sandbox"],
            },
          });
        }
        resolve(this.clientBot);
      });
    },
    /**
     * @async
     * @memberof conexaoBot
     * @function enviarMensagem
     * @description Envia uma mensagem de texto e/ou imagem para um destinatário. Formata o número do destinatário adicionando o nono dígito para DDDs <= 30.
     * @param {string} destinatario - Número do destinatário (sem o código do país, ex: DDDXXXXXXXXX).
     * @param {string} [texto] - Texto da mensagem.
     * @param {string} [imagem] - URL da imagem a ser enviada.
     * @returns {Promise<object>} Promessa que resolve com um objeto indicando sucesso ou erro.
     *              Exemplo de sucesso: `{ sucesso: "Mensagem Enviada", id: "message_id" }`
     *              Exemplo de erro: `{ erro: "WhatsApp não conectado!" }` ou `{ erro: "Erro ao carregar imagem para envio.", detalhes: "mensagem de erro" }`
     */
    async enviarMensagem(destinatario, texto, imagem) {
      //Fazendo verificacao se adicionara o nono digito.
      const num = destinatario;
      const DDD = num.substr(0, 2);
      const tel = num.substr(-8, 8);

      destinatario = DDD <= 30 ? DDD + "9" + tel : DDD + tel;

      if (this.clientBot == undefined || this.clientBot.info == undefined) {
        console.error("[conexaoZap.js] enviarMensagem: Erro - WhatsApp não conectado!");
        return { erro: "WhatsApp não conectado!" };
      }
      
      let imagemEnviar;
      let textoEnviar;
      const temImagem = imagem != undefined && imagem != null;
      
      let temTexto = false; 
      if (typeof texto === 'string') {
        temTexto = texto.trim() !== '';
      } else if (texto !== undefined && texto !== null) {
        console.warn(`[conexaoZap.js] enviarMensagem: A variável 'texto' não é uma string. Valor recebido: ${texto}, Tipo: ${typeof texto}`);
      }


      try {
        if (temImagem) {
          imagemEnviar = await MessageMedia.fromUrl(imagem);
        }
      } catch (error) {
        console.error('[conexaoZap.js] enviarMensagem: Erro ao carregar MessageMedia.fromUrl:', error);
        return { erro: 'Erro ao carregar imagem para envio.', detalhes: error.message };
      }
      

      if (temImagem && temTexto) {
        textoEnviar = { caption: texto };
      } else if (!temImagem && temTexto) {
        textoEnviar = texto;
      } else if (temImagem && !temTexto) {
        textoEnviar = imagemEnviar; 
      } else {
        console.error('[conexaoZap.js] enviarMensagem: Nada para enviar (sem texto ou imagem).');
        return { erro: 'Nada para enviar (sem texto ou imagem).' };
      }
      
      return await new Promise((resolve) => {
        const numero = "55" + destinatario + "@c.us";
        
        const mensagemParaEnviar = temImagem && temTexto ? imagemEnviar : textoEnviar;

        let promiseEnvio;

        if (temImagem && temTexto) {
          promiseEnvio = this.clientBot.sendMessage(numero, imagemEnviar, { caption: texto });
        } else if (!temImagem && temTexto) {
          promiseEnvio = this.clientBot.sendMessage(numero, textoEnviar);
        } else if (temImagem && !temTexto) {
          promiseEnvio = this.clientBot.sendMessage(numero, imagemEnviar);
        }

        promiseEnvio
          .then((retornoMensagem) => {
            resolve(this.retornoMensagem(retornoMensagem._data.id.id));
          })
          .catch((error) => {
            console.error("[conexaoZap.js] enviarMensagem: Erro detalhado no sendMessage:", error);
            resolve({ erro: "Erro ao enviar mensagem no whatsapp-web.js", detalhes: error.message || error });
          });
      });
    },
    /**
     * @async
     * @memberof conexaoBot
     * @function retornoMensagem
     * @description Aguarda a confirmação de envio de uma mensagem pelo ID.
     * @param {string} id - ID da mensagem para verificar o status.
     * @returns {Promise<object>} Promessa que resolve com o status da mensagem.
     *              Exemplo de sucesso: `{ sucesso: "Mensagem Enviada", id: "message_id" }`
     *              Exemplo de erro/timeout: `{ erro: "Erro ao Enviar Mensagem, finalizado por tentativas de confirmação", id: "message_id" }`
     */
    async retornoMensagem(id) {
      return await new Promise((resolve) => {
        let tentativas = 0;
        const verifica = setInterval(async () => {
          let mensagemStatus = statusMensagens.getMensagem(id);
          tentativas++;

          if (mensagemStatus.enviado) {
            clearInterval(verifica);
            resolve({ sucesso: "Mensagem Enviada", id: id });
          }

          if (tentativas > 30) { // 5 tentativas * 500ms = 2.5 segundos (ajustado de 30 para 5 para um timeout mais rápido)
            console.warn(`[conexaoZap.js] retornoMensagem: Timeout para ID: ${id}. Mensagem não confirmada após ${tentativas} tentativas.`);
            clearInterval(verifica);                       

            resolve({ erro: "Erro ao Enviar Mensagem, finalizado por tentativas de confirmação", id: id });
          }
        }, 500);
      });
    },
    /**
     * @async
     * @memberof conexaoBot
     * @function dadosMensagem
     * @description Extrai dados relevantes de um objeto de mensagem recebida.
     * @param {object} mensagem - Objeto da mensagem do whatsapp-web.js.
     * @returns {Promise<object>} Promessa que resolve com um objeto contendo a origem e o texto da mensagem.
     *              Exemplo: `{ origem: "DDDXXXXXXXXX", texto: "Conteúdo da mensagem" }`
     */
    async dadosMensagem(mensagem) {
      return await new Promise((resolve) => {
        resolve({
          origem: mensagem._data.from.split("@")[0].substring(2, 13), // Extrai o número do remetente
          texto: mensagem._data.body, // Extrai o corpo da mensagem
        });
      });
    },
    /**
     * @async
     * @memberof conexaoBot
     * @function recebeMensagem
     * @description Processa uma mensagem recebida. Verifica se é uma resposta a uma solicitação de vinculação pendente.
     * @param {object} mensagem - Objeto da mensagem do whatsapp-web.js.
     */
    async recebeMensagem(mensagem) {
      const { vinculacaoes } = require("../components/vinculacoes"); // Importa dinamicamente para evitar dependência circular ou carregar apenas quando necessário
      const origem = mensagem._data.from.split("@")[0].substring(2, 13); // Número do remetente

      const eResposta =
        mensagem._data.quotedMsg != undefined &&
        mensagem._data.quotedStanzaID != undefined; // Verifica se a mensagem é uma resposta
      const idUsuario = pegaIdContatoConfirmacao(origem); // Obtém o ID do usuário associado ao contato de confirmação
      const texto = mensagem._data.body; // Corpo da mensagem

      if (eResposta && idUsuario) {
        const idM = mensagem._data.quotedStanzaID; // ID da mensagem original que foi respondida

        let vinc = await vinculacaoes.pegaVinculacaoPendente(idM, origem);
        vinc = vinc.length > 0 ? vinc[0] : undefined; // Pega a primeira vinculação pendente, se existir

        if (vinc != undefined) {
          await vinculacaoes.responderSolicitacao(
            vinc,
            texto,
            origem,
          );
        }
      } 
    },
  };

  /**
   * @namespace statusMensagens
   * @description Objeto para gerenciar o status das mensagens enviadas (se foram enviadas, lidas, etc.).
   */
  const statusMensagens = {
    /** @type {Object<string, {enviado: boolean, lida: boolean}>} mensagens - Cache dos status das mensagens. */
    mensagens: {},
    /**
     * @memberof statusMensagens
     * @function setMensagem
     * @description Define ou atualiza o status de uma mensagem.
     * @param {string} id - ID da mensagem.
     * @param {{enviado: boolean, lida: boolean}} mensagem - Objeto com o status da mensagem.
     */
    setMensagem(id, mensagem) {
      this.mensagens[id] = mensagem;
    },
    /**
     * @memberof statusMensagens
     * @function getMensagem
     * @description Obtém o status de uma mensagem. Se não existir, inicializa com status padrão (não enviada, não lida).
     * @param {string} id - ID da mensagem.
     * @returns {{enviado: boolean, lida: boolean}} Status da mensagem.
     */
    getMensagem(id) {
      if (statusMensagens.mensagens[id] == undefined) {
        this.setMensagem(id, {
          enviado: false,
          lida: false,
        });
      }
      return this.mensagens[id];
    },
    /**
     * @memberof statusMensagens
     * @function delMensagen
     * @description Remove uma mensagem do cache de status. (Nota: A implementação atual parece recriar o objeto `mensagens` exceto pelo ID fornecido, o que pode não ser o comportamento desejado para uma simples deleção. Deveria ser `delete this.mensagens[id];`)
     * @param {string} id - ID da mensagem a ser removida.
     */
    delMensagen(id) { // Atenção: Nome da função com possível erro de digitação ("delMensagen" vs "delMensagem")
      // A lógica original recriava o objeto, o que é ineficiente.
      // Comentando a lógica original e sugerindo a correção:
      // for (let idM in this.mensagens) {
      //   if (idM != id) {
      //     this.setMensagem(idM, this.mensagens[idM]); // Erro aqui, deveria ser this.setMensagem(idM, this.mensagens[idM]) e depois delete this.mensagens[id] ou construir um novo objeto sem o id.
      //   }
      // }
      // Correção sugerida:
      if (this.mensagens.hasOwnProperty(id)) {
        delete this.mensagens[id];
      }
    },
  };

  //await conexaoBot.pegaClientBot(); // Chamada inicial comentada, o cliente será pego sob demanda

  module.exports = {
    conexaoBot,
    statusMensagens,
  };
})();
