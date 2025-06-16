import React, { useState } from 'react';

function TesteReenvioAlternativo({ socket, setResponseArea }) {
  const [numero, setNumero] = useState('82981575190');
  const [texto, setTexto] = useState('Teste de reenvio com formato alternativo - Central dos Resultados');

  const handleTesteReenvio = () => {
    if (!socket) {
      alert('Socket não conectado.');
      return;
    }

    if (!numero || !texto) {
      alert('Por favor, preencha número e texto.');
      return;
    }

    setResponseArea(prev => prev + `🔄 Iniciando teste de reenvio alternativo...\n`);
    setResponseArea(prev => prev + `   Número original: ${numero}\n`);
    setResponseArea(prev => prev + `   Formato alternativo será: ${numero.substring(0,2)}${numero.substring(3)}\n`);

    socket.emit('reenviarComFormatoAlternativo', {
      numeroOriginal: numero,
      texto: texto
    }, (response) => {
      if (response.sucesso) {
        setResponseArea(prev => prev + `✅ SUCESSO no reenvio alternativo!\n`);
        setResponseArea(prev => prev + `   Original: ${response.numeroOriginal}\n`);
        setResponseArea(prev => prev + `   Alternativo: ${response.numeroAlternativo}\n`);
        setResponseArea(prev => prev + `   ID da mensagem: ${response.id}\n`);
        setResponseArea(prev => prev + `   Formato usado: ${response.formatoUsado}\n\n`);
      } else {
        setResponseArea(prev => prev + `❌ ERRO no reenvio alternativo!\n`);
        setResponseArea(prev => prev + `   Erro: ${response.erro}\n`);
        if (response.detalhes) {
          setResponseArea(prev => prev + `   Detalhes: ${response.detalhes}\n`);
        }
        setResponseArea(prev => prev + `\n`);
      }
    });
  };

  return (
    <div className="event-test">
      <h2>🔄 Teste de Reenvio com Formato Alternativo</h2>
      
      <div className="form-group">
        <label htmlFor="numeroTeste">Número (11 dígitos):</label>
        <input
          type="text"
          id="numeroTeste"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          placeholder="Ex: 82981575190"
        />
        <small style={{ color: '#6c757d', display: 'block', marginTop: '4px' }}>
          Será convertido para: {numero.length === 11 ? `${numero.substring(0,2)}${numero.substring(3)}` : 'Número deve ter 11 dígitos'}
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="textoTeste">Texto da mensagem:</label>
        <textarea
          id="textoTeste"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows="3"
        />
      </div>

      <button 
        onClick={handleTesteReenvio} 
        disabled={!socket || numero.length !== 11}
        className="btn-primary"
      >
        📞 Testar Reenvio Alternativo
      </button>

      <div className="info-box" style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e7f3ff', border: '1px solid #b3d7ff', borderRadius: '4px' }}>
        <strong>ℹ️ Como funciona:</strong>
        <ul style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '14px' }}>
          <li>Remove o primeiro dígito após o DDD</li>
          <li>Exemplo: <code>82981575190</code> → <code>8281575190</code></li>
          <li>Útil para números antigos que não usam o 9º dígito</li>
          <li>Funciona apenas com números de 11 dígitos</li>
        </ul>
      </div>
    </div>
  );
}

export default TesteReenvioAlternativo;
