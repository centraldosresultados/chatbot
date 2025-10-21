# 🤖 Chatbot Central dos Resultados

Sistema de envio automatizado de mensagens WhatsApp para criadores.

---

## 📢 ATENÇÃO: MIGRAÇÃO EM ANDAMENTO

**Versão Atual:** 1.0 (whatsapp-web.js + Socket.io)  
**Versão Nova:** 2.0 (Baileys + Express REST)  
**Status:** 📋 Fase de Planejamento Completa

---

## 🚀 INÍCIO RÁPIDO

### Para usar o sistema atual:

```bash
cd back
npm install
npm start
```

### Para começar a migração:

**⚡ 3 PASSOS:**

1. **Ler documentação** (1h)
   ```bash
   cat QUICK_START.md
   cat RESUMO_CORRECOES_APLICADAS.md
   ```

2. **Preparar ambiente** (1h)
   ```bash
   git checkout -b migracao-baileys-v2
   cp ENV_EXAMPLE.txt .env
   # Editar .env com credenciais
   ```

3. **Executar Fase 0** (6-8h)
   ```bash
   # Seguir: FASE_0_RESEARCH_BAILEYS.md
   ```

---

## 📚 DOCUMENTAÇÃO DE MIGRAÇÃO

**📂 Toda documentação está em: [`docs-migracao/`](docs-migracao/)**

### 🎯 Começando Agora?

| # | Documento | Tempo | Descrição |
|---|-----------|-------|-----------|
| 1️⃣ | **[QUICK_START.md](docs-migracao/QUICK_START.md)** | 5min | ⚡ Comece aqui - 1 página |
| 2️⃣ | **[RESUMO_CORRECOES_APLICADAS.md](docs-migracao/RESUMO_CORRECOES_APLICADAS.md)** | 15min | O que foi corrigido |
| 3️⃣ | **[README_MIGRACAO.md](docs-migracao/README_MIGRACAO.md)** | 20min | Visão geral completa |

### 📖 Documentação Completa

| Documento | Tipo | Descrição |
|-----------|------|-----------|
| [PLANO_MIGRACAO.md](docs-migracao/PLANO_MIGRACAO.md) | Plano | Plano detalhado fase a fase |
| [FASE_0_RESEARCH_BAILEYS.md](docs-migracao/FASE_0_RESEARCH_BAILEYS.md) | Guia | 🔴 **EXECUTAR PRIMEIRO** |
| [GUIA_EXECUCAO_MIGRACAO.md](docs-migracao/GUIA_EXECUCAO_MIGRACAO.md) | Guia | Passo a passo fases 1-5 |
| [EXEMPLOS_CODIGO_MIGRACAO.md](docs-migracao/EXEMPLOS_CODIGO_MIGRACAO.md) | Código | Exemplos práticos |
| [DIAGRAMAS_ARQUITETURA.md](docs-migracao/DIAGRAMAS_ARQUITETURA.md) | Visual | Diagramas e arquitetura |
| [REVISAO_CRITICA_PLANO.md](docs-migracao/REVISAO_CRITICA_PLANO.md) | Análise | Problemas identificados |
| [ENV_EXAMPLE.txt](docs-migracao/ENV_EXAMPLE.txt) | Config | Template de configuração |
| [INDICE_DOCUMENTACAO.md](docs-migracao/INDICE_DOCUMENTACAO.md) | Índice | Navegação completa |

**📑 Ver todos:** [LISTA_DOCUMENTOS.md](docs-migracao/LISTA_DOCUMENTOS.md) | [MAPA_VISUAL.md](docs-migracao/MAPA_VISUAL.md)

---

## 🎯 PRÓXIMA AÇÃO RECOMENDADA

### Se você quer começar a migração:

```
1. Ler: QUICK_START.md (5min)
         ⬇️
2. Ler: RESUMO_CORRECOES_APLICADAS.md (15min)
         ⬇️
3. Ler: README_MIGRACAO.md (20min)
         ⬇️
4. Preparar ambiente (1h)
   - Backup
   - Git branch
   - .env
         ⬇️
5. 🔴 EXECUTAR: FASE_0_RESEARCH_BAILEYS.md (6-8h)
   ⚠️ CRÍTICO - Validar viabilidade ANTES de migrar
```

---

## 📊 RESUMO DA MIGRAÇÃO

### O Que Muda?

| Aspecto | Atual | Novo |
|---------|-------|------|
| WhatsApp | whatsapp-web.js | @whiskeysockets/baileys |
| Backend | Socket.io | Express REST |
| Frontend | CRA | Vite |
| Módulos | CommonJS | ES Modules |
| MongoDB | Driver nativo | Mongoose |

### Por Que Migrar?

✅ **10-20x mais rápido** (build)  
✅ **Mais estável** (sem Puppeteer)  
✅ **Mais moderno** (ES Modules, REST)  
✅ **Mais escalável** (stateless APIs)  
✅ **Melhor performance** (menor memória)

### Quanto Tempo?

**Total: 38-50 horas**

- Fase 0 (Research): 6-8h
- Fase 1 (Backend): 6-8h
- Fase 2 (APIs): 8-10h
- Fase 3 (Frontend): 6-8h
- Fase 4 (Funcionalidades): 6-8h
- Fase 5 (Testes/Deploy): 6-8h

---

## 🛠️ SISTEMA ATUAL

### Estrutura

```
chatbot/
├── back/               # Backend atual (Socket.io)
│   ├── src/
│   │   ├── components/
│   │   ├── helpers/
│   │   └── services/
│   └── package.json
│
├── front/              # Frontend atual (CRA)
│   ├── src/
│   │   └── components/
│   └── package.json
│
└── [DOCS DE MIGRAÇÃO]  # 📚 Toda documentação aqui
```

### Tecnologias Atuais

**Backend:**
- whatsapp-web.js
- Socket.io
- MySQL
- MongoDB
- Firebase

**Frontend:**
- React (CRA)
- Socket.io Client

---

## ⚙️ CONFIGURAÇÃO (Sistema Atual)

### Variáveis de Ambiente

Criar `.env` na pasta `back/`:

```env
# MySQL
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=senha
MYSQL_DATABASE=central_criadores

# MongoDB
MONGODB_URI=mongodb://localhost:27017/central-mensagens

# Firebase (configurações)
# ...
```

### Instalação

```bash
# Backend
cd back
npm install
npm start

# Frontend
cd front
npm install
npm start
```

---

## 📝 FUNCIONALIDADES

### Principais

- ✅ Conexão com WhatsApp via QR Code
- ✅ Envio de mensagens de validação de cadastro
- ✅ Envio de senhas provisórias
- ✅ Envio em lote para criadores
- ✅ Monitoramento de status de mensagens
- ✅ Reenvio automático se não entregue
- ✅ Sistema de vinculações
- ✅ Chat WhatsApp (em tempo real)
- ✅ Listagem de criadores (MySQL)
- ✅ Histórico de mensagens (MongoDB)

---

## 🤝 CONTRIBUINDO

### Para o Sistema Atual

1. Clone o repositório
2. Crie uma branch: `git checkout -b feature/nome`
3. Faça suas alterações
4. Commit: `git commit -m 'Descrição'`
5. Push: `git push origin feature/nome`
6. Abra um Pull Request

### Para a Migração

1. Leia toda documentação em `QUICK_START.md`
2. Execute Fase 0 primeiro (validação)
3. Siga o `GUIA_EXECUCAO_MIGRACAO.md`
4. Use `EXEMPLOS_CODIGO_MIGRACAO.md` como referência

---

## 📞 CONTATO

**Desenvolvedor:** Silvério  
**Projeto:** Central dos Resultados  
**Sistema:** Chatbot WhatsApp

---

## 📜 LICENÇA

Uso interno - Central dos Resultados

---

## 🔄 VERSÕES

### v2.0 (Em Planejamento)
- Migração para Baileys
- REST API com Express
- Frontend Vite
- ES Modules
- Mongoose ORM

### v1.0 (Atual)
- whatsapp-web.js
- Socket.io
- Create React App
- CommonJS
- MongoDB Driver Nativo

---

## 🎯 STATUS DO PROJETO

**Sistema Atual:** ✅ Funcionando  
**Migração:** 📋 Planejamento Completo  
**Próximo Passo:** 🔴 Executar Fase 0 (Research Baileys)

---

**Última Atualização:** 21/10/2025  
**Versão Documentação:** 2.0  
**Documentação:** ✅ Completa e Revisada

