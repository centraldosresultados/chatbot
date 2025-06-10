const { Client, MessageMedia, LocalAuth } = require("whatsapp-web.js");
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
     * @function validarNumero
     * @description Valida e formata um número de telefone brasileiro.
     * @param {string} numero - Número do destinatário (ex: DDDXXXXXXXXX).
     * @returns {object} Objeto com o número formatado ou erro.
     */
    validarNumero(numero) {
      // Remove caracteres não numéricos
      const numeroLimpo = numero.replace(/\D/g, '');
      
      // Verifica se tem pelo menos 10 dígitos (DDD + 8 dígitos) ou 11 dígitos (DDD + 9 dígitos)
      if (numeroLimpo.length < 10 || numeroLimpo.length > 11) {
        return { erro: 'Número inválido. Deve ter entre 10 e 11 dígitos.' };
      }
      
      const DDD = numeroLimpo.substr(0, 2);
      const dddValido = parseInt(DDD);
      
      // Valida se o DDD está no range válido (11-99)
      if (dddValido < 11 || dddValido > 99) {
        return { erro: 'DDD inválido. Deve estar entre 11 e 99.' };
      }
      
      let numeroFormatado;
      
      if (numeroLimpo.length === 10) {
        // Número de 8 dígitos, adiciona o 9 se necessário
        const tel = numeroLimpo.substr(2);
        numeroFormatado = dddValido <= 30 ? DDD + "9" + tel : numeroLimpo;
      } else {
        // Número já tem 9 dígitos
        numeroFormatado = numeroLimpo;
      }
      
      return { numero: numeroFormatado };
    },

    /**
     * @async
     * @memberof conexaoBot
     * @function verificarConectividade
     * @description Verifica se o WhatsApp está realmente conectado e pronto para envio.
     * @returns {Promise<boolean>} True se conectado, false caso contrário.
     */
    async verificarConectividade() {
      try {
        if (!this.clientBot || !this.clientBot.info) {
          return false;
        }
        
        // Verifica se o estado é 'CONNECTED'
        const state = await this.clientBot.getState();
        return state === 'CONNECTED';
      } catch (error) {
        console.error('[conexaoZap.js] verificarConectividade: Erro ao verificar estado:', error);
        return false;
      }
    },

    /**
     * @async
     * @memberof conexaoBot
     * @function enviarMensagem
     * @description Envia uma mensagem de texto e/ou imagem para um destinatário com retry automático e validações robustas.
     * @param {string} destinatario - Número do destinatário (ex: DDDXXXXXXXXX).
     * @param {string} [texto] - Texto da mensagem.
     * @param {string} [imagem] - URL da imagem a ser enviada.
     * @param {number} [tentativas=3] - Número máximo de tentativas de envio.
     * @returns {Promise<object>} Promessa que resolve com um objeto indicando sucesso ou erro.
     *              Exemplo de sucesso: `{ sucesso: "Mensagem Enviada", id: "message_id", numero: "55DDDNNNNNNNNN" }`
     *              Exemplo de erro: `{ erro: "Descrição do erro", detalhes: "detalhes técnicos" }`
     */
    async enviarMensagem(destinatario, texto, imagem, tentativas = 3) {
      console.log(`[conexaoZap.js] enviarMensagem: Iniciando envio para ${destinatario}`);
      
      // Validação do número
      const resultadoValidacao = this.validarNumero(destinatario);
      if (resultadoValidacao.erro) {
        console.error(`[conexaoZap.js] enviarMensagem: ${resultadoValidacao.erro}`);
        return { erro: resultadoValidacao.erro };
      }
      
      const numeroFormatado = resultadoValidacao.numero;
      const numeroCompleto = "55" + numeroFormatado + "@c.us";
      
      // Verificação de conectividade
      const conectado = await this.verificarConectividade();
      if (!conectado) {
        console.error("[conexaoZap.js] enviarMensagem: WhatsApp não está conectado ou pronto para envio!");
        return { erro: "WhatsApp não conectado ou não está pronto para envio!" };
      }
      
      // Validação do conteúdo
      const temTexto = typeof texto === 'string' && texto.trim() !== '';
      const temImagem = imagem && typeof imagem === 'string' && imagem.trim() !== '';
      
      if (!temTexto && !temImagem) {
        console.error('[conexaoZap.js] enviarMensagem: Nada para enviar (sem texto ou imagem).');
        return { erro: 'Nada para enviar (sem texto ou imagem válidos).' };
      }
      
      // Carregamento da imagem se necessário
      let imagemEnviar;
      if (temImagem) {
        try {
          console.log(`[conexaoZap.js] enviarMensagem: Carregando imagem: ${imagem}`);
          imagemEnviar = await MessageMedia.fromUrl(imagem);
        } catch (error) {
          console.error('[conexaoZap.js] enviarMensagem: Erro ao carregar imagem:', error);
          return { erro: 'Erro ao carregar imagem para envio.', detalhes: error.message };
        }
      }
      
      // Tentativas de envio com retry
      for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
        try {
          console.log(`[conexaoZap.js] enviarMensagem: Tentativa ${tentativa}/${tentativas} para ${numeroFormatado}`);
          
          let resultado;
          
          if (temImagem && temTexto) {
            // Envia imagem com legenda
            resultado = await this.clientBot.sendMessage(numeroCompleto, imagemEnviar, { caption: texto });
          } else if (temTexto && !temImagem) {
            // Envia apenas texto
            resultado = await this.clientBot.sendMessage(numeroCompleto, texto);
          } else if (temImagem && !temTexto) {
            // Envia apenas imagem
            resultado = await this.clientBot.sendMessage(numeroCompleto, imagemEnviar);
          }
          
          if (resultado && resultado._data && resultado._data.id) {
            const messageId = resultado._data.id.id;
            console.log(`[conexaoZap.js] enviarMensagem: Mensagem enviada com sucesso. ID: ${messageId}`);
            
            // Retorna sucesso imediato sem aguardar confirmação de status
            return { 
              sucesso: "Mensagem enviada com sucesso", 
              id: messageId, 
              numero: numeroCompleto,
              tentativa: tentativa
            };
          } else {
            throw new Error('Resposta inválida do WhatsApp Web');
          }
          
        } catch (error) {
          console.error(`[conexaoZap.js] enviarMensagem: Erro na tentativa ${tentativa}:`, error);
          
          // Se não é a última tentativa, aguarda antes de tentar novamente
          if (tentativa < tentativas) {
            const delay = tentativa * 2000; // Delay progressivo: 2s, 4s, 6s...
            console.log(`[conexaoZap.js] enviarMensagem: Aguardando ${delay}ms antes da próxima tentativa...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            
            // Re-verifica conectividade antes da próxima tentativa
            const conectadoRetry = await this.verificarConectividade();
            if (!conectadoRetry) {
              console.error('[conexaoZap.js] enviarMensagem: Perdeu conectividade durante retry');
              return { erro: 'Conexão perdida durante tentativas de envio', detalhes: error.message };
            }
          } else {
            // Última tentativa falhou
            console.error(`[conexaoZap.js] enviarMensagem: Todas as ${tentativas} tentativas falharam`);
            return { erro: 'Falha ao enviar mensagem após todas as tentativas', detalhes: error.message };
          }
        }
      }
      
      return { erro: 'Erro inesperado no envio da mensagem' };
    },
    /**
     * @async
     * @memberof conexaoBot
     * @function enviarMensagemComStatus
     * @description Envia uma mensagem e aguarda confirmação de status (método antigo). Use apenas quando necessário aguardar confirmação.
     * @param {string} destinatario - Número do destinatário.
     * @param {string} [texto] - Texto da mensagem.
     * @param {string} [imagem] - URL da imagem a ser enviada.
     * @returns {Promise<object>} Promessa que resolve com o status da mensagem após confirmação.
     */
    async enviarMensagemComStatus(destinatario, texto, imagem) {
      const resultado = await this.enviarMensagem(destinatario, texto, imagem, 1);
      
      if (resultado.erro) {
        return resultado;
      }
      
      // Aguarda confirmação de status usando o sistema antigo
      return await this.retornoMensagem(resultado.id);
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
        const maxTentativas = 10; // Reduzido de 30 para 10 (5 segundos total)
        
        const verifica = setInterval(async () => {
          let mensagemStatus = statusMensagens.getMensagem(id);
          tentativas++;

          if (mensagemStatus.enviado) {
            clearInterval(verifica);
            statusMensagens.delMensagem(id); // Limpa o cache após confirmação
            resolve({ sucesso: "Mensagem Enviada", id: id });
          }

          if (tentativas >= maxTentativas) {
            console.warn(`[conexaoZap.js] retornoMensagem: Timeout para ID: ${id}. Mensagem não confirmada após ${tentativas} tentativas.`);
            clearInterval(verifica);
            statusMensagens.delMensagem(id); // Limpa o cache mesmo com timeout
            resolve({ erro: "Timeout na confirmação de envio", id: id });
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
     * @function delMensagem
     * @description Remove uma mensagem do cache de status.
     * @param {string} id - ID da mensagem a ser removida.
     */
    delMensagem(id) {
      if (Object.prototype.hasOwnProperty.call(this.mensagens, id)) {
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
