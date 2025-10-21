# Migração whatsapp-web.js → Baileys 7.0

## 📋 Mapeamento de Funções

### whatsapp-web.js → Baileys

| Função whatsapp-web.js | Baileys Equivalente | Notas |
|------------------------|---------------------|-------|
| `new Client({ authStrategy: LocalAuth })` | `makeWASocket({ auth: state })` com `useMultiFileAuthState()` | Baileys usa arquivos JSON para auth |
| `client.on('qr', ...)` | `sock.ev.on('connection.update', ...)` + `update.qr` | QR vem em connection.update |
| `client.on('ready', ...)` | `sock.ev.on('connection.update', ...)` + `connection === 'open'` | Ready = connection open |
| `client.on('message', ...)` | `sock.ev.on('messages.upsert', ...)` | Estrutura diferente |
| `client.on('message_ack', ...)` | `sock.ev.on('messages.update', ...)` | Status updates |
| `client.sendMessage(id, message)` | `sock.sendMessage(jid, { text })` | Formato diferente |
| `MessageMedia.fromUrl(url)` | Download manual + `{ image: buffer }` | Baileys não tem helper |
| `client.getState()` | Verificar `sock.user` | Sem getState direto |
| `client.getChats()` | `sock.store.chats` ou manual | Precisa store |
| `client.getChatById(id)` | Manual via store | Sem helper direto |
| `client.logout()` | `sock.logout()` | Similar |
| `client.destroy()` | `sock.end()` | Fechar conexão |
| `@c.us` (contatos) | `@s.whatsapp.net` | ID format mudou |
| `message._data` | `message` | Sem _data wrapper |
| `message.id.id` | `message.key.id` | Estrutura key |
| `message.from` | `message.key.remoteJid` | remoteJid |

## 🔧 Funções Principais do conexaoZap.js

### ✅ Já Implementadas no chatbotBase
1. `connectToWhatsApp()` - ✅ Conexão básica
2. `sendMessage()` - ✅ Envio de mensagem
3. QR Code generation - ✅ Em connection.update

### 🔨 Precisam Ser Portadas
1. `pegaClientBot()` - Inicializar socket
2. `verificarConectividade()` - Verificar se está conectado
3. `enviarMensagem(destinatario, texto, imagem, tentativas)` - **COMPLEXO** com retry
4. `enviarMensagemComStatus()` - Envio com aguardo de confirmação
5. `retornoMensagem(id)` - Polling de status
6. `dadosMensagem()` - Extração de dados
7. `recebeMensagem()` - Processar recebimento
8. `gerarVariacoesNumero()` - Fallback de formatos
9. `tentarEnvioNumero()` - Tentativa única de envio
10. `validarNumero()` - Validação de número BR
11. `verificarNumeroWhatsApp()` - onWhatsApp check
12. `monitorarStatusMensagem()` - Monitor com reenvio automático
13. `notificarAdministradorInterno()` - Notificações internas
14. `reenviarComFormatoAlternativo()` - Reenvio com número alternativo
15. `verificarMensagensParaReenvio()` - Sistema de reenvio automático
16. `iniciarVerificacaoPeriodicaReenvios()` - Reenvio periódico

### 📊 statusMensagens (Gerenciamento de Status)
- `setMensagem(id, mensagem)` - Armazenar status
- `getMensagem(id)` - Recuperar status
- `delMensagem(id)` - Deletar status

## 🎯 Estratégia de Migração

### Fase 1: Setup Inicial
- ✅ Analisar chatbotBase
- ⏳ Atualizar package.json
- ⏳ Criar nova estrutura de conexão

### Fase 2: Core Functions
- Migrar `pegaClientBot()` → `initializeWhatsApp()`
- Migrar `verificarConectividade()`
- Migrar `validarNumero()` e `gerarVariacoesNumero()`

### Fase 3: Envio de Mensagens
- Migrar `enviarMensagem()` com retry
- Migrar envio de imagens
- Implementar `messages.update` para status

### Fase 4: Recebimento
- Migrar `messages.upsert`
- Migrar processamento de mensagens
- Migrar sistema de vinculações

### Fase 5: Features Avançadas
- Sistema de monitoramento
- Reenvio automático
- Notificações

### Fase 6: Integração
- Atualizar express.js
- Atualizar centralResultadosZapBot.js
- Testes completos

## ⚠️ Pontos de Atenção

1. **Auth Storage**: `.wwebjs_auth/` → `./auth_info_baileys/`
2. **JID Format**: `@c.us` → `@s.whatsapp.net`
3. **Message Structure**: `msg._data` → `msg`
4. **Events**: Diferentes eventos e estruturas
5. **Type**: Pode precisar mudar para ES Modules (`"type": "module"`)
6. **Image Handling**: Precisa download manual
7. **Store**: Baileys não tem store built-in para chats

