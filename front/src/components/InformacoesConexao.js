import React, { useState, useEffect } from 'react';
import { whatsappAPI } from '../services/api';
import './InformacoesConexao.css';

function InformacoesConexao() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  const loadStatus = async () => {
    setLoading(true);
    try {
      const data = await whatsappAPI.getStatus();
      setStatus(data);
      addLog('Status atualizado com sucesso', 'success');
    } catch (error) {
      addLog(`Erro ao carregar status: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    addLog('Iniciando conexão com WhatsApp...', 'info');
    try {
      const response = await whatsappAPI.connect('', 'padrao');
      addLog(response.message || 'Conexão iniciada', 'success');
      setTimeout(loadStatus, 2000);
    } catch (error) {
      addLog(`Erro ao conectar: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Deseja realmente desconectar do WhatsApp?')) return;
    
    setLoading(true);
    addLog('Desconectando...', 'info');
    try {
      const response = await whatsappAPI.disconnect();
      addLog(response.message || 'Desconectado', 'success');
      setTimeout(loadStatus, 1000);
    } catch (error) {
      addLog(`Erro ao desconectar: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  useEffect(() => {
    loadStatus();
    
    // Auto-refresh a cada 10 segundos
    const interval = setInterval(loadStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="informacoes-conexao">
      <div className="info-header">
        <h2>📡 Informações de Conexão - Baileys 7.0</h2>
        <div className="info-actions">
          <button onClick={loadStatus} disabled={loading} className="btn-refresh">
            🔄 Atualizar
          </button>
          {status?.conectado ? (
            <button onClick={handleDisconnect} disabled={loading} className="btn-danger">
              🔌 Desconectar
            </button>
          ) : (
            <button onClick={handleConnect} disabled={loading} className="btn-success">
              ▶️ Conectar WhatsApp
            </button>
          )}
        </div>
      </div>

      {/* Status Card */}
      <div className="status-card">
        <h3>Status da Conexão</h3>
        {status ? (
          <div className="status-grid">
            <div className="status-item">
              <span className="label">Status:</span>
              <span className={`value ${status.conectado ? 'connected' : 'disconnected'}`}>
                {status.conectado ? '✅ Conectado' : '❌ Desconectado'}
              </span>
            </div>
            <div className="status-item">
              <span className="label">Telefone:</span>
              <span className="value">{status.contato?.telefone || 'N/A'}</span>
            </div>
            {status.debug && (
              <>
                <div className="status-item">
                  <span className="label">Connection Status:</span>
                  <span className="value">{status.debug.connectionStatus}</span>
                </div>
                <div className="status-item">
                  <span className="label">Socket:</span>
                  <span className="value">{status.debug.temSock ? '✅ Ativo' : '❌ Inativo'}</span>
                </div>
                <div className="status-item">
                  <span className="label">Info:</span>
                  <span className="value">{status.debug.temInfo ? '✅ Disponível' : '❌ Indisponível'}</span>
                </div>
                <div className="status-item">
                  <span className="label">Número:</span>
                  <span className="value">{status.debug.numero || 'N/A'}</span>
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="loading">Carregando...</p>
        )}
      </div>

      {/* Comandos Rápidos */}
      <div className="comandos-card">
        <h3>⚡ Comandos Rápidos</h3>
        <div className="comandos-grid">
          <div className="comando-item">
            <strong>Conectar:</strong>
            <code>POST /api/conectar</code>
          </div>
          <div className="comando-item">
            <strong>Status:</strong>
            <code>GET /api/status</code>
          </div>
          <div className="comando-item">
            <strong>QR Code:</strong>
            <code>GET /api/qrcode</code>
          </div>
          <div className="comando-item">
            <strong>Enviar Mensagem:</strong>
            <code>POST /api/mensagens/enviar</code>
          </div>
          <div className="comando-item">
            <strong>Validação:</strong>
            <code>POST /api/validacao/enviar</code>
          </div>
          <div className="comando-item">
            <strong>Senha:</strong>
            <code>POST /api/senha/enviar</code>
          </div>
        </div>
      </div>

      {/* Informações Técnicas */}
      <div className="tech-card">
        <h3>🔧 Informações Técnicas</h3>
        <div className="tech-grid">
          <div className="tech-item">
            <span className="label">Biblioteca:</span>
            <span className="value">@whiskeysockets/baileys 7.0.0-rc.6</span>
          </div>
          <div className="tech-item">
            <span className="label">Tipo:</span>
            <span className="value">ES Modules</span>
          </div>
          <div className="tech-item">
            <span className="label">Backend:</span>
            <span className="value">Express.js</span>
          </div>
          <div className="tech-item">
            <span className="label">Autenticação:</span>
            <span className="value">./auth_info_baileys/</span>
          </div>
          <div className="tech-item">
            <span className="label">Porta:</span>
            <span className="value">3100</span>
          </div>
          <div className="tech-item">
            <span className="label">API Base:</span>
            <span className="value">http://localhost:3100</span>
          </div>
        </div>
      </div>

      {/* Logs do Sistema */}
      <div className="logs-card">
        <div className="logs-header">
          <h3>📋 Logs do Sistema</h3>
          <button onClick={clearLogs} className="btn-clear">
            🗑️ Limpar
          </button>
        </div>
        <div className="logs-container">
          {logs.length === 0 ? (
            <p className="no-logs">Nenhum log ainda...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className={`log-entry log-${log.type}`}>
                <span className="log-time">[{log.timestamp}]</span>
                <span className="log-message">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Instruções */}
      <div className="instructions-card">
        <h3>📖 Instruções de Uso</h3>
        <ol>
          <li>Clique em <strong>"Conectar WhatsApp"</strong> para gerar o QR Code</li>
          <li>Acesse a aba <strong>"Chat WhatsApp"</strong> e escaneie o QR Code com seu celular</li>
          <li>Aguarde a conexão ser estabelecida (status ficará verde)</li>
          <li>Use as outras abas para enviar mensagens, validações e senhas</li>
        </ol>
        
        <div className="warning-box">
          <strong>⚠️ Atenção:</strong>
          <ul>
            <li>Mantenha o backend rodando para manter a conexão ativa</li>
            <li>As credenciais são salvas em <code>auth_info_baileys/</code></li>
            <li>Para resetar completamente, delete a pasta <code>auth_info_baileys/</code> no backend</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default InformacoesConexao;

