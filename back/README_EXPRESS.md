# 🚀 Quick Start - Express API

## ⚡ Início Rápido

### 1️⃣ Instalar dependências
```bash
npm install
```

### 2️⃣ Iniciar servidor Express
```bash
npm run start:express
```

### 3️⃣ Testar
```bash
# Health check
curl http://localhost:3100/health

# Status WhatsApp
curl http://localhost:3100/api/status
```

---

## 📋 Principais Endpoints

### Conexão WhatsApp
- `GET /api/status` - Status da conexão
- `GET /api/qrcode` - Obter QR Code (polling)
- `POST /api/conectar` - Iniciar conexão

### Mensagens
- `POST /api/mensagens/enviar` - Enviar mensagem
- `GET /api/conversas` - Listar conversas
- `GET /api/mensagens/novas` - Novas mensagens (polling)

### Dados
- `GET /api/criadores` - Listar criadores
- `GET /api/envios/pendentes` - Envios pendentes
- `GET /api/historico/mensagens` - Histórico

---

## 🆚 Versões Disponíveis

| Versão | Arquivo | Comando | Descrição |
|--------|---------|---------|-----------|
| **Socket.io** | `centralResultadosZapBot.js` | `npm start` | Versão original com WebSocket |
| **Express** | `server-express.js` | `npm run start:express` | Nova versão REST API |

---

## 📚 Documentação Completa

Veja [MIGRACAO_EXPRESS.md](./MIGRACAO_EXPRESS.md) para documentação detalhada.

---

## ✅ Funcionalidades Mantidas

✅ Conexão WhatsApp  
✅ Envio de mensagens  
✅ Recebimento de mensagens  
✅ Status de entrega/leitura  
✅ Listagem de conversas  
✅ Histórico de mensagens  
✅ Validações e senhas  
✅ Integração MongoDB  
✅ Integração MySQL  
✅ Notificações administrador  
✅ Reconexão automática  

---

**Tudo que funciona no Socket.io, funciona no Express!**

