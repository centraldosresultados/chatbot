# 🔄 Guia de Migração - Frontend Socket.io → Express API

## 📋 Resumo

Este documento explica como migrar os componentes do frontend de Socket.io para REST API.

---

## ✅ Arquivos Já Atualizados

### 1. `src/services/api.js` ⭐ NOVO
Serviço centralizado com todas as chamadas à API Express.

**Principais funções:**
- `whatsappAPI.*` - Conexão WhatsApp
- `mensagensAPI.*` - Mensagens
- `validacoesAPI.*` - Validações
- `senhasAPI.*` - Senhas
- `criadoresAPI.*` - Criadores
- `polling` - Gerenciador de polling

### 2. `src/App.js` ✅ ATUALIZADO
- Removido `io from 'socket.io-client'`
- Adicionado `import { whatsappAPI, polling } from './services/api'`
- Implementado polling para status e QR Code
- Removido prop `socket` dos componentes

---

## 🔧 Como Migrar Componentes

### Padrão de Migração

#### Antes (Socket.io)
```javascript
function MeuComponente({ socket, setResponseArea }) {
  const handleAcao = () => {
    if (!socket) {
      alert('Socket não conectado');
      return;
    }

    socket.emit('nomeEvento', { dados }, (response) => {
      console.log(response);
      setResponseArea(prev => prev + JSON.stringify(response) + '\n');
    });
  };
  
  return <button onClick={handleAcao} disabled={!socket}>Ação</button>;
}
```

#### Depois (Express API)
```javascript
import { minhaAPI } from '../services/api';

function MeuComponente({ setResponseArea }) {
  const [loading, setLoading] = useState(false);

  const handleAcao = async () => {
    setLoading(true);
    try {
      const response = await minhaAPI.acaoEspecifica({ dados });
      console.log(response);
      setResponseArea(prev => prev + JSON.stringify(response) + '\n');
    } catch (error) {
      alert(`Erro: ${error.message}`);
      setResponseArea(prev => prev + `Erro: ${error.message}\n`);
    } finally {
      setLoading(false);
    }
  };
  
  return <button onClick={handleAcao} disabled={loading}>Ação</button>;
}
```

---

## 📝 Componentes a Migrar

### 1. EnviarValidacaoCadastro.js

**Antes:**
```javascript
socket.emit('enviarValidacaoCadastro', { nome, telefone }, (response) => { ... });
```

**Depois:**
```javascript
import { validacoesAPI } from '../services/api';

const response = await validacoesAPI.enviar(idc, idn);
```

---

### 2. EnviarSenhaProvisoria.js

**Antes:**
```javascript
socket.emit('enviarSenhaProvisoriaCriador', payload, (response) => { ... });
```

**Depois:**
```javascript
import { senhasAPI } from '../services/api';

const response = await senhasAPI.enviar(idc);
```

---

### 3. EnviarMensagemParaTodos.js

**Antes:**
```javascript
socket.emit('listarTodosCriadores', {}, (response) => { ... });
socket.emit('enviarMensagemParaTodos', { ids, mensagem }, (response) => { ... });
```

**Depois:**
```javascript
import { criadoresAPI, mensagensAPI } from '../services/api';

// Listar criadores
const criadores = await criadoresAPI.listarTodos();

// Enviar para selecionados
for (const id of ids) {
  await mensagensAPI.enviar(numero, mensagem);
}
```

---

### 4. ListaValidacoesCadastro.js

**Antes:**
```javascript
socket.emit('listarValidacoesCadastro', {}, (response) => { ... });
socket.emit('reenviarValidacaoExistente', { idc, idn }, (response) => { ... });
```

**Depois:**
```javascript
import { validacoesAPI } from '../services/api';

// Listar
const data = await validacoesAPI.listar();

// Reenviar
const response = await validacoesAPI.reenviar(idc, idn);
```

---

### 5. ListaEnviosSenhas.js

**Antes:**
```javascript
socket.emit('listarEnviosSenhas', {}, (response) => { ... });
```

**Depois:**
```javascript
import { senhasAPI } from '../services/api';

const data = await senhasAPI.listar();
```

---

### 6. ListaMensagensEnviadas.js

**Antes:**
```javascript
socket.emit('listarMensagensEnviadas', {}, (response) => { ... });
socket.emit('buscarMensagemPorId', { id }, (response) => { ... });
```

**Depois:**
```javascript
import { mensagensAPI } from '../services/api';

// Listar
const mensagens = await mensagensAPI.listarEnviadas();

// Buscar por ID
const mensagem = await mensagensAPI.buscarPorId(id);
```

---

### 7. ChatWhatsApp.js

**Antes:**
```javascript
socket.emit('obterConversasWhatsApp', {}, (response) => { ... });
socket.emit('obterMensagensConversa', { chatId, limit }, (response) => { ... });
socket.emit('enviarMensagem', { numero, mensagem }, (response) => { ... });

// Listeners
socket.on('mudancaStatus', (data) => { ... });
socket.on('novaMensagemRecebida', (msg) => { ... });
socket.on('statusMensagemAtualizado', (update) => { ... });
```

**Depois:**
```javascript
import { mensagensAPI, polling } from '../services/api';
import { useEffect } from 'react';

// Listar conversas
const conversas = await mensagensAPI.listarConversas();

// Mensagens de conversa
const mensagens = await mensagensAPI.buscarMensagensConversa(chatId, limit);

// Enviar mensagem
const response = await mensagensAPI.enviar(numero, mensagem);

// Polling para novas mensagens
useEffect(() => {
  polling.start('novasMensagens', async () => {
    const data = await mensagensAPI.buscarNovas();
    if (data.mensagens.length > 0) {
      setMensagens(prev => [...prev, ...data.mensagens]);
    }
  }, 2000);

  return () => polling.stop('novasMensagens');
}, []);

// Polling para status
useEffect(() => {
  polling.start('statusUpdates', async () => {
    const data = await mensagensAPI.buscarStatusUpdates();
    if (data.updates.length > 0) {
      data.updates.forEach(update => updateMessageStatus(update));
    }
  }, 2000);

  return () => polling.stop('statusUpdates');
}, []);
```

---

### 8. TesteReenvioAlternativo.js

**Antes:**
```javascript
socket.emit('reenviarComFormatoAlternativo', { numero, mensagem }, (response) => { ... });
```

**Depois:**
```javascript
import { mensagensAPI } from '../services/api';

// Nota: Esta funcionalidade específica pode precisar ser implementada no backend
// Por enquanto, use envio normal
const response = await mensagensAPI.enviar(numero, mensagem);
```

---

### 9. FerramentasMonitoramento.js

**Antes:**
```javascript
socket.emit('executarMigracao', {}, (response) => { ... });
socket.emit('verificarNaoMonitoradas', {}, (response) => { ... });
socket.emit('forcarMonitoramento', {}, (response) => { ... });
socket.emit('reprocessarMensagensAntigas', {}, (response) => { ... });
```

**Depois:**
```javascript
// Nota: Estes endpoints específicos podem não estar implementados no Express
// Verifique no backend se foram criados ou crie-os conforme necessário
// Por enquanto, remova ou comente estas funções
```

---

## 🔄 Padrão de Polling

Para substituir eventos em tempo real, use polling:

```javascript
import { polling } from '../services/api';
import { useEffect } from 'react';

function MeuComponente() {
  const [dados, setDados] = useState([]);

  useEffect(() => {
    // Inicia polling
    polling.start('meusDados', async () => {
      try {
        const novos = await minhaAPI.buscarNovos();
        if (novos.length > 0) {
          setDados(prev => [...prev, ...novos]);
        }
      } catch (error) {
        console.error('Erro no polling:', error);
      }
    }, 3000); // 3 segundos

    // Para polling ao desmontar
    return () => polling.stop('meusDados');
  }, []);

  return <div>{/* ... */}</div>;
}
```

---

## 📦 Checklist de Migração por Componente

- [ ] **EnviarValidacaoCadastro.js**
  - [ ] Remover prop `socket`
  - [ ] Adicionar `import { validacoesAPI }`
  - [ ] Substituir `socket.emit` por `await validacoesAPI.enviar()`
  - [ ] Adicionar `try/catch`
  - [ ] Adicionar estado `loading`

- [ ] **EnviarSenhaProvisoria.js**
  - [ ] Remover prop `socket`
  - [ ] Adicionar `import { senhasAPI }`
  - [ ] Substituir `socket.emit` por `await senhasAPI.enviar()`
  - [ ] Adicionar `try/catch`
  - [ ] Adicionar estado `loading`

- [ ] **EnviarMensagemParaTodos.js**
  - [ ] Remover prop `socket`
  - [ ] Adicionar `import { criadoresAPI, mensagensAPI }`
  - [ ] Substituir `socket.emit('listarTodosCriadores')` por `await criadoresAPI.listarTodos()`
  - [ ] Substituir envio de mensagens
  - [ ] Adicionar `try/catch`

- [ ] **ListaValidacoesCadastro.js**
  - [ ] Remover prop `socket`
  - [ ] Adicionar `import { validacoesAPI }`
  - [ ] Substituir `socket.emit('listarValidacoesCadastro')` por `await validacoesAPI.listar()`
  - [ ] Substituir reenvio
  - [ ] Adicionar `try/catch`

- [ ] **ListaEnviosSenhas.js**
  - [ ] Remover prop `socket`
  - [ ] Adicionar `import { senhasAPI }`
  - [ ] Substituir `socket.emit` por `await senhasAPI.listar()`
  - [ ] Adicionar `try/catch`

- [ ] **ListaMensagensEnviadas.js**
  - [ ] Remover prop `socket`
  - [ ] Adicionar `import { mensagensAPI }`
  - [ ] Substituir `socket.emit` por chamadas à API
  - [ ] Adicionar `try/catch`

- [ ] **ChatWhatsApp.js**
  - [ ] Remover prop `socket`
  - [ ] Adicionar `import { mensagensAPI, polling }`
  - [ ] Substituir `socket.emit` por chamadas à API
  - [ ] Implementar polling para novas mensagens
  - [ ] Implementar polling para status
  - [ ] Adicionar `try/catch`

- [ ] **TesteReenvioAlternativo.js**
  - [ ] Remover prop `socket`
  - [ ] Adicionar `import { mensagensAPI }`
  - [ ] Substituir por envio normal
  - [ ] Adicionar `try/catch`

- [ ] **FerramentasMonitoramento.js**
  - [ ] Verificar se endpoints existem no backend
  - [ ] Criar endpoints no backend se necessário
  - [ ] Ou remover/comentar temporariamente

---

## 🚀 Depois da Migração

1. **Remover Socket.io:**
   ```bash
   npm uninstall socket.io-client
   ```

2. **Limpar imports:**
   - Remover `import io from 'socket.io-client'` de todos os arquivos

3. **Testar:**
   - Verificar se todos os componentes funcionam
   - Testar polling
   - Verificar console para erros

4. **Build:**
   ```bash
   npm run build
   ```

---

## 💡 Dicas

1. **Loading States**: Sempre adicione estados de loading para melhor UX
2. **Error Handling**: Use try/catch em todas as chamadas assíncronas
3. **Polling Interval**: 2-5 segundos é o ideal
4. **Cleanup**: Sempre pare polling no `useEffect` cleanup
5. **Logs**: Mantenha logs para debug inicial

---

**Status:** App.js e serviço de API já migrados ✅  
**Próximo passo:** Migrar componentes restantes usando este guia como referência

