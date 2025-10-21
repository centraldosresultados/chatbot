import React, { useState, useEffect } from 'react';
import './App.css';
import EnviarSenhaProvisoria from './components/EnviarSenhaProvisoria';
import EnviarValidacaoCadastro from './components/EnviarValidacaoCadastro';
import EnviarMensagemParaTodos from './components/EnviarMensagemParaTodos';
import ListaValidacoesCadastro from './components/ListaValidacoesCadastro';
import ListaEnviosSenhas from './components/ListaEnviosSenhas';
import ListaMensagensEnviadas from './components/ListaMensagensEnviadas';
import ChatWhatsApp from './components/ChatWhatsApp';
import TesteReenvioAlternativo from './components/TesteReenvioAlternativo';
import FerramentasMonitoramento from './components/FerramentasMonitoramento';
import { whatsappAPI, polling } from './services/api';

function App() {
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
    polling.stopAll(); // Para todos os pollings
  };

  // Polling para status e QR Code quando logado
  useEffect(() => {
    if (isLoggedIn) {
      setResponseArea(prev => prev + 'Conectado ao servidor Express!\n');

      // Polling para status do WhatsApp (a cada 5 segundos)
      polling.start('status', async () => {
        try {
          const data = await whatsappAPI.getStatus();
          if (data.success && data.contato) {
            setStatus(data.contato);
          }
        } catch (error) {
          console.error('Erro ao buscar status:', error);
        }
      }, 5000);

      // Polling para QR Code (a cada 2 segundos, apenas quando não está conectado)
      polling.start('qrcode', async () => {
        try {
          if (!status.Conectado) {
            const data = await whatsappAPI.getQRCode();
            if (data.success && data.qrCode) {
              setQrCode(data.qrCode);
              setResponseArea(prev => prev + 'QR Code recebido!\n');
            } else {
              setQrCode('');
            }
          } else {
            setQrCode(''); // Limpa QR Code quando conectado
          }
        } catch (error) {
          // Silencioso - QR Code pode não estar disponível
        }
      }, 2000);

      // Cleanup ao deslogar
      return () => {
        polling.stopAll();
      };
    }
  }, [isLoggedIn, status.Conectado]);

  // Funções de controle WhatsApp
  const handleConectar = async () => {
    try {
      const data = await whatsappAPI.connect('react-session');
      setResponseArea(prev => prev + `Conectar: ${data.message}\n`);
    } catch (error) {
      setResponseArea(prev => prev + `Erro ao conectar: ${error.message}\n`);
    }
  };

  const handleDesconectar = async () => {
    try {
      const data = await whatsappAPI.disconnect();
      setResponseArea(prev => prev + `Desconectar: ${data.message}\n`);
      setStatus({});
      setQrCode('');
    } catch (error) {
      setResponseArea(prev => prev + `Erro ao desconectar: ${error.message}\n`);
    }
  };

  const handleVerificar = async () => {
    try {
      const data = await whatsappAPI.getStatus();
      setResponseArea(prev => prev + `Status: ${JSON.stringify(data.contato, null, 2)}\n`);
      setStatus(data.contato || {});
    } catch (error) {
      setResponseArea(prev => prev + `Erro ao verificar: ${error.message}\n`);
    }
  };

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
          </div>
        </div>
      ) : (
        // Interface principal (já logado)
        <div className="app-layout">
          <header className="App-header">
            <h1>Central de Resultados - WhatsApp Bot (Express API)</h1>
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
                <li>
                  <button 
                    className={activeTab === 'reenvioAlternativo' ? 'active' : ''} 
                    onClick={() => setActiveTab('reenvioAlternativo')}
                  >
                    🔄 Reenvio Alternativo
                  </button>
                </li>
                <li>
                  <button 
                    className={activeTab === 'ferramentasMonitoramento' ? 'active' : ''} 
                    onClick={() => setActiveTab('ferramentasMonitoramento')}
                  >
                    🛠️ Ferramentas
                  </button>
                </li>
              </ul>

              {/* Controles WhatsApp no Menu Lateral */}
              <div className="whatsapp-controls">
                <h4>Conexão WhatsApp</h4>
                <div className="control-buttons">
                  <button onClick={handleConectar}>
                    Conectar
                  </button>
                  <button onClick={handleDesconectar}>
                    Desconectar
                  </button>
                  <button onClick={handleVerificar}>
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
              <button 
                className={`icon-button ${activeTab === 'reenvioAlternativo' ? 'active' : ''}`}
                onClick={() => setActiveTab('reenvioAlternativo')}
                title="Reenvio Alternativo"
              >
                🔄
              </button>
            </div>
          )}
        </nav>

        {/* Conteúdo Principal */}
        <main className="main-content">
          {activeTab === 'chat' && (
            <ChatWhatsApp setResponseArea={setResponseArea} />
          )}
          {activeTab === 'enviarMensagem' && (
            <EnviarMensagemParaTodos setResponseArea={setResponseArea} />
          )}
          {activeTab === 'validacaoCadastro' && (
            <EnviarValidacaoCadastro setResponseArea={setResponseArea} />
          )}
          {activeTab === 'senhaProvisoria' && (
            <EnviarSenhaProvisoria setResponseArea={setResponseArea} />
          )}
          {activeTab === 'listaValidacoes' && (
            <ListaValidacoesCadastro setResponseArea={setResponseArea} />
          )}
          {activeTab === 'listaEnviosSenhas' && (
            <ListaEnviosSenhas setResponseArea={setResponseArea} />
          )}
          {activeTab === 'listaMensagens' && (
            <ListaMensagensEnviadas setResponseArea={setResponseArea} />
          )}
          {activeTab === 'reenvioAlternativo' && (
            <TesteReenvioAlternativo setResponseArea={setResponseArea} />
          )}
          {activeTab === 'ferramentasMonitoramento' && (
            <FerramentasMonitoramento setResponseArea={setResponseArea} />
          )}
          {activeTab === 'testarNumero' && (
            <div className="event-test">
              <h2>🧪 Testar Número</h2>
              <p>Funcionalidade de teste de número disponível.</p>
            </div>
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
