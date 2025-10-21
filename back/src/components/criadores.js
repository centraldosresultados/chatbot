/**
 * @file Gerenciamento de funcionalidades relacionadas a criadores.
 * @description Este módulo lida com a validação de cadastro de criadores e o envio de reset de senha.
 *              Originalmente continha um exemplo de objeto `mensagemEntrada` que foi comentado.
 * @version 1.0.0
 */

const { executaFuncaoClasse } = require("../services/services");

/**
 * Monta a mensagem de confirmação de cadastro validado.
 * @param {Object} dados - Dados do criador.
 * @param {string} dados.nome - Nome do criador.
 * @returns {string} Mensagem formatada.
 */
const montaMensagemValidaCadastro = (dados) => {
  return `
Olá ${dados.nome}
Parabéns, seu cadastro na 
*Central dos Criadores* 
foi validado com sucesso!
`;
};

/**
 * Monta a mensagem indicando que houve um erro ao validar o cadastro.
 * @param {Object} dados - Dados do criador (pode conter informações sobre o erro).
 * @param {string} dados.nome - Nome do criador.
 * @returns {string} Mensagem formatada.
 */
const montaMensagemNaoValidaCadastro = (dados) => {
  return `
Olá ${dados.nome}    
Houve algum erro tentar validar sua conta.
Tente novamente.
    `;
};

/**
 * Processa a validação de cadastro de um criador.
 * Extrai informações da mensagem recebida, chama o serviço para validar o cadastro
 * e envia uma mensagem de retorno ao usuário.
 * @param {import('whatsapp-web.js').Message} mensagem - Objeto da mensagem recebida do WhatsApp.
 * @param {import('whatsapp-web.js').Client} clientBot - Instância do cliente WhatsApp para enviar respostas.
 */
function validarCadastro(mensagem, clientBot) {
  // Extrai o código do criador e o telefone da mensagem de resposta de botão.
  const parametros = {
    codigo_criador: mensagem.selectedButtonId.split("_")[1],
    telefone: mensagem.from.split("@")[0].substring(2, 13), // Formata o telefone
  };

  // Chama a função do backend para validar o cadastro.
  executaFuncaoClasse(
    "centralCriadores", // Nome da classe no backend
    "validaCadastroCriador", // Nome da função no backend
    parametros,
  ).then((retorno) => {
    if (retorno.sucesso != undefined) {
      // Envia mensagem de sucesso
      clientBot
        .sendText(mensagem.from, montaMensagemValidaCadastro(retorno.dados))
        .then((retornoEnvio) => {
          // console.log("Status envio validação:", retornoEnvio.status);
          return retornoEnvio.status;
        });
    } else if (retorno.erro != undefined) {
      // Envia mensagem de erro
      clientBot.sendText(
        mensagem.from,
        montaMensagemNaoValidaCadastro(retorno.erro),
      );
    } else if (retorno.informacao != undefined) {
      // Envia mensagem de informação (possivelmente um erro tratado ou aviso)
      clientBot.sendText(
        mensagem.from,
        montaMensagemNaoValidaCadastro(retorno.informacao),
      );
    }
  });
}

/**
 * Função para enviar um email ou mensagem de reset de senha.
 * ATENÇÃO: Esta função está definida mas não implementada.
 * @param {Object} [parametros] - Parâmetros necessários para o reset (ex: email, telefone).
 * @param {Function} [callback] - Função de callback a ser executada após o envio.
 */
function enviarResetSenha(/*parametros, callback*/) {
  // TODO: Implementar a lógica de envio de reset de senha.
  // Considerar se será por WhatsApp, email ou outro método.
  // Remover a função se não for utilizada.
  console.warn("Função enviarResetSenha não implementada.");
}

module.exports = {
  validarCadastro,
  enviarResetSenha,
};
