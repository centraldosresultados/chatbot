/**
 * Script de teste para verificar a conexão otimizada do MongoDB
 */

const mongoService = require('./src/services/mongodb');

async function testarConexao() {
    console.log('🔍 Testando conexão otimizada do MongoDB...\n');
    
    const inicio = Date.now();
    
    try {
        const sucesso = await mongoService.conectar();
        const tempo = Date.now() - inicio;
        
        if (sucesso) {
            console.log(`✅ Conexão estabelecida com sucesso em ${tempo}ms`);
            console.log('📊 Status da conexão:', {
                conectado: mongoService.connected,
                hasClient: !!mongoService.client,
                hasDb: !!mongoService.db
            });
            
            // Teste básico de operação
            console.log('\n🧪 Testando operação básica...');
            const collections = await mongoService.db.listCollections().toArray();
            console.log('📋 Coleções disponíveis:', collections.map(c => c.name));
            
        } else {
            console.log(`❌ Falha na conexão após ${tempo}ms`);
        }
        
    } catch (error) {
        const tempo = Date.now() - inicio;
        console.log(`💥 Erro na conexão após ${tempo}ms:`, error.message);
    } finally {
        // Desconectar
        console.log('\n🔌 Desconectando...');
        await mongoService.desconectar();
        console.log('✅ Desconectado');
        process.exit(0);
    }
}

// Executar teste
testarConexao().catch(error => {
    console.error('💥 Erro no teste:', error);
    process.exit(1);
});
