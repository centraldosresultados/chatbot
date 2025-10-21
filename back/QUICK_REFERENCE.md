# ⚡ Quick Reference - Express API

## 🚀 Início Rápido

```bash
npm install
npm start
```

**Servidor:** `http://localhost:3100`

---

## 📡 Principais Endpoints

### 🔌 Conexão
```bash
# Status
GET  /api/status

# QR Code (polling)
GET  /api/qrcode

# Conectar
POST /api/conectar
```

### 💬 Mensagens
```bash
# Enviar
POST /api/mensagens/enviar
Body: { "numero": "5511999999999", "mensagem": "Olá!" }

# Conversas
GET  /api/conversas

# Novas mensagens (polling)
GET  /api/mensagens/novas

# Status updates (polling)
GET  /api/mensagens/status-updates
```

### ✅ Validações
```bash
# Enviar validação
POST /api/validacao/enviar
Body: { "idc": "123", "idn": "456" }

# Enviar senha
POST /api/senha/enviar
Body: { "idc": "123" }
```

### 👥 Criadores
```bash
# Listar todos
GET  /api/criadores

# Buscar selecionados
POST /api/criadores/selecionados
Body: { "ids": [1, 2, 3] }
```

### 📊 Histórico
```bash
# Pendentes
GET  /api/envios/pendentes?tipo=todos

# Histórico
GET  /api/historico/mensagens?limit=100
```

---

## 🧪 Exemplos curl

```bash
# Health check
curl http://localhost:3100/health

# Status WhatsApp
curl http://localhost:3100/api/status

# QR Code
curl http://localhost:3100/api/qrcode

# Enviar mensagem
curl -X POST http://localhost:3100/api/mensagens/enviar \
  -H "Content-Type: application/json" \
  -d '{"numero":"5511999999999","mensagem":"Teste!"}'

# Listar conversas
curl http://localhost:3100/api/conversas

# Novas mensagens
curl http://localhost:3100/api/mensagens/novas
```

---

## 🔄 Polling (Frontend)

```javascript
// QR Code
setInterval(async () => {
  const res = await fetch('/api/qrcode');
  const data = await res.json();
  if (data.success) updateQRCode(data.qrCode);
}, 2000);

// Status
setInterval(async () => {
  const res = await fetch('/api/status');
  const data = await res.json();
  updateStatus(data.contato);
}, 5000);

// Novas mensagens
setInterval(async () => {
  const res = await fetch('/api/mensagens/novas');
  const data = await res.json();
  if (data.mensagens.length > 0) {
    data.mensagens.forEach(msg => addMessage(msg));
  }
}, 2000);
```

---

## 📂 Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `src/services/express.js` | ⭐ Servidor principal |
| `src/services/conexaoZap.js` | WhatsApp |
| `src/services/mongodb.js` | MongoDB |
| `src/services/conexao.js` | MySQL |
| `package.json` | Dependências |
| `src/config.js` | Configurações |

---

## 🔧 Scripts npm

```bash
npm start              # Iniciar servidor
npm run start:pm2      # PM2
npm run stop:pm2       # Parar PM2
npm run logs           # Ver logs
npm run clean          # Limpar sessão
```

---

## 🐛 Troubleshooting

```bash
# Limpar sessão WhatsApp
npm run clean

# Liberar porta
lsof -ti :3100 | xargs kill -9

# Reinstalar
rm -rf node_modules package-lock.json
npm install
```

---

## ⚠️ Importante

- **Arquivo principal:** `src/services/express.js`
- **NÃO usar:** `centralResultadosZapBot.js` (legado)
- **Polling:** 2-5 segundos recomendado
- **Buffers:** Máximo 100 itens

