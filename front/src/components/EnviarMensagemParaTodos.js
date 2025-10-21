import React, { useState, useEffect } from 'react';
import { criadoresAPI, mensagensAPI } from '../services/api';

function EnviarMensagemParaTodos({ setResponseArea }) {
  const [criadores, setCriadores] = useState([]);
  const [criadoresSelecionados, setCriadoresSelecionados] = useState([]);
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    // Carregar lista de criadores quando o componente for montado
    carregarCriadores();
  }, []);

  const carregarCriadores = async () => {
    setLoading(true);
    try {
      const response = await criadoresAPI.listarTodos();
      if (response.success && response.criadores) {
        setCriadores(response.criadores);
        setResponseArea(prev => prev + `Lista de criadores carregada: ${response.criadores.length} encontrados\n`);
      } else {
        setResponseArea(prev => prev + `Erro ao carregar criadores\n`);
      }
    } catch (error) {
      setResponseArea(prev => prev + `Erro ao carregar criadores: ${error.message}\n`);
    } finally {
      setLoading(false);
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

  const handleEnviarMensagem = async () => {
    if (!mensagem.trim()) {
      alert('Por favor, digite uma mensagem.');
      return;
    }
    if (criadoresSelecionados.length === 0) {
      alert('Por favor, selecione pelo menos um criador.');
      return;
    }

    setLoading(true);
    setResponseArea(prev => prev + `Enviando mensagem para ${criadoresSelecionados.length} criadores...\n`);
    
    try {
      // Buscar dados completos dos criadores selecionados
      const criadoresDados = await criadoresAPI.buscarSelecionados(criadoresSelecionados);
      
      if (!criadoresDados.success || !criadoresDados.criadores) {
        throw new Error('Erro ao buscar dados dos criadores');
      }

      let sucessos = 0;
      let erros = 0;

      // Enviar mensagem para cada criador
      for (const criador of criadoresDados.criadores) {
        try {
          const resultado = await mensagensAPI.enviar(criador.telefone, mensagem);
          if (resultado.success && resultado.resultado.sucesso) {
            sucessos++;
            setResponseArea(prev => prev + `✅ ${criador.nome}: Enviado\n`);
          } else {
            erros++;
            setResponseArea(prev => prev + `❌ ${criador.nome}: Falhou\n`);
          }
        } catch (error) {
          erros++;
          setResponseArea(prev => prev + `❌ ${criador.nome}: Erro - ${error.message}\n`);
        }
        
        // Pequeno delay entre envios para evitar sobrecarga
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setResponseArea(prev => prev + `\n📊 Resumo: ${sucessos} enviadas, ${erros} erros\n`);
      
      if (sucessos > 0) {
        setMensagem('');
        setCriadoresSelecionados([]);
        setSelectAll(false);
      }
    } catch (error) {
      setResponseArea(prev => prev + `Erro geral ao enviar mensagens: ${error.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="event-test">
      <h2>Enviar Mensagem Para Todos</h2>
      
      <div className="controls-row">
        <button onClick={carregarCriadores} disabled={loading}>
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
          disabled={loading || criadoresSelecionados.length === 0 || !mensagem.trim()}
          className="send-button"
        >
          {loading ? 'Enviando...' : `Enviar para ${criadoresSelecionados.length} criadores`}
        </button>
      </div>
    </div>
  );
}

export default EnviarMensagemParaTodos;
