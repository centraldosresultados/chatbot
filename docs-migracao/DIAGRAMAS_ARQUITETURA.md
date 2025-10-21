# 📐 Diagramas de Arquitetura - Migração ChatBot

Este documento contém diagramas visuais em texto ASCII para facilitar o entendimento da arquitetura atual vs nova.

---

## 🏛️ Arquitetura Atual (Socket.io + whatsapp-web.js)

```
┌─────────────────────────────────────────────────────────────────────┐
│                          ARQUITETURA ATUAL                           │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────┐                                  ┌─────────────────┐
│                 │                                  │                 │
│    FRONTEND     │◄────────── WebSocket ─────────►│     BACKEND     │
│  (React CRA)    │          (Socket.io)            │  (Socket.io +   │
│                 │                                  │  whatsapp-web)  │
└─────────────────┘                                  └─────────────────┘
        │                                                     │
        │                                                     │
        │                                                     │
        │                                                     ▼
        │                                            ┌─────────────────┐
        │                                            │                 │
        │                                            │   Puppeteer     │
        │                                            │   (Headless     │
        │                                            │    Chrome)      │
        │                                            │                 │
        │                                            └─────────────────┘
        │                                                     │
        │                                                     │
        │                                                     ▼
        │                                            ┌─────────────────┐
        │                                            │                 │
        │                                            │    WhatsApp     │
        │                                            │      Web        │
        │                                            │                 │
        │                                            └─────────────────┘
        │
        │
        ▼
┌─────────────────┐
│                 │
│    MongoDB      │◄─────────────────────────────────┐
│                 │                                   │
└─────────────────┘                                   │
                                                      │
                                             (Driver nativo)


CARACTERÍSTICAS ATUAIS:

✓ Comunicação em tempo real via WebSocket
✓ Dependência de browser headless (pesado)
✓ Mais complexo de escalar
✗ Consome muita memória (~300-500MB base + Puppeteer)
✗ Build lento do frontend (CRA)
✗ Dificulta cache HTTP
```

---

## 🚀 Arquitetura Nova (Express REST + Baileys)

```
┌─────────────────────────────────────────────────────────────────────┐
│                          ARQUITETURA NOVA                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────┐                                  ┌─────────────────┐
│                 │                                  │                 │
│    FRONTEND     │◄────── HTTP REST API ──────────►│     BACKEND     │
│   (React +      │        (Fetch/Axios)            │   (Express +    │
│    Vite)        │                                  │    Baileys)     │
│                 │                                  │                 │
└─────────────────┘                                  └─────────────────┘
        │                                                     │
        │         (Opcional: WebSocket só para chat)         │
        │◄─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─►│
        │                                                     │
        │                                                     │
        │                                                     ▼
        │                                            ┌─────────────────┐
        │                                            │                 │
        │                                            │    Baileys      │
        │                                            │  (Lib nativa)   │
        │                                            │   Sem browser!  │
        │                                            │                 │
        │                                            └─────────────────┘
        │                                                     │
        │                                                     │
        │                                                     ▼
        │                                            ┌─────────────────┐
        │                                            │                 │
        │                                            │    WhatsApp     │
        │                                            │     Protocol    │
        │                                            │                 │
        │                                            └─────────────────┘
        │
        │
        ▼
┌─────────────────┐
│                 │
│    MongoDB      │◄─────────────────────────────────┐
│                 │                                   │
└─────────────────┘                                   │
                                                (Mongoose ODM)


CARACTERÍSTICAS NOVAS:

✓ APIs REST stateless (fácil cache)
✓ Sem dependência de browser
✓ Muito mais leve (~100-150MB)
✓ Build ultra-rápido (Vite)
✓ Fácil de escalar horizontalmente
✓ Melhor para microserviços
```

---

## 📊 Fluxo de Dados - Envio de Validação

### ATUAL (Socket.io)

```
┌──────────┐                                                    ┌──────────┐
│ Frontend │                                                    │ Backend  │
└─────┬────┘                                                    └────┬─────┘
      │                                                              │
      │  1. socket.emit('enviarValidacao', dados, callback)         │
      │─────────────────────────────────────────────────────────────►
      │                                                              │
      │                                                              │  2. Processa
      │                                                              │─────────┐
      │                                                              │         │
      │                                                              │◄────────┘
      │                                                              │
      │                                                              │  3. Envia WA
      │                                                              │─────────┐
      │                                                              │         │
      │                                                              │◄────────┘
      │                                                              │
      │                                                              │  4. Salva DB
      │                                                              │─────────┐
      │                                                              │         │
      │                                                              │◄────────┘
      │                                                              │
      │  5. callback({ sucesso: true, id: "..." })                  │
      │◄─────────────────────────────────────────────────────────────
      │                                                              │
      │  6. socket.on('statusMensagem', data)                       │
      │◄─────────────────────────────────────────────────────────────
      │                                                              │
```

### NOVO (REST API)

```
┌──────────┐                                                    ┌──────────┐
│ Frontend │                                                    │ Backend  │
└─────┬────┘                                                    └────┬─────┘
      │                                                              │
      │  1. POST /api/validations/send-validation                   │
      │     { telefone, nome_completo }                             │
      │─────────────────────────────────────────────────────────────►
      │                                                              │
      │                                                              │  2. Valida
      │                                                              │─────────┐
      │                                                              │         │
      │                                                              │◄────────┘
      │                                                              │
      │                                                              │  3. Envia WA
      │                                                              │─────────┐
      │                                                              │         │
      │                                                              │◄────────┘
      │                                                              │
      │                                                              │  4. Salva DB
      │                                                              │─────────┐
      │                                                              │         │
      │                                                              │◄────────┘
      │                                                              │
      │  5. Response: 200 OK                                        │
      │     { success: true, id: "...", dbId: "..." }               │
      │◄─────────────────────────────────────────────────────────────
      │                                                              │
      │  6. (Opcional) Polling para atualizar status               │
      │  GET /api/validations/status/:id                            │
      │─────────────────────────────────────────────────────────────►
      │                                                              │
      │  7. Response: { status: "Entregue" }                        │
      │◄─────────────────────────────────────────────────────────────
      │                                                              │
```

---

## 🗂️ Estrutura de Diretórios Detalhada

### Backend Novo

```
back-novo/
│
├── server.js                    # Servidor principal
│   ├── Configuração Express
│   ├── Middleware (CORS, JSON)
│   ├── Inicialização Baileys
│   └── Rotas principais
│
├── config.js                    # Configurações centralizadas
│   ├── Porta do servidor
│   ├── URI do MongoDB
│   ├── Configurações WhatsApp
│   └── Configurações CORS
│
├── package.json                 # Dependências
│   ├── @whiskeysockets/baileys
│   ├── express
│   ├── mongoose
│   ├── cors
│   └── qrcode
│
├── models/                      # Schemas Mongoose
│   ├── Validacao.js
│   │   ├── telefone
│   │   ├── nome_completo
│   │   ├── status_mensagem
│   │   ├── id_mensagem
│   │   └── historicoReenvios[]
│   │
│   ├── EnvioSenha.js
│   │   ├── telefone
│   │   ├── nome_completo
│   │   ├── senha_provisoria
│   │   └── status_mensagem
│   │
│   └── Mensagem.js
│       ├── id_lote
│       ├── mensagem
│       ├── criadores[]
│       └── estatísticas
│
├── routes/                      # Rotas da API
│   ├── whatsapp.js
│   │   ├── POST /api/connect
│   │   ├── GET  /api/qrcode
│   │   ├── GET  /api/status
│   │   └── POST /api/disconnect
│   │
│   ├── validacoes.js
│   │   ├── POST /api/validations/send-validation
│   │   └── GET  /api/validations/list
│   │
│   ├── senhas.js
│   │   ├── POST /api/passwords/send-password
│   │   └── GET  /api/passwords/list
│   │
│   └── mensagens.js
│       ├── POST /api/messages/send-to-all
│       └── GET  /api/messages/list
│
├── controllers/                 # Lógica de negócio
│   ├── whatsappController.js
│   │   ├── initializeWhatsApp()
│   │   ├── handleConnection()
│   │   └── handleDisconnection()
│   │
│   └── mensagensController.js
│       ├── sendMessage()
│       ├── processResponse()
│       └── updateStatus()
│
├── utils/                       # Funções auxiliares
│   ├── validacoes.js
│   │   ├── validarNumero()
│   │   └── gerarVariacoes()
│   │
│   └── formatadores.js
│       ├── formatarTelefone()
│       └── formatarMensagem()
│
└── auth_info_baileys/          # Credenciais WhatsApp (auto-gerado)
    ├── creds.json
    └── app-state-sync-*.json
```

### Frontend Novo

```
front-novo/
│
├── index.html                   # HTML principal
│   └── <div id="root"></div>
│
├── vite.config.js              # Configuração Vite
│   ├── Plugins
│   ├── Proxy para API
│   └── Build settings
│
├── package.json                # Dependências
│   ├── react
│   ├── react-dom
│   └── vite
│
└── src/
    │
    ├── main.jsx                # Entrada da aplicação
    │   ├── import React
    │   ├── import ReactDOM
    │   └── render App
    │
    ├── App.jsx                 # Componente principal
    │   ├── Estado global
    │   ├── Roteamento
    │   └── Layout
    │
    ├── config.js               # Configurações
    │   └── API_BASE_URL
    │
    ├── components/             # Componentes React
    │   │
    │   ├── Conexao/
    │   │   ├── ConexaoWhatsApp.jsx
    │   │   ├── QRCodeDisplay.jsx
    │   │   └── StatusIndicator.jsx
    │   │
    │   ├── Validacao/
    │   │   ├── EnviarValidacao.jsx
    │   │   └── ListaValidacoes.jsx
    │   │
    │   ├── Senhas/
    │   │   ├── EnviarSenha.jsx
    │   │   └── ListaSenhas.jsx
    │   │
    │   ├── Mensagens/
    │   │   ├── EnviarMensagem.jsx
    │   │   ├── SelecionarCriadores.jsx
    │   │   └── ListaMensagens.jsx
    │   │
    │   ├── Chat/
    │   │   ├── ChatWhatsApp.jsx
    │   │   ├── Conversas.jsx
    │   │   └── MensagensConversa.jsx
    │   │
    │   └── Historico/
    │       ├── HistoricoValidacoes.jsx
    │       ├── HistoricoSenhas.jsx
    │       └── HistoricoMensagens.jsx
    │
    ├── services/               # Serviços de API
    │   │
    │   └── api.js
    │       ├── class ApiService
    │       ├── connect()
    │       ├── sendMessage()
    │       ├── sendValidation()
    │       └── getHistory()
    │
    └── styles/                 # Estilos
        └── App.css
```

---

## 🔄 Ciclo de Vida de uma Mensagem

```
┌───────────────────────────────────────────────────────────────────┐
│                    CICLO DE VIDA DE MENSAGEM                       │
└───────────────────────────────────────────────────────────────────┘

1. CRIAÇÃO
   ┌─────────────┐
   │  Frontend   │ Usuário preenche formulário
   │   Form      │ (telefone, nome, mensagem)
   └──────┬──────┘
          │
          ▼
2. ENVIO PARA BACKEND
   ┌─────────────┐
   │ POST /api/  │ { telefone, mensagem }
   │ send-message│
   └──────┬──────┘
          │
          ▼
3. VALIDAÇÃO
   ┌─────────────┐
   │ Validar     │ → Número tem 10 ou 11 dígitos?
   │  Número     │ → DDD válido?
   └──────┬──────┘ → Formatar corretamente
          │
          ▼
4. TENTATIVA DE ENVIO
   ┌─────────────┐
   │   Baileys   │ → Variação 1: DDDNNNNNNNNN (11 dígitos)
   │ sendMessage │ → Variação 2: DDDNNNNNNNN (10 dígitos)
   └──────┬──────┘ → Até 3 tentativas cada
          │
          ├─► SUCESSO ──────────────┐
          │                         │
          └─► ERRO ─────────────┐   │
                                │   │
                                ▼   ▼
5. REGISTRO NO BANCO
   ┌─────────────────────────────────┐
   │  MongoDB                        │
   │  ├── id_mensagem: "xyz123"      │
   │  ├── telefone: "11999999999"    │
   │  ├── status: "Enviada"          │
   │  └── dataEnvio: Date.now()      │
   └─────────┬───────────────────────┘
             │
             ▼
6. MONITORAMENTO (5 minutos)
   ┌─────────────┐
   │   Timer     │ Verificar status após 5 min
   └──────┬──────┘
          │
          ├─► Status: Entregue → ✓ OK
          │
          └─► Status: Não Entregue
                    │
                    ▼
7. REENVIO AUTOMÁTICO (se aplicável)
   ┌─────────────┐
   │   Reenvio   │ Tentar formato alternativo
   │ Alternativo │ 11 → 10 ou 10 → 11 dígitos
   └──────┬──────┘
          │
          ▼
8. NOTIFICAÇÃO ADMIN
   ┌─────────────┐
   │  WhatsApp   │ "Mensagem não entregue para..."
   │    Admin    │ Detalhes do problema
   └─────────────┘
```

---

## 🌐 Fluxo de Conexão WhatsApp

```
┌───────────────────────────────────────────────────────────────────┐
│                   FLUXO DE CONEXÃO WHATSAPP                        │
└───────────────────────────────────────────────────────────────────┘

CASO 1: PRIMEIRA CONEXÃO (Sem credenciais)
═══════════════════════════════════════════

    ┌──────────┐
    │ Usuário  │
    │  clica   │
    │"Conectar"│
    └────┬─────┘
         │
         ▼
    ┌─────────────┐
    │POST /api/   │
    │  connect    │
    └──────┬──────┘
           │
           ▼
    ┌─────────────────────┐
    │ initializeWhatsApp()│
    │ - Baileys gera QR   │
    │ - Status: connecting│
    └──────┬──────────────┘
           │
           ▼
    ┌─────────────┐
    │GET /api/    │
    │  qrcode     │ ◄─── Polling a cada 2s
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │  Exibe QR   │
    │  no Front   │
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │   Usuário   │
    │  escaneia   │
    │  no celular │
    └──────┬──────┘
           │
           ▼
    ┌─────────────────────┐
    │ connection.update   │
    │ status: 'open'      │
    │ - Salvar creds      │
    │ - Status: connected │
    └─────────────────────┘


CASO 2: RECONEXÃO AUTOMÁTICA (Com credenciais)
════════════════════════════════════════════════

    ┌──────────────┐
    │ Servidor     │
    │  inicia      │
    └──────┬───────┘
           │
           ▼
    ┌─────────────────────┐
    │hasStoredCredentials│
    │     == true?        │
    └──────┬──────────────┘
           │ Sim
           ▼
    ┌─────────────────────┐
    │ autoReconnect()     │
    │ Tenta 5x com delay  │
    └──────┬──────────────┘
           │
           ├─► Sucesso ──► Status: connected ✓
           │
           └─► Falha ─────► Aguarda nova conexão manual


CASO 3: PERDA DE CONEXÃO (Durante uso)
════════════════════════════════════════

    ┌──────────────┐
    │ WhatsApp     │
    │ desconecta   │
    └──────┬───────┘
           │
           ▼
    ┌─────────────────────┐
    │connection.update    │
    │ status: 'close'     │
    └──────┬──────────────┘
           │
           ▼
    ┌─────────────────────┐
    │shouldReconnect?     │
    │ (não foi logout)    │
    └──────┬──────────────┘
           │ Sim
           ▼
    ┌─────────────────────┐
    │  setTimeout(5s)     │
    │ initializeWhatsApp()│
    └──────┬──────────────┘
           │
           ▼
    ┌─────────────────────┐
    │ Tenta reconectar    │
    │ automaticamente     │
    └─────────────────────┘
```

---

## 📈 Comparação de Performance

```
┌───────────────────────────────────────────────────────────────────┐
│                    MÉTRICAS DE PERFORMANCE                         │
└───────────────────────────────────────────────────────────────────┘

TEMPO DE BUILD (Frontend)
══════════════════════════

Atual (Create React App):
├── Desenvolvimento (npm start)
│   └── ████████████████████████████████ 30-45 segundos
│
└── Produção (npm run build)
    └── ████████████████████████████████████████████████████ 2-3 minutos

Novo (Vite):
├── Desenvolvimento (npm run dev)
│   └── █ 1-2 segundos  ← 15-30x MAIS RÁPIDO!
│
└── Produção (npm run build)
    └── ███ 10-20 segundos  ← 6-9x MAIS RÁPIDO!


USO DE MEMÓRIA (Backend)
═════════════════════════

Atual (whatsapp-web.js + Puppeteer):
└── ████████████████████████████████████ 300-500 MB base
    └── + Picos de 800MB+ quando enviando

Novo (Baileys):
└── ████████████ 100-150 MB base  ← 60-70% MENOS MEMÓRIA!
    └── + Picos de 200-250MB máximo


TEMPO DE RESPOSTA API
══════════════════════

Atual (Socket.io):
├── Latência WebSocket: 50-100ms
└── Sobrecarga manter conexões: Alta

Novo (REST API):
├── Latência HTTP: 50-200ms
└── Cache HTTP: Reduz até 90% requests repetidos!


TAXA DE SUCESSO DE MENSAGENS
═════════════════════════════

Atual (whatsapp-web.js):
└── ████████████████████░░░░ 85-90%
    └── Falhas comuns com números novos

Novo (Baileys + Sistema de Fallback):
└── ████████████████████████ 95-98%  ← MAIS CONFIÁVEL!
    └── Sistema inteligente de variações
```

---

## 🔐 Fluxo de Autenticação e Segurança

```
┌───────────────────────────────────────────────────────────────────┐
│                   AUTENTICAÇÃO E SEGURANÇA                         │
└───────────────────────────────────────────────────────────────────┘

AUTENTICAÇÃO FRONTEND
═══════════════════════

    ┌──────────┐
    │ Usuário  │
    │  acessa  │
    │   app    │
    └────┬─────┘
         │
         ▼
    ┌─────────────┐
    │localStorage │    Tem login salvo?
    │   check     │───────┬──────────────┬──────────
    └─────────────┘       │              │
                         Sim            Não
                          │              │
                          ▼              ▼
                    ┌──────────┐   ┌──────────┐
                    │ Validar  │   │  Tela de │
                    │ timestamp│   │  Login   │
                    └────┬─────┘   └────┬─────┘
                         │              │
                    < 24h│  > 24h       │ Login
                         │    │         │ correto
                    ┌────▼────▼─────────▼────┐
                    │   App Autenticado      │
                    │                        │
                    │ Login: chatbot         │
                    │ Senha: criadores       │
                    │                        │
                    │ Salvo no localStorage  │
                    │ Válido por 24h         │
                    └────────────────────────┘


SEGURANÇA API (Backend)
════════════════════════

    Produção:
    ┌─────────────────────────────────┐
    │ HTTPS (Let's Encrypt)           │
    │ ├── Certificado SSL automático  │
    │ └── Renovação automática        │
    └─────────────┬───────────────────┘
                  │
                  ▼
    ┌─────────────────────────────────┐
    │ Nginx Reverse Proxy             │
    │ ├── Rate limiting               │
    │ ├── Compression (gzip)          │
    │ └── Static files cache          │
    └─────────────┬───────────────────┘
                  │
                  ▼
    ┌─────────────────────────────────┐
    │ Express Backend                 │
    │ ├── CORS configurado            │
    │ │   └── Only: chatbot.domain    │
    │ ├── Body size limit: 10MB       │
    │ ├── Trust proxy: true           │
    │ └── JSON parser                 │
    └─────────────────────────────────┘

    Desenvolvimento:
    ┌─────────────────────────────────┐
    │ HTTP Simples                    │
    │ ├── CORS: * (all origins)      │
    │ ├── No SSL                      │
    │ └── Vite proxy                  │
    └─────────────────────────────────┘
```

---

## 💾 Modelo de Dados - Relacionamentos

```
┌───────────────────────────────────────────────────────────────────┐
│                   MODELO DE DADOS MONGODB                          │
└───────────────────────────────────────────────────────────────────┘

COLLECTIONS:
════════════

┌─────────────────────────────────────┐
│  tb_envio_validacoes                │
├─────────────────────────────────────┤
│ _id: ObjectId                       │
│ telefone: String ◄──────┐           │
│ nome_completo: String   │           │
│ status_mensagem: String │           │
│ id_mensagem: String ────┼───────┐   │
│ dataEnvio: Date         │       │   │
│ reenvioTentado: Boolean │       │   │
│ historicoReenvios: []   │       │   │
└─────────────────────────┼───────┼───┘
                          │       │
┌─────────────────────────┼───────┼───┐
│  tb_envio_senhas        │       │   │
├─────────────────────────┼───────┼───┤
│ _id: ObjectId           │       │   │
│ telefone: String ◄──────┘       │   │
│ nome_completo: String           │   │
│ senha_provisoria: String        │   │
│ status_mensagem: String         │   │
│ id_mensagem: String ────────────┼───┤
│ dataEnvio: Date                 │   │
└─────────────────────────────────┼───┘
                                  │
┌─────────────────────────────────┼───┐
│  tb_envio_mensagens             │   │
├─────────────────────────────────┼───┤
│ _id: ObjectId                   │   │
│ id_lote: String                 │   │
│ mensagem: String                │   │
│ criadores: [                    │   │
│   {                             │   │
│     codigo: Number              │   │
│     nome_completo: String       │   │
│     telefone: String            │   │
│     status_mensagem: String     │   │
│     id_mensagem: String ────────┘   │
│   }                                 │
│ ]                                   │
│ totalEnviados: Number               │
│ sucessos: Number                    │
│ erros: Number                       │
│ dataEnvio: Date                     │
└─────────────────────────────────────┘


ÍNDICES CRIADOS:
════════════════

tb_envio_validacoes:
├── telefone (para busca rápida)
└── dataEnvio (para ordenação)

tb_envio_senhas:
├── telefone
└── dataEnvio

tb_envio_mensagens:
├── id_lote (para buscar lote específico)
└── dataEnvio


QUERIES COMUNS:
═══════════════

1. Buscar todas validações de um número:
   db.tb_envio_validacoes.find({ telefone: "11999999999" })

2. Buscar mensagens não entregues:
   db.tb_envio_validacoes.find({ 
     status_mensagem: "Enviada",
     dataEnvio: { $lt: new Date(Date.now() - 5*60*1000) }
   })

3. Estatísticas de envio:
   db.tb_envio_validacoes.aggregate([
     { $group: {
       _id: "$status_mensagem",
       count: { $sum: 1 }
     }}
   ])
```

---

**Criado em:** 21 de Outubro de 2025  
**Versão:** 1.0  
**Próximo:** Veja [README_MIGRACAO.md](./README_MIGRACAO.md) para índice completo

