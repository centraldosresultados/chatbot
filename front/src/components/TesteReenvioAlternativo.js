import React, { useState } from 'react';
import { mensagensAPI } from '../services/api';

function TesteReenvioAlternativo({ setResponseArea }) {
  const [numero, setNumero] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReenviar = async () => {
    if (numero.length !== 11) {
      alert('Por favor, insira um número válido com 11 dígitos (DDD + número).');
      return;
    }

    if (!mensagem.trim()) {
      alert('Por favor, digite uma mensagem.');
      return;
    }

    setLoading(true);
    setResponseArea(prev => prev + `Reenviando com formato alternativo para ${numero}...\n`);

    try {
      // Usa o envio normal da API
      const response = await mensagensAPI.enviar(numero, mensagem);

      if (response.success && response.resultado.sucesso) {
        setResponseArea(prev => prev + `✅ Mensagem enviada com sucesso!\n`);
        setResponseArea(prev => prev + `ID: ${response.resultado.id}\n`);
        setMensagem('');
      } else {
        setResponseArea(prev => prev + `❌ Falha: ${response.resultado.mensagem || 'Erro desconhecido'}\n`);
      }
    } catch (error) {
      setResponseArea(prev => prev + `❌ Erro: ${error.message}\n`);
      alert(`Erro ao enviar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="event-test">
      <h2>Teste de Reenvio (Formato Alternativo)</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Envia mensagem para um número específico com diferentes formatos.
      </p>
      
      <div>
        <label htmlFor="numero">Número (11 dígitos):</label>
        <input
          type="text"
          id="numero"
          value={numero}
          onChange={(e) => setNumero(e.target.value.replace(/\D/g, '').slice(0, 11))}
          placeholder="11999998888"
          maxLength="11"
        />
        <small style={{ display: 'block', color: '#666', marginTop: '5px' }}>
          Formato: DDD + Número (ex: 11999998888)
        </small>
      </div>
      
      <div style={{ marginTop: '15px' }}>
        <label htmlFor="mensagem">Mensagem:</label>
        <textarea
          id="mensagem"
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          placeholder="Digite sua mensagem de teste..."
          rows="4"
          style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
        />
      </div>
      
      <button
        onClick={handleReenviar}
        disabled={loading || numero.length !== 11 || !mensagem.trim()}
      >
        {loading ? 'Enviando...' : '📤 Enviar Mensagem Teste'}
      </button>
      
      {numero.length > 0 && numero.length !== 11 && (
        <p style={{ color: 'red', marginTop: '10px' }}>
          ⚠️ Número deve ter exatamente 11 dígitos
        </p>
      )}
    </div>
  );
}

export default TesteReenvioAlternativo;
