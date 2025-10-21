# Guia de Execução da Migração - Passo a Passo

Este guia fornece instruções detalhadas e práticas para executar a migração do chatbot.

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter:

- [ ] Node.js versão 18 ou superior instalado
- [ ] MongoDB rodando (local ou na nuvem)
- [ ] Acesso ao servidor de produção (se aplicável)
- [ ] Backup completo do sistema atual
- [ ] Git configurado e repositório atualizado

### Verificar Versões

```bash
node --version  # Deve ser >= 18.x
npm --version   # Deve ser >= 9.x
```

---

## 🎯 Fase 1: Preparação (30 minutos)

### 1.1 Backup do Sistema Atual

```bash
# 1. Fazer backup dos arquivos
cd /Users/silverio/Dev/Web/centralresultados/chatbot
tar -czf backup-chatbot-$(date +%Y%m%d-%H%M%S).tar.gz back/ front/

# 2. Backup do MongoDB
mongodump --uri="mongodb://localhost:27017/central-mensagens" --out=./backup-mongodb-$(date +%Y%m%d-%H%M%S)

# 3. Criar branch de migração no Git
git checkout -b migracao-baileys-express
git add .
git commit -m "Backup antes da migração"
```

### 1.2 Criar Estrutura de Diretórios

```bash
# Navegar para o diretório do projeto
cd /Users/silverio/Dev/Web/centralresultados/chatbot

# Criar nova estrutura de backend
mkdir -p back-novo/{models,routes,controllers,utils}
mkdir -p back-novo/auth_info_baileys

# Criar nova estrutura de frontend
mkdir -p front-novo/src/{components,services,styles}
mkdir -p front-novo/public
```

---

## 🔧 Fase 2: Backend - Configuração Inicial (1-2 horas)

### 2.1 Criar package.json do Backend

```bash
cd back-novo

cat > package.json << 'EOF'
{
  "name": "central-resultados-chatbot-backend",
  "version": "2.0.0",
  "description": "Backend modernizado do ChatBot Central dos Resultados",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "@whiskeysockets/baileys": "^6.6.0",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "mongoose": "^8.18.2",
    "node-fetch": "^3.3.2",
    "qrcode": "^1.5.3"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
EOF

# Instalar dependências
npm install
```

### 2.2 Criar Configuração

```bash
cat > config.js << 'EOF'
export const config = {
    port: process.env.PORT || 3100,
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/central-mensagens'
    },
    whatsapp: {
        authDir: './auth_info_baileys',
        reconnectAttempts: 5
    },
    admin: {
        phone: process.env.ADMIN_PHONE || '5511999999999'
    },
    cors: {
        origin: process.env.NODE_ENV === 'production' 
            ? 'https://chatbot.centraldosresultados.com'
            : '*'
    }
};
EOF
```

### 2.3 Criar Modelos Mongoose

```bash
# Modelo de Validação
cat > models/Validacao.js << 'EOF'
import mongoose from 'mongoose';

const ValidacaoSchema = new mongoose.Schema({
    telefone: {
        type: String,
        required: true,
        index: true
    },
    nome_completo: {
        type: String,
        required: true
    },
    status_mensagem: {
        type: String,
        enum: ['Enviada', 'Entregue', 'Lida', 'Erro', 'Pendente'],
        default: 'Pendente'
    },
    id_mensagem: String,
    reenvioTentado: {
        type: Boolean,
        default: false
    },
    historicoReenvios: [{
        data: Date,
        numeroOriginal: String,
        numeroAlternativo: String,
        novoIdMensagem: String,
        motivo: String
    }]
}, {
    collection: 'tb_envio_validacoes',
    timestamps: { 
        createdAt: 'dataEnvio', 
        updatedAt: 'dataUltimaAtualizacao' 
    }
});

export const Validacao = mongoose.model('Validacao', ValidacaoSchema);
EOF

# Repetir para EnvioSenha.js e Mensagem.js
# (use os exemplos do EXEMPLOS_CODIGO_MIGRACAO.md)
```

### 2.4 Criar Servidor Básico

```bash
# Copiar o código do server.js do EXEMPLOS_CODIGO_MIGRACAO.md
# Arquivo: back-novo/server.js
```

### 2.5 Testar Servidor

```bash
# Iniciar servidor em modo desenvolvimento
npm run dev

# Em outro terminal, testar
curl http://localhost:3100/health

# Deve retornar: {"status":"OK","timestamp":"...","whatsapp":"disconnected"}
```

---

## 🌐 Fase 3: Frontend - Migração para Vite (2-3 horas)

### 3.1 Criar Projeto Vite

```bash
cd /Users/silverio/Dev/Web/centralresultados/chatbot/front-novo

cat > package.json << 'EOF'
{
  "name": "central-resultados-chatbot-frontend",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0"
  }
}
EOF

npm install
```

### 3.2 Configurar Vite

```bash
cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3100',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'build',
    sourcemap: true
  }
});
EOF
```

### 3.3 Criar Estrutura Base

```bash
# index.html
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ChatBot Central dos Resultados</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

# main.jsx
mkdir -p src
cat > src/main.jsx << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/App.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF
```

### 3.4 Migrar Componentes

```bash
# 1. Criar serviço de API
# src/services/api.js (use o exemplo do EXEMPLOS_CODIGO_MIGRACAO.md)

# 2. Migrar componentes um por um
# Começar com os mais simples:
# - ConexaoWhatsApp
# - EnviarValidacao
# - ListaValidacoes
# etc.
```

### 3.5 Migrar Estilos

```bash
# Copiar estilos do projeto antigo
cp ../front/src/App.css src/styles/App.css

# Ajustar imports no App.jsx para usar './styles/App.css'
```

### 3.6 Testar Frontend

```bash
# Iniciar frontend em modo desenvolvimento
npm run dev

# Acessar http://localhost:3000
# Testar conexão com backend
```

---

## 🔄 Fase 4: Migração de Funcionalidades (4-6 horas)

### 4.1 Migrar Sistema de Validações

#### Backend
```bash
# Criar rota de validações
# back-novo/routes/validacoes.js
```

#### Frontend
```bash
# Criar componente
# front-novo/src/components/EnviarValidacao.jsx
# front-novo/src/components/ListaValidacoes.jsx
```

#### Testar
```bash
# 1. Conectar WhatsApp
# 2. Enviar validação de teste
# 3. Verificar se aparece na lista
# 4. Verificar no MongoDB se foi salvo
```

### 4.2 Migrar Sistema de Senhas

```bash
# Repetir processo similar às validações:
# 1. Criar rota back-novo/routes/senhas.js
# 2. Criar componente front-novo/src/components/EnviarSenha.jsx
# 3. Testar envio
```

### 4.3 Migrar Envio em Massa

```bash
# 1. Criar rota de criadores
# 2. Criar rota de envio em massa
# 3. Migrar componente de seleção de criadores
# 4. Testar com 2-3 criadores primeiro
```

### 4.4 Migrar Chat em Tempo Real

**Opção A: Polling (Mais Simples)**

```javascript
// Frontend - useEffect no componente Chat
useEffect(() => {
    const interval = setInterval(async () => {
        const conversas = await api.getConversas();
        setConversas(conversas);
    }, 3000);
    
    return () => clearInterval(interval);
}, []);
```

**Opção B: WebSocket Híbrido**

```bash
# Manter Socket.io apenas para o chat
# REST API para o resto

# Backend
npm install socket.io

# Frontend  
npm install socket.io-client
```

---

## 🧪 Fase 5: Testes (2-3 horas)

### 5.1 Checklist de Testes Funcionais

```bash
# Criar arquivo de testes
cat > TESTES.md << 'EOF'
# Checklist de Testes

## Conexão WhatsApp
- [ ] Conectar com QR Code
- [ ] Reconexão automática funciona
- [ ] Desconectar funciona
- [ ] Status é exibido corretamente

## Validações
- [ ] Enviar validação com número de 10 dígitos
- [ ] Enviar validação com número de 11 dígitos
- [ ] Validação aparece na lista
- [ ] Status atualiza no banco
- [ ] Reenvio automático funciona

## Senhas
- [ ] Enviar senha provisória
- [ ] Campos obrigatórios validam
- [ ] Aparece na lista de envios

## Mensagens em Massa
- [ ] Listar criadores
- [ ] Selecionar múltiplos criadores
- [ ] Enviar mensagem
- [ ] Acompanhar progresso
- [ ] Ver resultado (sucessos/erros)

## Chat
- [ ] Listar conversas
- [ ] Ver mensagens de conversa
- [ ] Enviar mensagem individual
- [ ] Mensagens recebidas aparecem

## Geral
- [ ] Login funciona
- [ ] Logout funciona
- [ ] Navegação entre páginas
- [ ] Responsividade mobile
- [ ] Performance aceitável
EOF
```

### 5.2 Executar Testes

```bash
# Para cada item do checklist:
# 1. Executar ação
# 2. Verificar resultado visual
# 3. Verificar logs do backend
# 4. Verificar no MongoDB
# 5. Marcar como [ ] ou [x]
```

### 5.3 Teste de Carga

```bash
# Testar envio para 10 números
# Verificar:
# - Tempo de resposta
# - Uso de memória
# - Logs de erro
# - Taxa de sucesso
```

---

## 🚀 Fase 6: Deploy em Produção (2-3 horas)

### 6.1 Preparar Ambiente de Produção

```bash
# 1. Criar arquivo .env para produção
cat > back-novo/.env.production << 'EOF'
NODE_ENV=production
PORT=3100
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/central-mensagens
ADMIN_PHONE=5511999999999
CORS_ORIGIN=https://chatbot.centraldosresultados.com
EOF

# 2. Build do frontend
cd front-novo
npm run build

# Isso cria a pasta 'build' com arquivos otimizados
```

### 6.2 Configurar Servidor

```bash
# SSH no servidor
ssh user@servidor-producao

# Criar diretórios
mkdir -p /var/www/chatbot-novo/{backend,frontend}

# Upload dos arquivos
# Backend
scp -r back-novo/* user@servidor:/var/www/chatbot-novo/backend/

# Frontend
scp -r front-novo/build/* user@servidor:/var/www/chatbot-novo/frontend/
```

### 6.3 Configurar PM2 (Backend)

```bash
# No servidor
cd /var/www/chatbot-novo/backend

# Instalar dependências
npm install --production

# Criar arquivo PM2
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'chatbot-backend',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3100
    }
  }]
};
EOF

# Iniciar com PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 6.4 Configurar Nginx

```bash
# Criar configuração Nginx
sudo nano /etc/nginx/sites-available/chatbot

# Conteúdo:
server {
    listen 80;
    server_name chatbot.centraldosresultados.com;

    # Frontend
    location / {
        root /var/www/chatbot-novo/frontend;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Ativar site
sudo ln -s /etc/nginx/sites-available/chatbot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6.5 Configurar SSL (Let's Encrypt)

```bash
# Instalar certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d chatbot.centraldosresultados.com

# Renovação automática já é configurada
```

### 6.6 Testar Produção

```bash
# 1. Acessar https://chatbot.centraldosresultados.com
# 2. Fazer login
# 3. Conectar WhatsApp
# 4. Enviar mensagem de teste
# 5. Verificar logs
pm2 logs chatbot-backend
```

---

## 🔄 Fase 7: Transição e Rollback (Contingência)

### 7.1 Manter Sistema Antigo em Paralelo

```bash
# Não desativar o sistema antigo imediatamente
# Manter rodando em porta diferente (ex: 3101)
# Por 48-72 horas para validar novo sistema
```

### 7.2 Plano de Rollback

**Se houver problemas críticos:**

```bash
# 1. Parar novo sistema
pm2 stop chatbot-backend

# 2. Restaurar configuração Nginx antiga
sudo ln -sf /etc/nginx/sites-available/chatbot-old /etc/nginx/sites-enabled/chatbot
sudo systemctl reload nginx

# 3. Reiniciar sistema antigo
pm2 restart chatbot-old

# 4. Verificar funcionamento
curl https://chatbot.centraldosresultados.com/health
```

### 7.3 Monitoramento Pós-Deploy

```bash
# Monitorar por 48 horas:

# 1. Logs do PM2
pm2 logs chatbot-backend --lines 100

# 2. Status do processo
pm2 status

# 3. Uso de recursos
pm2 monit

# 4. Logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 5. MongoDB
# Verificar se dados estão sendo salvos corretamente
```

---

## 📊 Métricas de Sucesso

Após 48 horas em produção, verificar:

- [ ] Taxa de sucesso de envio de mensagens > 95%
- [ ] Tempo de resposta da API < 500ms
- [ ] Zero crashes ou reinícios não programados
- [ ] Reconexão automática funcionando
- [ ] Todas as funcionalidades operacionais
- [ ] Feedback positivo dos usuários
- [ ] Uso de memória estável (< 500MB)
- [ ] CPU em média < 20%

---

## 🛠️ Comandos Úteis Durante a Migração

### Desenvolvimento

```bash
# Backend
cd back-novo
npm run dev              # Iniciar em modo desenvolvimento
npm start               # Iniciar em modo produção

# Frontend
cd front-novo
npm run dev             # Iniciar desenvolvimento
npm run build           # Build produção
npm run preview         # Preview do build

# Ambos simultaneamente (em terminais separados)
# Terminal 1: cd back-novo && npm run dev
# Terminal 2: cd front-novo && npm run dev
```

### Produção

```bash
# PM2
pm2 list                # Listar processos
pm2 logs               # Ver logs
pm2 restart all        # Reiniciar todos
pm2 stop all           # Parar todos
pm2 delete all         # Remover todos
pm2 monit             # Monitor em tempo real

# Nginx
sudo nginx -t          # Testar configuração
sudo systemctl reload nginx   # Recarregar
sudo systemctl restart nginx  # Reiniciar
sudo systemctl status nginx   # Status

# MongoDB
mongosh                # Conectar ao MongoDB
show dbs              # Listar bancos
use central-mensagens # Usar banco
show collections      # Listar collections
db.tb_envio_validacoes.find().limit(5)  # Ver documentos
```

### Debug

```bash
# Ver uso de porta
lsof -i :3100
netstat -tulpn | grep 3100

# Ver processos Node
ps aux | grep node

# Ver logs do sistema
sudo journalctl -u nginx -f
```

---

## 📞 Suporte Durante a Migração

### Problemas Comuns e Soluções

#### 1. Erro de conexão MongoDB

```bash
# Verificar se MongoDB está rodando
sudo systemctl status mongod

# Testar conexão
mongosh "mongodb://localhost:27017/central-mensagens"

# Verificar credenciais no .env
```

#### 2. CORS Error no Frontend

```javascript
// Verificar configuração CORS no backend
// server.js
const corsOptions = {
    origin: '*', // Durante desenvolvimento
    credentials: true
};
```

#### 3. WhatsApp não conecta

```bash
# Limpar credenciais antigas
rm -rf back-novo/auth_info_baileys/*

# Reiniciar servidor
pm2 restart chatbot-backend

# Gerar novo QR Code
```

#### 4. Build do Vite falha

```bash
# Limpar cache
rm -rf node_modules
rm package-lock.json
npm install

# Tentar build novamente
npm run build
```

---

## ✅ Checklist Final

Antes de considerar a migração completa:

### Backend
- [ ] Servidor rodando estável
- [ ] MongoDB conectado
- [ ] WhatsApp reconectando automaticamente
- [ ] Todas as rotas funcionando
- [ ] Logs sem erros críticos
- [ ] PM2 configurado e rodando

### Frontend
- [ ] Build sem erros
- [ ] Todas as páginas carregam
- [ ] Navegação funciona
- [ ] Formulários validam
- [ ] Listagens exibem dados
- [ ] Estilos aplicados corretamente

### Integração
- [ ] Frontend conecta com backend
- [ ] Dados salvam no MongoDB
- [ ] Mensagens são enviadas
- [ ] Status atualiza em tempo real
- [ ] Notificações funcionam

### Produção
- [ ] SSL configurado
- [ ] Nginx funcionando
- [ ] DNS apontando corretamente
- [ ] Backup realizado
- [ ] Rollback testado
- [ ] Monitoramento ativo

---

**Duração Total Estimada:** 24-34 horas

**Data de Criação:** 21 de Outubro de 2025

**Próximos Passos:** Aguardar aprovação para iniciar Fase 1

