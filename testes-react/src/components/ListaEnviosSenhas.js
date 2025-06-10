import React, { useState, useEffect } from 'react';

function ListaEnviosSenhas({ socket, setResponseArea }) {
  const [envios, setEnvios] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (socket) {
      carregarEnvios();
    }
  }, [socket]);

  const carregarEnvios = () => {
    if (socket) {
      setLoading(true);
      socket.emit('listarEnviosSenhas', {}, (response) => {
        if (response.sucesso) {
          setEnvios(response.dados);
          setResponseArea(prev => prev + `Envios de senhas carregados: ${response.dados.length} encontrados\n`);
        } else {
          setResponseArea(prev => prev + `Erro ao carregar envios de senhas: ${response.erro}\n`);
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
      <h2>Lista de Envios de Senhas</h2>
      
      <div className="controls-row">
        <button onClick={carregarEnvios} disabled={!socket || loading}>
          {loading ? 'Carregando...' : 'Atualizar Lista'}
        </button>
        <span className="info-text">
          Total: {envios.length} envios
        </span>
      </div>

      {loading ? (
        <p>Carregando envios...</p>
      ) : envios.length === 0 ? (
        <p>Nenhum envio de senha encontrado. Clique em "Atualizar Lista" para carregar.</p>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Nome</th>
                <th>CPF</th>
                <th>Telefone</th>
                <th>Usuário</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {envios.map((envio, index) => (
                <tr key={envio._id || index}>
                  <td>{formatarData(envio.data_envio)}</td>
                  <td>{envio.nome}</td>
                  <td>{envio.cpf}</td>
                  <td>{envio.telefone}</td>
                  <td>{envio.usuario}</td>
                  <td>
                    <span 
                      className="status-badge" 
                      style={{ backgroundColor: getStatusColor(envio.status) }}
                    >
                      {envio.status || 'Enviada'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn-small"
                      onClick={() => setResponseArea(prev => prev + `Detalhes do envio:\n${JSON.stringify(envio, null, 2)}\n`)}
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

export default ListaEnviosSenhas;
