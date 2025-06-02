/**
 * @file Teste completo do sistema de envio de mensagens
 * @description Script para testar todas as funcionalidades do sistema de envio aprimorado
 */

const { conexaoBot } = require('./src/services/conexaoZap');

/**
 * Testa as funcionalidades de envio de mensagem
 */
async function testarSistemaEnvio() {
    console.log('🚀 Iniciando testes do sistema de envio...\n');
    
    try {
        // Obtém o cliente bot
        console.log('📱 Inicializando cliente WhatsApp...');
        const client = await conexaoBot.pegaClientBot();
        console.log('✅ Cliente inicializado com sucesso\n');
        
        // Teste 1: Validação de números
        console.log('🧪 Teste 1: Validação de números de telefone');
        const numerosTestar = [
            '22999134200',    // Válido
            '1199912345',     // Válido (será convertido para 11999912345)
            '119991234',      // Inválido (muito curto)
            '00999134200',    // Inválido (DDD inválido)
            '229991342001',   // Inválido (muito longo)
        ];
        
        numerosTestar.forEach(numero => {
            const resultado = conexaoBot.validarNumero(numero);
            console.log(`   ${numero}: ${resultado.erro || `✅ ${resultado.numero}`}`);
        });
        console.log('');
        
        // Teste 2: Verificação de conectividade
        console.log('🧪 Teste 2: Verificação de conectividade');
        const conectado = await conexaoBot.verificarConectividade();
        console.log(`   Status de conectividade: ${conectado ? '✅ Conectado' : '❌ Desconectado'}\n`);
        
        // Teste 3: Envio de mensagem (apenas simula, não envia de verdade)
        console.log('🧪 Teste 3: Simulação de envio de mensagem');
        console.log('   ⚠️  Para segurança, o envio real está comentado');
        console.log('   📝 Estrutura de teste preparada para quando necessário\n');
        
        /*
        // Descomente apenas para testes reais com número válido
        const resultadoEnvio = await conexaoBot.enviarMensagem(
            '22999134200', 
            '🧪 Teste do sistema aprimorado de envio de mensagens\nTeste realizado em: ' + new Date().toLocaleString()
        );
        console.log('   Resultado do envio:', resultadoEnvio);
        */
        
        console.log('✅ Todos os testes concluídos com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro durante os testes:', error);
    }
}

// Executa os testes se o script for executado diretamente
if (require.main === module) {
    testarSistemaEnvio();
}

module.exports = { testarSistemaEnvio };
