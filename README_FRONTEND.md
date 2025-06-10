# Central de Resultados - WhatsApp Bot Frontend

## 📋 Descrição

Interface web para gerenciamento do sistema de envio de mensagens via WhatsApp Bot da Central de Resultados. O sistema permite enviar mensagens para todos os criadores, gerenciar validações de cadastro, envio de senhas provisórias e acompanhar o status das mensagens enviadas.

## 🚀 Funcionalidades Implementadas

### ✅ Backend (Já Implementado)
- **Conexão MongoDB**: Configuração e conexão com banco de dados MongoDB
- **Serviços Socket.io**: 
  - `listarTodosCriadores`: Lista todos os criadores cadastrados
  - `enviarMensagemParaTodos`: Envia mensagens para criadores selecionados
  - `listarValidacoesCadastro`: Lista validações de cadastro enviadas
  - `listarEnviosSenhas`: Lista envios de senhas provisórias
  - `listarMensagensEnviadas`: Lista mensagens enviadas para todos
  - `buscarMensagemPorId`: Busca detalhes de uma mensagem específica
- **Alimentação das tabelas MongoDB**: 
  - `tb_envio_validacoes`: Salvamento automático nas validações de cadastro
  - `tb_envio_senhas`: Salvamento automático nos envios de senhas
  - `tb_envio_mensagens`: Salvamento de mensagens para todos
- **Sistema de status em tempo real**: Atualização automática de status (Enviada → Entregue → Lida)

### ✅ Frontend (Recém Implementado)
- **Menu Lateral**: Navegação intuitiva com ícones
- **Tela "Enviar Mensagem Para Todos"** (Tela inicial):
  - Lista todos os criadores com seleção individual ou em massa
  - Campo para digitação da mensagem
  - Envio para criadores selecionados
  - Contador de seleções
- **Tela "Validação de Cadastro"**: Envio individual de validações
- **Tela "Senha Provisória Criador"**: Envio de senhas para criadores
- **Tela "Lista Validações Cadastro"**: Visualização de todas as validações enviadas
- **Tela "Lista Envios de Senhas"**: Visualização de todos os envios de senhas
- **Tela "Lista Mensagens Enviadas"**: 
  - Select para escolher mensagem específica
  - Visualização de detalhes da mensagem
  - Lista de destinatários com status individual
- **Controles WhatsApp**: Conexão, desconexão e verificação de status
- **Log do Sistema**: Área fixa para acompanhar ações e respostas

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js**: Runtime JavaScript
- **Socket.io**: Comunicação em tempo real
- **MongoDB**: Banco de dados NoSQL
- **WhatsApp Web.js**: Integração com WhatsApp

### Frontend
- **React**: Biblioteca JavaScript para UI
- **Socket.io-client**: Cliente para comunicação com backend
- **CSS Grid/Flexbox**: Layout responsivo
- **CSS Custom Properties**: Temas e cores consistentes

## 📁 Estrutura de Arquivos

```
chatbot/
├── src/
│   ├── config.js                    # Configurações (MongoDB, etc.)
│   └── services/
│       ├── conexao.js              # Funções de banco de dados
│       └── mongodb.js              # Serviço MongoDB
├── centralResultadosZapBot.js      # Servidor principal com Socket.io
└── testes-react/
    └── src/
        ├── App.js                  # Componente principal
        ├── App.css                 # Estilos globais
        └── components/
            ├── EnviarMensagemParaTodos.js      # Tela principal
            ├── EnviarValidacaoCadastro.js      # Validação de cadastro
            ├── EnviarSenhaProvisoria.js        # Senha provisória
            ├── ListaValidacoesCadastro.js      # Lista validações
            ├── ListaEnviosSenhas.js           # Lista envios de senhas
            └── ListaMensagensEnviadas.js       # Lista mensagens
```

## 🚀 Como Executar

### 1. Backend (Terminal 1)
```bash
cd /Users/silverio/Dev/Web/centralresultados/chatbot
node centralResultadosZapBot.js
```

### 2. Frontend (Terminal 2)
```bash
cd /Users/silverio/Dev/Web/centralresultados/chatbot/testes-react
npm install  # Se primeira vez
npm start
```

### 3. Acesso
- **Frontend**: http://localhost:3000
- **Backend Socket.io**: https://chatbot.centraldosresultados.com:3100

## 📱 Como Usar

### 1. Conectar WhatsApp
1. No menu lateral, clique em "Conectar"
2. Escaneie o QR Code que aparece
3. Aguarde confirmação da conexão

### 2. Enviar Mensagem Para Todos
1. Acesse a tela principal "Enviar Mensagem Para Todos"
2. Clique em "Atualizar Lista" para carregar criadores
3. Selecione os criadores desejados (individual ou "Selecionar Todos")
4. Digite sua mensagem
5. Clique em "Enviar para X criadores"

### 3. Acompanhar Envios
- **Lista Validações Cadastro**: Veja todas as validações enviadas
- **Lista Envios de Senhas**: Veja todos os envios de senhas
- **Lista Mensagens Enviadas**: Selecione uma mensagem para ver detalhes e status por destinatário

## 📊 Status de Mensagens

- **Enviada** (Azul): Mensagem enviada com sucesso
- **Entregue** (Verde): Mensagem entregue ao destinatário
- **Lida** (Roxo): Mensagem lida pelo destinatário
- **Erro** (Vermelho): Erro no envio

## 🗄️ Estrutura do Banco MongoDB

### Coleções Criadas
- **tb_envio_validacoes**: Registros de validações de cadastro
- **tb_envio_senhas**: Registros de envios de senhas provisórias  
- **tb_envio_mensagens**: Registros de mensagens enviadas para todos

### Campos Principais
- `data_envio`: Data/hora do envio
- `status`: Status atual da mensagem
- `nome`, `telefone`: Dados do destinatário
- `mensagem`: Conteúdo da mensagem
- `destinatarios`: Array com status individual (para mensagens em massa)

## 🔧 Configurações

### MongoDB
No arquivo `src/config.js`:
```javascript
mongoDB: {
    uri: 'mongodb://localhost:27017/central_resultados'
}
```

### Socket.io
- Servidor: `https://chatbot.centraldosresultados.com:3100`
- Conexão automática ao carregar o frontend

## 📱 Layout Responsivo

O sistema é totalmente responsivo:
- **Desktop**: Menu lateral + conteúdo principal
- **Mobile**: Menu empilhado + conteúdo fluido
- **Tabelas**: Scroll horizontal quando necessário

## ✅ Status do Projeto

### ✅ Completado
- [x] Backend com MongoDB e Socket.io
- [x] Sistema de status em tempo real
- [x] Frontend com menu lateral
- [x] Todas as telas solicitadas
- [x] Integração frontend-backend
- [x] Layout responsivo
- [x] Sistema de logs

### 📝 Próximos Passos Sugeridos
- [ ] Testes automatizados
- [ ] Sistema de autenticação
- [ ] Filtros e busca nas listas
- [ ] Exportação de relatórios
- [ ] Notificações push

## 🤝 Contribuição

1. Clone o repositório
2. Instale as dependências do frontend e backend
3. Configure MongoDB e WhatsApp
4. Execute ambos os serviços
5. Teste as funcionalidades

---

**Desenvolvido para Central de Resultados** 🚀
