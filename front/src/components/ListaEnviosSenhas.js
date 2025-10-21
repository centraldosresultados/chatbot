import React, { useState, useEffect } from 'react';
import { senhasAPI } from '../services/api';

function ListaEnviosSenhas({ setResponseArea }) {
  const [envios, setEnvios] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarEnvios();
  }, []);

  const carregarEnvios = async () => {
    setLoading(true);
    try {
      const response = await senhasAPI.listar();
      if (response.success && response.pendentes && response.pendentes.senhas) {
        setEnvios(response.pendentes.senhas);
        setResponseArea(prev => prev + `Lista de envios de senhas carregada: ${response.pendentes.senhas.length} encontrados\n`);
      } else {
        setEnvios([]);
        setResponseArea(prev => prev + 'Nenhum envio de senha encontrado\n');
      }
    } catch (error) {
      setResponseArea(prev => prev + `Erro ao carregar envios: ${error.message}\n`);
      setEnvios([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="event-test">
      <h2>Lista de Envios de Senhas</h2>
      
      <div className="controls-row">
        <button onClick={carregarEnvios} disabled={loading}>
          {loading ? 'Carregando...' : 'Atualizar Lista'}
        </button>
        <span className="count-info">
          Total: {envios.length} envios pendentes
        </span>
      </div>

      <div className="lista-container">
        {loading ? (
          <p>Carregando envios...</p>
        ) : envios.length === 0 ? (
          <p>Nenhum envio de senha pendente encontrado.</p>
        ) : (
          <table className="lista-table">
            <thead>
              <tr>
                <th>Criador</th>
                <th>Telefone</th>
                <th>Usuário</th>
                <th>Status</th>
                <th>Data Envio</th>
              </tr>
            </thead>
            <tbody>
              {envios.map((envio, index) => (
                <tr key={index}>
                  <td>{envio.nome_criador || 'N/A'}</td>
                  <td>{envio.telefone || 'N/A'}</td>
                  <td>{envio.usuario_login || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${envio.status?.toLowerCase() || 'pendente'}`}>
                      {envio.status || 'Pendente'}
                    </span>
                  </td>
                  <td>
                    {envio.data_envio 
                      ? new Date(envio.data_envio).toLocaleString()
                      : 'N/A'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ListaEnviosSenhas;
