/**
 * @file Armazenamento de mensagens aguardando retorno.
 * @description Este módulo exporta um array que pode ser utilizado para armazenar
 *              identificadores ou objetos de mensagens que estão aguardando uma resposta
 *              ou uma ação específica do usuário ou do sistema.
 *              Atualmente, é apenas um array vazio inicializado.
 * @version 1.0.0
 */

/**
 * Array para armazenar mensagens que aguardam algum tipo de retorno ou processamento posterior.
 * Pode ser usado para rastrear interações em andamento.
 * @type {Array<any>} // O tipo 'any' pode ser refinado para um tipo mais específico de mensagem ou ID.
 */
let mensagensAguardandoRetorno = [];

module.exports = mensagensAguardandoRetorno;
