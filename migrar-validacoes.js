const { MongoClient } = require('mongodb');

/**
 * Script para migrar dados da coleção tb_envio_validacoes para validacoesCadastro
 * e garantir consistência no sistema
 */
async function migrarValidacoes() {
    try {
        const uri = 'mongodb+srv://silveriosepulveda:g7SbMKPby7roGi7P@cluster0.dcuqscr.mongodb.net/central-mensagens?retryWrites=true&w=majority&appName=Cluster0';
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db('central-mensagens');
        
        console.log('=== MIGRAÇÃO DE VALIDAÇÕES ===\n');
        
        // 1. Verificar quantos documentos existem em cada coleção
        const countEnvios = await db.collection('tb_envio_validacoes').countDocuments();
        const countValidacoes = await db.collection('validacoesCadastro').countDocuments();
        
        console.log(`tb_envio_validacoes: ${countEnvios} documentos`);
        console.log(`validacoesCadastro: ${countValidacoes} documentos\n`);
        
        if (countEnvios === 0) {
            console.log('✅ Nenhum documento para migrar de tb_envio_validacoes');
            await client.close();
            return;
        }
        
        // 2. Buscar documentos para migrar
        const documentosEnvios = await db.collection('tb_envio_validacoes').find({}).toArray();
        
        let migrados = 0;
        let duplicados = 0;
        
        for (const doc of documentosEnvios) {
            // Verificar se já existe na coleção validacoesCadastro
            const existeJa = await db.collection('validacoesCadastro').findOne({
                $or: [
                    { id_mensagem: doc.id_mensagem },
                    { 
                        telefone: doc.telefone, 
                        nome: doc.nome,
                        dataEnvio: doc.data || doc.created_at
                    }
                ]
            });
            
            if (existeJa) {
                duplicados++;
                console.log(`⚠️  Documento já existe (ID: ${doc._id}), pulando...`);
                continue;
            }
            
            // Converter formato dos dados
            const docMigrado = {
                dataEnvio: doc.data || doc.created_at || new Date(),
                telefone: doc.telefone,
                nome: doc.nome,
                status: doc.status_mensagem || 'Enviada',
                id_mensagem: doc.id_mensagem,
                tentativasReenvio: 0,
                reenvioTentado: false,
                formatoAlternativoUsado: false,
                historicoReenvios: [],
                created_at: doc.created_at || new Date(),
                updated_at: new Date(),
                // Manter referência do documento original
                _migrado_de_tb_envio_validacoes: doc._id
            };
            
            await db.collection('validacoesCadastro').insertOne(docMigrado);
            migrados++;
            console.log(`✅ Migrado: ${doc.telefone} (${doc.nome}) - ID Original: ${doc._id}`);
        }
        
        console.log(`\n=== RESULTADO DA MIGRAÇÃO ===`);
        console.log(`📄 Documentos migrados: ${migrados}`);
        console.log(`🔄 Documentos duplicados (ignorados): ${duplicados}`);
        console.log(`📊 Total processados: ${migrados + duplicados}`);
        
        // 3. Verificar a mensagem específica que estávamos investigando
        console.log(`\n=== VERIFICANDO MENSAGEM ESPECÍFICA ===`);
        const mensagemEspecifica = await db.collection('validacoesCadastro').findOne({
            id_mensagem: '3EB0A4FC1F977A2336B32E'
        });
        
        if (mensagemEspecifica) {
            console.log('✅ Mensagem específica encontrada após migração:');
            console.log(`   ID: ${mensagemEspecifica._id}`);
            console.log(`   Telefone: ${mensagemEspecifica.telefone}`);
            console.log(`   Status: ${mensagemEspecifica.status}`);
            console.log(`   Data Envio: ${mensagemEspecifica.dataEnvio}`);
        } else {
            console.log('❌ Mensagem específica ainda não encontrada');
        }
        
        await client.close();
        console.log('\n✅ Migração concluída!');
        
    } catch (error) {
        console.error('❌ Erro na migração:', error);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    migrarValidacoes();
}

module.exports = { migrarValidacoes };
