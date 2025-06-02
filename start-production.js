#!/usr/bin/env node

/**
 * @file Script de inicialização em produção para o ChatBot WhatsApp
 * @description Inicia o sistema com logs estruturados, monitoramento e recuperação automática
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Classe para gerenciar a inicialização e monitoramento do bot
 */
class BotManager {
    constructor() {
        this.botProcess = null;
        this.restartCount = 0;
        this.maxRestarts = 5;
        this.logFile = path.join(__dirname, 'logs', 'bot-manager.log');
        this.isShuttingDown = false;
        
        // Cria diretório de logs se não existir
        this.criarDiretorioLogs();
        
        // Configura handlers de sinal
        this.configurarSignalHandlers();
    }

    /**
     * Cria o diretório de logs se não existir
     */
    criarDiretorioLogs() {
        const logsDir = path.dirname(this.logFile);
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
            this.log('INFO', 'Diretório de logs criado');
        }
    }

    /**
     * Configura handlers para sinais do sistema
     */
    configurarSignalHandlers() {
        process.on('SIGINT', () => this.shutdown('SIGINT'));
        process.on('SIGTERM', () => this.shutdown('SIGTERM'));
        process.on('uncaughtException', (error) => {
            this.log('ERROR', `Exceção não capturada: ${error.message}`);
            this.shutdown('UNCAUGHT_EXCEPTION');
        });
        process.on('unhandledRejection', (reason, promise) => {
            this.log('ERROR', `Promise rejeitada: ${reason}`);
        });
    }

    /**
     * Registra mensagem no log
     * @param {string} level - Nível do log (INFO, WARN, ERROR)
     * @param {string} message - Mensagem a ser registrada
     */
    log(level, message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level}] ${message}`;
        
        console.log(logMessage);
        
        try {
            fs.appendFileSync(this.logFile, logMessage + '\n');
        } catch (error) {
            console.error('Erro ao escrever no log:', error.message);
        }
    }

    /**
     * Inicia o processo do bot
     */
    iniciarBot() {
        if (this.isShuttingDown) {
            this.log('WARN', 'Sistema está sendo encerrado, não iniciando novo processo');
            return;
        }

        this.log('INFO', `Iniciando ChatBot WhatsApp (tentativa ${this.restartCount + 1})`);
        
        this.botProcess = spawn('node', ['centralResultadosZapBot.js'], {
            stdio: ['inherit', 'pipe', 'pipe'],
            cwd: __dirname
        });

        // Configura handlers do processo
        this.configurarProcessHandlers();
        
        this.log('INFO', `Bot iniciado com PID: ${this.botProcess.pid}`);
    }

    /**
     * Configura handlers para o processo do bot
     */
    configurarProcessHandlers() {
        // Redireciona stdout
        this.botProcess.stdout.on('data', (data) => {
            const output = data.toString().trim();
            if (output) {
                this.log('BOT', output);
            }
        });

        // Redireciona stderr
        this.botProcess.stderr.on('data', (data) => {
            const error = data.toString().trim();
            if (error) {
                this.log('BOT_ERROR', error);
            }
        });

        // Handler de encerramento
        this.botProcess.on('close', (code, signal) => {
            this.log('WARN', `Bot encerrado - Code: ${code}, Signal: ${signal}`);
            this.botProcess = null;
            
            if (!this.isShuttingDown) {
                this.tentarRestart();
            }
        });

        // Handler de erro
        this.botProcess.on('error', (error) => {
            this.log('ERROR', `Erro no processo do bot: ${error.message}`);
            this.tentarRestart();
        });
    }

    /**
     * Tenta reiniciar o bot automaticamente
     */
    tentarRestart() {
        if (this.isShuttingDown) {
            return;
        }

        this.restartCount++;
        
        if (this.restartCount > this.maxRestarts) {
            this.log('ERROR', `Máximo de ${this.maxRestarts} tentativas de restart atingido. Encerrando.`);
            process.exit(1);
        }

        const delay = Math.min(5000 * this.restartCount, 30000); // Delay progressivo até 30s
        this.log('INFO', `Reiniciando em ${delay/1000}s... (tentativa ${this.restartCount}/${this.maxRestarts})`);
        
        setTimeout(() => {
            this.iniciarBot();
        }, delay);
    }

    /**
     * Encerra o sistema graciosamente
     * @param {string} reason - Motivo do encerramento
     */
    shutdown(reason) {
        if (this.isShuttingDown) {
            return;
        }

        this.isShuttingDown = true;
        this.log('INFO', `Iniciando encerramento gracioso - Motivo: ${reason}`);

        if (this.botProcess) {
            this.log('INFO', 'Enviando SIGTERM para o bot...');
            this.botProcess.kill('SIGTERM');
            
            // Força encerramento após 10 segundos
            setTimeout(() => {
                if (this.botProcess) {
                    this.log('WARN', 'Forçando encerramento do bot...');
                    this.botProcess.kill('SIGKILL');
                }
                process.exit(0);
            }, 10000);
        } else {
            process.exit(0);
        }
    }

    /**
     * Exibe informações do sistema
     */
    exibirInfo() {
        console.log('🤖 ChatBot WhatsApp - Central dos Resultados');
        console.log('📅 Data:', new Date().toLocaleString('pt-BR'));
        console.log('📍 Diretório:', __dirname);
        console.log('📝 Log:', this.logFile);
        console.log('🔄 Max Restarts:', this.maxRestarts);
        console.log('─'.repeat(50));
    }

    /**
     * Inicia o sistema completo
     */
    iniciar() {
        this.exibirInfo();
        this.log('INFO', '=== INICIANDO SISTEMA CHATBOT ===');
        this.log('INFO', `Node.js: ${process.version}`);
        this.log('INFO', `Plataforma: ${process.platform}`);
        this.log('INFO', `PID Manager: ${process.pid}`);
        
        this.iniciarBot();
    }
}

// Executa se o script for chamado diretamente
if (require.main === module) {
    const manager = new BotManager();
    manager.iniciar();
}

module.exports = BotManager;
