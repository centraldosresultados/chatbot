/**
 * Arquivo de exemplo demonstrando como usar as novas funcionalidades de envio de mensagem
 */

const { conexaoBot } = require('./src/services/conexaoZap');

/**
 * Exemplos de uso da função enviarMensagem melhorada
 */
async function exemploUsoEnvioMensagem() {
  try {
    console.log('=== Exemplos de Uso da Nova Função enviarMensagem ===\n');

    // Exemplo 1: Envio de texto simples
    console.log('1. Enviando mensagem de texto simples...');
    const resultado1 = await conexaoBot.enviarMensagem(
      '11999999999', 
      'Olá! Esta é uma mensagem de teste do sistema melhorado.'
    );
    console.log('Resultado:', resultado1);
    console.log('---\n');

    // Exemplo 2: Envio com retry personalizado
    console.log('2. Enviando mensagem com 5 tentativas...');
    const resultado2 = await conexaoBot.enviarMensagem(
      '11999999999', 
      'Mensagem com retry personalizado.',
      null, // sem imagem
      5     // 5 tentativas
    );
    console.log('Resultado:', resultado2);
    console.log('---\n');

    // Exemplo 3: Envio de imagem com legenda
    console.log('3. Enviando imagem com legenda...');
    const resultado3 = await conexaoBot.enviarMensagem(
      '11999999999',
      'Confira esta imagem!',
      'https://via.placeholder.com/300x200.png?text=Teste'
    );
    console.log('Resultado:', resultado3);
    console.log('---\n');

    // Exemplo 4: Envio apenas de imagem
    console.log('4. Enviando apenas imagem...');
    const resultado4 = await conexaoBot.enviarMensagem(
      '11999999999',
      null, // sem texto
      'https://via.placeholder.com/300x200.png?text=SemTexto'
    );
    console.log('Resultado:', resultado4);
    console.log('---\n');

    // Exemplo 5: Usando o método com confirmação de status
    console.log('5. Enviando mensagem e aguardando confirmação de status...');
    const resultado5 = await conexaoBot.enviarMensagemComStatus(
      '11999999999',
      'Mensagem com confirmação de status.'
    );
    console.log('Resultado:', resultado5);
    console.log('---\n');

    // Exemplo 6: Tratamento de erro - número inválido
    console.log('6. Testando validação - número inválido...');
    const resultado6 = await conexaoBot.enviarMensagem(
      '123', // número inválido
      'Esta mensagem não deveria ser enviada.'
    );
    console.log('Resultado:', resultado6);
    console.log('---\n');

  } catch (error) {
    console.error('Erro nos exemplos:', error);
  }
}

/**
 * Exemplo de uso em massa com controle de rate limit
 */
async function exemploEnvioEmMassa() {
  console.log('=== Exemplo de Envio em Massa ===\n');
  
  const destinatarios = [
    '11999999999',
    '11888888888', 
    '11777777777'
  ];
  
  const resultados = [];
  
  for (let i = 0; i < destinatarios.length; i++) {
    const numero = destinatarios[i];
    console.log(`Enviando para ${numero} (${i + 1}/${destinatarios.length})...`);
    
    const resultado = await conexaoBot.enviarMensagem(
      numero,
      `Mensagem personalizada ${i + 1} enviada para ${numero}`
    );
    
    resultados.push({ numero, resultado });
    
    // Delay entre envios para evitar spam
    if (i < destinatarios.length - 1) {
      console.log('Aguardando 2 segundos antes do próximo envio...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n=== Resumo dos Envios ===');
  resultados.forEach(({ numero, resultado }) => {
    const status = resultado.sucesso ? '✅ Sucesso' : '❌ Erro';
    console.log(`${numero}: ${status}`);
    if (resultado.erro) {
      console.log(`  Erro: ${resultado.erro}`);
    }
  });
}

// Exporta as funções para uso em outros arquivos
module.exports = {
  exemploUsoEnvioMensagem,
  exemploEnvioEmMassa
};

// Se executado diretamente, roda os exemplos
if (require.main === module) {
  console.log('Para usar este arquivo, importe-o em seu bot principal ou execute as funções individualmente.\n');
  console.log('Exemplo de uso:');
  console.log('const { exemploUsoEnvioMensagem } = require("./exemplo-uso-envio");');
  console.log('await exemploUsoEnvioMensagem();\n');
}
