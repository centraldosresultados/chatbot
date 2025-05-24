import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

// Connect to the Socket.io server.
// Replace with your server's URL if it\'s different.
const SOCKET_SERVER_URL = 'http://localhost:3100';

function App() {
  const [socket, setSocket] = useState(null);
  const [nomeCadastro, setNomeCadastro] = useState('');
  const [telefoneCadastro, setTelefoneCadastro] = useState('');
  const [responseArea, setResponseArea] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [status, setStatus] = useState({});

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

  const handleEnviarValidacaoCadastro = () => {
    if (!nomeCadastro || !telefoneCadastro) {
      alert('Por favor, preencha Nome e Telefone.');
      return;
    }
    if (socket) {
      setResponseArea(prev => prev + 'Enviando solicitação de validação de cadastro...\\n');
      socket.emit('enviarValidacaoCadastro', { nome: nomeCadastro, telefone: telefoneCadastro }, (response) => {
        setResponseArea(prev => prev + `Resposta de "enviarValidacaoCadastro":\\n${JSON.stringify(response, null, 2)}\\n`);
      });
    } else {
      alert('Socket não conectado.');
    }
  };

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

        <div className="event-test">
          <h2>Enviar Validação de Cadastro</h2>
          <div>
            <label htmlFor="nomeCadastro">Nome:</label>
            <input
              type="text"
              id="nomeCadastro"
              value={nomeCadastro}
              onChange={(e) => setNomeCadastro(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="telefoneCadastro">Telefone (ex: 11999998888):</label>
            <input
              type="text"
              id="telefoneCadastro"
              value={telefoneCadastro}
              onChange={(e) => setTelefoneCadastro(e.target.value)}
            />
          </div>
          <button onClick={handleEnviarValidacaoCadastro} disabled={!socket}>
            Enviar Validação Cadastro
          </button>
        </div>

        <div className="response-area">
          <h2>Resposta do Servidor:</h2>
          <pre>{responseArea}</pre>
        </div>
      </div>
    </div>
  );
}

export default App;
