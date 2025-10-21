import React, { useState, useEffect } from 'react';
import { mensagensAPI } from '../services/api';

function ListaMensagensEnviadas({ setResponseArea }) {
  const [mensagens, setMensagens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detalhando, setDetalhando] = useState({});

  useEffect(() => {
    carregarMensagens();
  }, []);

  const carregarMensagens = async () => {
    setLoading(true);
    try {
      const response = await mensagensAPI.listarEnviadas();
      if (response.success && response.historico) {
        setMensagens(response.historico);
        setResponseArea(prev => prev + `Lista de mensagens carregada: ${response.historico.length} encontradas\n`);
      } else {
        setMensagens([]);
        setResponseArea(prev => prev + 'Nenhuma mensagem encontrada\n');
      }
    } catch (error) {
      setResponseArea(prev => prev + `Erro ao carregar mensagens: ${error.message}\n`);
      setMensagens([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalhes = async (mensagemId) => {
    if (detalhando[mensagemId]) return;

    setDetalhando(prev => ({ ...prev, [mensagemId]: true }));
    
    try {
      const response = await mensagensAPI.buscarPorId(mensagemId);
      setResponseArea(prev => prev + `\nDetalhes da mensagem ${mensagemId}:\n${JSON.stringify(response, null, 2)}\n\n`);
    } catch (error) {
      setResponseArea(prev => prev + `Erro ao buscar detalhes: ${error.message}\n`);
    } finally {
      setDetalhando(prev => ({ ...prev, [mensagemId]: false }));
    }
  };

  return (
    <div className="event-test">
      <h2>Lista de Mensagens Enviadas</h2>
      
      <div className="controls-row">
        <button onClick={carregarMensagens} disabled={loading}>
          {loading ? 'Carregando...' : 'Atualizar Lista'}
        </button>
        <span className="count-info">
          Total: {mensagens.length} mensagens
        </span>
      </div>

      <div className="lista-container">
        {loading ? (
          <p>Carregando mensagens...</p>
        ) : mensagens.length === 0 ? (
          <p>Nenhuma mensagem enviada encontrada.</p>
        ) : (
          <table className="lista-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Destinatário</th>
                <th>Mensagem</th>
                <th>Status</th>
                <th>Data Envio</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {mensagens.map((mensagem, index) => (
                <tr key={index}>
                  <td>{mensagem.id_mensagem || mensagem._id || index}</td>
                  <td>{mensagem.numero || 'N/A'}</td>
                  <td className="message-preview">
                    {mensagem.mensagem?.substring(0, 50) || 'N/A'}
                    {mensagem.mensagem?.length > 50 && '...'}
                  </td>
                  <td>
                    <span className={`status-badge ${mensagem.status?.toLowerCase() || 'pendente'}`}>
                      {mensagem.status || 'Pendente'}
                    </span>
                  </td>
                  <td>
                    {mensagem.data_envio 
                      ? new Date(mensagem.data_envio).toLocaleString()
                      : 'N/A'
                    }
                  </td>
                  <td>
                    <button
                      onClick={() => handleVerDetalhes(mensagem.id_mensagem || mensagem._id)}
                      disabled={detalhando[mensagem.id_mensagem] || !mensagem.id_mensagem}
                      className="btn-detalhes"
                    >
                      {detalhando[mensagem.id_mensagem] ? '⏳' : '👁️'} Ver
                    </button>
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

export default ListaMensagensEnviadas;
