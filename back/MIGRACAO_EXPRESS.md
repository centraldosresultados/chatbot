# 🔄 Migração Socket.io → Express

## 📋 Resumo

Este documento detalha a migração do backend de **Socket.io** para **Express.js**, mantendo **TODAS** as funcionalidades existentes.

---

## 🆚 Comparação: Socket.io vs Express

### **Socket.io (Arquivo Original)**
- ✅ Comunicação em tempo real (WebSocket)
- ✅ Eventos bidirecionais
- ❌ Mais complexo para debugging
- ❌ Requer cliente Socket.io no frontend
- ❌ Não é REST padrão

### **Express (Novo Arquivo)**
- ✅ REST API padrão
- ✅ Mais fácil de debugar (curl, Postman)
- ✅ Stateless (melhor para escalar)
- ✅ Polling para tempo real
- ✅ Compatível com qualquer cliente HTTP

---

## 📁 Arquivos

| Tipo | Arquivo | Descrição |
|------|---------|-----------|
| **Original** | `centralResultadosZapBot.js` | Versão com Socket.io |
| **Novo** | `server-express.js` | Versão com Express |

---

## 🚀 Como Usar

### **1. Instalar dependências**

```bash
cd /Users/silverio/Dev/Web/centralresultados/chatbot/back
npm install
```

### **2. Rodar servidor Express**

```bash
npm run start:express
```

### **3. Testar API**

```bash
# Health check
curl http://localhost:3100/health

# Status da conexão
curl http://localhost:3100/api/status

# QR Code
curl http://localhost:3100/api/qrcode
```

---

## 📡 Mapeamento de Eventos → Rotas

### **Eventos Socket.io** → **Rotas Express**

| Socket.io (Evento) | Express (Rota) | Método | Descrição |
|-------------------|----------------|--------|-----------|
| `connection` | N/A | - | Não necessário (stateless) |
| `qrCode` (emit) | `GET /api/qrcode` | GET | Polling para obter QR Code |
| `mudancaStatus` (emit) | `GET /api/status` | GET | Polling para status |
| `novaMensagemRecebida` (emit) | `GET /api/mensagens/novas` | GET | Polling para novas mensagens |
| `statusMensagemAtualizado` (emit) | `GET /api/mensagens/status-updates` | GET | Polling para status |
| `enviarMensagem` (on) | `POST /api/mensagens/enviar` | POST | Enviar mensagem |
| `buscarConversas` (on) | `GET /api/conversas` | GET | Listar conversas |
| `buscarMensagensConversa` (on) | `GET /api/conversas/:id/mensagens` | GET | Mensagens de conversa |
| `enviaValidacao` (on) | `POST /api/validacao/enviar` | POST | Enviar validação |
| `enviaSenha` (on) | `POST /api/senha/enviar` | POST | Enviar senha |
| `buscaCriadores` (on) | `GET /api/criadores` | GET | Listar criadores |
| `buscaCriadoresSelecionados` (on) | `POST /api/criadores/selecionados` | POST | Buscar selecionados |
| `buscaEnviosPendentes` (on) | `GET /api/envios/pendentes` | GET | Envios pendentes |
| `buscaHistoricoMensagens` (on) | `GET /api/historico/mensagens` | GET | Histórico |
| `notificarAdministrador` (on) | `POST /api/notificar/administrador` | POST | Notificar admin |

---

## 🔧 Implementação no Frontend

### **Antes (Socket.io)**

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3100');

// Receber QR Code
socket.on('qrCode', (base64) => {
  setQrCode(base64);
});

// Enviar mensagem
socket.emit('enviarMensagem', { numero, mensagem }, (callback) => {
  console.log(callback);
});
```

### **Depois (Express + Fetch)**

```javascript
// Obter QR Code (polling a cada 2 segundos)
const fetchQRCode = async () => {
  const response = await fetch('http://localhost:3100/api/qrcode');
  const data = await response.json();
  if (data.success && data.qrCode) {
    setQrCode(data.qrCode);
  }
};

setInterval(fetchQRCode, 2000);

// Enviar mensagem
const enviarMensagem = async (numero, mensagem) => {
  const response = await fetch('http://localhost:3100/api/mensagens/enviar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ numero, mensagem })
  });
  const data = await response.json();
  return data;
};
```

---

## 📝 Endpoints Completos

### **📱 WhatsApp**

#### `GET /api/status`
Obter status da conexão WhatsApp.

**Resposta:**
```json
{
  "success": true,
  "contato": {
    "Conectado": true,
    "status": "Conectado",
    "telefone": "5511999999999"
  },
  "conectado": true
}
```

#### `GET /api/qrcode`
Obter QR Code para conexão.

**Resposta:**
```json
{
  "success": true,
  "qrCode": "data:image/png;base64,..."
}
```

#### `POST /api/conectar`
Iniciar conexão com WhatsApp.

**Body:**
```json
{
  "nomeSessao": "",
  "tipoInicializacao": "padrao"
}
```

---

### **💬 Mensagens**

#### `POST /api/mensagens/enviar`
Enviar mensagem individual.

**Body:**
```json
{
  "numero": "5511999999999",
  "mensagem": "Olá, teste!",
  "imagem": "base64..." // Opcional
}
```

**Resposta:**
```json
{
  "success": true,
  "resultado": {
    "sucesso": true,
    "id": "ABC123...",
    "mensagem": "Mensagem enviada com sucesso"
  }
}
```

#### `GET /api/conversas`
Listar todas as conversas do WhatsApp.

**Resposta:**
```json
{
  "success": true,
  "conversas": [
    {
      "id": "5511999999999@c.us",
      "nome": "João Silva",
      "ultimaMensagem": "Olá!",
      "timestamp": 1634567890,
      "naoLidas": 2,
      "tipo": "individual"
    }
  ]
}
```

#### `GET /api/conversas/:chatId/mensagens?limit=50`
Buscar mensagens de uma conversa.

**Resposta:**
```json
{
  "success": true,
  "mensagens": [
    {
      "id": "ABC123",
      "from": "5511999999999@c.us",
      "body": "Olá!",
      "timestamp": 1634567890,
      "fromMe": false,
      "type": "chat",
      "hasMedia": false,
      "ack": 2
    }
  ]
}
```

#### `GET /api/mensagens/novas`
Buscar novas mensagens recebidas (polling).

**Resposta:**
```json
{
  "success": true,
  "mensagens": [
    {
      "id": "ABC123",
      "from": "5511999999999@c.us",
      "body": "Teste",
      "timestamp": 1634567890,
      "type": "chat",
      "hasMedia": false
    }
  ]
}
```

#### `GET /api/mensagens/status-updates`
Buscar atualizações de status (polling).

**Resposta:**
```json
{
  "success": true,
  "updates": [
    {
      "messageId": "ABC123",
      "status": "read",
      "timestamp": 1634567890
    }
  ]
}
```

---

### **✅ Validações e Senhas**

#### `POST /api/validacao/enviar`
Enviar mensagem de validação.

**Body:**
```json
{
  "idc": "123",
  "idn": "456"
}
```

#### `POST /api/senha/enviar`
Enviar mensagem de senha.

**Body:**
```json
{
  "idc": "123"
}
```

---

### **👥 Criadores**

#### `GET /api/criadores`
Listar todos os criadores.

#### `POST /api/criadores/selecionados`
Buscar criadores selecionados.

**Body:**
```json
{
  "ids": [1, 2, 3]
}
```

---

### **📋 Histórico e Pendentes**

#### `GET /api/envios/pendentes?tipo=todos`
Buscar envios pendentes.

**Query params:**
- `tipo`: `validacao`, `senha`, `mensagem` ou `todos` (padrão: `todos`)

#### `GET /api/historico/mensagens?tabela=tb_envio_mensagens&limit=100&offset=0`
Buscar histórico de mensagens do MongoDB.

---

### **🔔 Notificações**

#### `POST /api/notificar/administrador`
Notificar administrador.

**Body:**
```json
{
  "mensagem": "Erro crítico no sistema!"
}
```

---

## 🆚 Diferenças Técnicas

### **Tempo Real**

| Aspecto | Socket.io | Express |
|---------|-----------|---------|
| **Push de dados** | Sim (WebSocket) | Não (polling necessário) |
| **Latência** | ~10ms | ~2000ms (polling a cada 2s) |
| **Conexão** | Persistente | Stateless |
| **Overhead** | Baixo (após conexão) | Médio (cada request) |

### **Polling Implementado**

Para substituir eventos em tempo real, use polling no frontend:

```javascript
// Polling para novas mensagens
setInterval(async () => {
  const response = await fetch('/api/mensagens/novas');
  const data = await response.json();
  if (data.success && data.mensagens.length > 0) {
    data.mensagens.forEach(msg => {
      // Processar mensagem
      console.log('Nova mensagem:', msg);
    });
  }
}, 2000); // A cada 2 segundos
```

---

## ✅ Vantagens da Migração

1. **📊 Debugging mais fácil:**
   - Use `curl`, Postman, ou navegador
   - Logs mais claros

2. **🔧 Manutenção simplificada:**
   - REST API padrão
   - Não precisa gerenciar conexões WebSocket

3. **📈 Escalabilidade:**
   - Stateless (pode usar load balancer facilmente)
   - Não precisa sticky sessions

4. **🌐 Compatibilidade:**
   - Qualquer cliente HTTP funciona
   - Não precisa Socket.io no frontend

---

## ⚠️ Considerações

1. **Polling vs WebSocket:**
   - Polling consome mais recursos
   - Para aplicações com MUITAS mensagens simultâneas, considere manter Socket.io
   - Para uso normal, polling funciona bem

2. **Buffers de Mensagens:**
   - O servidor mantém buffers de até 100 mensagens/atualizações
   - Mensagens antigas são descartadas (FIFO)

3. **Intervalo de Polling:**
   - Recomendado: 2-5 segundos
   - Mais rápido = mais requisições = mais overhead

---

## 🔄 Migração Gradual

Você pode rodar **ambos** os servidores simultaneamente:

```bash
# Terminal 1: Socket.io (porta 3100)
npm start

# Terminal 2: Express (porta 3101)
PORT=3101 npm run start:express
```

Isso permite testar a nova API enquanto mantém o sistema antigo funcionando.

---

## 📞 Suporte

- **Arquivo Original:** `centralResultadosZapBot.js`
- **Arquivo Novo:** `server-express.js`
- **Documentação:** `MIGRACAO_EXPRESS.md`

---

**Criado por:** Silvério  
**Data:** Outubro 2025  
**Versão:** 2.0.0

