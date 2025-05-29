import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';
import EnviarSenhaProvisoria from './components/EnviarSenhaProvisoria';
import EnviarValidacaoCadastro from './components/EnviarValidacaoCadastro';

// Connect to the Socket.io server.
// Replace with your server's URL if it's different.
//const SOCKET_SERVER_URL = 'http://localhost:3100';
const SOCKET_SERVER_URL = 'https://chatbot.centraldosresultados.com:3100';

function App() {
  const [socket, setSocket] = useState(null);
  const [responseArea, setResponseArea] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [status, setStatus] = useState({});
  const [activeTab, setActiveTab] = useState('validacaoCadastro');

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(SOCKET_SERVER_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setResponseArea(prev => prev + 'Conectado ao servidor Socket.io!\\n');
    });

    newSocket.on('disconnect', () => {
      setResponseArea(prev => prev + 'Desconectado do servidor Socket.io.\\n');
    });

    newSocket.on('qrCode', (base64) => {
      setResponseArea(prev => prev + 'QR Code Recebido:\\n');
      setQrCode(base64);
    });

    newSocket.on('mudancaStatus', (statusData) => {
      setResponseArea(prev => prev + `Mudança de Status: ${JSON.stringify(statusData, null, 2)}\\n`);
      setStatus(statusData);
    });

    // Cleanup on component unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Testar Eventos Socket.io (React)</h1>
      </header>
      <div className="container">
        <div className="controls">
          <h2>Conectar/Desconectar WhatsApp</h2>
          <button onClick={() => socket && socket.emit('conectarZap', 'react-test-session', (res) => setResponseArea(prev => prev + res + '\\n'))} disabled={!socket}>
            Conectar ao WhatsApp (Gerar QR)
          </button>
          <button onClick={() => socket && socket.emit('desconectarZap', {}, (res) => setResponseArea(prev => prev + res + '\\n'))} disabled={!socket}>
            Desconectar do WhatsApp
          </button>
          <button onClick={() => socket && socket.emit('verificarConexaoZap', {}, (res) => {
            setResponseArea(prev => prev + `Status Conexão: ${JSON.stringify(res, null, 2)}\\n`);
            setStatus(res);
          })} disabled={!socket}>
            Verificar Conexão WhatsApp
          </button>
          {status && status.Conectado && <p>Status: {status.status} - {status.telefone}</p>}
          {qrCode && (
            <div>
              <p>Escaneie o QR Code para conectar:</p>
              <img src={qrCode} alt="QR Code" />
            </div>
          )}
        </div>

        <div className="tabs">
          <button 
            className={activeTab === 'validacaoCadastro' ? 'active' : ''} 
            onClick={() => setActiveTab('validacaoCadastro')}
          >
            Validação de Cadastro
          </button>
          <button 
            className={activeTab === 'senhaProvisoria' ? 'active' : ''} 
            onClick={() => setActiveTab('senhaProvisoria')}
          >
            Senha Provisória Criador
          </button>
        </div>

        {activeTab === 'validacaoCadastro' && (
          <EnviarValidacaoCadastro socket={socket} setResponseArea={setResponseArea} />
        )}
        {activeTab === 'senhaProvisoria' && (
          <EnviarSenhaProvisoria socket={socket} setResponseArea={setResponseArea} />
        )}

        <div className="response-area">
          <h2>Resposta do Servidor:</h2>
          <pre>{responseArea}</pre>
        </div>
      </div>
    </div>
  );
}

export default App;
