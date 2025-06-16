import React, { useState } from 'react';

const TestarNumero = ({ socket, setResponseArea }) => {
    const [numero, setNumero] = useState('');
    const [resultado, setResultado] = useState(null);
    const [carregando, setCarregando] = useState(false);
    const [enviandoMensagem, setEnviandoMensagem] = useState(false);
    const [mensagemEnviada, setMensagemEnviada] = useState(null);
    const [erro, setErro] = useState('');

    const formatarNumero = (valor) => {
        // Remove caracteres não numéricos
        const apenasNumeros = valor.replace(/\D/g, '');
        
        // Aplica máscara (DD) NNNNN-NNNN
        if (apenasNumeros.length <= 2) {
            return apenasNumeros;
        } else if (apenasNumeros.length <= 7) {
            return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2)}`;
        } else if (apenasNumeros.length <= 11) {
            return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7)}`;
        } else {
            // Limita a 11 dígitos
            const limitado = apenasNumeros.slice(0, 11);
            return `(${limitado.slice(0, 2)}) ${limitado.slice(2, 7)}-${limitado.slice(7)}`;
        }
    };

    const handleInputChange = (e) => {
        const valorFormatado = formatarNumero(e.target.value);
        setNumero(valorFormatado);
        if (erro) setErro('');
        if (resultado) setResultado(null);
    };

    const verificarNumero = () => {
        if (!socket) {
            setErro('Socket não conectado');
            return;
        }

        if (!numero.trim()) {
            setErro('Por favor, insira um número');
            return;
        }

        // Remove formatação para enviar apenas números
        const numeroLimpo = numero.replace(/\D/g, '');
        
        if (numeroLimpo.length < 10) {
            setErro('Número deve ter pelo menos 10 dígitos (DDD + número)');
            return;
        }

        setCarregando(true);
        setErro('');
        setResultado(null);

        console.log('Enviando verificação para:', numeroLimpo);

        socket.emit('verificarNumeroWhatsApp', { numero: numeroLimpo }, (resposta) => {
            setCarregando(false);
            console.log('Resposta recebida:', resposta);
            
            if (resposta.sucesso || resposta.existeNoWhatsApp !== undefined) {
                setResultado(resposta);
            } else {
                setErro(resposta.erro || 'Erro ao verificar número');
            }
        });
    };

    const enviarMensagemValidacao = () => {
        if (!socket) {
            setErro('Socket não conectado');
            return;
        }

        if (!resultado || !resultado.existeNoWhatsApp) {
            setErro('Primeiro verifique se o número existe no WhatsApp');
            return;
        }

        setEnviandoMensagem(true);
        setErro('');
        setMensagemEnviada(null);

        const numeroLimpo = numero.replace(/\D/g, '');
        const textoMensagem = 'Validando Número';

        console.log('Enviando mensagem de validação para:', numeroLimpo);

        socket.emit('enviarMensagem', { 
            numero: numeroLimpo, 
            mensagem: textoMensagem 
        }, (resposta) => {
            setEnviandoMensagem(false);
            console.log('Resposta do envio de mensagem:', resposta);
            
            if (resposta.sucesso) {
                setMensagemEnviada({
                    sucesso: true,
                    numero: numeroLimpo,
                    texto: textoMensagem,
                    id: resposta.id
                });
                // Adicionar ao log de resposta
                if (setResponseArea) {
                    setResponseArea(prev => prev + `✅ Mensagem enviada para ${numeroLimpo}: "${textoMensagem}"\n`);
                    setResponseArea(prev => prev + `📊 ID da mensagem: ${resposta.id}\n`);
                    setResponseArea(prev => prev + `🔍 Monitoramento de entrega iniciado (timeout: 5 min)\n`);
                }
            } else {
                setErro(`Erro ao enviar mensagem: ${resposta.erro || 'Erro desconhecido'}`);
                // Adicionar erro ao log
                if (setResponseArea) {
                    setResponseArea(prev => prev + `❌ Erro ao enviar mensagem para ${numeroLimpo}: ${resposta.erro}\n`);
                    setResponseArea(prev => prev + `🚨 Administrador notificado sobre a falha\n`);
                }
            }
        });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            verificarNumero();
        }
    };

    const limparResultados = () => {
        setNumero('');
        setResultado(null);
        setMensagemEnviada(null);
        setErro('');
    };

    return (
        <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
                🔍 Testar Número WhatsApp
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: 'bold',
                    color: '#555'
                }}>
                    Número de telefone:
                </label>
                <input
                    type="text"
                    value={numero}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="(11) 99999-9999"
                    style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '16px',
                        border: erro ? '2px solid #e74c3c' : '2px solid #ddd',
                        borderRadius: '8px',
                        outline: 'none',
                        transition: 'border-color 0.3s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3498db'}
                    onBlur={(e) => e.target.style.borderColor = erro ? '#e74c3c' : '#ddd'}
                />
                {erro && (
                    <p style={{ 
                        color: '#e74c3c', 
                        fontSize: '14px', 
                        marginTop: '5px',
                        marginBottom: '0'
                    }}>
                        ⚠️ {erro}
                    </p>
                )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button
                    onClick={verificarNumero}
                    disabled={carregando}
                    style={{
                        flex: 1,
                        padding: '12px',
                        fontSize: '16px',
                        backgroundColor: carregando ? '#95a5a6' : '#27ae60',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: carregando ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.3s'
                    }}
                    onMouseEnter={(e) => {
                        if (!carregando) e.target.style.backgroundColor = '#229954';
                    }}
                    onMouseLeave={(e) => {
                        if (!carregando) e.target.style.backgroundColor = '#27ae60';
                    }}
                >
                    {carregando ? '🔄 Verificando...' : '✅ Verificar'}
                </button>
                
                <button
                    onClick={limparResultados}
                    style={{
                        padding: '12px 20px',
                        fontSize: '16px',
                        backgroundColor: '#95a5a6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#7f8c8d'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#95a5a6'}
                >
                    🗑️ Limpar
                </button>
            </div>

            {/* Botão de enviar mensagem - só aparece se o número existir no WhatsApp */}
            {resultado && resultado.existeNoWhatsApp && (
                <div style={{ marginBottom: '20px' }}>
                    <button
                        onClick={enviarMensagemValidacao}
                        disabled={enviandoMensagem}
                        style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '16px',
                            backgroundColor: enviandoMensagem ? '#95a5a6' : '#3498db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: enviandoMensagem ? 'not-allowed' : 'pointer',
                            transition: 'background-color 0.3s'
                        }}
                        onMouseEnter={(e) => {
                            if (!enviandoMensagem) e.target.style.backgroundColor = '#2980b9';
                        }}
                        onMouseLeave={(e) => {
                            if (!enviandoMensagem) e.target.style.backgroundColor = '#3498db';
                        }}
                    >
                        {enviandoMensagem ? '📤 Enviando...' : '📤 Enviar Mensagem "Validando Número"'}
                    </button>
                </div>
            )}

            {/* Resultado da mensagem enviada */}
            {mensagemEnviada && (
                <div style={{
                    padding: '15px',
                    borderRadius: '8px',
                    backgroundColor: mensagemEnviada.sucesso ? '#d5f4e6' : '#ffeaa7',
                    border: `2px solid ${mensagemEnviada.sucesso ? '#27ae60' : '#f39c12'}`,
                    marginBottom: '20px'
                }}>
                    <h4 style={{ 
                        margin: '0 0 10px 0',
                        color: mensagemEnviada.sucesso ? '#27ae60' : '#f39c12'
                    }}>
                        {mensagemEnviada.sucesso ? '✅ Mensagem enviada!' : '❌ Erro no envio'}
                    </h4>
                    <div style={{ marginBottom: '5px' }}>
                        <strong>Para:</strong> {mensagemEnviada.numero}
                    </div>
                    <div style={{ marginBottom: '5px' }}>
                        <strong>Texto:</strong> "{mensagemEnviada.texto}"
                    </div>
                    {mensagemEnviada.id && (
                        <div style={{ marginBottom: '5px' }}>
                            <strong>ID da mensagem:</strong> {mensagemEnviada.id}
                        </div>
                    )}
                </div>
            )}

            {resultado && (
                <div style={{
                    padding: '20px',
                    borderRadius: '8px',
                    backgroundColor: resultado.existeNoWhatsApp ? '#d5f4e6' : '#ffeaa7',
                    border: `2px solid ${resultado.existeNoWhatsApp ? '#27ae60' : '#f39c12'}`,
                    marginTop: '20px'
                }}>
                    <h3 style={{ 
                        margin: '0 0 15px 0',
                        color: resultado.existeNoWhatsApp ? '#27ae60' : '#f39c12'
                    }}>
                        {resultado.existeNoWhatsApp ? '✅ Número encontrado!' : '❌ Número não encontrado'}
                    </h3>
                    
                    <div style={{ marginBottom: '10px' }}>
                        <strong>Número verificado:</strong> {resultado.numero}
                    </div>
                    
                    <div style={{ marginBottom: '10px' }}>
                        <strong>Está no WhatsApp:</strong> {resultado.existeNoWhatsApp ? 'Sim' : 'Não'}
                    </div>

                    {resultado.contato && (
                        <div style={{
                            marginTop: '15px',
                            padding: '15px',
                            backgroundColor: 'rgba(255,255,255,0.7)',
                            borderRadius: '6px'
                        }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>
                                👤 Informações do contato:
                            </h4>
                            <div style={{ marginBottom: '5px' }}>
                                <strong>Nome:</strong> {resultado.contato.nome}
                            </div>
                            <div style={{ marginBottom: '5px' }}>
                                <strong>É usuário WhatsApp:</strong> {resultado.contato.isUser ? 'Sim' : 'Não'}
                            </div>
                            <div style={{ marginBottom: '5px' }}>
                                <strong>É contato WhatsApp:</strong> {resultado.contato.isWAContact ? 'Sim' : 'Não'}
                            </div>
                            {resultado.contato.profilePicUrl && (
                                <div style={{ marginTop: '10px' }}>
                                    <strong>Foto de perfil:</strong>
                                    <br />
                                    <img 
                                        src={resultado.contato.profilePicUrl} 
                                        alt="Foto de perfil"
                                        style={{
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '50%',
                                            marginTop: '5px',
                                            border: '2px solid #ddd'
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div style={{
                marginTop: '30px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
            }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#666' }}>ℹ️ Como usar:</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#666' }}>
                    <li>Digite o número com DDD (ex: 11999887766)</li>
                    <li>A verificação não envia nenhuma mensagem</li>
                    <li>Apenas verifica se o número está registrado no WhatsApp</li>
                    <li>Mostra informações básicas do contato quando disponível</li>
                </ul>
            </div>

            <div style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#e8f4fd',
                borderRadius: '8px',
                border: '1px solid #b8daff'
            }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#0c5aa6' }}>🔍 Sistema de Monitoramento:</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#0c5aa6', fontSize: '14px' }}>
                    <li><strong>Monitoramento automático:</strong> Cada mensagem enviada é monitorada por 5 minutos</li>
                    <li><strong>Notificação de falhas:</strong> O administrador é notificado automaticamente sobre:</li>
                    <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                        <li>Mensagens que falharam no envio</li>
                        <li>Mensagens enviadas mas não entregues</li>
                        <li>Perda de conectividade durante envio</li>
                        <li>Tentativas de envio sem conexão</li>
                    </ul>
                    <li><strong>Logs detalhados:</strong> Todas as ações são registradas na área de logs</li>
                </ul>
            </div>
        </div>
    );
};

export default TestarNumero;
