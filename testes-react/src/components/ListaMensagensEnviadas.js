import React, { useState, useEffect } from 'react';

function ListaMensagensEnviadas({ socket, setResponseArea }) {
  const [mensagens, setMensagens] = useState([]);
  const [mensagemSelecionada, setMensagemSelecionada] = useState(null);
  const [detalhesMensagem, setDetalhesMensagem] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (socket) {
      carregarMensagens();
    }
  }, [socket]);

  const carregarMensagens = () => {
    if (socket) {
      setLoading(true);
      socket.emit('listarMensagensEnviadas', {}, (response) => {
        if (response.sucesso) {
          setMensagens(response.dados);
          setResponseArea(prev => prev + `Mensagens carregadas: ${response.dados.length} encontradas\n`);
        } else {
          setResponseArea(prev => prev + `Erro ao carregar mensagens: ${response.erro}\n`);
        }
        setLoading(false);
      });
    }
  };

  const buscarDetalhesMensagem = (mensagemId) => {
    if (socket && mensagemId) {
      socket.emit('buscarMensagemPorId', { id: mensagemId }, (response) => {
        if (response.sucesso) {
          setDetalhesMensagem(response.dados);
          setResponseArea(prev => prev + `Detalhes da mensagem carregados\n`);
        } else {
          setResponseArea(prev => prev + `Erro ao carregar detalhes: ${response.erro}\n`);
        }
      });
    }
  };

  const handleSelecionarMensagem = (mensagem) => {
    setMensagemSelecionada(mensagem);
    if (mensagem?._id) {
      buscarDetalhesMensagem(mensagem._id);
    }
  };

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
      default: return '#6c757d';
    }
  };

  const contarPorStatus = (status) => {
    return mensagens.filter(m => m.status?.toLowerCase() === status?.toLowerCase()).length;
  };

  return (
    <div className="event-test">
      <h2>Lista de Mensagens Enviadas</h2>
      
      <div className="controls-row">
        <button onClick={carregarMensagens} disabled={!socket || loading}>
          {loading ? 'Carregando...' : 'Atualizar Lista'}
        </button>
        <div className="status-summary">
          <span className="status-count">
            Total: {mensagens.length} | 
            Enviadas: {contarPorStatus('enviada')} | 
            Entregues: {contarPorStatus('entregue')} | 
            Lidas: {contarPorStatus('lida')}
          </span>
        </div>
      </div>

      <div className="messages-layout">
        <div className="messages-list">
          <h3>Selecione uma mensagem:</h3>
          {loading ? (
            <p>Carregando mensagens...</p>
          ) : mensagens.length === 0 ? (
            <p>Nenhuma mensagem encontrada.</p>
          ) : (
            <select 
              value={mensagemSelecionada?._id || ''}
              onChange={(e) => {
                const mensagem = mensagens.find(m => m._id === e.target.value);
                handleSelecionarMensagem(mensagem);
              }}
              className="message-select"
            >
              <option value="">Selecione uma mensagem...</option>
              {mensagens.map((mensagem) => (
                <option key={mensagem._id} value={mensagem._id}>
                  {formatarData(mensagem.data_envio)} - {mensagem.mensagem.substring(0, 50)}...
                </option>
              ))}
            </select>
          )}
        </div>

        {mensagemSelecionada && (
          <div className="message-details">
            <h3>Detalhes da Mensagem</h3>
            <div className="detail-card">
              <div className="detail-row">
                <strong>Data/Hora:</strong>
                <span>{formatarData(mensagemSelecionada.data_envio)}</span>
              </div>
              <div className="detail-row">
                <strong>Mensagem:</strong>
                <div className="message-content">{mensagemSelecionada.mensagem}</div>
              </div>
              <div className="detail-row">
                <strong>Status Geral:</strong>
                <span 
                  className="status-badge" 
                  style={{ backgroundColor: getStatusColor(mensagemSelecionada.status) }}
                >
                  {mensagemSelecionada.status || 'Enviada'}
                </span>
              </div>
              <div className="detail-row">
                <strong>Total de Destinatários:</strong>
                <span>{mensagemSelecionada.total_destinatarios || 0}</span>
              </div>
            </div>

            {detalhesMensagem && detalhesMensagem.destinatarios && (
              <div className="recipients-details">
                <h4>Destinatários ({detalhesMensagem.destinatarios.length}):</h4>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Nome</th>
                        <th>Telefone</th>
                        <th>Situação</th>
                        <th>Status Mensagem</th>
                        <th>Data Envio</th>
                        <th>Última Atualização</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalhesMensagem.destinatarios.map((dest, index) => (
                        <tr key={index}>
                          <td>{dest.codigo || 'N/A'}</td>
                          <td>{dest.nome}</td>
                          <td>{dest.telefone}</td>
                          <td>
                            <span className="status-cadastro">
                              {dest.status_cadastro || 'N/A'}
                            </span>
                          </td>
                          <td>
                            <span 
                              className="status-badge" 
                              style={{ backgroundColor: getStatusColor(dest.status_mensagem) }}
                            >
                              {dest.status_mensagem || 'Enviada'}
                            </span>
                          </td>
                          <td>{formatarData(dest.data_envio)}</td>
                          <td>{formatarData(dest.data_status_atualizado)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ListaMensagensEnviadas;
