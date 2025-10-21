# Fase 0: Research e Validação do Baileys

**Duração Estimada:** 6-8 horas  
**Objetivo:** Validar viabilidade técnica da migração para Baileys  
**Status:** 📋 Pendente

---

## 🎯 Objetivo desta Fase

Antes de começar a migração completa, precisamos **validar que o Baileys suporta todas as funcionalidades críticas** do sistema atual. Esta fase evitará surpresas e retrabalho durante a migração.

---

## 📋 Funcionalidades Críticas a Validar

### 1. ✅ Conexão WhatsApp
**Atual (whatsapp-web.js):**
```javascript
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ["--no-sandbox"] }
});
await client.initialize();
```

**Testar no Baileys:**
```javascript
import { makeWASocket, useMultiFileAuthState } from '@whiskeysockets/baileys';

const { state, saveCreds } = await useMultiFileAuthState('auth_info');
const sock = makeWASocket({ auth: state });
```

**Validar:**
- [ ] Conexão funciona
- [ ] QR Code é gerado
- [ ] Credenciais são salvas
- [ ] Reconexão automática funciona

---

### 2. ✅ Envio de Mensagens
**Atual:**
```javascript
await client.sendMessage(numero, texto);
await client.sendMessage(numero, media, { caption: texto });
```

**Testar no Baileys:**
```javascript
await sock.sendMessage(jid, { text: mensagem });
await sock.sendMessage(jid, { 
    image: { url: imageUrl },
    caption: texto 
});
```

**Validar:**
- [ ] Envio de texto funciona
- [ ] Envio de imagem funciona
- [ ] Envio de imagem com caption funciona
- [ ] Retorna ID da mensagem

---

### 3. ⚠️ Status de Mensagens (CRÍTICO)
**Atual:**
```javascript
const info = await mensagem.getInfo();
const enviado = info.deliveryRemaining <= 0;
const lida = info.readRemaining <= 0;
```

**Pesquisar no Baileys:**
- [ ] Como verificar se mensagem foi entregue?
- [ ] Como verificar se mensagem foi lida?
- [ ] Existe evento de atualização de status?
- [ ] É possível buscar mensagem por ID?

**Possíveis soluções no Baileys:**
```javascript
// Listener de atualizações
sock.ev.on('messages.update', (updates) => {
    for (const { key, update } of updates) {
        if (update.status === 3) {  // Lida
            console.log('Mensagem lida:', key.id);
        }
    }
});
```

**Validar:**
- [ ] Existe equivalente a message.ack?
- [ ] Consegue detectar entrega
- [ ] Consegue detectar leitura
- [ ] Consegue buscar status depois de enviado

---

### 4. ✅ Recebimento de Mensagens
**Atual:**
```javascript
client.on('message', async (message) => {
    const text = message.body;
    const from = message.from;
    // ...
});
```

**Testar no Baileys:**
```javascript
sock.ev.on('messages.upsert', async (m) => {
    const message = m.messages[0];
    const text = message.message?.conversation || 
                 message.message?.extendedTextMessage?.text;
    const from = message.key.remoteJid;
});
```

**Validar:**
- [ ] Recebe mensagens de texto
- [ ] Recebe mensagens com reply
- [ ] Consegue extrair texto da mensagem
- [ ] Consegue identificar remetente

---

### 5. ⚠️ Listagem de Conversas (Para Chat)
**Atual:**
```javascript
const chats = await client.getChats();
for (const chat of chats) {
    const messages = await chat.fetchMessages({ limit: 10 });
}
```

**Pesquisar no Baileys:**
- [ ] Existe função para listar conversas?
- [ ] Como buscar histórico de mensagens?
- [ ] Existe equivalente a fetchMessages?

**Possíveis soluções:**
```javascript
// Baileys pode não ter API direta para isso
// Pode precisar manter histórico no MongoDB
```

**Validar:**
- [ ] Como listar conversas ativas
- [ ] Como buscar mensagens de conversa
- [ ] Se não existe, como implementar workaround

---

### 6. ✅ Verificação de Número
**Atual:**
```javascript
const isRegistered = await client.isRegisteredUser(numero);
const contact = await client.getContactById(numero);
```

**Testar no Baileys:**
```javascript
const [result] = await sock.onWhatsApp(numero);
if (result?.exists) {
    console.log('Número existe no WhatsApp');
}
```

**Validar:**
- [ ] onWhatsApp funciona
- [ ] Retorna se número está registrado
- [ ] Consegue obter informações do contato

---

### 7. ⚠️ Monitoramento de Mensagens (MUITO CRÍTICO)
**Atual:**
```javascript
setTimeout(async () => {
    const mensagem = await client.getMessageById(messageId);
    if (mensagem.ack < 2) {
        // Mensagem não entregue, reenviar
    }
}, 5 * 60 * 1000);
```

**Pesquisar no Baileys:**
- [ ] Existe getMessageById?
- [ ] Como monitorar status após envio?
- [ ] Existe histórico de mensagens enviadas?

**Possível solução alternativa:**
```javascript
// Manter mapeamento no MongoDB:
// messageId -> { status, timestamp, numero, texto }

// Listener de updates:
sock.ev.on('messages.update', (updates) => {
    // Atualizar status no MongoDB
});

// Job periódico para verificar mensagens pendentes
setInterval(() => {
    // Buscar mensagens sem confirmação no MongoDB
    // Tentar reenviar
}, 5 * 60 * 1000);
```

**Validar:**
- [ ] Como implementar monitoramento
- [ ] Se precisa usar MongoDB como cache
- [ ] Se listeners de update são confiáveis

---

## 🧪 Plano de Testes

### Passo 1: Criar Projeto de Teste (1-2h)

```bash
mkdir baileys-test
cd baileys-test
npm init -y
npm install @whiskeysockets/baileys qrcode
```

**Criar arquivo test.js:**
```javascript
import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode';

async function testBaileys() {
    console.log('🔄 Iniciando teste do Baileys...');
    
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_test');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
    });
    
    // Evento: QR Code
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            const qrImage = await qrcode.toDataURL(qr);
            console.log('📱 QR Code gerado - cole em HTML para testar');
            console.log(qrImage.substring(0, 100) + '...');
        }
        
        if (connection === 'open') {
            console.log('✅ Conectado ao WhatsApp!');
            
            // Aqui executar testes
            await executarTestes(sock);
        }
        
        if (connection === 'close') {
            console.log('❌ Conexão fechada');
        }
    });
    
    sock.ev.on('creds.update', saveCreds);
}

async function executarTestes(sock) {
    console.log('\n🧪 Executando testes...\n');
    
    // Teste 1: Verificar número
    await testarVerificacaoNumero(sock);
    
    // Teste 2: Enviar mensagem
    await testarEnvioMensagem(sock);
    
    // Teste 3: Monitorar status
    await testarMonitoramentoStatus(sock);
    
    // Teste 4: Receber mensagem
    await testarRecebimentoMensagem(sock);
    
    console.log('\n✅ Testes concluídos!');
}

// Implementar cada teste...

testBaileys().catch(console.error);
```

### Passo 2: Testes de Funcionalidades (2-3h)

**Checklist de Testes:**

1. **Teste de Conexão (30min)**
   - [ ] Gera QR Code
   - [ ] Conecta com sucesso
   - [ ] Salva credenciais
   - [ ] Reconecta automaticamente

2. **Teste de Envio (30min)**
   - [ ] Envia mensagem de texto
   - [ ] Envia imagem
   - [ ] Envia imagem com caption
   - [ ] Retorna ID da mensagem
   - [ ] Mensagem chega no destino

3. **Teste de Status (1h - CRÍTICO)**
   - [ ] Detecta envio
   - [ ] Detecta entrega
   - [ ] Detecta leitura
   - [ ] Consegue buscar status depois

4. **Teste de Recebimento (30min)**
   - [ ] Recebe mensagem de texto
   - [ ] Recebe reply
   - [ ] Identifica remetente
   - [ ] Extrai conteúdo corretamente

5. **Teste de Conversas (30min)**
   - [ ] Lista conversas ativas
   - [ ] Busca mensagens de conversa
   - [ ] Ou identifica necessidade de workaround

6. **Teste de Verificação (15min)**
   - [ ] Verifica se número existe
   - [ ] Obtém informações do contato

### Passo 3: Documentar Resultados (1h)

Criar documento `BAILEYS_FINDINGS.md`:

```markdown
# Resultados do Research do Baileys

## ✅ Funcionalidades que Funcionam

1. **Conexão:** ...
2. **Envio:** ...

## ⚠️ Funcionalidades com Limitações

1. **Status de Mensagens:** 
   - Funciona através de: ...
   - Limitação: ...
   - Solução: ...

## ❌ Funcionalidades que Não Existem

1. **getChats():**
   - Não existe no Baileys
   - Solução proposta: ...

## 📝 Adaptações Necessárias

1. **Monitoramento:**
   - Atual: setTimeout + getMessageById
   - Novo: MongoDB cache + listeners

2. **Chat:**
   - Atual: getChats() + fetchMessages()
   - Novo: Manter histórico no MongoDB
```

---

## 📊 Critérios de Sucesso

### ✅ PODE PROSSEGUIR se:

- [ ] Conexão funciona perfeitamente
- [ ] Envio de mensagens funciona (texto + imagem)
- [ ] Existe forma confiável de monitorar status (mesmo que diferente)
- [ ] Recebimento de mensagens funciona
- [ ] Verificação de número funciona

### ⚠️ PROSSEGUIR COM CUIDADO se:

- [ ] Alguma funcionalidade precisa workaround
- [ ] Chat precisa ser reimplementado diferente
- [ ] Monitoramento precisa usar MongoDB

### ❌ NÃO PROSSEGUIR se:

- [ ] Monitoramento de status não é possível
- [ ] Mensagens não chegam confiávelmente
- [ ] Não consegue receber mensagens
- [ ] Bugs críticos no Baileys

---

## 📝 Template de Relatório

Ao final da Fase 0, criar documento com:

```markdown
# Relatório de Viabilidade - Baileys

**Data:** XX/XX/2025
**Duração do Research:** Xh
**Decisão:** ✅ PROSSEGUIR / ⚠️ PROSSEGUIR COM RESTRIÇÕES / ❌ NÃO PROSSEGUIR

## Sumário Executivo

[Resumo de 2-3 parágrafos sobre a viabilidade]

## Funcionalidades Testadas

### 1. Conexão WhatsApp
- Status: ✅ Funciona perfeitamente
- Detalhes: ...

### 2. Envio de Mensagens
- Status: ✅ Funciona perfeitamente
- Detalhes: ...

[... continuar para todas]

## Diferenças Principais vs whatsapp-web.js

| Funcionalidade | whatsapp-web.js | Baileys | Impacto |
|----------------|----------------|---------|---------|
| Conexão | Puppeteer | Direto | ✅ Melhor |
| Status msg | message.ack | listeners | ⚠️ Diferente |
| Chat | getChats() | N/A | ❌ Precisa workaround |

## Adaptações Necessárias

1. **Monitoramento:**
   - Descrição do problema
   - Solução proposta
   - Risco: Baixo/Médio/Alto

[... continuar]

## Riscos Identificados

1. **[Risco 1]:** Descrição + Mitigação
2. **[Risco 2]:** Descrição + Mitigação

## Recomendações

1. Prosseguir com migração
2. Implementar workarounds para X e Y
3. Testar extensivamente Z antes de produção

## Próximos Passos

1. Fase 1: Preparação do Backend
2. Implementar adaptações identificadas
3. ...
```

---

## 🛠️ Scripts Úteis para Research

### test-connection.js
```javascript
// Testar apenas conexão
```

### test-send-message.js
```javascript
// Testar envio de mensagem
```

### test-message-status.js
```javascript
// Testar monitoramento de status
```

### test-receive-message.js
```javascript
// Testar recebimento
```

---

## ⏱️ Cronograma da Fase 0

| Atividade | Tempo | Status |
|-----------|-------|--------|
| Setup projeto teste | 30min | ⬜ |
| Teste de conexão | 1h | ⬜ |
| Teste de envio | 1h | ⬜ |
| Teste de status | 1.5h | ⬜ |
| Teste de recebimento | 30min | ⬜ |
| Teste de conversas | 1h | ⬜ |
| Teste de verificação | 30min | ⬜ |
| Documentar resultados | 1h | ⬜ |
| Criar relatório | 1h | ⬜ |

**Total: 8h**

---

## ✅ Próximos Passos Após Fase 0

**Se APROVAR:**
1. Criar relatório de viabilidade
2. Atualizar plano de migração com adaptações necessárias
3. Iniciar Fase 1: Preparação do Backend

**Se REPROVAR:**
1. Documentar problemas encontrados
2. Avaliar alternativas (manter whatsapp-web.js, tentar outro lib)
3. Reavaliar estratégia de migração

---

**Criado em:** 21/10/2025  
**Versão:** 1.0  
**Status:** 📋 Aguardando Execução

