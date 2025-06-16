const mongoService = require('./src/services/mongodb');

async function testarListagem() {
  try {
    console.log('Conectando ao MongoDB...');
    await mongoService.conectar();
    
    console.log('Testando listarValidacoesCadastro...');
    const validacoes = await mongoService.listarValidacoesCadastro();
    
    console.log(`Total de validações: ${validacoes.length}`);
    
    if (validacoes.length > 0) {
      const primeira = validacoes[0];
      console.log('Primeira validação:');
      console.log('- Nome:', primeira.nome);
      console.log('- Telefone:', primeira.telefone);
      console.log('- Status:', primeira.status_mensagem);
      console.log('- Data:', primeira.data);
      console.log('- Created:', primeira.created_at);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

testarListagem();
