# 📱 Frontend - Central dos Resultados WhatsApp Bot

## 🚀 Migração Socket.io → Express API

Este frontend foi migrado de Socket.io para consumir a REST API Express.

---

## 📦 Instalação

```bash
npm install
```

**Nota:** `socket.io-client` foi removido das dependências.

---

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
REACT_APP_API_URL=http://localhost:11001
```

Para produção:
```env
REACT_APP_API_URL=https://api.chatbot.centraldosresultados.com
```

---

## 🚀 Iniciar

### Desenvolvimento
```bash
npm start
```

Abre automaticamente em `http://localhost:3000`

### Build (Produção)
```bash
npm run build
```

Gera arquivos otimizados na pasta `build/`

---

## 📂 Estrutura

```
front/
├── public/
├── src/
│   ├── components/          # Componentes React
│   │   ├── ChatWhatsApp.js
│   │   ├── EnviarMensagemParaTodos.js
│   │   ├── EnviarSenhaProvisoria.js
│   │   ├── EnviarValidacaoCadastro.js
│   │   ├── ListaValidacoesCadastro.js
│   │   ├── ListaEnviosSenhas.js
│   │   ├── ListaMensagensEnviadas.js
│   │   ├── TesteReenvioAlternativo.js
│   │   └── FerramentasMonitoramento.js
│   ├── services/
│   │   └── api.js           ⭐ Serviço de API REST
│   ├── App.js               ✅ Migrado para Express
│   ├── App.css
│   └── index.js
├── package.json             ✅ Socket.io removido
├── MIGRACAO_FRONTEND.md     📚 Guia de migração
└── README.md                📖 Este arquivo
```

---

## 🔌 Serviço de API

O arquivo `src/services/api.js` centraliza todas as chamadas à API:

### Exemplo de Uso

```javascript
import { whatsappAPI, mensagensAPI, polling } from './services/api';

// Status WhatsApp
const status = await whatsappAPI.getStatus();

// Enviar mensagem
const response = await mensagensAPI.enviar('5511999999999', 'Olá!');

// Polling para novas mensagens
polling.start('novasMensagens', async () => {
  const data = await mensagensAPI.buscarNovas();
  if (data.mensagens.length > 0) {
    processarMensagens(data.mensagens);
  }
}, 2000); // A cada 2 segundos
```

---

## 📡 APIs Disponíveis

### whatsappAPI
- `getStatus()` - Status da conexão
- `getQRCode()` - QR Code atual
- `connect()` - Conectar WhatsApp
- `disconnect()` - Desconectar

### mensagensAPI
- `enviar(numero, mensagem, imagem)` - Enviar mensagem
- `listarConversas()` - Listar conversas
- `buscarMensagensConversa(chatId, limit)` - Mensagens de conversa
- `buscarNovas()` - Novas mensagens (polling)
- `buscarStatusUpdates()` - Status updates (polling)
- `listarEnviadas()` - Histórico MongoDB

### validacoesAPI
- `enviar(idc, idn)` - Enviar validação
- `listar()` - Listar validações
- `reenviar(idc, idn)` - Reenviar validação

### senhasAPI
- `enviar(idc)` - Enviar senha
- `listar()` - Listar envios

### criadoresAPI
- `listarTodos()` - Todos os criadores
- `buscarSelecionados(ids)` - Criadores específicos

---

## 🔄 Polling

O serviço de polling substitui eventos em tempo real do Socket.io:

```javascript
import { polling } from './services/api';

// Iniciar polling
polling.start('minhaChave', async () => {
  // Sua lógica aqui
}, 3000); // Intervalo em ms

// Parar polling específico
polling.stop('minhaChave');

// Parar todos os pollings
polling.stopAll();
```

**Intervalos recomendados:**
- QR Code: 2 segundos
- Status: 5 segundos
- Novas mensagens: 2-3 segundos
- Lista geral: 10-30 segundos

---

## ✅ Status da Migração

### Já Migrados ✅
- [x] `src/services/api.js` - Serviço de API criado
- [x] `src/App.js` - Migrado para Express
- [x] `package.json` - Socket.io removido

### A Migrar ⚠️
- [ ] `ChatWhatsApp.js` - Precisa adaptar polling
- [ ] `EnviarMensagemParaTodos.js`
- [ ] `EnviarSenhaProvisoria.js`
- [ ] `EnviarValidacaoCadastro.js`
- [ ] `ListaValidacoesCadastro.js`
- [ ] `ListaEnviosSenhas.js`
- [ ] `ListaMensagensEnviadas.js`
- [ ] `TesteReenvioAlternativo.js`
- [ ] `FerramentasMonitoramento.js`

**Guia completo:** Veja `MIGRACAO_FRONTEND.md`

---

## 🔑 Login

**Credenciais padrão:**
- Login: `chatbot`
- Senha: `criadores`

---

## 🐛 Troubleshooting

### Erro de conexão com API

Verifique se:
1. O backend Express está rodando: `http://localhost:11001/health`
2. A variável `REACT_APP_API_URL` está correta
3. CORS está configurado no backend

### Polling não funciona

Verifique:
1. Console do navegador para erros
2. Se o polling foi iniciado corretamente
3. Se o cleanup (`polling.stopAll()`) está sendo chamado

### Build falha

```bash
# Limpar cache
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📚 Documentação Adicional

- **MIGRACAO_FRONTEND.md** - Guia completo de migração dos componentes
- **Backend README** - `../back/readme.md`
- **API Docs** - `../back/QUICK_REFERENCE.md`

---

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm start

# Build
npm run build

# Testes
npm test

# Eject (não recomendado)
npm run eject
```

---

## 📦 Dependências Principais

| Pacote | Versão | Uso |
|--------|--------|-----|
| `react` | ^19.1.0 | Framework |
| `react-dom` | ^19.1.0 | DOM Rendering |
| `react-scripts` | 5.0.1 | CRA Scripts |

**Removido:** `socket.io-client` ❌

---

## 🎯 Próximos Passos

1. **Migrar componentes restantes** usando o guia `MIGRACAO_FRONTEND.md`
2. **Testar todas as funcionalidades**
3. **Fazer build de produção**
4. **Deploy**

---

**Versão:** 2.0.0  
**Última atualização:** Outubro 2025  
**Migrado de:** Socket.io → Express REST API
