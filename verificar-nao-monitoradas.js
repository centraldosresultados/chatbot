const { MongoClient } = require('mongodb');

/**
 * Script para verificar mensagens de validação não monitoradas
 * e aplicar lógica de reenvio quando necessário
 */
async function verificarMensagensNaoMonitoradas() {
    try {
        const uri = 'mongodb+srv://silveriosepulveda:g7SbMKPby7roGi7P@cluster0.dcuqscr.mongodb.net/central-mensagens?retryWrites=true&w=majority&appName=Cluster0';
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db('central-mensagens');
        
        console.log('=== VERIFICANDO MENSAGENS NÃO MONITORADAS ===\n');
        
        // Buscar mensagens enviadas mas que podem não ter sido entregues
        // (mensagens antigas sem campo de reenvio ou com status "Enviada" há mais de 5 minutos)
        const cincoMinutosAtras = new Date(Date.now() - 5 * 60 * 1000);
        
        const mensagensParaVerificar = await db.collection('validacoesCadastro').find({
            $and: [
                { status: { $in: ['Enviada', 'enviada'] } },
                { id_mensagem: { $exists: true, $ne: null } },
                { dataEnvio: { $lt: cincoMinutosAtras } },
                { reenvioTentado: { $ne: true } },
                { formatoAlternativoUsado: { $ne: true } }
            ]
        }).toArray();
        
        console.log(`📨 Encontradas ${mensagensParaVerificar.length} mensagens para verificar\n`);
        
        if (mensagensParaVerificar.length === 0) {
            console.log('✅ Nenhuma mensagem precisa de verificação');
            await client.close();
            return;
        }
        
        // Análise de cada mensagem
        for (const mensagem of mensagensParaVerificar) {
            const tempoDecorrido = Math.floor((Date.now() - new Date(mensagem.dataEnvio).getTime()) / (1000 * 60));
            
            console.log(`🔍 Analisando mensagem:`);
            console.log(`   ID: ${mensagem._id}`);
            console.log(`   ID Mensagem: ${mensagem.id_mensagem}`);
            console.log(`   Telefone: ${mensagem.telefone}`);
            console.log(`   Nome: ${mensagem.nome}`);
            console.log(`   Status: ${mensagem.status}`);
            console.log(`   Data Envio: ${mensagem.dataEnvio}`);
            console.log(`   Tempo decorrido: ${tempoDecorrido} minutos`);
            
            // Verificar se é elegível para reenvio automático (número de 11 dígitos)
            const telefoneNumerico = mensagem.telefone.replace(/\D/g, '');
            const elegivelParaReenvio = telefoneNumerico.length === 11;
            
            console.log(`   Elegível para reenvio alternativo: ${elegivelParaReenvio ? '✅' : '❌'}`);
            
            if (elegivelParaReenvio && tempoDecorrido >= 5) {
                // Marcar para reenvio manual ou automático
                await db.collection('validacoesCadastro').updateOne(
                    { _id: mensagem._id },
                    { 
                        $set: { 
                            precisaReenvio: true,
                            motivoReenvio: `Mensagem não entregue após ${tempoDecorrido} minutos`,
                            updated_at: new Date()
                        } 
                    }
                );
                
                console.log(`   🔄 Marcada para reenvio alternativo`);
                
                // Calcular número alternativo
                const DDD = telefoneNumerico.substr(0, 2);
                const numeroSemDDD = telefoneNumerico.substr(2);
                const numeroAlternativo = DDD + numeroSemDDD.substr(1); // Remove o 9
                
                console.log(`   📱 Número original: ${telefoneNumerico}`);
                console.log(`   📱 Número alternativo: ${numeroAlternativo}`);
            } else if (tempoDecorrido >= 10) {
                // Mensagens muito antigas, marcar como possivelmente não entregues
                await db.collection('validacoesCadastro').updateOne(
                    { _id: mensagem._id },
                    { 
                        $set: { 
                            possivelmenteNaoEntregue: true,
                            motivoProblema: `Mensagem antiga sem confirmação (${tempoDecorrido} min)`,
                            updated_at: new Date()
                        } 
                    }
                );
                
                console.log(`   ⚠️  Marcada como possivelmente não entregue`);
            }
            
            console.log(''); // Linha em branco para separar
        }
        
        // Resumo
        console.log('=== RESUMO ===');
        const marcadasParaReenvio = await db.collection('validacoesCadastro').countDocuments({
            precisaReenvio: true
        });
        
        const marcadasComoProblema = await db.collection('validacoesCadastro').countDocuments({
            possivelmenteNaoEntregue: true
        });
        
        console.log(`🔄 Mensagens marcadas para reenvio: ${marcadasParaReenvio}`);
        console.log(`⚠️  Mensagens com possível problema: ${marcadasComoProblema}`);
        
        await client.close();
        console.log('\n✅ Verificação concluída!');
        
    } catch (error) {
        console.error('❌ Erro na verificação:', error);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    verificarMensagensNaoMonitoradas();
}

module.exports = { verificarMensagensNaoMonitoradas };
