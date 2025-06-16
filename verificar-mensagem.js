const { MongoClient } = require('mongodb');

async function verificarMensagem() {
    try {
        const client = new MongoClient('mongodb://localhost:27017');
        await client.connect();
        const db = client.db('centralResultados');
        
        console.log('=== VERIFICANDO COLEÇÕES ===');
        
        // Verificar em validacoesCadastro
        console.log('\n1. Verificando coleção validacoesCadastro:');
        const validacoesCount = await db.collection('validacoesCadastro').countDocuments();
        console.log('Total de documentos:', validacoesCount);
        
        // Verificar em tb_envio_validacoes
        console.log('\n2. Verificando coleção tb_envio_validacoes:');
        const enviosCount = await db.collection('tb_envio_validacoes').countDocuments();
        console.log('Total de documentos:', enviosCount);
        
        // Buscar mensagem específica nas duas coleções
        console.log('\n3. Buscando mensagem específica com id_mensagem: 3EB0A4FC1F977A2336B32E');
        
        const msgValidacoes = await db.collection('validacoesCadastro').findOne({
            id_mensagem: '3EB0A4FC1F977A2336B32E'
        });
        
        const msgEnvios = await db.collection('tb_envio_validacoes').findOne({
            id_mensagem: '3EB0A4FC1F977A2336B32E'
        });
        
        if (msgValidacoes) {
            console.log('\nEncontrada em validacoesCadastro:');
            console.log('ID:', msgValidacoes._id);
            console.log('Telefone:', msgValidacoes.telefone);
            console.log('Status:', msgValidacoes.status);
            console.log('Data Envio:', msgValidacoes.dataEnvio);
        }
        
        if (msgEnvios) {
            console.log('\nEncontrada em tb_envio_validacoes:');
            console.log('ID:', msgEnvios._id);
            console.log('Telefone:', msgEnvios.telefone);
            console.log('Status:', msgEnvios.status_mensagem);
            console.log('Data:', msgEnvios.data);
        }
        
        if (!msgValidacoes && !msgEnvios) {
            console.log('\n❌ Mensagem não encontrada em nenhuma coleção!');
        }
        
        await client.close();
    } catch (error) {
        console.error('Erro:', error);
    }
}

verificarMensagem();
