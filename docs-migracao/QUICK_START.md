# ⚡ Quick Start - Migração Chatbot

**1 página com tudo que você precisa para começar AGORA**

---

## 🎯 O QUE VAI MUDAR

WhatsApp: `whatsapp-web.js` → `@whiskeysockets/baileys`  
Backend: `Socket.io` → `Express REST API`  
Frontend: `Create React App` → `Vite`  
Tempo: **38-50 horas**

---

## ⚠️ ANTES DE COMEÇAR

### Pré-requisitos (15min)
```bash
# Verificar Node
node --version  # Deve ser 18+

# Verificar Git
git --version

# Verificar MySQL (deve estar rodando)
mysql -u root -p  # Testar conexão

# Verificar MongoDB (local ou cloud)
# Se cloud: ter URI pronto
```

### Backup (30min)
```bash
# 1. Código
git add .
git commit -m "Backup antes de migração"
git push

# 2. MySQL
mysqldump -u user -p central_resultados_criadores > backup_mysql.sql

# 3. MongoDB
mongodump --uri="mongodb+srv://..." --out=backup_mongo
```

### Preparar (30min)
```bash
# 1. Criar branch
git checkout -b migracao-baileys-v2

# 2. Copiar configurações
cp ENV_EXAMPLE.txt .env

# 3. Preencher .env com suas credenciais
nano .env  # ou usar seu editor
```

---

## 📋 DECISÕES NECESSÁRIAS

Antes de começar, decida:

1. **Firebase: manter ou migrar para MongoDB?**
   - Manter: + rápido, mantém sistema atual
   - Migrar: - 1 dependência, tudo no MongoDB
   
   **Minha decisão:** _____________

2. **Porta durante testes:**
   - Sistema novo rodará na porta 3101
   - Depois de validado, migrar para 3100
   
   **OK? [ ]**

---

## 🚀 EXECUÇÃO (38-50h)

### FASE 0: Research Baileys (6-8h) ⬅️ **COMEÇAR AQUI**

**Objetivo:** Validar que Baileys suporta tudo que precisamos

```bash
# Criar projeto de teste
mkdir baileys-test
cd baileys-test
npm init -y
npm install @whiskeysockets/baileys qrcode
```

**Testar:**
- [ ] Conexão WhatsApp
- [ ] Envio de mensagens
- [ ] Status de mensagens (CRÍTICO!)
- [ ] Recebimento de mensagens
- [ ] Listagem de conversas
- [ ] Verificação de número
- [ ] Monitoramento

**Documento:** `FASE_0_RESEARCH_BAILEYS.md`

**Decisão GO/NO-GO:**
- ✅ Se tudo funciona → Continuar
- ❌ Se falta algo crítico → Parar e reavaliar

---

### FASE 1: Backend (6-8h)

```bash
# Criar estrutura
mkdir backend
cd backend
npm init -y

# Instalar dependências
npm install @whiskeysockets/baileys express mongoose mysql2 \
  firebase winston dotenv cors qrcode
```

**Tarefas:**
- [ ] Configurar Express
- [ ] Integrar Baileys
- [ ] Conectar MySQL (criadores)
- [ ] Conectar MongoDB (mensagens)
- [ ] Conectar Firebase (se mantiver)
- [ ] Migrar helpers

**Documento:** `GUIA_EXECUCAO_MIGRACAO.md` (Fase 1)

---

### FASE 2: APIs REST (8-10h)

**Criar rotas:**
- [ ] POST `/api/whatsapp/connect`
- [ ] GET `/api/whatsapp/qrcode`
- [ ] GET `/api/whatsapp/status`
- [ ] POST `/api/whatsapp/disconnect`
- [ ] POST `/api/messages/send`
- [ ] POST `/api/messages/send-validation`
- [ ] POST `/api/messages/send-password`
- [ ] POST `/api/messages/send-bulk`
- [ ] GET `/api/creators/list` (MySQL)
- [ ] POST `/api/creators/selected` (MySQL)

**Documento:** `GUIA_EXECUCAO_MIGRACAO.md` (Fase 2)

---

### FASE 3: Frontend (6-8h)

```bash
# Criar projeto Vite
npm create vite@latest frontend -- --template react
cd frontend
npm install
```

**Tarefas:**
- [ ] Migrar componentes React
- [ ] Trocar Socket.io por fetch
- [ ] Adaptar UI
- [ ] Testar integração

**Documento:** `GUIA_EXECUCAO_MIGRACAO.md` (Fase 3)

---

### FASE 4: Funcionalidades (6-8h)

**Implementar:**
- [ ] Envio de validação de cadastro
- [ ] Envio de senha provisória
- [ ] Envio em lote
- [ ] Monitoramento e reenvio
- [ ] Sistema de vinculações
- [ ] Chat WhatsApp (opcional)

**Documento:** `GUIA_EXECUCAO_MIGRACAO.md` (Fase 4)

---

### FASE 5: Testes & Deploy (6-8h)

**Testes:**
- [ ] Conexão WhatsApp
- [ ] Envio de mensagens
- [ ] Status e monitoramento
- [ ] Recebimento
- [ ] Reenvio automático
- [ ] MySQL queries
- [ ] MongoDB save/find
- [ ] Frontend completo

**Deploy:**
```bash
# Backend
cd backend
npm run build
pm2 start server.js --name chatbot-backend

# Frontend
cd frontend
npm run build
# Copiar dist/ para servidor web
```

**Documento:** `GUIA_EXECUCAO_MIGRACAO.md` (Fase 5)

---

## 📚 DOCUMENTOS DISPONÍVEIS

| Documento | Quando Usar |
|-----------|-------------|
| **QUICK_START.md** | Começar agora (este arquivo) |
| **RESUMO_CORRECOES_APLICADAS.md** | Ver o que foi corrigido |
| **README_MIGRACAO.md** | Visão geral completa |
| **PLANO_MIGRACAO.md** | Plano detalhado |
| **FASE_0_RESEARCH_BAILEYS.md** | 🔴 Executar primeiro |
| **GUIA_EXECUCAO_MIGRACAO.md** | Guia passo a passo |
| **EXEMPLOS_CODIGO_MIGRACAO.md** | Copiar código |
| **ENV_EXAMPLE.txt** | Configurar .env |
| **INDICE_DOCUMENTACAO.md** | Navegar documentos |

---

## ⚡ 3 COMANDOS PARA COMEÇAR

```bash
# 1. Ler documentação principal (1h)
cat RESUMO_CORRECOES_APLICADAS.md
cat README_MIGRACAO.md

# 2. Preparar ambiente (1h)
git checkout -b migracao-baileys-v2
cp ENV_EXAMPLE.txt .env
# Editar .env com suas credenciais

# 3. Começar Fase 0 (6-8h)
# Seguir: FASE_0_RESEARCH_BAILEYS.md
mkdir baileys-test
cd baileys-test
npm init -y
npm install @whiskeysockets/baileys qrcode
```

---

## 🆘 PROBLEMAS COMUNS

**Baileys não conecta:**
- Verificar Node 18+
- Verificar internet
- Deletar pasta auth_info e tentar de novo

**MySQL não conecta:**
- Verificar credenciais no .env
- Verificar se MySQL está rodando
- Testar com `mysql -u user -p`

**MongoDB não conecta:**
- Verificar URI no .env
- Verificar IP liberado (se Atlas)
- Testar com mongosh

**Frontend não compila:**
- Deletar node_modules
- `npm install` de novo
- Verificar versão Node

---

## ✅ CHECKLIST RÁPIDO

**Antes de começar:**
- [ ] Node 18+ instalado
- [ ] Git configurado
- [ ] MySQL rodando + credenciais
- [ ] MongoDB rodando + URI
- [ ] Backup completo feito
- [ ] Branch criada
- [ ] .env configurado
- [ ] Decisão Firebase tomada
- [ ] Documentação lida (1h)

**Agora sim:**
- [ ] 🔴 **Executar FASE_0_RESEARCH_BAILEYS.md**

---

## 🎯 PRÓXIMA AÇÃO

**➡️ Ler: FASE_0_RESEARCH_BAILEYS.md**

**🔴 Executar: Fase 0 - Research do Baileys (6-8h)**

Essa fase é **OBRIGATÓRIA** e deve ser feita **ANTES** de qualquer migração.

---

**Versão:** 2.0  
**Data:** 21/10/2025  
**Tempo Total:** 38-50 horas  
**Status:** ✅ Pronto para começar

