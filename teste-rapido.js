const { MongoClient } = require('mongodb');

async function testeRapido() {
    try {
        console.log('Testando conexão com MongoDB Atlas...');
        const uri = 'mongodb+srv://silveriosepulveda:g7SbMKPby7roGi7P@cluster0.dcuqscr.mongodb.net/central-mensagens?retryWrites=true&w=majority&appName=Cluster0';
        const client = new MongoClient(uri);
        await client.connect();
        console.log('✅ Conexão com MongoDB Atlas estabelecida');
        
        const db = client.db('central-mensagens');
        
        // Listar coleções
        const collections = await db.listCollections().toArray();
        console.log('\n📂 Coleções disponíveis:');
        collections.forEach(col => console.log(`   - ${col.name}`));
        
        // Contar documentos nas coleções relevantes
        const countValidacoes = await db.collection('validacoesCadastro').countDocuments();
        const countEnvios = await db.collection('tb_envio_validacoes').countDocuments();
        
        console.log('\n📊 Contagem de documentos:');
        console.log(`   validacoesCadastro: ${countValidacoes}`);
        console.log(`   tb_envio_validacoes: ${countEnvios}`);
        
        // Buscar a mensagem específica
        const msgEspecifica = await db.collection('validacoesCadastro').findOne({
            id_mensagem: '3EB0A4FC1F977A2336B32E'
        });
        
        if (msgEspecifica) {
            console.log('\n🎯 Mensagem específica encontrada em validacoesCadastro:');
            console.log(`   ID: ${msgEspecifica._id}`);
            console.log(`   Telefone: ${msgEspecifica.telefone}`);
            console.log(`   Status: ${msgEspecifica.status}`);
            console.log(`   Data: ${msgEspecifica.dataEnvio || msgEspecifica.data}`);
        } else {
            console.log('\n❌ Mensagem específica NÃO encontrada em validacoesCadastro');
            
            // Verificar se está em tb_envio_validacoes
            const msgEnvios = await db.collection('tb_envio_validacoes').findOne({
                id_mensagem: '3EB0A4FC1F977A2336B32E'
            });
            
            if (msgEnvios) {
                console.log('✅ Mensagem específica encontrada em tb_envio_validacoes:');
                console.log(`   ID: ${msgEnvios._id}`);
                console.log(`   Telefone: ${msgEnvios.telefone}`);
                console.log(`   Status: ${msgEnvios.status_mensagem}`);
                console.log(`   Data: ${msgEnvios.data}`);
                
                console.log('\n🔄 MIGRAÇÃO NECESSÁRIA!');
            } else {
                console.log('❌ Mensagem específica não encontrada em nenhuma coleção');
            }
        }
        
        await client.close();
        console.log('\n✅ Teste concluído com sucesso');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    }
}

testeRapido();
