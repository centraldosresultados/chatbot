# Exemplos de Código - Migração ChatBot

Este documento contém exemplos práticos de código para implementar cada parte da migração.

---

## 📦 1. Package.json do Backend

```json
{
  "name": "central-resultados-chatbot-backend",
  "version": "2.0.0",
  "description": "Backend modernizado do ChatBot Central dos Resultados",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": ["whatsapp", "chatbot", "baileys"],
  "author": "Silverio",
  "license": "ISC",
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
```

---

## 🗄️ 2. Schemas Mongoose

### models/Validacao.js
```javascript
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
    id_mensagem: {
        type: String,
        default: null
    },
    dataEnvio: {
        type: Date,
        default: Date.now
    },
    dataUltimaAtualizacao: {
        type: Date,
        default: Date.now
    },
    reenvioTentado: {
        type: Boolean,
        default: false
    },
    precisaReenvio: {
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
```

### models/EnvioSenha.js
```javascript
import mongoose from 'mongoose';

const EnvioSenhaSchema = new mongoose.Schema({
    telefone: {
        type: String,
        required: true,
        index: true
    },
    nome_completo: {
        type: String,
        required: true
    },
    cpf: {
        type: String,
        required: false
    },
    usuario: {
        type: String,
        required: false
    },
    senha_provisoria: {
        type: String,
        required: false
    },
    status_mensagem: {
        type: String,
        enum: ['Enviada', 'Entregue', 'Lida', 'Erro'],
        default: 'Enviada'
    },
    id_mensagem: {
        type: String,
        default: null
    }
}, {
    collection: 'tb_envio_senhas',
    timestamps: { createdAt: 'dataEnvio' }
});

export const EnvioSenha = mongoose.model('EnvioSenha', EnvioSenhaSchema);
```

### models/Mensagem.js
```javascript
import mongoose from 'mongoose';

const MensagemSchema = new mongoose.Schema({
    id_lote: {
        type: String,
        required: true,
        index: true
    },
    mensagem: {
        type: String,
        required: true
    },
    criadores: [{
        codigo: Number,
        nome_completo: String,
        telefone: String,
        status_mensagem: String,
        id_mensagem: String
    }],
    totalEnviados: Number,
    sucessos: Number,
    erros: Number
}, {
    collection: 'tb_envio_mensagens',
    timestamps: { createdAt: 'dataEnvio' }
});

export const Mensagem = mongoose.model('Mensagem', MensagemSchema);
```

---

## 🚀 3. Servidor Express Principal

### server.js (Parte 1 - Configuração)
```javascript
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { makeWASocket, DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3100;

// Configuração MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/central-mensagens';

// Conectar ao MongoDB
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Conectado ao MongoDB com sucesso!');
    })
    .catch((error) => {
        console.error('❌ Erro ao conectar ao MongoDB:', error.message);
    });

// Configurar CORS
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://chatbot.centraldosresultados.com'] 
        : '*',
    credentials: true,
    optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Trust proxy para HTTPS em produção
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Estado da aplicação
let sock = null;
let qrCodeString = null;
let connectionStatus = 'disconnected'; // disconnected, connecting, connected
let connectedNumber = null;

// Diretório para salvar credenciais
const authDir = path.join(__dirname, 'auth_info_baileys');

// Garantir que o diretório existe
if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
}
```

### server.js (Parte 2 - Inicialização WhatsApp)
```javascript
// Função para verificar credenciais salvas
function hasStoredCredentials() {
    try {
        const credsPath = path.join(authDir, 'creds.json');
        if (fs.existsSync(credsPath)) {
            const credsContent = fs.readFileSync(credsPath, 'utf8');
            const creds = JSON.parse(credsContent);
            return !!(creds.noiseKey && creds.signedIdentityKey && creds.signedPreKey);
        }
        return false;
    } catch (error) {
        console.log('⚠️ Erro ao verificar credenciais:', error.message);
        return false;
    }
}

// Flag para reconexão
let isReconnecting = false;

// Função de reconexão automática
async function autoReconnect(attempt = 1, maxAttempts = 5) {
    if (isReconnecting) {
        console.log('🔄 Reconexão já em andamento');
        return;
    }

    if (attempt > maxAttempts) {
        console.log('❌ Máximo de tentativas de reconexão atingido');
        isReconnecting = false;
        return;
    }

    if (connectionStatus === 'connected') {
        console.log('✅ Já conectado ao WhatsApp');
        isReconnecting = false;
        return;
    }

    isReconnecting = true;
    console.log(`🔄 Tentativa de reconexão ${attempt}/${maxAttempts}...`);
    
    try {
        await initializeWhatsApp();
        
        await new Promise(resolve => setTimeout(resolve, 15000));
        
        if (connectionStatus === 'connected') {
            console.log('✅ Reconexão bem-sucedida!');
            isReconnecting = false;
            return;
        } else {
            const delay = Math.min(60000, 10000 * Math.pow(1.5, attempt - 1));
            console.log(`⏰ Próxima tentativa em ${Math.round(delay/1000)}s...`);
            isReconnecting = false;
            setTimeout(() => autoReconnect(attempt + 1, maxAttempts), delay);
        }
    } catch (error) {
        console.log(`❌ Erro na tentativa ${attempt}:`, error.message);
        const delay = Math.min(60000, 10000 * Math.pow(1.5, attempt - 1));
        console.log(`⏰ Próxima tentativa em ${Math.round(delay/1000)}s...`);
        isReconnecting = false;
        setTimeout(() => autoReconnect(attempt + 1, maxAttempts), delay);
    }
}

// Inicialização na startup
async function initializeAppOnStartup() {
    console.log('\n🚀 Inicializando aplicação...');
    
    try {
        if (hasStoredCredentials()) {
            console.log('🔑 Credenciais encontradas! Tentando reconexão...');
            setTimeout(() => {
                autoReconnect();
            }, 3000);
        } else {
            console.log('📱 Nenhuma credencial encontrada.');
            console.log('🔗 Use POST /api/connect para conectar');
        }
    } catch (error) {
        console.error('❌ Erro ao verificar credenciais:', error.message);
    }
}

// Função principal de inicialização do WhatsApp
async function initializeWhatsApp() {
    try {
        console.log('🔄 Inicializando WhatsApp...');
        connectionStatus = 'connecting';
        
        const { state, saveCreds } = await useMultiFileAuthState(authDir);
        
        sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            browser: ['ChatBot Central', 'Chrome', '1.0.0'],
            logger: {
                level: 'silent',
                child: () => ({
                    level: 'silent',
                    error: () => {},
                    warn: () => {},
                    info: () => {},
                    debug: () => {},
                    trace: () => {}
                }),
                error: () => {},
                warn: () => {},
                info: () => {},
                debug: () => {},
                trace: () => {}
            }
        });

        // Event: atualização de conexão
        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            console.log('📡 Status da conexão:', connection);
            
            if (qr) {
                qrCodeString = qr;
                console.log('📱 QR Code gerado');
            }
            
            if (connection === 'close') {
                connectionStatus = 'disconnected';
                qrCodeString = null;
                connectedNumber = null;
                
                const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('❌ Conexão fechada. Reconectar?', shouldReconnect);
                
                if (shouldReconnect) {
                    setTimeout(initializeWhatsApp, 5000);
                }
            } else if (connection === 'open') {
                connectionStatus = 'connected';
                qrCodeString = null;
                console.log('✅ WhatsApp conectado!');
                
                try {
                    const userInfo = sock.user;
                    if (userInfo && userInfo.id) {
                        connectedNumber = userInfo.id.replace(/:\d+@s\.whatsapp\.net$/, '');
                        console.log(`📱 Número conectado: ${connectedNumber}`);
                    }
                } catch (error) {
                    console.log('⚠️ Erro ao obter número:', error.message);
                }
            } else if (connection === 'connecting') {
                connectionStatus = 'connecting';
                console.log('🔄 Conectando...');
            }
        });

        // Event: atualização de credenciais
        sock.ev.on('creds.update', saveCreds);

        // Event: mensagens recebidas
        sock.ev.on('messages.upsert', async (m) => {
            try {
                const message = m.messages[0];
                
                if (message.message?.conversation || message.message?.extendedTextMessage) {
                    const text = message.message.conversation || message.message.extendedTextMessage.text;
                    const from = message.key.remoteJid;
                    
                    console.log(`📨 Mensagem de ${from}: ${text}`);
                    
                    // Aqui você pode adicionar lógica para processar mensagens
                    // Por exemplo, sistema de respostas automáticas
                }
                
            } catch (error) {
                console.error('❌ Erro ao processar mensagem:', error);
            }
        });

        return sock;
    } catch (error) {
        console.error('❌ Erro ao inicializar WhatsApp:', error);
        connectionStatus = 'disconnected';
        throw error;
    }
}
```

### server.js (Parte 3 - Rotas Principais)
```javascript
// Rota: Conectar WhatsApp
app.post('/api/connect', async (req, res) => {
    try {
        if (connectionStatus === 'connected') {
            return res.json({
                success: true,
                message: 'WhatsApp já está conectado',
                status: connectionStatus
            });
        }
        
        if (connectionStatus === 'connecting') {
            return res.json({
                success: true,
                message: 'Conexão em andamento',
                status: connectionStatus
            });
        }

        await initializeWhatsApp();
        
        res.json({
            success: true,
            message: 'Iniciando conexão WhatsApp',
            status: connectionStatus
        });
    } catch (error) {
        console.error('❌ Erro ao conectar:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao iniciar conexão'
        });
    }
});

// Rota: Obter QR Code
app.get('/api/qrcode', async (req, res) => {
    try {
        if (!qrCodeString) {
            return res.status(404).json({
                success: false,
                error: 'QR Code não disponível'
            });
        }

        const qrImage = await qrcode.toDataURL(qrCodeString);
        
        res.json({
            success: true,
            qrCode: qrImage
        });
    } catch (error) {
        console.error('❌ Erro ao gerar QR Code:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao gerar QR Code'
        });
    }
});

// Rota: Verificar status
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        status: connectionStatus,
        hasQRCode: !!qrCodeString
    });
});

// Rota: Obter número conectado
app.get('/api/connected-number', (req, res) => {
    if (connectionStatus === 'connected' && connectedNumber) {
        const formattedNumber = connectedNumber.replace(/(\d{2})(\d{2})(\d{4,5})(\d{4})/, '+$1 ($2) $3-$4');
        
        res.json({
            success: true,
            number: formattedNumber,
            raw_number: connectedNumber
        });
    } else {
        res.json({
            success: false,
            error: 'WhatsApp não conectado'
        });
    }
});

// Rota: Desconectar
app.post('/api/disconnect', async (req, res) => {
    try {
        if (sock) {
            await sock.logout();
            sock = null;
        }
        
        connectionStatus = 'disconnected';
        qrCodeString = null;
        connectedNumber = null;
        
        if (fs.existsSync(authDir)) {
            fs.rmSync(authDir, { recursive: true, force: true });
            fs.mkdirSync(authDir, { recursive: true });
        }
        
        res.json({
            success: true,
            message: 'Desconectado com sucesso'
        });
    } catch (error) {
        console.error('❌ Erro ao desconectar:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao desconectar'
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        timestamp: new Date().toISOString(),
        whatsapp: connectionStatus
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📋 API disponível em http://localhost:${PORT}/health`);
    
    // Inicializar reconexão automática
    initializeAppOnStartup().catch(error => {
        console.error('❌ Erro na inicialização:', error);
    });
});

export default app;
```

---

## 📤 4. Funções de Envio de Mensagens

### utils/whatsappHelpers.js
```javascript
/**
 * Valida e formata número de telefone brasileiro
 */
export function validarNumero(numero) {
    let numeroLimpo = numero.replace(/\D/g, '');
    
    // Remove código do país se presente
    if (numeroLimpo.startsWith('055') && numeroLimpo.length >= 13) {
        numeroLimpo = numeroLimpo.substring(3);
    } else if (numeroLimpo.startsWith('55') && numeroLimpo.length >= 12) {
        numeroLimpo = numeroLimpo.substring(2);
    }
    
    // Remove prefixo 0
    if (numeroLimpo.startsWith('0') && numeroLimpo.length > 11) {
        numeroLimpo = numeroLimpo.substring(1);
    }
    
    // Valida comprimento
    if (numeroLimpo.length < 10 || numeroLimpo.length > 11) {
        return { 
            erro: `Número inválido. Tem ${numeroLimpo.length} dígitos, deve ter 10 ou 11` 
        };
    }
    
    const DDD = numeroLimpo.substr(0, 2);
    const dddValido = parseInt(DDD);
    
    if (dddValido < 11 || dddValido > 99) {
        return { erro: 'DDD inválido' };
    }
    
    let numeroFormatado;
    
    if (numeroLimpo.length === 10) {
        const tel = numeroLimpo.substr(2);
        numeroFormatado = dddValido <= 30 ? DDD + "9" + tel : numeroLimpo;
    } else {
        numeroFormatado = numeroLimpo;
    }
    
    return { numero: numeroFormatado };
}

/**
 * Gera variações do número para fallback
 */
export function gerarVariacoesNumero(numeroOriginal) {
    const numeroLimpo = numeroOriginal.replace(/\D/g, '');
    const variacoes = [];
    
    variacoes.push(numeroLimpo);
    
    if (numeroLimpo.length === 11) {
        const DDD = numeroLimpo.substr(0, 2);
        const numeroSemDDD = numeroLimpo.substr(2);
        
        if (numeroSemDDD.length === 9) {
            const numeroSem9 = DDD + numeroSemDDD.substr(1);
            variacoes.push(numeroSem9);
        }
    }
    
    return [...new Set(variacoes)];
}

/**
 * Envia mensagem com retry
 */
export async function enviarMensagem(sock, destinatario, texto, tentativas = 3) {
    console.log(`📤 Enviando mensagem para ${destinatario}`);
    
    const resultadoValidacao = validarNumero(destinatario);
    if (resultadoValidacao.erro) {
        return { erro: resultadoValidacao.erro };
    }
    
    const numeroFormatado = resultadoValidacao.numero;
    const variacoesNumero = gerarVariacoesNumero(numeroFormatado);
    
    for (let i = 0; i < variacoesNumero.length; i++) {
        const numeroVariacao = variacoesNumero[i];
        const numeroCompleto = "55" + numeroVariacao + "@s.whatsapp.net";
        
        for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
            try {
                const resultado = await sock.sendMessage(numeroCompleto, {
                    text: texto
                });
                
                if (resultado && resultado.key && resultado.key.id) {
                    return {
                        sucesso: true,
                        id: resultado.key.id,
                        numero: numeroCompleto,
                        formatoUsado: numeroVariacao
                    };
                }
            } catch (error) {
                console.error(`Erro tentativa ${tentativa}:`, error.message);
                
                if (tentativa < tentativas) {
                    await new Promise(resolve => setTimeout(resolve, tentativa * 1000));
                }
            }
        }
    }
    
    return {
        erro: 'Falha ao enviar mensagem para todas as variações',
        variacoesTentadas: variacoesNumero
    };
}
```

---

## 📋 5. Rotas Específicas do Sistema

### routes/validacoes.js
```javascript
import express from 'express';
import { Validacao } from '../models/Validacao.js';
import { enviarMensagem } from '../utils/whatsappHelpers.js';

const router = express.Router();

// Enviar validação de cadastro
router.post('/send-validation', async (req, res) => {
    try {
        const { telefone, nome_completo } = req.body;
        
        if (!telefone || !nome_completo) {
            return res.status(400).json({
                success: false,
                error: 'Telefone e nome são obrigatórios'
            });
        }
        
        // Verificar se WhatsApp está conectado
        if (!req.app.get('whatsappSock')) {
            return res.status(400).json({
                success: false,
                error: 'WhatsApp não conectado'
            });
        }
        
        const sock = req.app.get('whatsappSock');
        
        // Montar mensagem
        const mensagem = `Olá ${nome_completo}!\\n\\nSeja bem-vindo à Central dos Resultados.\\n\\nSeu cadastro foi validado com sucesso!`;
        
        // Enviar mensagem
        const resultado = await enviarMensagem(sock, telefone, mensagem);
        
        if (resultado.erro) {
            // Salvar com erro
            const validacao = new Validacao({
                telefone,
                nome_completo,
                status_mensagem: 'Erro',
                id_mensagem: null
            });
            await validacao.save();
            
            return res.status(500).json({
                success: false,
                error: resultado.erro
            });
        }
        
        // Salvar no banco
        const validacao = new Validacao({
            telefone,
            nome_completo,
            status_mensagem: 'Enviada',
            id_mensagem: resultado.id
        });
        await validacao.save();
        
        res.json({
            success: true,
            message: 'Validação enviada com sucesso',
            id: resultado.id,
            dbId: validacao._id
        });
        
    } catch (error) {
        console.error('❌ Erro ao enviar validação:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao enviar validação'
        });
    }
});

// Listar validações
router.get('/list', async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        
        const validacoes = await Validacao.find()
            .sort({ dataEnvio: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        
        const total = await Validacao.countDocuments();
        
        res.json({
            success: true,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            total_pages: Math.ceil(total / limit),
            validacoes
        });
    } catch (error) {
        console.error('❌ Erro ao listar validações:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao listar validações'
        });
    }
});

export default router;
```

---

## 💻 6. Frontend com Vite

### package.json (Frontend)
```json
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
```

### vite.config.js
```javascript
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
```

### src/config.js
```javascript
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://api.chatbot.centraldosresultados.com'
  : 'http://localhost:3100';

export { API_BASE_URL };
```

### src/services/api.js
```javascript
import { API_BASE_URL } from '../config.js';

class ApiService {
    // Conexão WhatsApp
    async connect() {
        const response = await fetch(`${API_BASE_URL}/api/connect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        return response.json();
    }

    async getQRCode() {
        const response = await fetch(`${API_BASE_URL}/api/qrcode`);
        return response.json();
    }

    async getStatus() {
        const response = await fetch(`${API_BASE_URL}/api/status`);
        return response.json();
    }

    async disconnect() {
        const response = await fetch(`${API_BASE_URL}/api/disconnect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        return response.json();
    }

    // Mensagens
    async sendMessage(numero, mensagem) {
        const response = await fetch(`${API_BASE_URL}/api/send-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ numero, mensagem })
        });
        return response.json();
    }

    async sendValidation(telefone, nome_completo) {
        const response = await fetch(`${API_BASE_URL}/api/validations/send-validation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telefone, nome_completo })
        });
        return response.json();
    }

    // Histórico
    async getValidationsList(page = 1, limit = 50) {
        const response = await fetch(
            `${API_BASE_URL}/api/validations/list?page=${page}&limit=${limit}`
        );
        return response.json();
    }
}

export const api = new ApiService();
```

### src/components/ConexaoWhatsApp.jsx
```javascript
import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';

function ConexaoWhatsApp() {
    const [status, setStatus] = useState('disconnected');
    const [qrCode, setQrCode] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Verificar status ao montar
    useEffect(() => {
        checkStatus();
    }, []);

    // Polling quando conectando
    useEffect(() => {
        let interval;
        if (status === 'connecting') {
            interval = setInterval(checkStatus, 2000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [status]);

    const checkStatus = async () => {
        try {
            const data = await api.getStatus();
            if (data.success) {
                setStatus(data.status);
                if (data.hasQRCode && data.status === 'connecting') {
                    await fetchQRCode();
                } else if (data.status === 'connected') {
                    setQrCode(null);
                }
            }
        } catch (error) {
            console.error('Erro ao verificar status:', error);
            setError('Erro ao conectar com servidor');
        }
    };

    const fetchQRCode = async () => {
        try {
            const data = await api.getQRCode();
            if (data.success) {
                setQrCode(data.qrCode);
            }
        } catch (error) {
            console.error('Erro ao buscar QR Code:', error);
        }
    };

    const handleConnect = async () => {
        setLoading(true);
        setError(null);
        setQrCode(null);
        
        try {
            const data = await api.connect();
            if (data.success) {
                setStatus(data.status);
                setTimeout(checkStatus, 2000);
            } else {
                setError(data.error || 'Erro ao conectar');
            }
        } catch (error) {
            setError('Erro ao conectar com servidor');
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const data = await api.disconnect();
            if (data.success) {
                setStatus('disconnected');
                setQrCode(null);
            } else {
                setError(data.error || 'Erro ao desconectar');
            }
        } catch (error) {
            setError('Erro ao desconectar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="conexao-whatsapp">
            <h2>Conexão WhatsApp</h2>
            
            <div className={`status ${status}`}>
                {status === 'disconnected' && '🔴 Desconectado'}
                {status === 'connecting' && '🟡 Conectando...'}
                {status === 'connected' && '🟢 Conectado'}
            </div>

            {error && (
                <div className="error-message">
                    ❌ {error}
                </div>
            )}

            <div className="buttons">
                {status === 'disconnected' && (
                    <button onClick={handleConnect} disabled={loading}>
                        {loading ? 'Conectando...' : 'Conectar WhatsApp'}
                    </button>
                )}
                
                {status === 'connected' && (
                    <button onClick={handleDisconnect} disabled={loading}>
                        {loading ? 'Desconectando...' : 'Desconectar'}
                    </button>
                )}
                
                {status === 'connecting' && (
                    <button onClick={checkStatus} disabled={loading}>
                        Atualizar Status
                    </button>
                )}
            </div>

            {qrCode && status === 'connecting' && (
                <div className="qr-container">
                    <h3>📱 Escaneie o QR Code</h3>
                    <img src={qrCode} alt="QR Code WhatsApp" />
                    <p>Abra o WhatsApp e escaneie este código</p>
                </div>
            )}
        </div>
    );
}

export default ConexaoWhatsApp;
```

---

## 🔄 7. Componente de Envio de Validação

### src/components/EnviarValidacao.jsx
```javascript
import React, { useState } from 'react';
import { api } from '../services/api.js';

function EnviarValidacao() {
    const [telefone, setTelefone] = useState('');
    const [nome_completo, setNomeCompleto] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!telefone || !nome_completo) {
            setError('Telefone e nome são obrigatórios');
            return;
        }
        
        setLoading(true);
        setError('');
        setSuccess('');
        
        try {
            const result = await api.sendValidation(telefone, nome_completo);
            
            if (result.success) {
                setSuccess(`Validação enviada com sucesso para ${nome_completo}`);
                setTelefone('');
                setNomeCompleto('');
            } else {
                setError(result.error || 'Erro ao enviar validação');
            }
        } catch (error) {
            setError('Erro ao enviar validação');
        } finally {
            setLoading(false);
        }
    };

    const formatPhone = (value) => {
        const numbers = value.replace(/\D/g, '');
        
        if (numbers.length <= 2) {
            return numbers;
        } else if (numbers.length <= 6) {
            return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
        } else if (numbers.length <= 10) {
            return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
        } else {
            return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
        }
    };

    return (
        <div className="enviar-validacao">
            <h2>📝 Enviar Validação de Cadastro</h2>
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="nome">Nome Completo:</label>
                    <input
                        type="text"
                        id="nome"
                        value={nome_completo}
                        onChange={(e) => setNomeCompleto(e.target.value)}
                        placeholder="João da Silva"
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="telefone">Telefone:</label>
                    <input
                        type="text"
                        id="telefone"
                        value={telefone}
                        onChange={(e) => setTelefone(formatPhone(e.target.value))}
                        placeholder="(11) 99999-9999"
                        maxLength={15}
                    />
                </div>
                
                <button type="submit" disabled={loading}>
                    {loading ? 'Enviando...' : 'Enviar Validação'}
                </button>
            </form>
            
            {success && (
                <div className="success-message">
                    ✅ {success}
                </div>
            )}
            
            {error && (
                <div className="error-message">
                    ❌ {error}
                </div>
            )}
        </div>
    );
}

export default EnviarValidacao;
```

---

## 📊 8. Script de Migração de Dados

### scripts/migrarDados.js
```javascript
import mongoose from 'mongoose';
import { Validacao } from '../models/Validacao.js';
import { EnvioSenha } from '../models/EnvioSenha.js';
import { Mensagem } from '../models/Mensagem.js';

const MONGODB_URI = 'mongodb://localhost:27017/central-mensagens';

async function migrarDados() {
    try {
        console.log('🔄 Conectando ao MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado!');

        // Verificar collections existentes
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📋 Collections encontradas:', collections.map(c => c.name));

        // Migrar validações se necessário
        const validacoesAnteriores = await mongoose.connection.db
            .collection('tb_envio_validacoes')
            .find({})
            .toArray();

        console.log(`📊 Encontradas ${validacoesAnteriores.length} validações para migrar`);

        // Verificar se os campos estão corretos
        for (const v of validacoesAnteriores) {
            if (v.nome && !v.nome_completo) {
                await mongoose.connection.db
                    .collection('tb_envio_validacoes')
                    .updateOne(
                        { _id: v._id },
                        { 
                            $set: { nome_completo: v.nome },
                            $unset: { nome: '' }
                        }
                    );
            }
        }

        console.log('✅ Migração concluída!');

    } catch (error) {
        console.error('❌ Erro na migração:', error);
    } finally {
        await mongoose.disconnect();
    }
}

migrarDados();
```

---

**Documentação atualizada em:** 21 de Outubro de 2025

