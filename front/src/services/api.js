/**
 * Serviço de API REST para substituir Socket.io
 * Centraliza todas as chamadas HTTP ao backend Express
 */

// Em desenvolvimento, o proxy do CRA redireciona /api para o backend
// Em produção, usa a variável de ambiente ou URL absoluta
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? '' // Proxy do CRA cuida disso
  : (process.env.REACT_APP_API_URL || 'https://api.chatbot.centraldosresultados.com');

/**
 * Utilitário para fazer requisições HTTP
 */
const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Erro na requisição ${endpoint}:`, error);
    throw error;
  }
};

/**
 * API de Conexão WhatsApp
 */
export const whatsappAPI = {
  // Obter status da conexão
  getStatus: () => request('/api/status'),
  
  // Obter QR Code
  getQRCode: () => request('/api/qrcode'),
  
  // Conectar WhatsApp
  connect: (nomeSessao = '', tipoInicializacao = 'padrao') => 
    request('/api/conectar', {
      method: 'POST',
      body: JSON.stringify({ nomeSessao, tipoInicializacao })
    }),
  
  // Desconectar WhatsApp
  disconnect: () => request('/api/disconnect', { method: 'POST' }),
  
  // Deslogar WhatsApp (remove credenciais)
  logout: () => request('/api/logout', { method: 'POST' }),
  
  // Obter número conectado
  getConnectedNumber: () => request('/api/connected-number')
};

/**
 * API de Mensagens
 */
export const mensagensAPI = {
  // Enviar mensagem individual
  enviar: (numero, mensagem, imagem = null) =>
    request('/api/mensagens/enviar', {
      method: 'POST',
      body: JSON.stringify({ numero, mensagem, imagem })
    }),
  
  // Listar conversas
  listarConversas: () => request('/api/conversas'),
  
  // Buscar mensagens de uma conversa
  buscarMensagensConversa: (chatId, limit = 50) =>
    request(`/api/conversas/${encodeURIComponent(chatId)}/mensagens?limit=${limit}`),
  
  // Buscar novas mensagens (polling)
  buscarNovas: () => request('/api/mensagens/novas'),
  
  // Buscar atualizações de status (polling)
  buscarStatusUpdates: () => request('/api/mensagens/status-updates'),
  
  // Listar mensagens enviadas (MongoDB)
  listarEnviadas: () => request('/api/historico/mensagens?tabela=tb_envio_mensagens'),
  
  // Buscar mensagem por ID
  buscarPorId: (id) => request(`/api/historico/mensagens?tabela=tb_envio_mensagens&id=${id}`)
};

/**
 * API de Validações
 */
export const validacoesAPI = {
  // Enviar validação de cadastro
  enviar: (nome, telefone) =>
    request('/api/validacao/enviar', {
      method: 'POST',
      body: JSON.stringify({ nome, telefone })
    }),
  
  // Listar validações
  listar: () => request('/api/envios/pendentes?tipo=validacao'),
  
  // Reenviar validação existente
  reenviar: (nome, telefone) =>
    request('/api/validacao/enviar', {
      method: 'POST',
      body: JSON.stringify({ nome, telefone })
    })
};

/**
 * API de Senhas
 */
export const senhasAPI = {
  // Enviar senha provisória
  enviar: (dados) =>
    request('/api/senha/enviar', {
      method: 'POST',
      body: JSON.stringify(dados)
    }),
  
  // Listar envios de senhas
  listar: () => request('/api/envios/pendentes?tipo=senha')
};

/**
 * API de Criadores
 */
export const criadoresAPI = {
  // Listar todos os criadores
  listarTodos: () => request('/api/criadores'),
  
  // Buscar criadores selecionados
  buscarSelecionados: (ids) =>
    request('/api/criadores/selecionados', {
      method: 'POST',
      body: JSON.stringify({ ids })
    })
};

/**
 * API de Notificações
 */
export const notificacoesAPI = {
  // Notificar administrador
  notificar: (mensagem) =>
    request('/api/notificar/administrador', {
      method: 'POST',
      body: JSON.stringify({ mensagem })
    })
};

/**
 * API de Histórico
 */
export const historicoAPI = {
  // Buscar envios pendentes
  buscarPendentes: (tipo = 'todos') =>
    request(`/api/envios/pendentes?tipo=${tipo}`),
  
  // Buscar histórico de mensagens
  buscarMensagens: (tabela = 'tb_envio_mensagens', limit = 100, offset = 0) =>
    request(`/api/historico/mensagens?tabela=${tabela}&limit=${limit}&offset=${offset}`)
};

/**
 * Health Check
 */
export const healthCheck = () => request('/health');

/**
 * Polling Service
 * Gerencia polling para substituir eventos em tempo real
 */
export class PollingService {
  constructor() {
    this.intervals = new Map();
  }

  /**
   * Inicia polling para um determinado endpoint
   */
  start(key, callback, intervalMs = 2000) {
    this.stop(key); // Para polling anterior se existir
    
    const interval = setInterval(async () => {
      try {
        await callback();
      } catch (error) {
        console.error(`Erro no polling ${key}:`, error);
      }
    }, intervalMs);
    
    this.intervals.set(key, interval);
  }

  /**
   * Para polling específico
   */
  stop(key) {
    const interval = this.intervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(key);
    }
  }

  /**
   * Para todos os pollings
   */
  stopAll() {
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals.clear();
  }
}

export const polling = new PollingService();

export default {
  whatsappAPI,
  mensagensAPI,
  validacoesAPI,
  senhasAPI,
  criadoresAPI,
  notificacoesAPI,
  historicoAPI,
  healthCheck,
  polling
};

