/**
 * Script de teste para verificar o sistema de atualização de status MongoDB
 */

const { MongoClient } = require('mongodb');
const { configuracoes } = require('./src/config');

async function testarAtualizacaoStatus() {
    let client;
    
    try {
        console.log('=== TESTE DE ATUALIZAÇÃO DE STATUS MONGODB ===');
        
        // Conectar ao MongoDB
        client = new MongoClient(configuracoes.mongoDB.uri);
        await client.connect();
        const db = client.db();
        
        console.log('✅ Conectado ao MongoDB');
        
        // 1. Verificar estrutura da tb_envio_mensagens
        console.log('\n📋 Estrutura da tb_envio_mensagens:');
        const mensagens = await db.collection('tb_envio_mensagens').find({}).limit(2).toArray();
        
        if (mensagens.length > 0) {
            mensagens.forEach((msg, index) => {
                console.log(`\nMensagem ${index + 1}:`);
                console.log(`- ID: ${msg._id}`);
                console.log(`- Data: ${msg.data}`);
                console.log(`- ID Lote: ${msg.id_lote || 'N/A'}`);
                console.log(`- Total destinatários: ${msg.total_destinatarios}`);
                console.log(`- Criadores (${msg.criadores?.length || 0}):`);
                
                if (msg.criadores && msg.criadores.length > 0) {
                    msg.criadores.slice(0, 2).forEach((criador, i) => {
                        console.log(`  ${i + 1}. ${criador.nome} (${criador.telefone})`);
                        console.log(`     Status: ${criador.status_mensagem}`);
                        console.log(`     ID Mensagem: ${criador.id_mensagem}`);
                    });
                    if (msg.criadores.length > 2) {
                        console.log(`     ... e mais ${msg.criadores.length - 2} criadores`);
                    }
                }
            });
        } else {
            console.log('Nenhuma mensagem encontrada na tb_envio_mensagens');
        }
        
        // 2. Testar atualização de status (se houver mensagens)
        if (mensagens.length > 0 && mensagens[0].criadores && mensagens[0].criadores.length > 0) {
            const primeiraMsg = mensagens[0];
            const primeiroCriador = primeiraMsg.criadores[0];
            
            if (primeiroCriador.id_mensagem) {
                console.log(`\n🔄 Testando atualização de status:`);
                console.log(`ID Mensagem: ${primeiroCriador.id_mensagem}`);
                
                // Teste de atualização para "Entregue"
                const filtro = { 'criadores.id_mensagem': primeiroCriador.id_mensagem };
                const atualizacao = {
                    $set: {
                        'criadores.$[elem].status_mensagem': 'Entregue (Teste)',
                        'criadores.$[elem].data_status_atualizado': new Date(),
                        updated_at: new Date()
                    }
                };
                
                const opcoes = {
                    arrayFilters: [{ 'elem.id_mensagem': primeiroCriador.id_mensagem }]
                };
                
                const resultado = await db.collection('tb_envio_mensagens').updateMany(filtro, atualizacao, opcoes);
                
                console.log(`✅ Resultado da atualização:`);
                console.log(`   - Documentos encontrados: ${resultado.matchedCount}`);
                console.log(`   - Documentos modificados: ${resultado.modifiedCount}`);
                
                // Verificar se foi atualizado
                const verificacao = await db.collection('tb_envio_mensagens').findOne(
                    { 'criadores.id_mensagem': primeiroCriador.id_mensagem },
                    { projection: { 'criadores.$': 1 } }
                );
                
                if (verificacao && verificacao.criadores && verificacao.criadores.length > 0) {
                    console.log(`✅ Verificação pós-atualização:`);
                    console.log(`   - Novo status: ${verificacao.criadores[0].status_mensagem}`);
                    console.log(`   - Data atualização: ${verificacao.criadores[0].data_status_atualizado}`);
                }
                
                // Reverter para o status original
                await db.collection('tb_envio_mensagens').updateMany(
                    filtro,
                    {
                        $set: {
                            'criadores.$[elem].status_mensagem': primeiroCriador.status_mensagem,
                            updated_at: new Date()
                        },
                        $unset: {
                            'criadores.$[elem].data_status_atualizado': ""
                        }
                    },
                    opcoes
                );
                console.log('🔄 Status revertido para o original');
            }
        }
        
        // 3. Contar documentos por tabela
        console.log('\n📊 Estatísticas das tabelas:');
        const tabelas = ['tb_envio_validacoes', 'tb_envio_senhas', 'tb_envio_mensagens'];
        
        for (const tabela of tabelas) {
            const count = await db.collection(tabela).countDocuments();
            console.log(`- ${tabela}: ${count} documentos`);
        }
        
        console.log('\n✅ Teste concluído com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    } finally {
        if (client) {
            await client.close();
            console.log('🔌 Conexão fechada');
        }
    }
}

// Executar o teste
testarAtualizacaoStatus();
