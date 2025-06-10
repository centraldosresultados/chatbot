/**
 * @file Serviços de conexão e operações com MongoDB
 * @description Gerencia conexão com MongoDB e operações nas tabelas de mensagens
 * @version 1.0.0
 */

const { MongoClient, ObjectId } = require('mongodb');
const { configuracoes } = require('../config');

class MongoDBService {
    constructor() {
        this.client = null;
        this.db = null;
        this.connected = false;
        this.uri = configuracoes.mongoDB.uri;
        
        // URIs alternativas para fallback
        this.urisAlternativas = [
            // URI básica sem parâmetros SSL/TLS
            'mongodb+srv://silveriosepulveda:g7SbMKPby7roGi7P@cluster0.dcuqscr.mongodb.net/central-mensagens?retryWrites=true&w=majority',
            // URI com TLS desabilitado explicitamente
            'mongodb+srv://silveriosepulveda:g7SbMKPby7roGi7P@cluster0.dcuqscr.mongodb.net/central-mensagens?retryWrites=true&w=majority&tls=false',
            // URI original do config
            configuracoes.mongoDB.uri,
            // URI com SSL legacy desabilitado
            'mongodb+srv://silveriosepulveda:g7SbMKPby7roGi7P@cluster0.dcuqscr.mongodb.net/central-mensagens?retryWrites=true&w=majority&ssl=false'
        ];
    }


    /**
     * Conecta ao MongoDB
     * @async
     * @returns {Promise<boolean>} True se conectado com sucesso
     */
    async conectar() {
        // Configurações em ordem de preferência (da mais permissiva para funcionar)
        const configuracoes = [
            // Configuração 1: Sem TLS (mais compatível)
            {
                nome: 'Sem TLS',
                options: {
                    tls: false,
                    ssl: false,
                    serverSelectionTimeoutMS: 15000,
                    socketTimeoutMS: 15000,
                    connectTimeoutMS: 15000,
                    maxPoolSize: 5,
                    retryWrites: true
                }
            },
            // Configuração 2: TLS básico
            {
                nome: 'TLS Básico',
                options: {
                    serverSelectionTimeoutMS: 15000,
                    socketTimeoutMS: 15000,
                    connectTimeoutMS: 15000,
                    maxPoolSize: 5,
                    retryWrites: true
                }
            },
            // Configuração 3: TLS com certificados inválidos permitidos
            {
                nome: 'TLS Permissivo',
                options: {
                    tls: true,
                    tlsAllowInvalidCertificates: true,
                    tlsAllowInvalidHostnames: true,
                    tlsInsecure: true,
                    serverSelectionTimeoutMS: 15000,
                    socketTimeoutMS: 15000,
                    connectTimeoutMS: 15000,
                    maxPoolSize: 5,
                    retryWrites: true
                }
            }
        ];

        try {
            if (this.connected) {
                console.log('[MongoDB] Já conectado');
                return true;
            }

            for (const config of configuracoes) {
                // Tentar cada URI com cada configuração
                for (const uri of this.urisAlternativas) {
                    try {
                        console.log(`[MongoDB] Tentando ${config.nome} com URI: ${uri.substring(0, 50)}...`);
                        
                        // Limpar qualquer conexão anterior
                        if (this.client) {
                            try {
                                await this.client.close();
                            } catch (e) {
                                // Ignorar erro ao fechar
                            }
                            this.client = null;
                        }
                        
                        this.client = new MongoClient(uri, config.options);
                        
                        // Timeout manual para evitar travamentos
                        const connectPromise = this.client.connect();
                        const timeoutPromise = new Promise((_, reject) => {
                            setTimeout(() => reject(new Error('Connection timeout')), 10000);
                        });
                        
                        await Promise.race([connectPromise, timeoutPromise]);
                        
                        // Testar a conexão
                        this.db = this.client.db();
                        await this.db.admin().ping();
                        
                        this.connected = true;
                        
                        console.log(`[MongoDB] ✅ CONECTADO com sucesso usando: ${config.nome}`);
                        return true;
                        
                    } catch (error) {
                        console.log(`[MongoDB] ❌ Falha ${config.nome}:`, error.message.substring(0, 100));
                        
                        // Limpar cliente após falha
                        if (this.client) {
                            try {
                                await this.client.close();
                            } catch (closeError) {
                                // Ignorar erros ao fechar
                            }
                            this.client = null;
                        }
                        this.connected = false;
                        this.db = null;
                        
                        // Continuar para próxima URI
                        continue;
                    }
                }
            }
            
            // Se chegou aqui, todas as tentativas falharam
            console.error('[MongoDB] ❌ TODAS as configurações falharam');
            throw new Error('Não foi possível conectar ao MongoDB com nenhuma configuração');
            
        } catch (error) {
            console.error('[MongoDB] Erro final ao conectar:', error.message);
            this.connected = false;
            this.client = null;
            this.db = null;
            return false;
        }
    }

    /**
     * Desconecta do MongoDB
     * @async
     */
    async desconectar() {
        try {
            if (this.client) {
                await this.client.close();
                this.client = null;
                this.db = null;
                this.connected = false;
                console.log('[MongoDB] Desconectado');
            }
        } catch (error) {
            console.error('[MongoDB] Erro ao desconectar:', error);
        }
    }

    /**
     * Garante que está conectado antes de executar operações
     * @async
     * @private
     */
    async _garantirConexao() {
        if (!this.connected) {
            await this.conectar();
        }
    }

    /**
     * Salva validação de cadastro na tabela tb_envio_validacoes
     * @async
     * @param {Object} dados
     * @param {string} dados.telefone
     * @param {string} dados.nome
     * @param {string} dados.status_mensagem
     * @param {string} dados.id_mensagem - ID da mensagem para controle de status
     * @returns {Promise<Object>} Resultado da operação
     */
    async salvarValidacaoCadastro(dados) {
        try {
            await this._garantirConexao();

            const documento = {
                data: new Date(),
                telefone: dados.telefone,
                nome: dados.nome,
                status_mensagem: dados.status_mensagem || 'Enviada',
                id_mensagem: dados.id_mensagem,
                created_at: new Date(),
                updated_at: new Date()
            };

            const resultado = await this.db.collection('tb_envio_validacoes').insertOne(documento);

            console.log('[MongoDB] Validação cadastro salva:', resultado.insertedId);
            return { sucesso: true, id: resultado.insertedId };
        } catch (error) {
            console.error('[MongoDB] Erro ao salvar validação cadastro:', error);
            return { erro: error.message };
        }
    }

    /**
     * Salva envio de senha na tabela tb_envio_senhas
     * @async
     * @param {Object} dados
     * @param {string} dados.telefone
     * @param {string} dados.nome
     * @param {string} dados.status_mensagem
     * @param {string} dados.id_mensagem - ID da mensagem para controle de status
     * @returns {Promise<Object>} Resultado da operação
     */
    async salvarEnvioSenha(dados) {
        try {
            await this._garantirConexao();

            const documento = {
                data: new Date(),
                telefone: dados.telefone,
                nome: dados.nome,
                status_mensagem: dados.status_mensagem || 'Enviada',
                id_mensagem: dados.id_mensagem,
                created_at: new Date(),
                updated_at: new Date()
            };

            const resultado = await this.db.collection('tb_envio_senhas').insertOne(documento);

            console.log('[MongoDB] Envio senha salvo:', resultado.insertedId);
            return { sucesso: true, id: resultado.insertedId };
        } catch (error) {
            console.error('[MongoDB] Erro ao salvar envio senha:', error);
            return { erro: error.message };
        }
    }

    /**
     * Salva mensagem para todos na tabela tb_envio_mensagens
     * @async
     * @param {Object} dados
     * @param {string} dados.mensagem
     * @param {Array} dados.criadores - Array de criadores destinatários
     * @param {string} dados.id_lote - ID do lote para controle
     * @returns {Promise<Object>} Resultado da operação
     */
    async salvarMensagemParaTodos(dados) {
        try {
            await this._garantirConexao();

            const documento = {
                data: new Date(),
                mensagem: dados.mensagem,
                id_lote: dados.id_lote,
                criadores: dados.criadores.map(criador => ({
                    codigo_criador: criador.codigo_criador || criador.codigo,
                    nome: criador.nome,
                    telefone: criador.telefone,
                    status_cadastro: criador.status_cadastro || 'N/A',
                    status_mensagem: criador.status_mensagem || 'Enviada',
                    id_mensagem: criador.id_mensagem, // Cada criador tem seu próprio ID
                    data_envio: new Date(),
                    resultado_envio: criador.resultado_envio || null
                })),
                total_destinatarios: dados.criadores.length,
                created_at: new Date(),
                updated_at: new Date()
            };

            const resultado = await this.db.collection('tb_envio_mensagens').insertOne(documento);

            console.log('[MongoDB] Mensagem para todos salva:', {
                documento_id: resultado.insertedId,
                id_lote: dados.id_lote,
                total_criadores: dados.criadores.length
            });

            return { sucesso: true, id: resultado.insertedId };
        } catch (error) {
            console.error('[MongoDB] Erro ao salvar mensagem para todos:', error);
            return { erro: error.message };
        }
    }

    /**
     * Atualiza status de mensagem em qualquer tabela
     * @async
     * @param {string} tabela - Nome da tabela (tb_envio_validacoes, tb_envio_senhas, tb_envio_mensagens)
     * @param {string} id_mensagem - ID da mensagem
     * @param {string} novoStatus - Novo status (Enviada, Entregue, Lida)
     * @returns {Promise<Object>} Resultado da operação
     */
    /**
     * Atualiza status de mensagem em qualquer tabela
     * @async
     * @param {string} tabela - Nome da tabela (tb_envio_validacoes, tb_envio_senhas, tb_envio_mensagens)
     * @param {string} id_mensagem - ID da mensagem
     * @param {string} novoStatus - Novo status (Enviada, Entregue, Lida)
     * @returns {Promise<Object>} Resultado da operação
     */
    async atualizarStatusMensagem(tabela, id_mensagem, novoStatus) {
        try {
            await this._garantirConexao();

            let filtro, atualizacao, resultado;

            if (tabela === 'tb_envio_mensagens') {
                // Para mensagens em massa, precisamos atualizar TODOS os elementos do array que tenham o id_mensagem
                // Usando arrayFilters para atualizar múltiplos elementos
                filtro = { 'criadores.id_mensagem': id_mensagem };
                atualizacao = {
                    $set: {
                        'criadores.$[elem].status_mensagem': novoStatus,
                        'criadores.$[elem].data_status_atualizado': new Date(),
                        updated_at: new Date()
                    }
                };

                const opcoes = {
                    arrayFilters: [{ 'elem.id_mensagem': id_mensagem }]
                };

                resultado = await this.db.collection(tabela).updateMany(filtro, atualizacao, opcoes);

                // Se não encontrou com id_mensagem individual, tentar com id_mensagem do documento (compatibilidade)
                if (resultado.matchedCount === 0) {
                    filtro = { id_mensagem: id_mensagem };
                    atualizacao = {
                        $set: {
                            'criadores.$[].status_mensagem': novoStatus,
                            'criadores.$[].data_status_atualizado': new Date(),
                            updated_at: new Date()
                        }
                    };

                    resultado = await this.db.collection(tabela).updateMany(filtro, atualizacao);
                    console.log(`[MongoDB] Tentativa fallback em ${tabela} (id_mensagem no documento):`, {
                        id_mensagem,
                        matchedCount: resultado.matchedCount,
                        modifiedCount: resultado.modifiedCount
                    });
                }

                console.log(`[MongoDB] Tentativa de atualização em ${tabela}:`, {
                    id_mensagem,
                    matchedCount: resultado.matchedCount,
                    modifiedCount: resultado.modifiedCount
                });

            } else {
                // Para validações e senhas, atualiza diretamente
                filtro = { id_mensagem: id_mensagem };
                atualizacao = {
                    $set: {
                        status_mensagem: novoStatus,
                        updated_at: new Date()
                    }
                };

                resultado = await this.db.collection(tabela).updateOne(filtro, atualizacao);
            }

            if (resultado.matchedCount > 0) {
                console.log(`[MongoDB] Status atualizado em ${tabela}: ${id_mensagem} -> ${novoStatus} (${resultado.modifiedCount} modificados)`);
                return { sucesso: true, modificados: resultado.modifiedCount };
            } else {
                console.log(`[MongoDB] Nenhum documento encontrado para atualização em ${tabela}: ${id_mensagem}`);
                return { erro: 'Documento não encontrado' };
            }
        } catch (error) {
            console.error(`[MongoDB] Erro ao atualizar status em ${tabela}:`, error);
            return { erro: error.message };
        }
    }

    /**
     * Lista validações de cadastro em ordem decrescente
     * @async
     * @returns {Promise<Array>} Lista de validações
     */
    async listarValidacoesCadastro() {
        try {
            await this._garantirConexao();

            const documentos = await this.db.collection('tb_envio_validacoes')
                .find({})
                .sort({ data: -1 })
                .toArray();

            return documentos;
        } catch (error) {
            console.error('[MongoDB] Erro ao listar validações:', error);
            return [];
        }
    }

    /**
     * Lista envios de senhas em ordem decrescente
     * @async
     * @returns {Promise<Array>} Lista de envios de senhas
     */
    async listarEnviosSenhas() {
        try {
            await this._garantirConexao();

            const documentos = await this.db.collection('tb_envio_senhas')
                .find({})
                .sort({ data: -1 })
                .toArray();

            return documentos;
        } catch (error) {
            console.error('[MongoDB] Erro ao listar envios de senhas:', error);
            return [];
        }
    }

    /**
     * Lista mensagens enviadas para todos em ordem decrescente
     * @async
     * @returns {Promise<Array>} Lista de mensagens enviadas
     */
    async listarMensagensEnviadas() {
        try {
            await this._garantirConexao();

            const documentos = await this.db.collection('tb_envio_mensagens')
                .find({})
                .sort({ data: -1 })
                .toArray();

            return documentos;
        } catch (error) {
            console.error('[MongoDB] Erro ao listar mensagens enviadas:', error);
            return [];
        }
    }

    /**
     * Busca uma mensagem específica por ID
     * @async
     * @param {string} id - ID do documento
     * @returns {Promise<Object|null>} Documento encontrado ou null
     */
    async buscarMensagemPorId(id) {
        try {
            await this._garantirConexao();

            const documento = await this.db.collection('tb_envio_mensagens')
                .findOne({ _id: new ObjectId(id) });

            if (documento && documento.criadores) {
                // Formatar dados dos destinatários para o frontend
                documento.destinatarios = documento.criadores.map(criador => ({
                    codigo: criador.codigo_criador || criador.codigo,
                    nome: criador.nome,
                    telefone: criador.telefone,
                    status_cadastro: criador.status_cadastro || 'N/A',
                    status_mensagem: criador.status_mensagem || 'Enviada',
                    data_envio: criador.data_envio,
                    data_status_atualizado: criador.data_status_atualizado,
                    id_mensagem: criador.id_mensagem
                }));
            }

            return documento;
        } catch (error) {
            console.error('[MongoDB] Erro ao buscar mensagem por ID:', error);
            return null;
        }
    }
}

// Instância singleton
const mongoService = new MongoDBService();

module.exports = mongoService;
