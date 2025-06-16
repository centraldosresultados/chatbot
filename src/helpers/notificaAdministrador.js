/**
 * Rotina para notificar o administrador em caso de falhas ou desconexão do WhatsApp.
 * Envia uma mensagem para o telefone definido em contatoAdministrador no config.js.
 */
const { contatoAdministrador } = require('../config');

// Garantir que contatoAdministrador está definido corretamente
function getTelefoneAdministrador() {
  // Se o objeto foi importado como default, ou como propriedade, cobre ambos os casos
  if (contatoAdministrador && contatoAdministrador.telefone) return contatoAdministrador.telefone;
  if (contatoAdministrador && contatoAdministrador.default && contatoAdministrador.default.telefone) return contatoAdministrador.default.telefone;
  return null;
}

// Função para obter conexaoBot de forma dinâmica, evitando dependência circular
function getConexaoBot() {
  try {
    const { conexaoBot } = require('../services/conexaoZap');
    return conexaoBot;
  } catch (error) {
    console.warn('[notificaAdministrador] Não foi possível importar conexaoBot:', error.message);
    return null;
  }
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
    if (!telefone) {
      console.warn('[notificaAdministrador] Telefone do administrador não encontrado em config.js');
      return;
    }

    const conexaoBot = getConexaoBot();
    if (!conexaoBot || !conexaoBot.enviarMensagem) {
      console.warn('[notificaAdministrador] conexaoBot não disponível ou não inicializado');
      return;
    }

    // Verificar se o cliente está conectado
    const conectado = await conexaoBot.verificarConectividade();
    if (!conectado) {
      console.warn('[notificaAdministrador] WhatsApp não está conectado, notificação não enviada');
      return;
    }

    const texto = `⚠️ Atenção: ${motivo}${detalhes ? `\nDetalhes: ${detalhes}` : ''}`;
    const resultado = await conexaoBot.enviarMensagem(telefone, texto);
    
    if (resultado.sucesso) {
      console.log(`[notificaAdministrador] ✅ Mensagem enviada para o administrador (${telefone}): ${motivo}`);
    } else {
      console.error(`[notificaAdministrador] ❌ Falha ao enviar para administrador: ${resultado.erro}`);
    }
  } catch (err) {
    console.error('[notificaAdministrador] Erro inesperado ao notificar o administrador:', err.message);
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
