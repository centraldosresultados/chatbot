import React, { useState, useEffect, useRef } from 'react';
import './ChatWhatsApp.css';

const ChatWhatsApp = ({ socket, setResponseArea }) => {
  const [selectedContact, setSelectedContact] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [contacts, setContacts] = useState([]);
  const [conversations, setConversations] = useState({});
  const [whatsappStatus, setWhatsappStatus] = useState({ connected: false, info: null });

  const messagesEndRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedContact, conversations]);

  // Socket listeners para mensagens em tempo real
  useEffect(() => {
    if (!socket) return;

    // Listener para status do WhatsApp
    const handleStatusChange = (status) => {
      setWhatsappStatus({
        connected: status.Conectado || false,
        info: status
      });
      setResponseArea(prev => prev + `WhatsApp Status: ${status.status}\n`);
    };

    // Listener para mensagens recebidas em tempo real
    const handleNewMessage = (messageData) => {
      const { from, body, timestamp, id } = messageData;
      const contactId = from; // Usar o ID completo como identificador
      const contactNumber = from.replace('@c.us', '').replace('55', '');
      
      // Encontrar contato existente ou criar um novo
      setContacts(prev => {
        const existingIndex = prev.findIndex(c => c.id === contactId);
        
        if (existingIndex >= 0) {
          // Atualizar contato existente
          const updatedContacts = [...prev];
          updatedContacts[existingIndex] = {
            ...updatedContacts[existingIndex],
            lastMessage: body,
            timestamp: new Date(timestamp * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            unread: updatedContacts[existingIndex].unread + 1
          };
          return updatedContacts;
        } else {
          // Criar novo contato
          const newContact = {
            id: contactId,
            name: `Contato ${contactNumber}`,
            number: contactNumber,
            lastMessage: body,
            timestamp: new Date(timestamp * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            unread: 1,
            avatar: '👤',
            online: false
          };
          return [newContact, ...prev];
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

      setResponseArea(prev => prev + `Nova mensagem de ${contactNumber}: ${body}\n`);
    };

    // Listener para atualizações de status de mensagens enviadas
    const handleMessageStatus = (statusData) => {
      const { messageId, status } = statusData;
      
      console.log('Status atualizado:', statusData); // Debug
      
      // Atualizar status da mensagem nas conversas
      setConversations(prev => {
        const updated = { ...prev };
        let found = false;
        
        Object.keys(updated).forEach(contactId => {
          updated[contactId] = updated[contactId].map(msg => {
            // Verificar tanto pelo ID original quanto pelo ID do WhatsApp
            if (msg.id === messageId || msg.whatsappId === messageId) {
              found = true;
              return { ...msg, status };
            }
            return msg;
          });
        });
        
        if (found) {
          setResponseArea(prev => prev + `Status da mensagem atualizado para: ${status}\n`);
        }
        
        return updated;
      });
    };

    socket.on('mudancaStatus', handleStatusChange);
    socket.on('novaMensagemRecebida', handleNewMessage);
    socket.on('statusMensagemAtualizado', handleMessageStatus);

    return () => {
      socket.off('mudancaStatus', handleStatusChange);
      socket.off('novaMensagemRecebida', handleNewMessage);
      socket.off('statusMensagemAtualizado', handleMessageStatus);
    };
  }, [socket, setResponseArea]);

  // Carregar conversas reais do WhatsApp
  useEffect(() => {
    if (!socket) return;

    const carregarConversas = () => {
      socket.emit('obterConversasWhatsApp', {}, (response) => {
        if (response.sucesso && response.conversas) {
          const conversasWhatsApp = response.conversas.map((conversa) => {
            const formatTimestamp = (timestamp) => {
              if (!timestamp) return '';
              const date = new Date(timestamp * 1000);
              const now = new Date();
              const isToday = date.toDateString() === now.toDateString();
              return isToday 
                ? date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                : date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            };

            return {
              id: conversa.id,
              name: conversa.name || conversa.number || 'Contato Desconhecido',
              number: conversa.number || conversa.id.split('@')[0].replace('55', ''),
              lastMessage: conversa.lastMessage.body || 'Sem mensagens',
              timestamp: formatTimestamp(conversa.lastMessage.timestamp),
              unread: conversa.unreadCount || 0,
              avatar: conversa.isGroup ? '👥' : '👤',
              online: false,
              isGroup: conversa.isGroup || false
            };
          });
          setContacts(conversasWhatsApp);
          setResponseArea(prev => prev + `${conversasWhatsApp.length} conversas carregadas do WhatsApp\n`);
        } else {
          setResponseArea(prev => prev + `Erro ao carregar conversas: ${response.erro || 'Erro desconhecido'}\n`);
        }
      });
    };

    carregarConversas();
  }, [socket, setResponseArea]);

  // Função para carregar mensagens de uma conversa específica
  const carregarMensagensConversa = (contact) => {
    if (!socket || !contact) return;

    socket.emit('obterMensagensConversa', { 
      chatId: contact.id,
      limit: 50 
    }, (response) => {
      if (response.sucesso && response.mensagens) {
        const mensagensFormatadas = response.mensagens.map(msg => {
          const formatTimestamp = (timestamp) => {
            const date = new Date(timestamp * 1000);
            return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          };

          return {
            id: msg.id,
            text: msg.body,
            sender: msg.fromMe ? 'me' : 'other',
            timestamp: formatTimestamp(msg.timestamp),
            status: msg.fromMe ? 'read' : 'received',
            type: msg.type,
            hasMedia: msg.hasMedia
          };
        }).reverse(); // Reverter para mostrar mensagens mais antigas primeiro

        setConversations(prev => ({
          ...prev,
          [contact.id]: mensagensFormatadas
        }));

        setResponseArea(prev => prev + `${mensagensFormatadas.length} mensagens carregadas da conversa com ${contact.name}\n`);
      } else {
        setResponseArea(prev => prev + `Erro ao carregar mensagens: ${response.erro || 'Erro desconhecido'}\n`);
      }
    });
  };

  // Função para lidar com seleção de contato
  const handleContactSelect = (contact) => {
    setSelectedContact(contact);
    
    // Zerar contador de mensagens não lidas
    setContacts(prev => prev.map(c => 
      c.id === contact.id ? { ...c, unread: 0 } : c
    ));

    // Carregar mensagens da conversa se ainda não foram carregadas
    if (!conversations[contact.id]) {
      carregarMensagensConversa(contact);
    }
  };

  const sendMessage = () => {
    if (!messageText.trim() || !selectedContact || !socket) return;

    const newMessage = {
      id: Date.now(),
      text: messageText,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: 'sending'
    };

    // Adicionar mensagem à conversa localmente
    setConversations(prev => ({
      ...prev,
      [selectedContact.id]: [...(prev[selectedContact.id] || []), newMessage]
    }));

    // Atualizar último mensagem do contato
    setContacts(prev => prev.map(contact => 
      contact.id === selectedContact.id 
        ? { ...contact, lastMessage: messageText, timestamp: 'Agora' }
        : contact
    ));

    const messageTextToSend = messageText;
    setMessageText('');

    // Enviar mensagem real via socket usando o número extraído do chat ID
    const numeroParaEnvio = selectedContact.number || selectedContact.id.split('@')[0].replace('55', '');
    const messageData = {
      numero: numeroParaEnvio,
      mensagem: messageTextToSend
    };
    
    socket.emit('enviarMensagem', messageData, (response) => {
      console.log('Resposta do servidor:', response); // Debug
      
      if (response.erro) {
        // Atualizar status da mensagem para erro
        setConversations(prev => ({
          ...prev,
          [selectedContact.id]: prev[selectedContact.id].map(msg => 
            msg.id === newMessage.id 
              ? { ...msg, status: 'error' }
              : msg
          )
        }));
        setResponseArea(prev => prev + `Erro ao enviar mensagem para ${selectedContact.name}: ${response.erro}\n`);
      } else {
        // Atualizar status da mensagem para enviada e armazenar o ID do WhatsApp
        const whatsappMessageId = response.id;
        console.log('ID da mensagem do WhatsApp:', whatsappMessageId); // Debug
        
        setConversations(prev => ({
          ...prev,
          [selectedContact.id]: prev[selectedContact.id].map(msg => 
            msg.id === newMessage.id 
              ? { ...msg, status: 'sent', whatsappId: whatsappMessageId }
              : msg
          )
        }));
        setResponseArea(prev => prev + `Mensagem enviada para ${selectedContact.name}. ID: ${whatsappMessageId}\n`);
      }
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.number.includes(searchTerm)
  );

  // Função para obter ícone de status da mensagem
  const getStatusIcon = (status) => {
    switch (status) {
      case 'sending': return '🕐';
      case 'sent': return '✓';
      case 'delivered': return '✓✓';
      case 'read': return '✓✓';
      case 'error': return '❌';
      default: return '✓';
    }
  };

  return (
    <div className="whatsapp-chat">
      {/* Sidebar com lista de contatos */}
      <div className="chat-sidebar">
        <div className="chat-header">
          <div className="profile-section">
            <div className="profile-avatar">👤</div>
            <div className="profile-info">
              <span>Central dos Resultados</span>
              <div className="connection-status">
                <span className={`status-indicator ${whatsappStatus.connected ? 'connected' : 'disconnected'}`}>
                  {whatsappStatus.connected ? '🟢' : '🔴'}
                </span>
                <span className="status-text">
                  {whatsappStatus.connected ? 'WhatsApp Conectado' : 'WhatsApp Desconectado'}
                </span>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <button className="icon-btn" title="Nova conversa">💬</button>
            <button className="icon-btn" title="Configurações">⚙️</button>
          </div>
        </div>

        <div className="search-box">
          <input
            type="text"
            placeholder="Pesquisar ou começar uma nova conversa"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="contacts-list">
          {filteredContacts.map(contact => (
            <div
              key={contact.id}
              className={`contact-item ${selectedContact?.id === contact.id ? 'active' : ''}`}
              onClick={() => handleContactSelect(contact)}
            >
              <div className="contact-avatar">
                {contact.avatar}
                {contact.online && <div className="online-indicator"></div>}
              </div>
              <div className="contact-info">
                <div className="contact-header">
                  <h4>{contact.name}</h4>
                  <span className="timestamp">{contact.timestamp}</span>
                </div>
                <div className="contact-preview">
                  <p>{contact.lastMessage}</p>
                  {contact.unread > 0 && (
                    <span className="unread-badge">{contact.unread}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Área principal do chat */}
      <div className="chat-main">
        {selectedContact ? (
          <>
            {/* Header do chat */}
            <div className="chat-conversation-header">
              <div className="contact-info-header">
                <div className="contact-avatar-header">
                  {selectedContact.avatar}
                  {selectedContact.online && <div className="online-indicator"></div>}
                </div>
                <div className="contact-details">
                  <h3>{selectedContact.name}</h3>
                  <span className="phone-number">{selectedContact.number}</span>
                  <span className="whatsapp-info">
                    {whatsappStatus.connected ? 'WhatsApp Ativo' : 'WhatsApp Inativo'}
                  </span>
                </div>
              </div>
              <div className="chat-actions">
                <button className="icon-btn">🔍</button>
                <button className="icon-btn">📞</button>
                <button className="icon-btn">📹</button>
                <button className="icon-btn">⋮</button>
              </div>
            </div>

            {/* Mensagens */}
            <div className="messages-container">
              {conversations[selectedContact.id]?.map(message => (
                <div
                  key={message.id}
                  className={`message ${message.sender === 'me' ? 'sent' : 'received'}`}
                >
                  <div className="message-content">
                    <span className="message-text">{message.text}</span>
                    <span className="message-time">{message.timestamp}</span>
                    {message.sender === 'me' && (
                      <span className={`message-status ${message.status || 'sent'}`}>
                        {getStatusIcon(message.status)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de mensagem */}
            <div className="message-input-container">
              <button className="icon-btn">😊</button>
              <button className="icon-btn">📎</button>
              <div className="message-input-wrapper">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite uma mensagem"
                  rows={1}
                />
              </div>
              <button 
                className="send-button"
                onClick={sendMessage}
                disabled={!messageText.trim()}
                title={!messageText.trim() ? 'Digite uma mensagem' : 'Enviar mensagem'}
              >
                {messageText.trim() ? '➤' : '🎤'}
              </button>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <div className="no-chat-content">
              <h2>WhatsApp Web</h2>
              <p>Envie e receba mensagens sem manter seu telefone conectado.</p>
              <p>Use o WhatsApp em até 4 dispositivos vinculados e 1 telefone ao mesmo tempo.</p>
              <div className="whatsapp-icon">💬</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWhatsApp;
