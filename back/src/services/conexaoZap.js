/**
 * @file Serviço de conexão WhatsApp usando Baileys 7.0 (ES Module)
 * @description Gerencia conexão, envio e recebimento de mensagens via Baileys
 * @version 2.0.0 - Migrado de whatsapp-web.js para Baileys
 */

import { makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, downloadMediaMessage } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Imports diretos agora que tudo é ES Module
import { pegaIdContatoConfirmacao, configuracoes, contatosConfirmacao } from '../config.js';

// Logger configurado
const logger = pino({ level: 'silent' });

/**
 * @namespace conexaoBot
 * @description Objeto principal para gerenciar a conexão e as interações com o WhatsApp via Baileys.
 */
const conexaoBot = {
    /** @type {Object | undefined} sock - Instância do socket Baileys. */
    sock: undefined,
    
    /** @type {string | null} qrCodeData - Dados do QR Code atual. */
    qrCodeData: null,
    
    /** @type {string} connectionStatus - Status da conexão (disconnected, connecting, connected). */
    connectionStatus: 'disconnected',
    
    /** @type {string | null} connectedNumber - Número conectado. */
    connectedNumber: null,
    
    /** @type {Object} state - Estado de autenticação. */
    state: null,
    
    /** @type {Function} saveCreds - Função para salvar credenciais. */
    saveCreds: null,

    /** @type {Object} info - Informações do usuário conectado (similar ao client.info do whatsapp-web.js). */
    info: null,

    /**
     * @async
     * @memberof conexaoBot
     * @function pegaClientBot
     * @description Obtém ou inicializa a instância do socket Baileys.
     * @returns {Promise<Object>} Promessa que resolve com a instância do socket.
     */
    async pegaClientBot() {
        if (this.sock == undefined) {
            await this.initializeWhatsApp();
        }
        return this.sock;
    },

    /**
     * @async
     * @memberof conexaoBot
     * @function initializeWhatsApp
     * @description Inicializa a conexão com o WhatsApp usando Baileys.
     * @param {string} authPath - Caminho para armazenar credenciais (padrão: './auth_info_baileys').
     * @returns {Promise<Object>} Promessa que resolve com o socket criado.
     */
    async initializeWhatsApp(authPath = './auth_info_baileys') {
        try {
            console.log('[Baileys] Inicializando conexão WhatsApp...');
            this.connectionStatus = 'connecting';
            
            // Carregar ou criar estado de autenticação
            const { state, saveCreds } = await useMultiFileAuthState(authPath);
            this.state = state;
            this.saveCreds = saveCreds;
            
            // Buscar a versão mais recente do Baileys
            const { version, isLatest } = await fetchLatestBaileysVersion();
            console.log(`[Baileys] Usando v${version.join('.')}, isLatest: ${isLatest}`);
            
            // Criar conexão com o WhatsApp
            this.sock = makeWASocket({
                version,
                logger,
                printQRInTerminal: false,
                auth: state,
                browser: ['Central dos Resultados Bot', 'Chrome', '1.0.0'],
                getMessage: async (key) => {
                    return { conversation: '' };
                }
            });
            
            // Configurar eventos
            this.setupEventListeners();
            
            return this.sock;
        } catch (error) {
            console.error('[Baileys] Erro ao inicializar:', error);
            this.connectionStatus = 'disconnected';
            throw error;
        }
    },

    /**
     * @memberof conexaoBot
     * @function setupEventListeners
     * @description Configura os event listeners do Baileys.
     */
    setupEventListeners() {
        // Evento: atualização de conexão
        this.sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            // QR Code gerado
            if (qr) {
                this.qrCodeData = qr;
                console.log('[Baileys] 📱 QR Code gerado e disponível via API');
                
                // Também exibir no terminal
                console.log('\n📱 QR CODE:\n');
                qrcodeTerminal.generate(qr, { small: true });
                console.log('\n');
            }
            
            // Status da conexão
            if (connection === 'close') {
                this.connectionStatus = 'disconnected';
                this.qrCodeData = null;
                this.connectedNumber = null;
                this.info = null;
                
                const shouldReconnect = (lastDisconnect?.error instanceof Boom)
                    ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                    : true;
                
                console.log('[Baileys] ❌ Conexão fechada. Motivo:', lastDisconnect?.error?.message);
                
                if (shouldReconnect) {
                    console.log('[Baileys] ⏳ Reconectando em 5 segundos...\n');
                    setTimeout(() => this.initializeWhatsApp(), 5000);
                } else {
                    console.log('[Baileys] 🔐 Deslogado. Precisa gerar novo QR Code.\n');
                }
            } else if (connection === 'open') {
                this.connectionStatus = 'connected';
                this.qrCodeData = null;
                this.connectedNumber = this.sock.user.id.split(':')[0];
                
                // Criar objeto info similar ao whatsapp-web.js para compatibilidade
                this.info = {
                    me: {
                        user: this.connectedNumber,
                        _serialized: this.sock.user.id
                    },
                    pushname: this.sock.user.name || 'Bot',
                    platform: 'baileys',
                    wid: this.sock.user.id
                };
                
                console.log('[Baileys] ✅ Conectado ao WhatsApp com sucesso!');
                console.log('[Baileys] 📱 Número:', this.connectedNumber);
                console.log('[Baileys] 👤 Nome:', this.sock.user.name || 'Não definido');
                console.log('\n[Baileys] 🤖 Bot está pronto!\n');
                
                // Iniciar sistema de verificação periódica de reenvios
                try {
                    this.iniciarVerificacaoPeriodicaReenvios();
                } catch (error) {
                    console.error('[Baileys] Erro ao iniciar verificação periódica de reenvios:', error);
                }
            } else if (connection === 'connecting') {
                this.connectionStatus = 'connecting';
                console.log('[Baileys] 🔄 Conectando ao WhatsApp...');
            }
        });
        
        // Evento: salvar credenciais quando atualizadas
        this.sock.ev.on('creds.update', this.saveCreds);
        
            // Evento: mensagens recebidas
            this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
                const msg = messages[0];
                
                if (!msg.message) return;
                
                console.log('[Baileys] 📨 Mensagem recebida');
                
                // Emitir evento para ser capturado pelo express.js (para cache de conversas)
                if (global.onMessageReceived && typeof global.onMessageReceived === 'function') {
                    global.onMessageReceived(msg);
                }
                
                // Processar mensagem (similar ao evento 'message' do whatsapp-web.js)
                if (!msg.key.fromMe) {
                    await this.recebeMensagem(msg);
                }
            });
        
        // Evento: atualizações de status de mensagens
        this.sock.ev.on('messages.update', async (updates) => {
            for (const update of updates) {
                const messageId = update.key.id;
                
                // Mapear status do Baileys para formato esperado
                let statusAtualizado = {
                    enviado: false,
                    lida: false
                };
                
                if (update.update.status) {
                    // Status: 0 = erro, 1 = pending, 2 = server ack, 3 = delivery ack, 4 = read
                    const status = update.update.status;
                    statusAtualizado.enviado = status >= 2;
                    statusAtualizado.lida = status >= 4;
                    
                    // Atualizar no sistema de status
                    statusMensagens.setMensagem(messageId, statusAtualizado);
                    
                    console.log(`[Baileys] 📊 Status atualizado para ${messageId}: enviado=${statusAtualizado.enviado}, lida=${statusAtualizado.lida}`);
                }
            }
        });
    },

    /**
     * @async
     * @memberof conexaoBot
     * @function verificarConectividade
     * @description Verifica se o WhatsApp está realmente conectado e pronto para envio.
     * @returns {Promise<boolean>} True se conectado, false caso contrário.
     */
    async verificarConectividade() {
        try {
            if (!this.sock || !this.info) {
                return false;
            }

            // Verificar se o socket está aberto
            return this.connectionStatus === 'connected' && this.sock.user !== undefined;
        } catch (error) {
            console.error('[Baileys] verificarConectividade: Erro ao verificar estado:', error);
            return false;
        }
    },

    /**
     * @async
     * @memberof conexaoBot
     * @function enviarMensagem
     * @description Envia uma mensagem de texto e/ou imagem para um destinatário com retry automático e validações robustas.
     * @param {string} destinatario - Número do destinatário (ex: DDDXXXXXXXXX).
     * @param {string} [texto] - Texto da mensagem.
     * @param {string} [imagem] - URL da imagem a ser enviada.
     * @param {number} [tentativas=3] - Número máximo de tentativas de envio.
     * @returns {Promise<object>} Promessa que resolve com um objeto indicando sucesso ou erro.
     */
    async enviarMensagem(destinatario, texto, imagem, tentativas = 3) {
        console.log(`[Baileys] enviarMensagem: Iniciando envio para ${destinatario}`);

        // Validação do número
        const resultadoValidacao = this.validarNumero(destinatario);
        if (resultadoValidacao.erro) {
            console.error(`[Baileys] enviarMensagem: ${resultadoValidacao.erro}`);
            return { erro: resultadoValidacao.erro };
        }

        const numeroFormatado = resultadoValidacao.numero;

        // Verificação de conectividade
        const conectado = await this.verificarConectividade();
        if (!conectado) {
            console.error("[Baileys] enviarMensagem: WhatsApp não está conectado ou pronto para envio!");
            return { erro: "WhatsApp não conectado ou não está pronto para envio!" };
        }

        // Validação do conteúdo
        const temTexto = typeof texto === 'string' && texto.trim() !== '';
        const temImagem = imagem && typeof imagem === 'string' && imagem.trim() !== '';

        if (!temTexto && !temImagem) {
            console.error('[Baileys] enviarMensagem: Nada para enviar (sem texto ou imagem).');
            return { erro: 'Nada para enviar (sem texto ou imagem válidos).' };
        }

        // Carregamento da imagem se necessário
        let imagemBuffer;
        if (temImagem) {
            try {
                console.log(`[Baileys] enviarMensagem: Baixando imagem: ${imagem}`);
                const response = await axios.get(imagem, { responseType: 'arraybuffer' });
                imagemBuffer = Buffer.from(response.data, 'binary');
            } catch (error) {
                console.error('[Baileys] enviarMensagem: Erro ao baixar imagem:', error);
                return { erro: 'Erro ao carregar imagem para envio.', detalhes: error.message };
            }
        }

        // Gera variações do número para fallback
        const variacoesNumero = this.gerarVariacoesNumero(numeroFormatado);
        console.log(`[Baileys] enviarMensagem: Variações do número geradas:`, variacoesNumero);

        // Tenta enviar para cada variação do número
        for (let i = 0; i < variacoesNumero.length; i++) {
            const numeroVariacao = variacoesNumero[i];
            // Formato Baileys: 55DDDNNNNNNNNN@s.whatsapp.net
            const numeroCompleto = "55" + numeroVariacao + "@s.whatsapp.net";

            console.log(`[Baileys] enviarMensagem: Tentando formato ${i + 1}/${variacoesNumero.length}: ${numeroVariacao}`);

            // Tentativas de envio com retry para esta variação
            for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
                console.log(`[Baileys] enviarMensagem: Tentativa ${tentativa}/${tentativas} para formato ${numeroVariacao}`);

                const resultado = await this.tentarEnvioNumero(numeroCompleto, texto, imagem, imagemBuffer, temTexto, temImagem);

                if (resultado.sucesso) {
                    console.log(`[Baileys] enviarMensagem: Mensagem enviada com sucesso para formato ${numeroVariacao}. ID: ${resultado.id}`);

                    return {
                        sucesso: "Mensagem enviada com sucesso",
                        id: resultado.id,
                        numero: numeroCompleto,
                        formatoUsado: numeroVariacao,
                        tentativa: tentativa,
                        variacaoUtilizada: i + 1
                    };
                } else {
                    console.error(`[Baileys] enviarMensagem: Erro na tentativa ${tentativa} para formato ${numeroVariacao}:`, resultado.erro);

                    // Se não é a última tentativa para esta variação, aguarda antes de tentar novamente
                    if (tentativa < tentativas) {
                        const delay = tentativa * 1000;
                        console.log(`[Baileys] enviarMensagem: Aguardando ${delay}ms antes da próxima tentativa...`);
                        await new Promise(resolve => setTimeout(resolve, delay));

                        // Re-verifica conectividade antes da próxima tentativa
                        const conectadoRetry = await this.verificarConectividade();
                        if (!conectadoRetry) {
                            console.error('[Baileys] enviarMensagem: Perdeu conectividade durante retry');
                            return { erro: 'Conexão perdida durante tentativas de envio', detalhes: resultado.erro };
                        }
                    }
                }
            }

            console.warn(`[Baileys] enviarMensagem: Todas as tentativas falharam para formato ${numeroVariacao}`);

            // Pausa entre variações de formato
            if (i < variacoesNumero.length - 1) {
                console.log(`[Baileys] enviarMensagem: Aguardando 2s antes de tentar próximo formato...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        console.error(`[Baileys] enviarMensagem: Falha ao enviar mensagem para todas as variações do número ${destinatario}`);
        
        return {
            erro: 'Falha ao enviar mensagem para todas as variações do número',
            detalhes: `Tentativas: ${variacoesNumero.join(', ')}`,
            variacoesTentadas: variacoesNumero
        };
    },

    /**
     * @async
     * @memberof conexaoBot
     * @function tentarEnvioNumero
     * @description Realiza uma única tentativa de envio para um número específico.
     */
    async tentarEnvioNumero(numeroCompleto, texto, imagemUrl, imagemBuffer, temTexto, temImagem) {
        try {
            let resultado;
            
            // Enviar imagem com legenda ou apenas texto
            if (temImagem && temTexto) {
                console.log(`[Baileys] Enviando imagem com texto para ${numeroCompleto}`);
                resultado = await this.sock.sendMessage(numeroCompleto, {
                    image: imagemBuffer,
                    caption: texto
                });
            } else if (temImagem) {
                console.log(`[Baileys] Enviando apenas imagem para ${numeroCompleto}`);
                resultado = await this.sock.sendMessage(numeroCompleto, {
                    image: imagemBuffer
                });
            } else if (temTexto) {
                console.log(`[Baileys] Enviando apenas texto para ${numeroCompleto}`);
                resultado = await this.sock.sendMessage(numeroCompleto, {
                    text: texto
                });
            }
            
            // Validar resultado
            if (resultado && resultado.key && resultado.key.id) {
                const messageId = resultado.key.id;
                
                // Inicializar status da mensagem
                statusMensagens.setMensagem(messageId, {
                    enviado: false,
                    lida: false,
                    timestamp: Date.now()
                });
                
                return {
                    sucesso: true,
                    id: messageId,
                    key: resultado.key
                };
            } else {
                return {
                    sucesso: false,
                    erro: 'Resultado de envio inválido'
                };
            }
        } catch (error) {
            console.error(`[Baileys] Erro ao tentar enviar para ${numeroCompleto}:`, error.message);
            return {
                sucesso: false,
                erro: error.message,
                detalhes: error
            };
        }
    },

    /**
     * Validações e utilitários
     */
    gerarVariacoesNumero(numeroOriginal) {
        const numeroLimpo = numeroOriginal.replace(/\D/g, '');
        const variacoes = [];

        // Número original já validado
        variacoes.push(numeroLimpo);

        if (numeroLimpo.length === 11) {
            const DDD = numeroLimpo.substr(0, 2);
            const numeroSemDDD = numeroLimpo.substr(2);

            // Se tem 9 dígitos após DDD, remove o primeiro dígito (geralmente o 9)
            if (numeroSemDDD.length === 9) {
                const numeroSem9 = DDD + numeroSemDDD.substr(1);
                variacoes.push(numeroSem9);
            }
        } else if (numeroLimpo.length === 10) {
            const DDD = numeroLimpo.substr(0, 2);
            const numeroSemDDD = numeroLimpo.substr(2);

            // Adiciona o 9 na frente para celular
            if (numeroSemDDD.length === 8) {
                const numeroCom9 = DDD + '9' + numeroSemDDD;
                variacoes.push(numeroCom9);
            }
        }

        return variacoes;
    },

    validarNumero(numero) {
        if (!numero || typeof numero !== 'string') {
            return { erro: 'Número inválido: vazio ou não é string' };
        }

        // Remove tudo que não é dígito
        const numeroLimpo = numero.replace(/\D/g, '');

        // Remove código do país (55) se presente
        let numeroSemPais = numeroLimpo;
        if (numeroLimpo.startsWith('55') && numeroLimpo.length >= 12) {
            numeroSemPais = numeroLimpo.substring(2);
        }

        // Validar tamanho (deve ter 10 ou 11 dígitos: DDD + número)
        if (numeroSemPais.length < 10 || numeroSemPais.length > 11) {
            return {
                erro: `Número inválido: deve ter 10 ou 11 dígitos (com DDD). Recebido: ${numeroSemPais.length} dígitos`
            };
        }

        // Validar DDD (deve ser entre 11 e 99)
        const dddValido = parseInt(numeroSemPais.substr(0, 2), 10);
        if (dddValido < 11 || dddValido > 99) {
            return { erro: `DDD inválido: ${dddValido}. Deve estar entre 11 e 99` };
        }

        return { numero: numeroSemPais };
    },

    async recebeMensagem(mensagem) {
        // Implementação simplificada
        console.log('[Baileys] Mensagem recebida processada');
    },

    iniciarVerificacaoPeriodicaReenvios() {
        console.log('[Baileys] Verificação periódica de reenvios desabilitada');
    },

    /**
     * Propriedade compatível com whatsapp-web.js
     */
    get clientBot() {
        return this.sock;
    },

    set clientBot(value) {
        this.sock = value;
    }
};

/**
 * @namespace statusMensagens
 * @description Gerenciamento de status de mensagens enviadas.
 */
const statusMensagens = {
    mensagens: {},

    setMensagem(id, mensagem) {
        if (!this.mensagens[id]) {
            this.mensagens[id] = {};
        }
        Object.assign(this.mensagens[id], mensagem);
    },

    getMensagem(id) {
        if (this.mensagens[id] == undefined) {
            this.mensagens[id] = {
                enviado: false,
                lida: false,
            };
        }
        return this.mensagens[id];
    },

    delMensagem(id) {
        if (this.mensagens[id]) {
            delete this.mensagens[id];
        }
    },

    limparAntigos() {
        const agora = Date.now();
        const umahora = 60 * 60 * 1000;
        
        for (const id in this.mensagens) {
            const msg = this.mensagens[id];
            if (msg.timestamp && (agora - msg.timestamp > umahora)) {
                delete this.mensagens[id];
            }
        }
    }
};

// Limpar mensagens antigas a cada 30 minutos
setInterval(() => {
    statusMensagens.limparAntigos();
}, 1800000);

export { conexaoBot, statusMensagens };

