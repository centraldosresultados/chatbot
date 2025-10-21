import React, { useState, useEffect, useRef, useCallback } from 'react';
import './ChatWhatsApp.css';
import { whatsappAPI, mensagensAPI, polling } from '../services/api';

const ChatWhatsApp = ({ setResponseArea }) => {
  const [selectedContact, setSelectedContact] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [contacts, setContacts] = useState([]);
  const [conversations, setConversations] = useState({});
  const [whatsappStatus, setWhatsappStatus] = useState({ connected: false, info: null });
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);


  // Verificar status inicial
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await whatsappAPI.getStatus();
        if (response && response.conectado) {
          setWhatsappStatus({
            connected: true,
            info: response.contato
          });
          setResponseArea(prev => prev + `Status inicial: WhatsApp Conectado - ${response.contato.telefone}\n`);
          loadConversations();
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      }
    };
    checkStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling para status e novas mensagens
  useEffect(() => {
    // Polling para status do WhatsApp (a cada 10 segundos)
    polling.start('chatWhatsappStatus', async () => {
      try {
        const response = await whatsappAPI.getStatus();
        const isConnected = response && response.conectado;
        
        setWhatsappStatus({
          connected: isConnected,
          info: response.contato
        });

        // Se conectou agora, carregar conversas
        if (isConnected && contacts.length === 0) {
          loadConversations();
        }
      } catch (error) {
        console.error('Erro no polling de status:', error);
      }
    }, 10000);

    // Polling para novas mensagens (a cada 3 segundos)
    polling.start('chatWhatsappMessages', async () => {
      try {
        const response = await mensagensAPI.buscarNovas();
        if (response.success && response.mensagens && response.mensagens.length > 0) {
          response.mensagens.forEach(handleNewMessage);
        }
      } catch (error) {
        // Silencioso - pode não haver mensagens novas
      }
    }, 3000);

    // Polling para atualizações de status de mensagens (a cada 5 segundos)
    polling.start('chatWhatsappStatusUpdates', async () => {
      try {
        const response = await mensagensAPI.buscarStatusUpdates();
        if (response.success && response.updates && response.updates.length > 0) {
          response.updates.forEach(handleMessageStatus);
        }
      } catch (error) {
        // Silencioso
      }
    }, 5000);

    // Cleanup
    return () => {
      polling.stop('chatWhatsappStatus');
      polling.stop('chatWhatsappMessages');
      polling.stop('chatWhatsappStatusUpdates');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contacts.length]);

  // Handler para novas mensagens recebidas
  const handleNewMessage = useCallback((messageData) => {
    const { from, body, timestamp, id } = messageData;
    const contactId = from;
    const contactNumber = from.replace('@c.us', '').replace('55', '');
    
    // Atualizar ou criar contato
    setContacts(prev => {
      const existingIndex = prev.findIndex(c => c.id === contactId);
      
      if (existingIndex >= 0) {
        const updatedContacts = [...prev];
        updatedContacts[existingIndex] = {
          ...updatedContacts[existingIndex],
          lastMessage: body,
          timestamp: new Date(timestamp * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          unread: updatedContacts[existingIndex].unread + 1
        };
        return updatedContacts;
      } else {
        return [{
          id: contactId,
          name: `Contato ${contactNumber}`,
          number: contactNumber,
          lastMessage: body,
          timestamp: new Date(timestamp * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          unread: 1,
          avatar: '👤',
          online: false
        }, ...prev];
      }
    });

    // Adicionar mensagem à conversa
    const newMessage = {
      id: id || Date.now(),
      text: body,
      sender: 'other',
      timestamp: new Date(timestamp * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: 'received'
    };

      setConversations(prev => ({
        ...prev,
        [contactId]: [...(prev[contactId] || []), newMessage]
      }));

      setResponseArea(prev => prev + `Nova mensagem de ${contactNumber}: ${body.substring(0, 50)}...\n`);
      
      // Scroll apenas se for a conversa atualmente selecionada
      if (selectedContact && selectedContact.id === contactId) {
        setTimeout(scrollToBottom, 100);
      }
  }, [selectedContact, scrollToBottom, setResponseArea]);

  // Handler para atualização de status de mensagem
  const handleMessageStatus = (update) => {
    const { messageId, status } = update;
    
    // Atualizar status da mensagem em todas as conversas
    setConversations(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(contactId => {
        updated[contactId] = updated[contactId].map(msg => 
          msg.id === messageId ? { ...msg, status } : msg
        );
      });
      return updated;
    });
  };

  // Carregar conversas do WhatsApp
  const loadConversations = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    setResponseArea(prev => prev + 'Carregando conversas do WhatsApp...\n');

    try {
      const response = await mensagensAPI.listarConversas();
      
      if (response.success && response.conversas) {
        const formattedContacts = response.conversas.map(chat => ({
          id: chat.id,
          name: chat.nome || 'Sem nome',
          number: chat.id.split('@')[0].replace(/\D/g, ''),
          lastMessage: chat.ultimaMensagem || '',
          timestamp: chat.timestamp ? new Date(chat.timestamp * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '',
          unread: chat.naoLidas || 0,
          avatar: chat.tipo === 'grupo' ? '👥' : '👤',
          online: false
        }));

        setContacts(formattedContacts);
        setResponseArea(prev => prev + `${formattedContacts.length} conversas carregadas\n`);
      } else {
        setResponseArea(prev => prev + 'Nenhuma conversa encontrada\n');
      }
    } catch (error) {
      setResponseArea(prev => prev + `Erro ao carregar conversas: ${error.message}\n`);
    } finally {
      setLoading(false);
    }
  }, [loading, setResponseArea]);

  // Função para verificar status manualmente (botão)
  const checkWhatsAppStatus = async () => {
    try {
      const response = await whatsappAPI.getStatus();
      setWhatsappStatus({
        connected: response?.conectado || false,
        info: response?.contato || null
      });
      if (response?.conectado) {
        setResponseArea(prev => prev + `Status: WhatsApp Conectado - ${response.contato.telefone}\n`);
      } else {
        setResponseArea(prev => prev + `Status: WhatsApp Desconectado\n`);
      }
    } catch (error) {
      setResponseArea(prev => prev + `Erro ao verificar status: ${error.message}\n`);
    }
  };

  // Carregar mensagens de uma conversa específica
  const loadMessagesForContact = async (contact) => {
    if (!contact) return;

    setResponseArea(prev => prev + `Carregando mensagens de ${contact.name}...\n`);

    try {
      const response = await mensagensAPI.buscarMensagensConversa(contact.id, 50);

      if (response.success && response.mensagens) {
        const formattedMessages = response.mensagens.map(msg => ({
          id: msg.id,
          text: msg.body || '',
          sender: msg.fromMe ? 'me' : 'other',
          timestamp: new Date(msg.timestamp * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          status: getStatusFromAck(msg.ack)
        }));

        setConversations(prev => ({
          ...prev,
          [contact.id]: formattedMessages
        }));

        // Marcar como lido
        setContacts(prev => prev.map(c => 
          c.id === contact.id ? { ...c, unread: 0 } : c
        ));

        setResponseArea(prev => prev + `${formattedMessages.length} mensagens carregadas de ${contact.name}\n`);
      }
    } catch (error) {
      setResponseArea(prev => prev + `Erro ao carregar mensagens: ${error.message}\n`);
    }
  };

  // Converter ack para status
  const getStatusFromAck = (ack) => {
    switch (ack) {
      case 0: return 'pending';
      case 1: return 'sent';
      case 2: return 'delivered';
      case 3: return 'read';
      default: return 'sent';
    }
  };

  // Selecionar contato e carregar mensagens
  const handleContactClick = (contact) => {
    setSelectedContact(contact);
    if (!conversations[contact.id]) {
      loadMessagesForContact(contact);
    } else {
      // Marcar como lido
      setContacts(prev => prev.map(c => 
        c.id === contact.id ? { ...c, unread: 0 } : c
      ));
    }
  };

  // Enviar mensagem
  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedContact) return;

    const numero = selectedContact.number || selectedContact.id.split('@')[0].replace(/\D/g, '');

    // Adicionar mensagem localmente
    const newMessage = {
      id: Date.now(),
      text: messageText,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: 'pending'
    };

      setConversations(prev => ({
        ...prev,
        [selectedContact.id]: [...(prev[selectedContact.id] || []), newMessage]
      }));

      const messageToSend = messageText;
      setMessageText('');
      setResponseArea(prev => prev + `Enviando mensagem para ${numero}...\n`);
      
      // Scroll para a nova mensagem
      setTimeout(scrollToBottom, 100);

    try {
      const response = await mensagensAPI.enviar(numero, messageToSend);

      if (response.success && response.resultado.sucesso) {
        // Atualizar mensagem com status de sucesso
        setConversations(prev => ({
          ...prev,
          [selectedContact.id]: prev[selectedContact.id].map(msg =>
            msg.id === newMessage.id ? { ...msg, status: 'sent', id: response.resultado.id } : msg
          )
        }));

        // Atualizar última mensagem do contato
        setContacts(prev => prev.map(c =>
          c.id === selectedContact.id ? { ...c, lastMessage: messageToSend } : c
        ));

        setResponseArea(prev => prev + `✅ Mensagem enviada com sucesso para ${numero}\n`);
      } else {
        // Marcar como falha
        setConversations(prev => ({
          ...prev,
          [selectedContact.id]: prev[selectedContact.id].map(msg =>
            msg.id === newMessage.id ? { ...msg, status: 'failed' } : msg
          )
        }));

        setResponseArea(prev => prev + `❌ Falha ao enviar mensagem: ${response.resultado.mensagem || 'Erro desconhecido'}\n`);
      }
    } catch (error) {
      setResponseArea(prev => prev + `❌ Erro ao enviar mensagem: ${error.message}\n`);
      
      // Marcar como falha
      setConversations(prev => ({
        ...prev,
        [selectedContact.id]: prev[selectedContact.id].map(msg =>
          msg.id === newMessage.id ? { ...msg, status: 'failed' } : msg
        )
      }));
    }
  };

  // Filtrar contatos
  const filteredContacts = contacts.filter(contact => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      contact.name.toLowerCase().includes(search) ||
      contact.number.includes(search) ||
      (contact.lastMessage && contact.lastMessage.toLowerCase().includes(search))
    );
  });

  // Renderizar indicador de status de mensagem
  const renderMessageStatus = (status) => {
    switch (status) {
      case 'pending':
        return '🕐';
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'read':
        return '✓✓';
      case 'failed':
        return '❌';
      default:
        return '';
    }
  };

  return (
    <div className="chat-container">
      {/* Status do WhatsApp */}
      <div className={`whatsapp-status ${whatsappStatus.connected ? 'connected' : 'disconnected'}`}>
        {whatsappStatus.connected ? (
          <>
            <span className="status-indicator">🟢</span>
            <span>WhatsApp Conectado</span>
            {whatsappStatus.info && whatsappStatus.info.telefone && (
              <span className="phone-number">📱 {whatsappStatus.info.telefone}</span>
            )}
          </>
        ) : (
          <>
            <span className="status-indicator">🔴</span>
            <span>WhatsApp Desconectado</span>
            <button onClick={checkWhatsAppStatus} style={{ marginLeft: '10px', padding: '5px 10px' }}>
              Verificar Status
            </button>
          </>
        )}
        <button 
          onClick={loadConversations} 
          disabled={!whatsappStatus.connected || loading}
          style={{ marginLeft: '10px', padding: '5px 10px' }}
        >
          {loading ? 'Carregando...' : '🔄 Atualizar Conversas'}
        </button>
      </div>

      <div className="chat-layout">
        {/* Lista de Contatos */}
        <div className="contacts-panel">
          <div className="contacts-header">
            <h3>💬 Conversas</h3>
            <div className="search-box">
              <input
                type="text"
                placeholder="🔍 Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="contacts-list">
            {!whatsappStatus.connected ? (
              <div className="no-connection-message">
                <p>WhatsApp não conectado.</p>
                <p>Conecte o WhatsApp no menu lateral.</p>
              </div>
            ) : loading ? (
              <div className="loading-message">
                Carregando conversas...
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="no-contacts-message">
                <p>Nenhuma conversa encontrada.</p>
                <button onClick={loadConversations}>Atualizar</button>
              </div>
            ) : (
              filteredContacts.map(contact => (
                <div
                  key={contact.id}
                  className={`contact-item ${selectedContact?.id === contact.id ? 'active' : ''}`}
                  onClick={() => handleContactClick(contact)}
                >
                  <div className="contact-avatar">
                    {contact.avatar}
                    {contact.online && <span className="online-indicator"></span>}
                  </div>
                  <div className="contact-info">
                    <div className="contact-header">
                      <span className="contact-name">{contact.name}</span>
                      <span className="contact-timestamp">{contact.timestamp}</span>
                    </div>
                    <div className="contact-last-message">
                      {contact.lastMessage}
                    </div>
                  </div>
                  {contact.unread > 0 && (
                    <div className="unread-badge">{contact.unread}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Área de Mensagens */}
        <div className="messages-panel">
          {selectedContact ? (
            <>
              {/* Header da conversa */}
              <div className="messages-header">
                <div className="contact-header-info">
                  <span className="contact-avatar">{selectedContact.avatar}</span>
                  <div>
                    <div className="contact-name">{selectedContact.name}</div>
                    <div className="contact-number">{selectedContact.number}</div>
                  </div>
                </div>
              </div>

              {/* Lista de mensagens */}
              <div className="messages-list">
                {conversations[selectedContact.id] && conversations[selectedContact.id].length > 0 ? (
                  <>
                    {conversations[selectedContact.id].map((message) => (
                      <div
                        key={message.id}
                        className={`message ${message.sender === 'me' ? 'message-sent' : 'message-received'}`}
                      >
                        <div className="message-content">
                          <div className="message-text">{message.text}</div>
                          <div className="message-footer">
                            <span className="message-time">{message.timestamp}</span>
                            {message.sender === 'me' && (
                              <span className="message-status">{renderMessageStatus(message.status)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div className="no-messages">
                    Nenhuma mensagem nesta conversa.
                  </div>
                )}
              </div>

              {/* Input de mensagem */}
              <div className="message-input-container">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Digite sua mensagem..."
                  className="message-input"
                  disabled={!whatsappStatus.connected}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || !whatsappStatus.connected}
                  className="send-button"
                >
                  ➤ Enviar
                </button>
              </div>
            </>
          ) : (
            <div className="no-selected-contact">
              <div className="empty-state">
                <span className="empty-icon">💬</span>
                <h3>Selecione uma conversa</h3>
                <p>Escolha um contato na lista à esquerda para ver as mensagens.</p>
                {whatsappStatus.connected && contacts.length === 0 && (
                  <button onClick={loadConversations} disabled={loading}>
                    {loading ? 'Carregando...' : 'Carregar Conversas'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatWhatsApp;
