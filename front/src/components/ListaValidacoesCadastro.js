import React, { useState, useEffect } from 'react';
import { validacoesAPI } from '../services/api';

function ListaValidacoesCadastro({ setResponseArea }) {
  const [validacoes, setValidacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reenviando, setReenviando] = useState({});

  useEffect(() => {
    carregarValidacoes();
  }, []);

  const carregarValidacoes = async () => {
    setLoading(true);
    try {
      const response = await validacoesAPI.listar();
      if (response.success && response.pendentes && response.pendentes.validacoes) {
        setValidacoes(response.pendentes.validacoes);
        setResponseArea(prev => prev + `Lista de validações carregada: ${response.pendentes.validacoes.length} encontradas\n`);
      } else {
        setValidacoes([]);
        setResponseArea(prev => prev + 'Nenhuma validação encontrada\n');
      }
    } catch (error) {
      setResponseArea(prev => prev + `Erro ao carregar validações: ${error.message}\n`);
      setValidacoes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReenviar = async (validacao) => {
    const key = `${validacao.id_criador}-${validacao.id_numero}`;
    
    if (!validacao.id_criador || !validacao.id_numero) {
      setResponseArea(prev => prev + 'Erro: IDs não disponíveis para reenvio\n');
      return;
    }
    
    if (reenviando[key]) return;

    setReenviando(prev => ({ ...prev, [key]: true }));
    setResponseArea(prev => prev + `Reenviando validação para ${validacao.nome_criador}...\n`);

    try {
      const response = await validacoesAPI.reenviar(
        validacao.id_criador,
        validacao.id_numero
      );

      if (response.success && response.resultado.sucesso) {
        setResponseArea(prev => prev + `✅ Reenviado com sucesso para ${validacao.nome_criador}\n`);
        // Atualizar lista
        await carregarValidacoes();
      } else {
        setResponseArea(prev => prev + `❌ Falha ao reenviar para ${validacao.nome_criador}: ${response.resultado.mensagem || 'Erro desconhecido'}\n`);
      }
    } catch (error) {
      setResponseArea(prev => prev + `❌ Erro ao reenviar: ${error.message}\n`);
    } finally {
      setReenviando(prev => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="event-test">
      <h2>Lista de Validações de Cadastro</h2>
      
      <div className="controls-row">
        <button onClick={carregarValidacoes} disabled={loading}>
          {loading ? 'Carregando...' : 'Atualizar Lista'}
        </button>
        <span className="count-info">
          Total: {validacoes.length} validações pendentes
        </span>
      </div>

      <div className="lista-container">
        {loading ? (
          <p>Carregando validações...</p>
        ) : validacoes.length === 0 ? (
          <p>Nenhuma validação pendente encontrada.</p>
        ) : (
          <table className="lista-table">
            <thead>
              <tr>
                <th>Criador</th>
                <th>Telefone</th>
                <th>CPF</th>
                <th>Status</th>
                <th>Data Envio</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {validacoes.map((validacao, index) => {
                const key = `${validacao.id_criador}-${validacao.id_numero}`;
                return (
                  <tr key={index}>
                    <td>{validacao.nome_criador || 'N/A'}</td>
                    <td>{validacao.telefone || 'N/A'}</td>
                    <td>{validacao.cpf_criador || 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${validacao.status?.toLowerCase() || 'pendente'}`}>
                        {validacao.status || 'Pendente'}
                      </span>
                    </td>
                    <td>
                      {validacao.data_envio 
                        ? new Date(validacao.data_envio).toLocaleString()
                        : 'N/A'
                      }
                    </td>
                    <td>
                      <button
                        onClick={() => handleReenviar(validacao)}
                        disabled={reenviando[key] || !validacao.telefone || validacao.telefone.length !== 11}
                        className="btn-reenviar"
                        title={validacao.telefone?.length !== 11 ? 'Telefone inválido' : 'Reenviar validação'}
                      >
                        {reenviando[key] ? '⏳' : '🔄'} Reenviar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ListaValidacoesCadastro;
