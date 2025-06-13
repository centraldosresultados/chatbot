import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';
import EnviarSenhaProvisoria from './components/EnviarSenhaProvisoria';
import EnviarValidacaoCadastro from './components/EnviarValidacaoCadastro';
import EnviarMensagemParaTodos from './components/EnviarMensagemParaTodos';
import ListaValidacoesCadastro from './components/ListaValidacoesCadastro';
import ListaEnviosSenhas from './components/ListaEnviosSenhas';
import ListaMensagensEnviadas from './components/ListaMensagensEnviadas';
import ChatWhatsApp from './components/ChatWhatsApp';

// Connect to the Socket.io server.
// Replace with your server's URL if it's different.
const SOCKET_SERVER_URL = 'http://localhost:3100';
//const SOCKET_SERVER_URL = 'https://chatbot.centraldosresultados.com:3100';

function App() {
  const [socket, setSocket] = useState(null);
  const [responseArea, setResponseArea] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [status, setStatus] = useState({});
  const [activeTab, setActiveTab] = useState('chat');
  
  // Estados para controlar expansão/compressão
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isLogsCollapsed, setIsLogsCollapsed] = useState(false);
  
  // Estados do sistema de login
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ login: '', senha: '' });
  const [loginError, setLoginError] = useState('');

  // Verificar se há login salvo no localStorage
  useEffect(() => {
    const savedLogin = localStorage.getItem('chatbot_login');
    if (savedLogin === 'authenticated') {
      setIsLoggedIn(true);
    }
  }, []);

  // Função de login
  const handleLogin = (e) => {
    e.preventDefault();
    
    if (loginForm.login === 'chatbot' && loginForm.senha === 'criadores') {
      setIsLoggedIn(true);
      localStorage.setItem('chatbot_login', 'authenticated');
      setLoginError('');
    } else {
      setLoginError('Login ou senha incorretos');
    }
  };

  // Função de logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('chatbot_login');
    if (socket) {
      socket.disconnect();
    }
  };

  useEffect(() => {
    // Initialize socket connection only if logged in
    if (isLoggedIn) {
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
    }
  }, [isLoggedIn]);

  return (
    <div className="App">
      {!isLoggedIn ? (
        // Tela de Login
        <div className="login-container">
          <div className="login-box">
            <h2>Central de Resultados - WhatsApp Bot</h2>
            <p>Faça login para acessar o sistema</p>
            
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label htmlFor="login">Login:</label>
                <input
                  type="text"
                  id="login"
                  value={loginForm.login}
                  onChange={(e) => setLoginForm({...loginForm, login: e.target.value})}
                  placeholder="Digite seu login"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="senha">Senha:</label>
                <input
                  type="password"
                  id="senha"
                  value={loginForm.senha}
                  onChange={(e) => setLoginForm({...loginForm, senha: e.target.value})}
                  placeholder="Digite sua senha"
                  required
                />
              </div>
              
              {loginError && <div className="login-error">{loginError}</div>}
              
              <button type="submit" className="login-button">Entrar</button>
            </form>
            
            {/* <div className="login-hint">
              <small>Dica: login = chatbot, senha = criadores</small>
            </div> */}
          </div>
        </div>
      ) : (
        // Interface principal (já logado)
        <div className="app-layout">
          <header className="App-header">
            <h1>Central de Resultados - WhatsApp Bot</h1>
            <button onClick={handleLogout} className="logout-button">Sair</button>
          </header>
          
          <div className="main-layout">
        {/* Menu Lateral */}
        <nav className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <h3>{isSidebarCollapsed ? '' : 'Menu Principal'}</h3>
            <button 
              className="collapse-toggle"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? 'Expandir Menu' : 'Comprimir Menu'}
            >
              {isSidebarCollapsed ? '→' : '←'}
            </button>
          </div>
          
          {!isSidebarCollapsed && (
            <>
              <ul className="sidebar-menu">
                <li>
                  <button 
                    className={activeTab === 'chat' ? 'active' : ''} 
                    onClick={() => setActiveTab('chat')}
                  >
                    💬 Chat WhatsApp
                  </button>
                </li>
                <li>
                  <button 
                    className={activeTab === 'enviarMensagem' ? 'active' : ''} 
                    onClick={() => setActiveTab('enviarMensagem')}
                  >
                    📧 Enviar Mensagem Para Todos
                  </button>
                </li>
                <li>
                  <button 
                    className={activeTab === 'validacaoCadastro' ? 'active' : ''} 
                    onClick={() => setActiveTab('validacaoCadastro')}
                  >
                    ✅ Validação de Cadastro
                  </button>
                </li>
                <li>
                  <button 
                    className={activeTab === 'senhaProvisoria' ? 'active' : ''} 
                    onClick={() => setActiveTab('senhaProvisoria')}
                  >
                    🔑 Senha Provisória Criador
                  </button>
                </li>
                <li>
                  <button 
                    className={activeTab === 'listaValidacoes' ? 'active' : ''} 
                    onClick={() => setActiveTab('listaValidacoes')}
                  >
                    📋 Lista Validações Cadastro
                  </button>
                </li>
                <li>
                  <button 
                    className={activeTab === 'listaEnviosSenhas' ? 'active' : ''} 
                    onClick={() => setActiveTab('listaEnviosSenhas')}
                  >
                    📄 Lista Envios de Senhas
                  </button>
                </li>
                <li>
                  <button 
                    className={activeTab === 'listaMensagens' ? 'active' : ''} 
                    onClick={() => setActiveTab('listaMensagens')}
                  >
                    💬 Lista Mensagens Enviadas
                  </button>
                </li>
              </ul>

              {/* Controles WhatsApp no Menu Lateral */}
              <div className="whatsapp-controls">
                <h4>Conexão WhatsApp</h4>
                <div className="control-buttons">
                  <button onClick={() => socket && socket.emit('conectarZap', 'react-test-session', (res) => setResponseArea(prev => prev + res + '\n'))} disabled={!socket}>
                    Conectar
                  </button>
                  <button onClick={() => socket && socket.emit('desconectarZap', {}, (res) => setResponseArea(prev => prev + res + '\n'))} disabled={!socket}>
                    Desconectar
                  </button>
                  <button onClick={() => socket && socket.emit('verificarConexaoZap', {}, (res) => {
                    setResponseArea(prev => prev + `Status: ${JSON.stringify(res, null, 2)}\n`);
                    setStatus(res);
                  })} disabled={!socket}>
                    Verificar
                  </button>
                </div>
                {status && status.Conectado && (
                  <div className="status-info">
                    <p>✅ {status.status}</p>
                    <p>📱 {status.telefone}</p>
                  </div>
                )}
                {qrCode && (
                  <div className="qr-code">
                    <p>Escaneie o QR Code:</p>
                    <img src={qrCode} alt="QR Code" />
                  </div>
                )}
              </div>
            </>
          )}
          
          {/* Menu comprimido - apenas ícones */}
          {isSidebarCollapsed && (
            <div className="sidebar-collapsed-menu">
              <button 
                className={`icon-button ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => setActiveTab('chat')}
                title="Chat WhatsApp"
              >
                💬
              </button>
              <button 
                className={`icon-button ${activeTab === 'enviarMensagem' ? 'active' : ''}`}
                onClick={() => setActiveTab('enviarMensagem')}
                title="Enviar Mensagem Para Todos"
              >
                📧
              </button>
              <button 
                className={`icon-button ${activeTab === 'validacaoCadastro' ? 'active' : ''}`}
                onClick={() => setActiveTab('validacaoCadastro')}
                title="Validação de Cadastro"
              >
                ✅
              </button>
              <button 
                className={`icon-button ${activeTab === 'senhaProvisoria' ? 'active' : ''}`}
                onClick={() => setActiveTab('senhaProvisoria')}
                title="Senha Provisória Criador"
              >
                🔑
              </button>
              <button 
                className={`icon-button ${activeTab === 'listaValidacoes' ? 'active' : ''}`}
                onClick={() => setActiveTab('listaValidacoes')}
                title="Lista Validações Cadastro"
              >
                📋
              </button>
              <button 
                className={`icon-button ${activeTab === 'listaEnviosSenhas' ? 'active' : ''}`}
                onClick={() => setActiveTab('listaEnviosSenhas')}
                title="Lista Envios de Senhas"
              >
                📄
              </button>
              <button 
                className={`icon-button ${activeTab === 'listaMensagens' ? 'active' : ''}`}
                onClick={() => setActiveTab('listaMensagens')}
                title="Lista Mensagens Enviadas"
              >
                💬
              </button>
            </div>
          )}
        </nav>

        {/* Conteúdo Principal */}
        <main className="main-content">
          {activeTab === 'chat' && (
            <ChatWhatsApp socket={socket} setResponseArea={setResponseArea} />
          )}
          {activeTab === 'enviarMensagem' && (
            <EnviarMensagemParaTodos socket={socket} setResponseArea={setResponseArea} />
          )}
          {activeTab === 'validacaoCadastro' && (
            <EnviarValidacaoCadastro socket={socket} setResponseArea={setResponseArea} />
          )}
          {activeTab === 'senhaProvisoria' && (
            <EnviarSenhaProvisoria socket={socket} setResponseArea={setResponseArea} />
          )}
          {activeTab === 'listaValidacoes' && (
            <ListaValidacoesCadastro socket={socket} setResponseArea={setResponseArea} />
          )}
          {activeTab === 'listaEnviosSenhas' && (
            <ListaEnviosSenhas socket={socket} setResponseArea={setResponseArea} />
          )}
          {activeTab === 'listaMensagens' && (
            <ListaMensagensEnviadas socket={socket} setResponseArea={setResponseArea} />
          )}
        </main>
        </div>

        {/* Área de Resposta - Agora fixa na parte inferior com expansão/compressão */}
        <div className={`response-area-container ${isLogsCollapsed ? 'collapsed' : ''}`}>
          <div className="response-area">
            <div className="response-header">
              <h3>{isLogsCollapsed ? 'Logs' : 'Log do Sistema:'}</h3>
              <button 
                className="collapse-toggle"
                onClick={() => setIsLogsCollapsed(!isLogsCollapsed)}
                title={isLogsCollapsed ? 'Expandir Logs' : 'Comprimir Logs'}
              >
                {isLogsCollapsed ? '↑' : '↓'}
              </button>
            </div>
            
            {!isLogsCollapsed && (
              <>
                <pre>{responseArea}</pre>
                <button 
                  className="clear-log" 
                  onClick={() => setResponseArea('')}
                >
                  Limpar Log
                </button>
              </>
            )}
          </div>
        </div>
        </div>
      )}
    </div>
  );
}

export default App;
