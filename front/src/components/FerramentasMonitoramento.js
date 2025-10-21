import React, { useState } from 'react';
import { notificacoesAPI } from '../services/api';

function FerramentasMonitoramento({ setResponseArea }) {
  const [loading, setLoading] = useState(false);
  const [mensagemAdmin, setMensagemAdmin] = useState('');

  const handleNotificarAdmin = async () => {
    if (!mensagemAdmin.trim()) {
      alert('Digite uma mensagem para o administrador.');
      return;
    }

    setLoading(true);
    setResponseArea(prev => prev + `Enviando notificação ao administrador...\n`);

    try {
      const response = await notificacoesAPI.notificar(mensagemAdmin);

      if (response.success) {
        setResponseArea(prev => prev + `✅ Notificação enviada com sucesso!\n`);
        setMensagemAdmin('');
      } else {
        setResponseArea(prev => prev + `❌ Falha ao enviar notificação\n`);
      }
    } catch (error) {
      setResponseArea(prev => prev + `❌ Erro: ${error.message}\n`);
      alert(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="event-test">
      <h2>🛠️ Ferramentas de Monitoramento</h2>
      
      <div className="tool-section">
        <h3>🔔 Notificar Administrador</h3>
        <p style={{ color: '#666', marginBottom: '15px' }}>
          Envia uma mensagem de alerta para o administrador do sistema.
        </p>
        
        <div>
          <label htmlFor="mensagemAdmin">Mensagem:</label>
          <textarea
            id="mensagemAdmin"
            value={mensagemAdmin}
            onChange={(e) => setMensagemAdmin(e.target.value)}
            placeholder="Digite a mensagem de notificação..."
            rows="4"
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
          />
        </div>
        
        <button
          onClick={handleNotificarAdmin}
          disabled={loading || !mensagemAdmin.trim()}
          style={{
            marginTop: '10px',
            background: '#ff9800',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Enviando...' : '📨 Enviar Notificação'}
        </button>
      </div>

      <div className="tool-section" style={{ marginTop: '30px', padding: '20px', background: '#f5f5f5', borderRadius: '10px' }}>
        <h3>ℹ️ Informações</h3>
        <ul style={{ textAlign: 'left', color: '#666' }}>
          <li>Ferramentas administrativas do sistema</li>
          <li>Notificação é enviada via WhatsApp para o administrador</li>
          <li>Use para alertas importantes ou problemas críticos</li>
        </ul>
        
        <p style={{ marginTop: '15px', color: '#999', fontSize: '14px' }}>
          <strong>Nota:</strong> Outras ferramentas de monitoramento (migração, reprocessamento, etc.) 
          podem ser adicionadas conforme necessário. Entre em contato com o desenvolvedor.
        </p>
      </div>
    </div>
  );
}

export default FerramentasMonitoramento;
