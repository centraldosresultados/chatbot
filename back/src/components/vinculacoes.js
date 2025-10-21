/**
 * @file Gerenciamento de vinculações de pássaros.
 * @description Este módulo é responsável por popular, enviar e responder solicitações de vinculação
 *              de pássaros, interagindo com o Firebase Realtime Database e a API da Central dos Criadores.
 * @version 1.0.0
 */

import { getDatabase, ref, get, child, onValue } from 'firebase/database';
import {
  contatosConfirmacao,
  firebaseConfig,
  pegaIdContatoConfirmacao,
} from '../config.js';
import {
  montaMensagemVinculacaoConfirmacao,
} from '../helpers/funcoesAuxiliares.js';
import { salvarSolicitacaoFB } from '../services/conexao.js';
import { conexaoBot } from '../services/conexaoZap.js';
import { executaFuncaoClasse } from '../services/services.js';
import { initializeApp } from 'firebase/app';

// Inicializa o Firebase App. Não é necessário atribuir a uma variável se não for usada diretamente em outros locais deste arquivo.
initializeApp(firebaseConfig);
const db = getDatabase(); // Obtém a instância do Realtime Database.
const dbRef = ref(db);    // Cria uma referência para a raiz do banco de dados.
const tabela = "vinculacoes_solicitacoes"; // Nome da tabela/nó no Firebase para as solicitações.

/**
 * Objeto que encapsula a lógica de vinculações.
 * @namespace vinculacaoes
 */
const vinculacaoes = {
    /** @type {Array<Object> | undefined} */
    vinculacoes: undefined, // Cache local das solicitações de vinculação.

    /**
     * Carrega (ou recarrega) as solicitações de vinculação do Firebase para o cache local.
     * @async
     */
    async populaVinculacoes() {
      try {
        const snapshot = await get(child(dbRef, tabela));
        if (snapshot.exists()) {
          const temp = [];
          const data = snapshot.val();
          for (let keyFB in data) {
            let item = data[keyFB];
            item["keyFB"] = keyFB; // Adiciona a chave do Firebase ao objeto para referência futura.
            temp.push(item);
          }
          this.vinculacoes = temp;
          console.log("Vinculações populadas/atualizadas.");
        } else {
          this.vinculacoes = []; // Se não há dados, inicializa como array vazio.
          console.log("Nenhuma vinculação encontrada no Firebase.");
        }
      } catch (error) {
        console.error("Erro ao popular vinculações do Firebase:", error);
        this.vinculacoes = []; // Em caso de erro, define como vazio para evitar problemas.
      }
    },

    /**
     * Busca uma vinculação pendente específica no cache local.
     * @async
     * @param {string} idM - ID da mensagem original da solicitação no WhatsApp.
     * @param {string} numero - Número de telefone que deve confirmar.
     * @returns {Promise<Object | undefined>} A vinculação pendente, se encontrada.
     */
    async pegaVinculacaoPendente(idM, numero) {
      if (this.vinculacoes === undefined) {
        await this.populaVinculacoes(); // Garante que as vinculações estejam carregadas.
      }
      // Filtra as vinculações para encontrar uma correspondente, não respondida e não autorizada.
      return this.vinculacoes.find(
        (v) =>
          v.idM == idM && v.numero == numero && !v.respondida && !v.autorizada,
      );
    },

    /**
     * Envia uma solicitação de vinculação para os contatos de confirmação.
     * @async
     * @param {Object} parametros - Parâmetros da solicitação (ex: dados do pássaro, criador).
     * @returns {Promise<Object>} Um objeto indicando sucesso ou falha.
     */
    async enviarSolicitacao(parametros) {
      return new Promise((resolve) => { // Removido reject pois não estava sendo usado e erros são logados.
        (async () => {
          try {
            // Busca os dados do pássaro na API backend.
            const retornoApi = await executaFuncaoClasse(
              "centralCriadores",
              "buscarPassaroVinculacaoSolicitacao",
              parametros,
            );

            if (!retornoApi || retornoApi.erro) {
              console.error("Erro ao buscar dados do pássaro na API:", retornoApi ? retornoApi.erro : "Retorno vazio");
              resolve({ erro: "Falha ao buscar dados para solicitação." });
              return;
            }

            const dadosMensagem = montaMensagemVinculacaoConfirmacao(retornoApi); // Monta a mensagem a ser enviada.

            // Envia a solicitação para cada contato de confirmação.
            for (const item of contatosConfirmacao) {
              const contatoEnviar = item.telefone;

              // Envia a mensagem de texto principal.
              const mensagemEnviada = await conexaoBot.enviarMensagem(
                contatoEnviar,
                dadosMensagem.texto,
              );

              if (!mensagemEnviada || !mensagemEnviada.id) {
                console.error(`Falha ao enviar mensagem de texto para ${contatoEnviar}`);
                continue; // Pula para o próximo contato em caso de falha no envio da mensagem principal
              }
              console.log("Retorno Mensagem para", contatoEnviar, ":", mensagemEnviada.id);

              // Envia imagens, se existirem.
              if (dadosMensagem.placaIdentifcacao && dadosMensagem.placaIdentifcacao.imagem) {
                await conexaoBot.enviarMensagem(
                  contatoEnviar,
                  "", // Sem texto adicional para a imagem
                  dadosMensagem.placaIdentifcacao.imagem,
                );
              }
              if (dadosMensagem.relacaoSispass && dadosMensagem.relacaoSispass.imagem) {
                await conexaoBot.enviarMensagem(
                  contatoEnviar,
                  "", // Sem texto adicional para a imagem
                  dadosMensagem.relacaoSispass.imagem,
                );
              }

              // Prepara o objeto para salvar no Firebase.
              const insereFB = {
                idM: mensagemEnviada.id, // ID da mensagem do WhatsApp enviada.
                numero: contatoEnviar,    // Número para o qual a mensagem foi enviada.
                acao: "confirmacaoVinculacao",
                codigo_vinculacao: parametros, // Dados originais da solicitação.
                autorizada: false, // Status inicial.
                respondida: false, // Status inicial.
              };

              await salvarSolicitacaoFB(insereFB); // Salva a solicitação no Firebase.
            }
            resolve({ sucesso: "Solicitação Enviada, Aguarde a confirmação." });
          } catch (error) {
            console.error("Erro ao enviar solicitação de vinculação:", error);
            resolve({ erro: "Ocorreu um erro interno ao processar a solicitação." });
          }
        })();
      });
    },

    /**
     * Processa a resposta de uma solicitação de vinculação.
     * @async
     * @param {Object} solicitacao - Objeto da solicitação pendente do Firebase.
     * @param {string} textoResposta - Texto da resposta do usuário (ex: "1" para confirmar, "2" para recusar).
     * @param {string} origem - Número de telefone de quem respondeu.
     */
    async responderSolicitacao(solicitacao, textoResposta, origem) {
      console.log("Processando resposta de vinculação...");

      const idUsuarioConfirmacao = pegaIdContatoConfirmacao(origem);
      if (!idUsuarioConfirmacao) {
        console.warn(`Resposta de vinculação de número não autorizado: ${origem}`);
        // Poderia enviar uma mensagem de volta informando que o número não é autorizado a responder.
        return;
      }

      const respostaValida = textoResposta === "1" || textoResposta === "2";
      if (!respostaValida) {
        console.log(`Resposta inválida: '${textoResposta}'. Enviando instrução.`);
        await conexaoBot.enviarMensagem(
          origem,
          "Resposta Inválida. Por favor, responda com '1' para CONFIRMAR ou '2' para RECUSAR.",
        );
        return;
      }

      const autorizar = textoResposta === "1";

      // Parâmetros para a API backend confirmar/recusar a vinculação.
      let parametrosApi = {
        id_usuario: idUsuarioConfirmacao,
        id_solicitacao: solicitacao.codigo_vinculacao.id_passaro_vinculacao_solicitacao, // Ajustar conforme a estrutura de `solicitacao.codigo_vinculacao`
        autorizar: autorizar,
      };

      try {
        const respConfApi = await executaFuncaoClasse(
          "centralCriadores",
          "confirmaSolicitacaoVinculacao",
          parametrosApi,
          "get", // ou "post", dependendo da API
        );
        console.log("Resposta da API de confirmação:", respConfApi);

        if (respConfApi && respConfApi.sucesso) {
          // Atualiza todas as solicitações pendentes relacionadas no Firebase.
          // Isso é útil se a mesma solicitação foi enviada para múltiplos confirmadores.
          const vinculacoesParaAtualizar = this.vinculacoes.filter(
            (v) => v.codigo_vinculacao.id_passaro_vinculacao_solicitacao === solicitacao.codigo_vinculacao.id_passaro_vinculacao_solicitacao && !v.respondida,
          );

          for (const vinc of vinculacoesParaAtualizar) {
            vinc.autorizada = autorizar;
            vinc.respondida = true;
            // Não deletar keyFB antes de salvar, pois é usada como ID do nó.
            await salvarSolicitacaoFB(vinc, vinc.keyFB); // Atualiza o registro existente usando a keyFB.
          }

          await conexaoBot.enviarMensagem(origem, respConfApi.texto || (autorizar ? "Vinculação autorizada com sucesso!" : "Vinculação recusada."));
          // Notificar o solicitante original (se aplicável e se os dados estiverem disponíveis)

        } else if (respConfApi && respConfApi.informacao) {
          await conexaoBot.enviarMensagem(origem, respConfApi.informacao);
        } else {
          await conexaoBot.enviarMensagem(origem, "Houve um erro ao processar sua resposta junto ao sistema.");
        }
      } catch (error) {
        console.error("Erro ao responder solicitação de vinculação (API ou Firebase):", error);
        await conexaoBot.enviarMensagem(origem, "Ocorreu um erro interno ao processar sua resposta.");
      }
    },
};

// Observador para atualizações na tabela de vinculações no Firebase.
// Quando há uma alteração, repopula a lista local de vinculações.
onValue(ref(db, tabela), (/*snapshot*/) => {
  console.log("Detectada alteração em 'vinculacoes_solicitacoes', repopulando...");
  vinculacaoes.populaVinculacoes();
});

export { vinculacaoes };
