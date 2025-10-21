/**
 * @file Serviços de conexão e operações com MongoDB
 * @description Gerencia conexão com MongoDB e operações nas tabelas de mensagens
 * @version 1.0.0
 */

import { MongoClient, ObjectId } from 'mongodb';
import { configuracoes } from '../config.js';

class MongoDBService {
    constructor() {
        this.client = null;
        this.db = null;
        this.connected = false;
        this.uri = configuracoes.mongoDB.uri;
    }

    /**
     * Conecta ao MongoDB com TLS básico
     * @async
     * @returns {Promise<boolean>} True se conectado com sucesso
     */
    async conectar() {
        try {
            if (this.connected) {
                console.log('[MongoDB] Já conectado');
                return true;
            }

            console.log('[MongoDB] Conectando com TLS básico...');
            
            // Configuração otimizada com TLS básico
            const options = {
                serverSelectionTimeoutMS: 10000,
                socketTimeoutMS: 10000,
                connectTimeoutMS: 10000,
                maxPoolSize: 5,
                retryWrites: true,
                maxIdleTimeMS: 30000,
                // TLS básico (padrão do MongoDB Atlas)
                tls: true
            };

            this.client = new MongoClient(this.uri, options);
            
            // Conectar com timeout manual
            const connectPromise = this.client.connect();
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Connection timeout')), 8000);
            });
            
            await Promise.race([connectPromise, timeoutPromise]);
            
            // Testar a conexão
            this.db = this.client.db();
            await this.db.admin().ping();
            
            this.connected = true;
            
            console.log('[MongoDB] ✅ CONECTADO com sucesso usando TLS básico');
            return true;
            
        } catch (error) {
            console.error('[MongoDB] ❌ Erro ao conectar:', error.message);
            
            // Limpar cliente após falha
            if (this.client) {
                try {
                    await this.client.close();
                } catch {
                    // Ignorar erros ao fechar
                }
                this.client = null;
            }
            this.connected = false;
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
                dataEnvio: new Date(),
                telefone: dados.telefone,
                nome: dados.nome,
                status: dados.status_mensagem || 'Enviada',
                id_mensagem: dados.id_mensagem,
                tentativasReenvio: 0,
                reenvioTentado: false,
                formatoAlternativoUsado: false,
                historicoReenvios: [],
                created_at: new Date(),
                updated_at: new Date()
            };

            // Usar a coleção unificada
            const resultado = await this.db.collection('tb_envio_validacoes').insertOne(documento);

            console.log('[MongoDB] Validação cadastro salva em tb_envio_validacoes:', resultado.insertedId);
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
                // Para tb_envio_validacoes (unificada) e outras coleções
                if (tabela === 'tb_envio_validacoes') {
                    // tb_envio_validacoes pode ter ambos os campos
                    filtro = { id_mensagem: id_mensagem };
                    atualizacao = {
                        $set: {
                            status_mensagem: novoStatus,
                            status: novoStatus, // também atualizar status para compatibilidade
                            updated_at: new Date()
                        }
                    };
                } else {
                    // Para outras coleções, usar status_mensagem
                    filtro = { id_mensagem: id_mensagem };
                    atualizacao = {
                        $set: {
                            status_mensagem: novoStatus,
                            updated_at: new Date()
                        }
                    };
                }

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
    /**
     * Busca dados em uma tabela com filtros
     * @async
     * @param {string} tabela - Nome da tabela
     * @param {...any} filtros - Pares de chave/valor para filtrar
     * @returns {Promise<Object|null>} Documento encontrado ou null
     */
    async buscaDados(tabela, ...filtros) {
        try {
            await this._garantirConexao();

            // Construir objeto de filtro a partir dos pares chave/valor
            const query = {};
            for (let i = 0; i < filtros.length; i += 2) {
                if (filtros[i] && filtros[i + 1] !== undefined) {
                    query[filtros[i]] = filtros[i + 1];
                }
            }

            const documento = await this.db.collection(tabela).findOne(query);
            return documento;
        } catch (error) {
            console.error(`[MongoDB] Erro ao buscar dados em ${tabela}:`, error);
            return null;
        }
    }

    /**
     * Busca todos os dados pendentes de uma tabela
     * @async
     * @param {string} tabela - Nome da tabela
     * @returns {Promise<Array>} Lista de documentos pendentes
     */
    async buscaTodosPendentes(tabela) {
        try {
            await this._garantirConexao();

            const documentos = await this.db.collection(tabela)
                .find({ status: { $ne: 'Enviada' } })
                .sort({ created_at: -1 })
                .toArray();

            return documentos;
        } catch (error) {
            console.error(`[MongoDB] Erro ao buscar pendentes em ${tabela}:`, error);
            return [];
        }
    }

    /**
     * Busca histórico de uma tabela
     * @async
     * @param {string} tabela - Nome da tabela
     * @param {number} limit - Limite de documentos
     * @param {number} offset - Offset para paginação
     * @returns {Promise<Array>} Lista de documentos
     */
    async buscarHistorico(tabela, limit = 100, offset = 0) {
        try {
            await this._garantirConexao();

            const documentos = await this.db.collection(tabela)
                .find({})
                .sort({ created_at: -1, _id: -1 })
                .skip(offset)
                .limit(limit)
                .toArray();

            return documentos;
        } catch (error) {
            console.error(`[MongoDB] Erro ao buscar histórico em ${tabela}:`, error);
            return [];
        }
    }

    /**
     * Lista validações de cadastro da coleção unificada tb_envio_validacoes
     * @async
     * @returns {Promise<Array>} Lista de validações de cadastro
     */
    async listarValidacoesCadastro() {
        try {
            await this._garantirConexao();

            const documentos = await this.db.collection('tb_envio_validacoes')
                .find({})
                .sort({ dataEnvio: -1, created_at: -1, _id: -1 }) // Ordenar por data de envio e depois por criação
                .toArray();

            console.log(`[MongoDB] Validações encontradas: ${documentos.length}`);
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

    /**
     * Busca validações que precisam de monitoramento
     */
    async buscarValidacoesPendentes() {
        try {
            await this._garantirConexao();

            const cincoMinutosAtras = new Date(Date.now() - 5 * 60 * 1000);
            
            const validacoes = await this.db.collection('tb_envio_validacoes').find({
                $and: [
                    { status: { $in: ['Enviada', 'enviada'] } },
                    { id_mensagem: { $exists: true, $ne: null } },
                    { dataEnvio: { $lt: cincoMinutosAtras } },
                    { reenvioTentado: { $ne: true } }
                ]
            }).toArray();

            console.log(`[MongoDB] Encontradas ${validacoes.length} validações pendentes de monitoramento`);
            return validacoes;
        } catch (error) {
            console.error('[MongoDB] Erro ao buscar validações pendentes:', error);
            return [];
        }
    }

    /**
     * Busca mensagens marcadas para reenvio
     */
    async buscarMensagensParaReenvio() {
        try {
            await this._garantirConexao();
            
            const mensagens = await this.db.collection('tb_envio_validacoes').find({
                $or: [
                    { precisaReenvio: true },
                    { possivelmenteNaoEntregue: true }
                ]
            }).toArray();

            console.log(`[MongoDB] Encontradas ${mensagens.length} mensagens marcadas para reenvio`);
            return mensagens;
        } catch (error) {
            console.error('[MongoDB] Erro ao buscar mensagens para reenvio:', error);
            return [];
        }
    }
}

// Instância singleton
const mongoService = new MongoDBService();

export default mongoService;
