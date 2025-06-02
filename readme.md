# 🤖 ChatBot WhatsApp - Central dos Resultados

Sistema de chatbot integrado com WhatsApp para automatização de processos da Central dos Resultados.

## ✨ Características Principais

- 📱 **Integração WhatsApp Web** - Conexão robusta com reconexão automática
- 🚀 **Sistema de Envio Aprimorado** - Validação, retry automático e confirmação
- 🔌 **Socket.io Real-time** - Comunicação bidirecional instantânea
- 🎛️ **Interface React de Testes** - Dashboard completo para testes
- 🔧 **Sistema de Monitoramento** - Logs estruturados e notificações admin
- 📚 **Documentação Completa** - JSDoc em português para todas as funções
- 🛡️ **Error Handling Robusto** - Recuperação automática de falhas

## 🚀 Instalação Rápida

```bash
# Clone e instale dependências
npm install

# Instale dependências do React (interface de testes)
cd testes-react && npm install && cd ..
```

## 🎯 Modos de Execução

### Desenvolvimento
```bash
# Execução simples
node centralResultadosZapBot.js

# Com monitoramento
node start-production.js
```

### Produção
```bash
# Execução com logs e restart automático
./start-production.js

# Ou usando PM2 (recomendado)
pm2 start centralResultadosZapBot.js --name "chatbot-whatsapp"
```

### Interface de Testes React
```bash
cd testes-react
npm start
# Acesse: http://localhost:3000
```

## 📋 Funcionalidades

### 💬 Sistema de Envio de Mensagens

#### enviarMensagem() - Método Aprimorado
```javascript
const { conexaoBot } = require('./src/services/conexaoZap');

// Envio otimizado (resposta imediata)
const resultado = await conexaoBot.enviarMensagem(
    '22999134200',                    // Destinatário
    'Mensagem de teste',              // Texto (opcional)
    'https://exemplo.com/imagem.jpg', // Imagem (opcional)
    3                                 // Tentativas (padrão: 3)
);

// Envio com confirmação de status
const resultado = await conexaoBot.enviarMensagemComStatus(
    '22999134200',
    'Mensagem importante'
);
```

### 🔧 Funcionalidades Aprimoradas

- **Validação de Números**: DDD brasileiro (11-99), formato automático
- **Retry Inteligente**: 1-5 tentativas com delay progressivo (2s, 4s, 6s...)
- **Verificação de Conectividade**: Checagem em tempo real antes do envio
- **Dois Modos de Envio**: Rápido (sem confirmação) ou com confirmação de status
- **Suporte Completo**: Texto, imagem, ou texto+imagem combinados

### 🎛️ Interface React de Testes

A interface React possui duas abas principais:

1. **Validação de Cadastro**: Testa processo de validação
2. **Senha Provisória Criador**: Testa envio de credenciais

**Recursos da Interface:**
- Conexão/desconexão WhatsApp via interface
- Visualização de QR Code para autenticação
- Envio de eventos personalizados
- Monitoramento de respostas em tempo real

## 📁 Estrutura do Projeto

```
chatbot/
├── centralResultadosZapBot.js        # Script principal do bot
├── start-production.js               # Script de produção com logs
├── monitor-sistema.js                # Monitoramento do sistema
├── src/
│   ├── config.js                     # Configurações gerais
│   ├── services/
│   │   ├── conexaoZap.js            # ⭐ Serviço principal WhatsApp
│   │   ├── socket.js                # Comunicação Socket.io
│   │   └── conexao.js               # Conexão database
│   ├── helpers/
│   │   ├── notificaAdministrador.js # Sistema de notificações
│   │   ├── funcoesAuxiliares.js     # Funções utilitárias
│   │   └── mensagens.js             # Processamento de mensagens
│   └── components/
│       ├── vinculacoes.js           # Sistema de vinculações
│       └── criadores.js             # Gestão de criadores
└── testes-react/                    # Interface React de testes
    ├── src/
    │   ├── App.js                   # Aplicação principal
    │   └── components/              # Componentes de teste
    └── package.json
```

## 🛠️ Scripts Úteis

```bash
# Monitoramento do sistema
node monitor-sistema.js

# Testes de validação
node teste-validacao-simples.js

# Exemplo de uso
node exemplo-uso-envio.js

# Interface React
cd testes-react && npm start
```

## 🔧 Configuração

### Variáveis de Ambiente (.env)
```env
# Socket.io
SOCKET_PORT=3100

# Administrador (notificações)
ADMIN_PHONE=22999134200

# Database (se aplicável)
DB_HOST=localhost
DB_PORT=3306
```

### Configurações Principais (src/config.js)
```javascript
module.exports = {
    // Configurações de conexão
    portaSocket: process.env.SOCKET_PORT || 3100,
    
    // Contato do administrador
    contatoAdministrador: {
        numero: process.env.ADMIN_PHONE || '22999134200',
        nome: 'Administrador Sistema'
    },
    
    // Outros contatos de confirmação...
};
```

## 📊 Monitoramento

### Logs do Sistema
```bash
# Logs em tempo real
tail -f logs/bot-manager.log

# Verificação de saúde
node monitor-sistema.js
```

### Notificações Automáticas
O sistema envia notificações automáticas para o administrador sobre:
- ✅ Reconexões bem-sucedidas
- ❌ Falhas de conexão
- 🔄 Reinicializações do sistema
- ⚠️ Erros críticos

## 🐛 Solução de Problemas

### Problemas Comuns

**WhatsApp não conecta:**
```bash
# Remove sessão e reconecta
rm -rf .wwebjs_auth/
node centralResultadosZapBot.js
```

**Mensagens não são enviadas:**
```bash
# Verifica conectividade
node -e "
const { conexaoBot } = require('./src/services/conexaoZap');
conexaoBot.verificarConectividade().then(console.log);
"
```

**Interface React não carrega:**
```bash
cd testes-react
rm -rf node_modules package-lock.json
npm install
npm start
```

## 📈 Melhorias Implementadas

### v2.0 - Sistema Aprimorado (Maio 2025)

✅ **Sistema de Envio Reformulado:**
- Validação robusta de números brasileiros
- Sistema de retry com delay progressivo
- Verificação de conectividade em tempo real
- Duas modalidades de envio (rápido vs. confirmado)

✅ **Estabilidade e Monitoramento:**
- Reconexão automática com notificações
- Sistema de notificação de administrador
- Global error handlers
- Logs estruturados

✅ **Interface e Documentação:**
- Interface React com tabs
- Documentação JSDoc completa em português
- Scripts de monitoramento e produção
- Limpeza de código (remoção de console.logs)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte técnico ou dúvidas:
- 📧 Email: suporte@centraldosresultados.com
- 💬 WhatsApp: +55 (22) 99913-4200
- 🌐 Website: https://centraldosresultados.com

---

**🚀 Sistema WhatsApp Chatbot - Central dos Resultados**  
**Versão 2.0** | **Atualizado em:** Maio 2025
