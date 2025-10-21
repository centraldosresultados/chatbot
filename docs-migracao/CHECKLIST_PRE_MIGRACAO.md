# ✅ Checklist Pré-Migração

**Use este checklist ANTES de começar a Fase 0**

---

## 📋 1. DOCUMENTAÇÃO LIDA

### Essencial (1h)
- [ ] RESUMO_EXECUTIVO.md (10min)
- [ ] QUICK_START.md (5min)
- [ ] RESUMO_CORRECOES_APLICADAS.md (15min)
- [ ] README_MIGRACAO.md (20min)
- [ ] FASE_0_RESEARCH_BAILEYS.md (30min)

### Recomendado (2h)
- [ ] PLANO_MIGRACAO.md (45min)
- [ ] GUIA_EXECUCAO_MIGRACAO.md (1h)

### Opcional
- [ ] EXEMPLOS_CODIGO_MIGRACAO.md (consulta)
- [ ] DIAGRAMAS_ARQUITETURA.md (30min)
- [ ] REVISAO_CRITICA_PLANO.md (30min)

---

## 💻 2. AMBIENTE TÉCNICO

### Node.js
- [ ] Node.js 18+ instalado
- [ ] Verificar: `node --version`
- [ ] npm atualizado
- [ ] Verificar: `npm --version`

### Git
- [ ] Git instalado e configurado
- [ ] Verificar: `git --version`
- [ ] Git config user.name configurado
- [ ] Git config user.email configurado
- [ ] Acesso ao repositório remoto

### MySQL
- [ ] MySQL Server rodando
- [ ] Testar conexão: `mysql -u root -p`
- [ ] Banco `central_resultados_criadores` existe
- [ ] Usuário tem permissões necessárias
- [ ] Porta 3306 acessível (ou porta configurada)
- [ ] **Credenciais em mãos:**
  - [ ] MYSQL_HOST
  - [ ] MYSQL_USER
  - [ ] MYSQL_PASSWORD
  - [ ] MYSQL_DATABASE

### MongoDB
- [ ] MongoDB rodando (local ou cloud)
- [ ] Se local: Testar com `mongosh`
- [ ] Se cloud: URI pronto
- [ ] Banco `central-mensagens` acessível
- [ ] **Credencial em mãos:**
  - [ ] MONGODB_URI completo

### Firebase (se decidir manter)
- [ ] Projeto Firebase existe
- [ ] Console Firebase acessível
- [ ] **Todas credenciais em mãos:**
  - [ ] FIREBASE_API_KEY
  - [ ] FIREBASE_AUTH_DOMAIN
  - [ ] FIREBASE_DATABASE_URL
  - [ ] FIREBASE_PROJECT_ID
  - [ ] FIREBASE_STORAGE_BUCKET
  - [ ] FIREBASE_MESSAGING_SENDER_ID
  - [ ] FIREBASE_APP_ID
  - [ ] FIREBASE_MEASUREMENT_ID

---

## 💾 3. BACKUP

### Código
- [ ] Código atual commitado
- [ ] `git status` limpo
- [ ] Push para remoto feito
- [ ] Tag criada: `git tag v1.0-pre-migration`
- [ ] Tag enviada: `git push --tags`

### Banco MySQL
- [ ] Backup criado
- [ ] Comando usado:
  ```bash
  mysqldump -u USER -p central_resultados_criadores > backup_mysql_$(date +%Y%m%d).sql
  ```
- [ ] Arquivo backup verificado (tem conteúdo)
- [ ] Backup guardado em local seguro

### Banco MongoDB
- [ ] Backup criado
- [ ] Comando usado:
  ```bash
  mongodump --uri="MONGODB_URI" --out=backup_mongo_$(date +%Y%m%d)
  ```
- [ ] Diretório backup verificado (tem arquivos)
- [ ] Backup guardado em local seguro

### Firebase (se usar)
- [ ] Dados exportados do Realtime Database
- [ ] Backup guardado em local seguro

### Arquivos de Configuração
- [ ] .env atual copiado para .env.backup
- [ ] Configurações documentadas

---

## ⚙️ 4. CONFIGURAÇÃO

### Arquivo .env
- [ ] Copiado ENV_EXAMPLE.txt para .env
- [ ] Todas variáveis preenchidas:

**Server:**
- [ ] NODE_ENV (development)
- [ ] PORT (3101)

**MySQL:**
- [ ] MYSQL_HOST
- [ ] MYSQL_USER
- [ ] MYSQL_PASSWORD
- [ ] MYSQL_DATABASE
- [ ] MYSQL_PORT

**MongoDB:**
- [ ] MONGODB_URI

**Firebase (se manter):**
- [ ] FIREBASE_API_KEY
- [ ] FIREBASE_AUTH_DOMAIN
- [ ] FIREBASE_DATABASE_URL
- [ ] FIREBASE_PROJECT_ID
- [ ] FIREBASE_STORAGE_BUCKET
- [ ] FIREBASE_MESSAGING_SENDER_ID
- [ ] FIREBASE_APP_ID
- [ ] FIREBASE_MEASUREMENT_ID

**WhatsApp:**
- [ ] WA_AUTH_DIR (./auth_info_baileys)

**Admin:**
- [ ] ADMIN_NAME
- [ ] ADMIN_PHONE

**Contatos:**
- [ ] CONTACTS_CONFIRMATION (JSON)

**URLs:**
- [ ] IMAGES_BASE_URL
- [ ] API_BASE_URL
- [ ] LOGO_PATH

**CORS:**
- [ ] CORS_ORIGIN (* para dev)

**Logs:**
- [ ] LOG_LEVEL (info)
- [ ] LOG_FILE (logs/chatbot.log)

### Git Branch
- [ ] Branch criada: `git checkout -b migracao-baileys-v2`
- [ ] Branch verificada: `git branch`

---

## 🤔 5. DECISÕES TOMADAS

### Firebase
- [ ] **Decisão tomada:** Manter ou Migrar?
- [ ] Se manter: Credenciais prontas
- [ ] Se migrar: Plano de migração documentado

### Porta
- [ ] Porta 3101 disponível durante desenvolvimento
- [ ] Porta 3100 usada pelo sistema atual (OK)
- [ ] Plano para migrar 3101 → 3100 após validação

### Dados
- [ ] Entendido que schemas usam nomes atuais
- [ ] Entendido que collections usam nomes atuais (tb_*)
- [ ] Migração de dados planejada (se necessário)

---

## 📞 6. CONTATOS E ACESSOS

### Pessoas
- [ ] Time notificado sobre migração
- [ ] Contato de suporte técnico anotado
- [ ] Responsável por decisões definido

### Acessos
- [ ] Acesso ao servidor de produção (se necessário)
- [ ] Acesso ao console MySQL
- [ ] Acesso ao console MongoDB
- [ ] Acesso ao Firebase Console (se usar)
- [ ] Acesso ao GitHub/GitLab

---

## 🧪 7. AMBIENTE DE TESTE

### Sistema Atual Funcionando
- [ ] Sistema atual está rodando
- [ ] WhatsApp conectado
- [ ] Envio de mensagens funciona
- [ ] MySQL conectado
- [ ] MongoDB conectado
- [ ] Frontend acessível

### Ferramentas de Teste
- [ ] Postman ou Insomnia instalado (testar APIs)
- [ ] Browser DevTools funcionando
- [ ] Terminal/Console funcionando

---

## 📊 8. MÉTRICAS BASELINE

### Performance Atual (anotar para comparar depois)
- [ ] Tempo de build frontend: _____ segundos
- [ ] Tempo de startup backend: _____ segundos
- [ ] Uso de memória: _____ MB
- [ ] Tempo de envio de mensagem: _____ ms
- [ ] Taxa de sucesso de envio: _____% 

### Funcionalidades Críticas
- [ ] Conexão WhatsApp: ✅ Funciona
- [ ] Envio validação: ✅ Funciona
- [ ] Envio senha: ✅ Funciona
- [ ] Envio em lote: ✅ Funciona
- [ ] Monitoramento: ✅ Funciona
- [ ] Reenvio: ✅ Funciona
- [ ] Chat: ✅ Funciona

---

## ⏱️ 9. PLANEJAMENTO DE TEMPO

### Disponibilidade
- [ ] Tenho 6-8h disponíveis para Fase 0
- [ ] Posso dedicar 38-50h nas próximas semanas
- [ ] Tenho flexibilidade se atrasar
- [ ] Time está ciente do cronograma

### Deadline
- [ ] Prazo final definido (se houver): ___/___/____
- [ ] Prazo é realista (mínimo 1-2 semanas)
- [ ] Buffer para imprevistos considerado

---

## 🆘 10. PLANO B

### Se Algo Der Errado
- [ ] Sei como restaurar backup MySQL
  ```bash
  mysql -u USER -p central_resultados_criadores < backup_mysql.sql
  ```
- [ ] Sei como restaurar backup MongoDB
  ```bash
  mongorestore --uri="MONGODB_URI" backup_mongo/
  ```
- [ ] Sei como voltar para código anterior
  ```bash
  git checkout main
  git branch -D migracao-baileys-v2
  ```
- [ ] Tenho contato de suporte técnico

### Se Fase 0 Reprovar
- [ ] Entendo que posso parar sem ter perdido nada
- [ ] Sei avaliar alternativas (manter atual, outro lib)
- [ ] Documentarei problemas encontrados

---

## 🎯 11. OBJETIVOS CLAROS

### Entendo Que
- [ ] Fase 0 é apenas validação (6-8h)
- [ ] Posso parar após Fase 0 se não viável
- [ ] Sistema atual continua funcionando
- [ ] Migração completa leva 38-50h
- [ ] Testes em produção levam mais 2 semanas

### Espero Como Resultado
- [ ] Sistema 10-20x mais rápido
- [ ] Mais estável e confiável
- [ ] Mais fácil de manter
- [ ] Stack moderna

---

## ✅ 12. PRONTO PARA COMEÇAR?

### Checklist Final
- [ ] ✅ Toda documentação essencial lida
- [ ] ✅ Ambiente técnico preparado
- [ ] ✅ Backups completos feitos
- [ ] ✅ Arquivo .env configurado
- [ ] ✅ Git branch criada
- [ ] ✅ Todas decisões tomadas
- [ ] ✅ Contatos e acessos OK
- [ ] ✅ Métricas baseline anotadas
- [ ] ✅ Tempo disponível
- [ ] ✅ Plano B definido
- [ ] ✅ Objetivos claros

---

## 🚀 PRÓXIMA AÇÃO

**Se TODOS os itens acima estão ✅:**

```bash
# Você está pronto para Fase 0!
cd ~/baileys-test  # ou criar diretório
cat ~/chatbot/FASE_0_RESEARCH_BAILEYS.md

# Começar testes do Baileys
npm init -y
npm install @whiskeysockets/baileys qrcode
```

**Se ALGUM item está ⬜:**

1. Complete os itens pendentes
2. Volte aqui e marque como ✅
3. Só comece quando TUDO estiver ✅

---

## 📋 RESUMO DE ITENS CRÍTICOS

**Bloqueadores (NÃO comece sem estes):**
- [ ] Node.js 18+
- [ ] MySQL rodando + credenciais
- [ ] MongoDB rodando + URI
- [ ] Backup completo feito
- [ ] .env configurado
- [ ] Git branch criada
- [ ] Tempo disponível (6-8h para Fase 0)

**Importantes (complete antes de começar):**
- [ ] Documentação lida
- [ ] Decisão Firebase tomada
- [ ] Métricas baseline anotadas
- [ ] Plano B definido

**Opcionais (bom ter):**
- [ ] Ferramentas de teste
- [ ] Deadline definido
- [ ] Time notificado

---

## 📊 PROGRESSO

**Total de Itens:** ~80  
**Marcados:** _____ / 80  
**Percentual:** _____% 

**Status:**
- 0-30%: 🔴 Não está pronto
- 31-70%: 🟡 Parcialmente pronto
- 71-99%: 🟢 Quase pronto
- 100%: ✅ **PRONTO PARA COMEÇAR!**

---

**Criado em:** 21/10/2025  
**Versão:** 2.0  
**Use antes de:** Fase 0 - Research Baileys

