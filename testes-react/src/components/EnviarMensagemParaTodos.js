import React, { useState, useEffect } from 'react';

function EnviarMensagemParaTodos({ socket, setResponseArea }) {
  const [criadores, setCriadores] = useState([]);
  const [criadoresSelecionados, setCriadoresSelecionados] = useState([]);
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    // Carregar lista de criadores quando o componente for montado
    if (socket) {
      carregarCriadores();
    }
  }, [socket]);

  const carregarCriadores = () => {
    if (socket) {
      setLoading(true);
      socket.emit('listarTodosCriadores', {}, (response) => {
        if (response.sucesso) {
          setCriadores(response.dados);
          setResponseArea(prev => prev + `Lista de criadores carregada: ${response.dados.length} encontrados\n`);
        } else {
          setResponseArea(prev => prev + `Erro ao carregar criadores: ${response.erro}\n`);
        }
        setLoading(false);
      });
    }
  };

  // Função para filtrar criadores baseado no input de filtro
  const criadoresFiltrados = criadores.filter(criador => {
    if (!filtro.trim()) return true;
    
    const filtroLower = filtro.toLowerCase();
    return (
      criador.nome.toLowerCase().includes(filtroLower) ||
      criador.telefone.includes(filtro) ||
      criador.codigo.toString().includes(filtro)
    );
  });

  // Reset selectAll quando o filtro muda
  useEffect(() => {
    setSelectAll(false);
  }, [filtro]);

  const handleSelecionarTodos = () => {
    if (selectAll) {
      setCriadoresSelecionados([]);
    } else {
      // Selecionar todos os criadores filtrados
      setCriadoresSelecionados(criadoresFiltrados.map(c => c.codigo));
    }
    setSelectAll(!selectAll);
  };

  const handleSelecionarCriador = (codigo) => {
    if (criadoresSelecionados.includes(codigo)) {
      setCriadoresSelecionados(criadoresSelecionados.filter(id => id !== codigo));
    } else {
      setCriadoresSelecionados([...criadoresSelecionados, codigo]);
    }
  };

  const handleEnviarMensagem = () => {
    if (!mensagem.trim()) {
      alert('Por favor, digite uma mensagem.');
      return;
    }
    if (criadoresSelecionados.length === 0) {
      alert('Por favor, selecione pelo menos um criador.');
      return;
    }

    if (socket) {
      setLoading(true);
      setResponseArea(prev => prev + `Enviando mensagem para ${criadoresSelecionados.length} criadores...\n`);
      
      socket.emit('enviarMensagemParaTodos', {
        criadores: criadoresSelecionados,
        mensagem: mensagem
      }, (response) => {
        setResponseArea(prev => prev + `Resposta do envio:\n${JSON.stringify(response, null, 2)}\n`);
        if (response.sucesso) {
          setMensagem('');
          setCriadoresSelecionados([]);
          setSelectAll(false);
        }
        setLoading(false);
      });
    }
  };

  return (
    <div className="event-test">
      <h2>Enviar Mensagem Para Todos</h2>
      
      <div className="controls-row">
        <button onClick={carregarCriadores} disabled={!socket || loading}>
          {loading ? 'Carregando...' : 'Atualizar Lista'}
        </button>
        <button onClick={handleSelecionarTodos} disabled={criadoresFiltrados.length === 0}>
          {selectAll ? 'Desmarcar Todos' : 'Selecionar Todos'}
        </button>
        <div className="filter-container">
          <div className="filter-input-wrapper">
            <input
              type="text"
              placeholder="🔍 Filtrar por nome, telefone ou código..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="filter-input"
            />
            {filtro && (
              <button 
                className="clear-filter-btn"
                onClick={() => setFiltro('')}
                title="Limpar filtro"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <span className="selection-info">
          {criadoresSelecionados.length} de {criadoresFiltrados.length} selecionados
          {filtro && ` (${criadores.length} total)`}
        </span>
      </div>

      <div className="message-area">
        <label htmlFor="mensagem">Mensagem:</label>
        <textarea
          id="mensagem"
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          placeholder="Digite sua mensagem aqui..."
          rows="4"
        />
      </div>

      <div className="criadores-list">
        <h3>Lista de Criadores:</h3>
        {loading ? (
          <p>Carregando criadores...</p>
        ) : criadores.length === 0 ? (
          <p>Nenhum criador encontrado. Clique em "Atualizar Lista" para carregar.</p>
        ) : criadoresFiltrados.length === 0 ? (
          <p>Nenhum criador encontrado com o filtro "{filtro}". Tente outro termo de busca.</p>
        ) : (
          <div className="criadores-grid">
            {criadoresFiltrados.map((criador) => (
              <div 
                key={criador.codigo} 
                className={`criador-item ${criadoresSelecionados.includes(criador.codigo) ? 'selected' : ''}`}
                onClick={() => handleSelecionarCriador(criador.codigo)}
              >
                <input
                  type="checkbox"
                  checked={criadoresSelecionados.includes(criador.codigo)}
                  onChange={() => handleSelecionarCriador(criador.codigo)}
                />
                <div className="criador-info">
                  <strong>{criador.nome}</strong>
                  <span>{criador.telefone}</span>
                  <small>Código: {criador.codigo}</small>
                  {criador.data_cadastro && (
                    <small>Cadastro: {new Date(criador.data_cadastro).toLocaleDateString()}</small>
                  )}
                  {criador.status_cadastro && (
                    <small>Situação: {criador.status_cadastro}</small>
                  )}
                  {criador.status_mensagem && (
                    <span className={`status-badge ${criador.status_mensagem.toLowerCase()}`}>
                      {criador.status_mensagem}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="action-buttons">
        <button 
          onClick={handleEnviarMensagem} 
          disabled={!socket || loading || criadoresSelecionados.length === 0 || !mensagem.trim()}
          className="send-button"
        >
          {loading ? 'Enviando...' : `Enviar para ${criadoresSelecionados.length} criadores`}
        </button>
      </div>
    </div>
  );
}

export default EnviarMensagemParaTodos;
