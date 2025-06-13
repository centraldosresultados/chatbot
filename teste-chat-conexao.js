const { io } = require('socket.io-client');

console.log('🔌 Testando conexão Socket.io com o backend...');

const socket = io('http://localhost:3100');

socket.on('connect', () => {
  console.log('✅ Conectado ao servidor socket.io');
  console.log('📋 Solicitando conversas do WhatsApp...');
  
  // Testar evento obterConversasWhatsApp
  socket.emit('obterConversasWhatsApp', {}, (response) => {
    console.log('📱 Resposta obterConversasWhatsApp:', response);
    
    if (response.sucesso && response.conversas) {
      console.log(`📊 ${response.conversas.length} conversas encontradas:`);
      response.conversas.forEach((conversa, index) => {
        console.log(`   ${index + 1}. ${conversa.name || conversa.number} - ${conversa.lastMessage?.body || 'Sem mensagens'}`);
      });
    }
    
    socket.disconnect();
    console.log('🔌 Teste finalizado');
  });
});

socket.on('connect_error', (error) => {
  console.error('❌ Erro de conexão:', error);
});

socket.on('disconnect', () => {
  console.log('🔌 Desconectado do servidor');
});
