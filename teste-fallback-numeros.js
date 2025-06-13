#!/usr/bin/env node

/**
 * Teste do Sistema de Fallback de Números WhatsApp
 * 
 * Este script testa a funcionalidade de fallback implementada na função enviarMensagem
 * que tenta múltiplos formatos de número quando o envio falha.
 */

const { conexaoBot } = require('./src/services/conexaoZap');

async function testarFallbackNumeros() {
    console.log('\n🧪 === TESTE DO SISTEMA DE FALLBACK DE NÚMEROS ===\n');
    
    try {
        // Testa a função de geração de variações
        console.log('📋 Testando geração de variações de números:\n');
        
        const numerosTestar = [
            '05581989827656', // Caso do usuário - deve gerar variações
            '0558189827656',  // Caso que funciona segundo o usuário
            '81989827656',    // 11 dígitos - deve gerar variações
            '8198982765',     // 10 dígitos - sem variações adicionais
        ];
        
        // Simula o cliente para testar as funções
        await conexaoBot.pegaClientBot();
        
        for (const numero of numerosTestar) {
            console.log(`\n🔢 Número original: ${numero}`);
            
            // Primeiro valida o número
            const validacao = conexaoBot.validarNumero(numero);
            if (validacao.erro) {
                console.log(`❌ Erro na validação: ${validacao.erro}`);
                continue;
            }
            
            console.log(`✅ Número validado: ${validacao.numero}`);
            
            // Gera as variações
            const variacoes = conexaoBot.gerarVariacoesNumero(validacao.numero);
            console.log(`📱 Variações geradas (${variacoes.length}):`, variacoes);
            
            // Mostra como ficaria o número completo para cada variação
            variacoes.forEach((variacao, index) => {
                const numeroCompleto = "55" + variacao + "@c.us";
                console.log(`   ${index + 1}. ${numeroCompleto}`);
            });
        }
        
        console.log('\n✅ Teste de geração de variações concluído!\n');
        
        // Teste real de envio (comentado para evitar envios desnecessários)
        console.log('📤 Para testar o envio real, descomente a seção abaixo e forneça um número válido.\n');
        
        /*
        // DESCOMENTAR PARA TESTE REAL
        console.log('🚀 Testando envio real com fallback...\n');
        
        const numeroTeste = '81989827656'; // Substitua por um número real para teste
        const mensagemTeste = 'Teste do sistema de fallback de números WhatsApp';
        
        console.log(`📱 Enviando para: ${numeroTeste}`);
        console.log(`💬 Mensagem: ${mensagemTeste}\n`);
        
        const resultado = await conexaoBot.enviarMensagem(numeroTeste, mensagemTeste);
        
        if (resultado.sucesso) {
            console.log('✅ Mensagem enviada com sucesso!');
            console.log(`📋 Detalhes:`, {
                id: resultado.id,
                numeroUsado: resultado.numero,
                formatoUsado: resultado.formatoUsado,
                variacaoUtilizada: resultado.variacaoUtilizada,
                tentativa: resultado.tentativa
            });
        } else {
            console.log('❌ Falha no envio:');
            console.log(`📋 Erro: ${resultado.erro}`);
            if (resultado.variacoesTentadas) {
                console.log(`📱 Variações tentadas: ${resultado.variacoesTentadas.join(', ')}`);
            }
        }
        */
        
    } catch (error) {
        console.error('❌ Erro durante o teste:', error);
    }
    
    console.log('\n🏁 Teste finalizado!');
}

// Executa o teste apenas se executado diretamente
if (require.main === module) {
    testarFallbackNumeros();
}

module.exports = { testarFallbackNumeros };
