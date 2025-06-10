import React, { useState, useEffect } from 'react';

function ListaValidacoesCadastro({ socket, setResponseArea }) {
  const [validacoes, setValidacoes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (socket) {
      carregarValidacoes();
    }
  }, [socket]);

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
        <p>Nenhuma validação encontrada. Clique em "Atualizar Lista" para carregar.</p>
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
                <tr key={validacao._id || index}>
                  <td>{formatarData(validacao.data_envio)}</td>
                  <td>{validacao.nome}</td>
                  <td>{validacao.telefone}</td>
                  <td>
                    <span 
                      className="status-badge" 
                      style={{ backgroundColor: getStatusColor(validacao.status) }}
                    >
                      {validacao.status || 'Enviada'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn-small"
                      onClick={() => setResponseArea(prev => prev + `Detalhes da validação:\n${JSON.stringify(validacao, null, 2)}\n`)}
                    >
                      Ver Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ListaValidacoesCadastro;
