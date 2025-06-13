/**
 * Script de teste para demonstrar a sincronização do Chat WhatsApp
 * com o backend real - Central dos Resultados
 */

const io = require('socket.io-client');

// Conectar ao servidor backend
const socket = io('http://localhost:3100');

socket.on('connect', () => {
    console.log('🟢 Conectado ao servidor backend!');
    console.log('📱 ID da conexão:', socket.id);
    
    // Verificar status do WhatsApp
    socket.emit('verificarConexaoZap', {}, (response) => {
        console.log('📊 Status WhatsApp:', response);
        
        if (response.Conectado) {
            console.log('✅ WhatsApp conectado! Telefone:', response.telefone);
            demonstrarFuncionalidades();
        } else {
            console.log('❌ WhatsApp não conectado. Conecte primeiro via interface web.');
        }
    });
});

socket.on('mudancaStatus', (status) => {
    console.log('🔄 Mudança de status:', status);
});

socket.on('novaMensagemRecebida', (messageData) => {
    console.log('📨 Nova mensagem recebida:', {
        de: messageData.from,
        texto: messageData.body,
        timestamp: new Date(messageData.timestamp * 1000).toLocaleString('pt-BR')
    });
});

socket.on('statusMensagemAtualizado', (statusData) => {
    console.log('✅ Status da mensagem atualizado:', statusData);
});

function demonstrarFuncionalidades() {
    console.log('\n🚀 DEMONSTRAÇÃO DAS FUNCIONALIDADES:');
    
    // 1. Listar criadores (contatos)
    setTimeout(() => {
        console.log('\n1️⃣ Listando criadores (contatos do chat)...');
        socket.emit('listarTodosCriadores', {}, (response) => {
            if (response.sucesso && response.dados.length > 0) {
                console.log(`📋 ${response.dados.length} criadores encontrados:`);
                response.dados.slice(0, 3).forEach((criador, index) => {
                    console.log(`   ${index + 1}. ${criador.nome} - ${criador.telefone}`);
                });
            } else {
                console.log('⚠️ Nenhum criador encontrado');
            }
        });
    }, 1000);
    
    // 2. Simular envio de mensagem (descomente para testar)
    /*
    setTimeout(() => {
        console.log('\n2️⃣ Simulando envio de mensagem...');
        const numeroTeste = '22999134200'; // Substitua pelo seu número para teste
        socket.emit('enviarMensagem', {
            numero: numeroTeste,
            mensagem: '🤖 Teste do Chat WhatsApp Web - Central dos Resultados!'
        }, (response) => {
            if (response.erro) {
                console.log('❌ Erro ao enviar:', response.erro);
            } else {
                console.log('✅ Mensagem enviada!', response);
            }
        });
    }, 3000);
    */
}

socket.on('disconnect', () => {
    console.log('🔴 Desconectado do servidor backend');
});

socket.on('connect_error', (error) => {
    console.log('❌ Erro de conexão:', error.message);
});

console.log('🚀 Iniciando teste de sincronização do Chat WhatsApp...');
console.log('📡 Tentando conectar em http://localhost:3100...');
console.log('');
console.log('💡 COMO TESTAR:');
console.log('1. Abra http://localhost:3000 no navegador');
console.log('2. Faça login (chatbot/criadores)');
console.log('3. Clique na aba "💬 Chat WhatsApp"');
console.log('4. Conecte o WhatsApp via menu lateral');
console.log('5. Observe este terminal para eventos em tempo real');
console.log('6. Envie uma mensagem para o número conectado');
console.log('7. Use a interface de chat para responder');
console.log('');
