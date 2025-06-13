// Script para testar se o frontend está se conectando e carregando as conversas
const io = require('socket.io-client');

// Simular uma conexão como se fosse do frontend
const socket = io('http://localhost:3100');

socket.on('connect', () => {
  console.log('🔌 Frontend conectado ao backend');
  
  // Escutar por solicitações do frontend
  socket.onAny((event, ...args) => {
    console.log(`📤 Frontend enviou evento: ${event}`, args);
  });

  // Simular o que o frontend deveria fazer ao inicializar
  console.log('📋 Simulando solicitação de conversas pelo frontend...');
  socket.emit('obterConversasWhatsApp', {}, (response) => {
    console.log('✅ Resposta recebida pelo frontend:', {
      sucesso: response.sucesso,
      total: response.conversas ? response.conversas.length : 0,
      primeirasConversas: response.conversas ? response.conversas.slice(0, 3).map(c => ({
        nome: c.name,
        id: c.id,
        ultimaMensagem: c.lastMessage?.body?.substring(0, 50) + '...'
      })) : []
    });
    
    process.exit(0);
  });
});

socket.on('disconnect', () => {
  console.log('🔌 Frontend desconectado');
});

socket.on('error', (error) => {
  console.error('❌ Erro na conexão:', error);
});

// Timeout de segurança
setTimeout(() => {
  console.log('⏰ Timeout - encerrando teste');
  process.exit(1);
}, 5000);
