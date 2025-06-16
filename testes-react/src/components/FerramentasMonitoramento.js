import React, { useState } from 'react';

function FerramentasMonitoramento({ socket, setResponseArea }) {
    const [loading, setLoading] = useState(false);

    const executarMigracao = () => {
        if (!socket) {
            setResponseArea(prev => prev + '❌ Socket não conectado\n');
            return;
        }

        setLoading(true);
        setResponseArea(prev => prev + '🔄 Iniciando migração de validações...\n');

        // Emitir evento para executar migração no backend
        socket.emit('executarMigracao', {}, (response) => {
            setLoading(false);
            if (response.sucesso) {
                setResponseArea(prev => prev + '✅ Migração concluída com sucesso!\n');
                setResponseArea(prev => prev + `📊 Resultado: ${response.resultado}\n\n`);
            } else {
                setResponseArea(prev => prev + `❌ Erro na migração: ${response.erro}\n\n`);
            }
        });
    };

    const verificarNaoMonitoradas = () => {
        if (!socket) {
            setResponseArea(prev => prev + '❌ Socket não conectado\n');
            return;
        }

        setLoading(true);
        setResponseArea(prev => prev + '🔍 Verificando mensagens não monitoradas...\n');

        socket.emit('verificarNaoMonitoradas', {}, (response) => {
            setLoading(false);
            if (response.sucesso) {
                setResponseArea(prev => prev + '✅ Verificação concluída!\n');
                setResponseArea(prev => prev + `📊 Resultado: ${response.resultado}\n\n`);
            } else {
                setResponseArea(prev => prev + `❌ Erro na verificação: ${response.erro}\n\n`);
            }
        });
    };

    const forcarMonitoramentoTodos = () => {
        if (!socket) {
            setResponseArea(prev => prev + '❌ Socket não conectado\n');
            return;
        }

        setLoading(true);
        setResponseArea(prev => prev + '🔄 Forçando monitoramento de todas as mensagens pendentes...\n');

        socket.emit('forcarMonitoramento', {}, (response) => {
            setLoading(false);
            if (response.sucesso) {
                setResponseArea(prev => prev + '✅ Monitoramento forçado iniciado!\n');
                setResponseArea(prev => prev + `📊 Resultado: ${response.resultado}\n\n`);
            } else {
                setResponseArea(prev => prev + `❌ Erro ao forçar monitoramento: ${response.erro}\n\n`);
            }
        });
    };

    const reprocessarMensagensAntigas = () => {
        if (!socket) {
            setResponseArea(prev => prev + '❌ Socket não conectado\n');
            return;
        }

        const confirmacao = window.confirm(
            'Esta ação irá reprocessar todas as mensagens antigas que podem não ter sido entregues. ' +
            'Isso pode gerar muitos reenvios automáticos. Continuar?'
        );

        if (!confirmacao) {
            setResponseArea(prev => prev + 'ℹ️ Operação cancelada pelo usuário\n\n');
            return;
        }

        setLoading(true);
        setResponseArea(prev => prev + '⚡ Reprocessando mensagens antigas...\n');

        socket.emit('reprocessarMensagensAntigas', {}, (response) => {
            setLoading(false);
            if (response.sucesso) {
                setResponseArea(prev => prev + '✅ Reprocessamento iniciado!\n');
                setResponseArea(prev => prev + `📊 Resultado: ${response.resultado}\n\n`);
            } else {
                setResponseArea(prev => prev + `❌ Erro no reprocessamento: ${response.erro}\n\n`);
            }
        });
    };

    return (
        <div className="event-test">
            <h2>🛠️ Ferramentas de Monitoramento e Correção</h2>
            
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#0c5aa6' }}>ℹ️ Sobre estas ferramentas:</h4>
                <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '14px' }}>
                    <li><strong>Migrar Validações:</strong> Move dados da coleção antiga (tb_envio_validacoes) para a nova (validacoesCadastro)</li>
                    <li><strong>Verificar Não Monitoradas:</strong> Identifica mensagens que não foram monitoradas e marca para reenvio</li>
                    <li><strong>Forçar Monitoramento:</strong> Inicia monitoramento manual para mensagens pendentes</li>
                    <li><strong>Reprocessar Antigas:</strong> Força reenvio de mensagens antigas que podem ter falhado</li>
                </ul>
            </div>

            <div className="controls-grid">
                <button 
                    onClick={executarMigracao}
                    disabled={!socket || loading}
                    style={{
                        backgroundColor: loading ? '#6c757d' : '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '12px 20px',
                        borderRadius: '6px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        marginRight: '10px',
                        marginBottom: '10px'
                    }}
                >
                    {loading ? '⏳ Processando...' : '📊 Migrar Validações'}
                </button>

                <button 
                    onClick={verificarNaoMonitoradas}
                    disabled={!socket || loading}
                    style={{
                        backgroundColor: loading ? '#6c757d' : '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '12px 20px',
                        borderRadius: '6px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        marginRight: '10px',
                        marginBottom: '10px'
                    }}
                >
                    {loading ? '⏳ Processando...' : '🔍 Verificar Não Monitoradas'}
                </button>

                <button 
                    onClick={forcarMonitoramentoTodos}
                    disabled={!socket || loading}
                    style={{
                        backgroundColor: loading ? '#6c757d' : '#ffc107',
                        color: loading ? 'white' : 'black',
                        border: 'none',
                        padding: '12px 20px',
                        borderRadius: '6px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        marginRight: '10px',
                        marginBottom: '10px'
                    }}
                >
                    {loading ? '⏳ Processando...' : '🔄 Forçar Monitoramento'}
                </button>

                <button 
                    onClick={reprocessarMensagensAntigas}
                    disabled={!socket || loading}
                    style={{
                        backgroundColor: loading ? '#6c757d' : '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '12px 20px',
                        borderRadius: '6px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        marginRight: '10px',
                        marginBottom: '10px'
                    }}
                >
                    {loading ? '⏳ Processando...' : '⚡ Reprocessar Antigas'}
                </button>
            </div>

            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeaa7' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>⚠️ Notas Importantes:</h4>
                <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '14px', color: '#856404' }}>
                    <li>Execute a migração primeiro se estiver vendo dados inconsistentes</li>
                    <li>A verificação de não monitoradas identifica problemas, mas não os resolve automaticamente</li>
                    <li>O reprocessamento pode gerar muitos reenvios - use com cuidado</li>
                    <li>Acompanhe os logs no backend para ver o progresso das operações</li>
                </ul>
            </div>
        </div>
    );
}

export default FerramentasMonitoramento;
