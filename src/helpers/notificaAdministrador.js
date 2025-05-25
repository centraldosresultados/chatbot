/**
 * Rotina para notificar o administrador em caso de falhas ou desconexão do WhatsApp.
 * Envia uma mensagem para o telefone definido em contatoAdministrador no config.js.
 */
const { contatoAdministrador } = require('../config');
const { conexaoBot } = require('../services/conexaoZap');

// Garantir que contatoAdministrador está definido corretamente
function getTelefoneAdministrador() {
  // Se o objeto foi importado como default, ou como propriedade, cobre ambos os casos
  if (contatoAdministrador && contatoAdministrador.telefone) return contatoAdministrador.telefone;
  if (contatoAdministrador && contatoAdministrador.default && contatoAdministrador.default.telefone) return contatoAdministrador.default.telefone;
  return null;
}

/**
 * Envia uma mensagem de notificação para o administrador.
 * @param {string} motivo - Motivo da falha, desconexão, conexão ou reconexão.
 * @param {string} [detalhes] - Detalhes adicionais do evento.
 * @returns {Promise<void>}
 */
async function notificaAdministrador(motivo, detalhes = '') {
  try {
    const telefone = getTelefoneAdministrador();
    if (!telefone) throw new Error('Telefone do administrador não encontrado em config.js');
    const texto = `⚠️ Atenção: ${motivo}${detalhes ? `\nDetalhes: ${detalhes}` : ''}`;
    await conexaoBot.enviarMensagem(telefone, texto);
    // Opcional: logar o envio
    console.log(`[notificaAdministrador] Mensagem enviada para o administrador (${telefone}): ${texto}`);
  } catch (err) {
    console.error('[notificaAdministrador] Falha ao notificar o administrador:', err);
  }
}

/**
 * Notifica o administrador sobre uma nova conexão ou reconexão do WhatsApp.
 * @param {boolean} reconexao - Se é uma reconexão (true) ou uma nova conexão (false).
 */
async function notificaConexao(reconexao = false) {
  const motivo = reconexao ? 'Reconexão do WhatsApp realizada com sucesso.' : 'Nova conexão do WhatsApp realizada com sucesso.';
  await notificaAdministrador(motivo);
}

module.exports = { notificaAdministrador, notificaConexao };
