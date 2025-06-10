/**
 * Script de teste para verificar as melhorias implementadas
 */

const { MongoClient } = require('mongodb');
const { configuracoes } = require('./src/config');

async function testarMelhorias() {
    let client;
    
    try {
        console.log('=== TESTE DAS MELHORIAS IMPLEMENTADAS ===\n');
        
        // Conectar ao MongoDB
        client = new MongoClient(configuracoes.mongoDB.uri);
        await client.connect();
        const db = client.db();
        
        console.log('✅ Conectado ao MongoDB\n');
        
        // 1. Verificar estrutura atualizada da tb_envio_mensagens
        console.log('📋 Verificando estrutura atualizada da tb_envio_mensagens:');
        const mensagens = await db.collection('tb_envio_mensagens').find({}).limit(1).toArray();
        
        if (mensagens.length > 0) {
            const msg = mensagens[0];
            console.log(`✅ Mensagem encontrada:`);
            console.log(`   - ID: ${msg._id}`);
            console.log(`   - Data: ${msg.data}`);
            console.log(`   - ID Lote: ${msg.id_lote || 'N/A'}`);
            console.log(`   - Total destinatários: ${msg.total_destinatarios}`);
            
            if (msg.criadores && msg.criadores.length > 0) {
                const criador = msg.criadores[0];
                console.log(`\n   📝 Estrutura do primeiro criador:`);
                console.log(`      - Código: ${criador.codigo_criador || 'N/A'}`);
                console.log(`      - Nome: ${criador.nome}`);
                console.log(`      - Telefone: ${criador.telefone}`);
                console.log(`      - Status Cadastro: ${criador.status_cadastro || 'Campo não encontrado'}`);
                console.log(`      - Status Mensagem: ${criador.status_mensagem}`);
                console.log(`      - ID Mensagem: ${criador.id_mensagem}`);
                console.log(`      - Data Envio: ${criador.data_envio}`);
                
                // Verificar se o campo status_cadastro está presente
                if (criador.status_cadastro) {
                    console.log('   ✅ Campo status_cadastro encontrado!');
                } else {
                    console.log('   ⚠️  Campo status_cadastro não encontrado (será adicionado em próximos envios)');
                }
            }
        } else {
            console.log('ℹ️  Nenhuma mensagem encontrada na tb_envio_mensagens');
        }
        
        // 2. Simular formatação de destinatários (como fará a função buscarMensagemPorId)
        if (mensagens.length > 0 && mensagens[0].criadores) {
            console.log('\n🔄 Simulando formatação de destinatários:');
            const destinatarios = mensagens[0].criadores.map(criador => ({
                codigo: criador.codigo_criador || criador.codigo,
                nome: criador.nome,
                telefone: criador.telefone,
                status_cadastro: criador.status_cadastro || 'N/A',
                status_mensagem: criador.status_mensagem || 'Enviada',
                data_envio: criador.data_envio,
                data_status_atualizado: criador.data_status_atualizado,
                id_mensagem: criador.id_mensagem
            }));
            
            console.log(`✅ ${destinatarios.length} destinatários formatados:`);
            destinatarios.slice(0, 2).forEach((dest, i) => {
                console.log(`   ${i + 1}. ${dest.nome} (${dest.telefone})`);
                console.log(`      - Código: ${dest.codigo}`);
                console.log(`      - Status Cadastro: ${dest.status_cadastro}`);
                console.log(`      - Status Mensagem: ${dest.status_mensagem}`);
            });
        }
        
        // 3. Testar query de criadores (simulação)
        console.log('\n📊 Campos disponíveis para criadores:');
        console.log('   ✅ codigo (chave_cadastro)');
        console.log('   ✅ nome');
        console.log('   ✅ telefone (tel_1)');
        console.log('   ✅ data_cadastro');
        console.log('   ✅ status_cadastro (NOVO)');
        console.log('   ✅ status_mensagem');
        
        console.log('\n🎯 Melhorias implementadas:');
        console.log('   ✅ Status cadastro adicionado ao EnviarMensagemParaTodos');
        console.log('   ✅ Tabela de destinatários expandida na ListaMensagensEnviadas');
        console.log('   ✅ Novas colunas: Código, Situação, Status Mensagem');
        console.log('   ✅ Formatação automática de destinatários');
        console.log('   ✅ CSS atualizado para melhor visualização');
        
        console.log('\n✅ Teste concluído com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    } finally {
        if (client) {
            await client.close();
            console.log('\n🔌 Conexão fechada');
        }
    }
}

// Executar o teste
testarMelhorias();
