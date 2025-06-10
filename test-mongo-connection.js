/**
 * Script para testar conexão MongoDB em produção
 * Execute: node test-mongo-connection.js
 */

const { MongoClient } = require('mongodb');

// URIs para teste (da mais simples para mais complexa)
const urisTest = [
    // URI mais simples possível
    'mongodb+srv://silveriosepulveda:g7SbMKPby7roGi7P@cluster0.dcuqscr.mongodb.net/',
    
    // URI com database específico
    'mongodb+srv://silveriosepulveda:g7SbMKPby7roGi7P@cluster0.dcuqscr.mongodb.net/central-mensagens',
    
    // URI com parâmetros básicos
    'mongodb+srv://silveriosepulveda:g7SbMKPby7roGi7P@cluster0.dcuqscr.mongodb.net/central-mensagens?retryWrites=true&w=majority',
    
    // URI atual
    'mongodb+srv://silveriosepulveda:g7SbMKPby7roGi7P@cluster0.dcuqscr.mongodb.net/central-mensagens?retryWrites=true&w=majority&appName=Cluster0&tls=true&tlsAllowInvalidCertificates=true'
];

// Configurações para teste
const configuracoes = [
    // Configuração mínima
    {
        nome: 'Mínima',
        options: {}
    },
    
    // Sem TLS
    {
        nome: 'Sem TLS',
        options: {
            tls: false,
            ssl: false
        }
    },
    
    // TLS permissivo
    {
        nome: 'TLS Permissivo',
        options: {
            tls: true,
            tlsAllowInvalidCertificates: true,
            tlsAllowInvalidHostnames: true,
            tlsInsecure: true
        }
    }
];

async function testarConexao(uri, config) {
    let client = null;
    try {
        console.log(`\n🔄 Testando: ${config.nome} com URI: ${uri.substring(0, 60)}...`);
        
        client = new MongoClient(uri, {
            ...config.options,
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000
        });
        
        await client.connect();
        
        // Testar operação básica
        const db = client.db('central-mensagens');
        await db.admin().ping();
        
        console.log(`✅ SUCESSO: ${config.nome}`);
        console.log(`   URI funcional: ${uri}`);
        
        // Testar uma operação de coleção
        const collections = await db.listCollections().toArray();
        console.log(`   Collections encontradas: ${collections.length}`);
        
        return { sucesso: true, uri, config: config.nome };
        
    } catch (error) {
        console.log(`❌ FALHA: ${config.nome} - ${error.message.substring(0, 100)}`);
        return { sucesso: false, erro: error.message };
    } finally {
        if (client) {
            try {
                await client.close();
            } catch {
                // Ignorar erro ao fechar
            }
        }
    }
}

async function executarTestes() {
    console.log('🚀 Iniciando testes de conexão MongoDB Atlas...\n');
    
    const resultadosOk = [];
    
    for (const uri of urisTest) {
        for (const config of configuracoes) {
            const resultado = await testarConexao(uri, config);
            if (resultado.sucesso) {
                resultadosOk.push(resultado);
            }
            
            // Pequena pausa entre testes
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADOS FINAIS:');
    console.log('='.repeat(60));
    
    if (resultadosOk.length > 0) {
        console.log(`\n✅ ${resultadosOk.length} configuração(ões) funcionaram:`);
        resultadosOk.forEach((resultado, index) => {
            console.log(`\n${index + 1}. ${resultado.config}`);
            console.log(`   URI: ${resultado.uri}`);
        });
        
        console.log('\n🔧 RECOMENDAÇÃO:');
        console.log(`Use a primeira configuração que funcionou no seu código de produção.`);
        
    } else {
        console.log('\n❌ NENHUMA configuração funcionou!');
        console.log('\n🔧 PRÓXIMOS PASSOS:');
        console.log('1. Verifique se o IP do servidor está na whitelist do MongoDB Atlas');
        console.log('2. Confirme as credenciais do usuário');
        console.log('3. Verifique se o cluster está online');
        console.log('4. Tente conectar do MongoDB Compass para testar');
    }
    
    console.log('\n' + '='.repeat(60));
}

// Executar os testes
executarTestes().catch(console.error);
