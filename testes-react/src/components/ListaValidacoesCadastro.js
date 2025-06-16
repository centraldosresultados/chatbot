import React, { useState, useEffect } from 'react';

function ListaValidacoesCadastro({ socket, setResponseArea }) {
  const [validacoes, setValidacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  const carregarValidacoes = () => {
    if (socket) {
      setLoading(true);
      socket.emit('listarValidacoesCadastro', {}, (response) => {
        if (response.sucesso) {
          setValidacoes(response.dados);
          setResponseArea(prev => prev + `Validações carregadas: ${response.dados.length} encontradas\n`);
        } else {
          setResponseArea(prev => prev + `Erro ao carregar validações: ${response.erro}\n`);
        }
        setLoading(false);
      });
    }
  };

  useEffect(() => {
    if (socket) {
      carregarValidacoes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const formatarData = (data) => {
    if (!data) return 'N/A';
    return new Date(data).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'enviada': return '#007bff';
      case 'entregue': return '#28a745';
      case 'lida': return '#6f42c1';
      case 'erro': return '#dc3545';
      case 'falha': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const toggleRowExpansion = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  const reenviarValidacaoExistente = (validacao) => {
    if (!socket) {
      setResponseArea(prev => prev + 'Socket não conectado para reenvio\n');
      return;
    }

    const telefone = validacao.telefone;
    if (!telefone || telefone.length !== 11) {
      setResponseArea(prev => prev + 'Número deve ter 11 dígitos para reenvio alternativo\n');
      return;
    }
    
    setResponseArea(prev => prev + `🔄 Reenviando validação existente...\n`);
    setResponseArea(prev => prev + `   ID: ${validacao._id}\n`);
    setResponseArea(prev => prev + `   Nome: ${validacao.nome}\n`);
    setResponseArea(prev => prev + `   Telefone original: ${telefone}\n`);
    setResponseArea(prev => prev + `   Telefone alternativo: ${telefone.substring(0,2)}${telefone.substring(3)}\n`);
    
    socket.emit('reenviarValidacaoExistente', {
      id: validacao._id,
      telefone: telefone
    }, (response) => {
      if (response.sucesso) {
        setResponseArea(prev => prev + `✅ Reenvio de validação bem-sucedido!\n`);
        setResponseArea(prev => prev + `   Original: ${response.numeroOriginal}\n`);
        setResponseArea(prev => prev + `   Alternativo: ${response.numeroAlternativo}\n`);
        setResponseArea(prev => prev + `   Novo ID: ${response.id}\n\n`);
        
        // Recarregar lista após sucesso
        setTimeout(() => {
          carregarValidacoes();
        }, 1000);
      } else {
        setResponseArea(prev => prev + `❌ Falha no reenvio de validação: ${response.erro}\n`);
        if (response.detalhes) {
          setResponseArea(prev => prev + `   Detalhes: ${response.detalhes}\n`);
        }
        setResponseArea(prev => prev + `\n`);
      }
    });
  };

  const formatarDetalhes = (validacao) => {
    return [
      { label: 'ID', value: validacao._id || 'N/A' },
      { label: 'Nome Completo', value: validacao.nome || 'N/A' },
      { label: 'Telefone', value: validacao.telefone || 'N/A' },
      { label: 'E-mail', value: validacao.email || 'N/A' },
      { label: 'Status', value: validacao.status || validacao.status_mensagem || 'Enviada' },
      { label: 'Data de Envio', value: formatarData(validacao.dataEnvio || validacao.data || validacao.created_at) },
      { label: 'Data de Atualização', value: formatarData(validacao.updated_at) },
      { label: 'ID da Mensagem', value: validacao.id_mensagem || 'N/A' },
      { label: 'Tentativas de Reenvio', value: validacao.tentativasReenvio || '0' },
      { label: 'Reenvio Tentado', value: validacao.reenvioTentado ? 'Sim' : 'Não' },
      { label: 'Formato Alternativo Usado', value: validacao.formatoAlternativoUsado ? 'Sim' : 'Não' },
      { label: 'Precisa Reenvio', value: validacao.precisaReenvio ? `Sim - ${validacao.motivoReenvio || 'Motivo não especificado'}` : 'Não' },
      { label: 'Possível Problema', value: validacao.possivelmenteNaoEntregue ? `Sim - ${validacao.motivoProblema || 'Problema não especificado'}` : 'Não' },
      { label: 'Histórico de Reenvios', value: validacao.historicoReenvios?.length > 0 ? `${validacao.historicoReenvios.length} reenvios` : 'Nenhum' }
    ];
  };

  return (
    <div className="event-test">
      <h2>Lista de Validações de Cadastro</h2>
      
      <div className="controls-row">
        <button onClick={carregarValidacoes} disabled={!socket || loading}>
          {loading ? 'Carregando...' : 'Atualizar Lista'}
        </button>
        <span className="info-text">
          Total: {validacoes.length} validações
        </span>
      </div>

      {loading ? (
        <p>Carregando validações...</p>
      ) : validacoes.length === 0 ? (
        <p>Nenhuma validação encontrada. Clique em &quot;Atualizar Lista&quot; para carregar.</p>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {validacoes.map((validacao, index) => (
                <React.Fragment key={validacao._id || index}>
                  <tr>
                    <td>{formatarData(validacao.dataEnvio || validacao.data || validacao.created_at)}</td>
                    <td>{validacao.nome}</td>
                    <td>{validacao.telefone}</td>
                    <td>
                      <span 
                        className="status-badge" 
                        style={{ 
                          backgroundColor: getStatusColor(validacao.status || validacao.status_mensagem),
                          padding: '4px 8px',
                          borderRadius: '4px',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        {validacao.status || validacao.status_mensagem || 'Enviada'}
                      </span>
                      {validacao.precisaReenvio && (
                        <div style={{ 
                          color: '#ffc107', 
                          fontSize: '11px', 
                          marginTop: '2px',
                          fontWeight: 'bold'
                        }}>
                          🔄 Reenvio Pendente
                        </div>
                      )}
                      {validacao.possivelmenteNaoEntregue && (
                        <div style={{ 
                          color: '#dc3545', 
                          fontSize: '11px', 
                          marginTop: '2px',
                          fontWeight: 'bold'
                        }}>
                          ⚠️ Possível Problema
                        </div>
                      )}
                      {validacao.formatoAlternativoUsado && (
                        <div style={{ 
                          color: '#007bff', 
                          fontSize: '11px', 
                          marginTop: '2px',
                          fontWeight: 'bold'
                        }}>
                          📱 Formato Alt.
                        </div>
                      )}
                    </td>
                    <td>
                      <button 
                        className="btn-small"
                        onClick={() => toggleRowExpansion(index)}
                        style={{ 
                          backgroundColor: expandedRow === index ? '#dc3545' : '#007bff',
                          color: 'white'
                        }}
                      >
                        {expandedRow === index ? 'Ocultar Detalhes' : 'Ver Detalhes'}
                      </button>
                    </td>
                  </tr>
                  {expandedRow === index && (
                    <tr className="expanded-row">
                      <td colSpan="5" style={{ 
                        backgroundColor: '#f8f9fa', 
                        border: '1px solid #dee2e6',
                        padding: '15px'
                      }}>
                        <div className="details-grid">
                          {formatarDetalhes(validacao).map((detalhe, idx) => (
                            <div key={idx} className="detail-item">
                              <strong className="detail-label">
                                {detalhe.label}:
                              </strong>
                              <span className="detail-value">
                                {detalhe.value}
                              </span>
                            </div>
                          ))}
                          {/* Botão de ação para reenvio */}
                          <div className="detail-item" style={{ gridColumn: '1 / -1', textAlign: 'center', backgroundColor: '#f8f9fa', border: '2px dashed #dee2e6' }}>
                            <strong className="detail-label">Ações:</strong>
                            <div style={{ marginTop: '8px' }}>
                              <button 
                                onClick={() => reenviarValidacaoExistente(validacao)}
                                disabled={!socket || validacao.telefone?.length !== 11}
                                style={{
                                  backgroundColor: validacao.telefone?.length === 11 ? '#dc3545' : '#6c757d',
                                  color: 'white',
                                  border: 'none',
                                  padding: '8px 16px',
                                  borderRadius: '4px',
                                  cursor: validacao.telefone?.length === 11 ? 'pointer' : 'not-allowed',
                                  fontSize: '14px'
                                }}
                                title={validacao.telefone?.length === 11 ? 
                                  'Reenviar validação existente com formato alternativo' : 
                                  'Disponível apenas para números com 11 dígitos'
                                }
                              >
                                � Reenviar Validação
                              </button>
                              <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                                {validacao.telefone?.length === 11 ? 
                                  `Tentará: ${validacao.telefone.substring(0,2)}${validacao.telefone.substring(3)}` :
                                  'Número deve ter 11 dígitos'
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ListaValidacoesCadastro;
