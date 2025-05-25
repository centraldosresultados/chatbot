import React, { useState } from 'react';

function EnviarSenhaProvisoria({ socket, setResponseArea }) {
  const [nome, setNome] = useState('Silvério');
  const [cpf, setCpf] = useState('079.293.257-92');
  const [telefone, setTelefone] = useState('22999134200'); // Novo estado para telefone
  const [usuario, setUsuario] = useState('silver');
  const [senha_provisoria, setSenha_provisoria] = useState('123'); // Renomeado de senha para senha_provisoria

  // Funções de handle para cada input
  const handleNomeChange = (e) => setNome(e.target.value);
  const handleCpfChange = (e) => setCpf(e.target.value);
  const handleTelefoneChange = (e) => setTelefone(e.target.value); // Novo handler
  const handleUsuarioChange = (e) => setUsuario(e.target.value);
  const handleSenhaProvisoriaChange = (e) => setSenha_provisoria(e.target.value); // Renomeado handler

  const handleEnviarSenha = () => {
    if (!nome || !cpf || !telefone || !usuario || !senha_provisoria) {
      alert('Por favor, preencha todos os campos: Nome, CPF, Telefone, Usuário e Senha Provisória.');
      return;
    }
    if (socket) {
      setResponseArea(prev => prev + 'Enviando solicitação de senha provisória...\n');
      const payload = { nome, cpf, telefone, usuario, senha_provisoria }; // Payload atualizado
      socket.emit('enviarSenhaProvisoriaCriador', payload, (response) => {
        setResponseArea(prev => prev + `Resposta de "enviarSenhaProvisoriaCriador":\n${JSON.stringify(response, null, 2)}\n`);
      });
    } else {
      alert('Socket não conectado.');
    }
  };

  return (
    <div className="event-test">
      <h2>Enviar Senha Provisória para Criador</h2>
      <div className="input-row">
        <div>
          <label htmlFor="nomeCriador">Nome do Criador:</label>
          <input
            type="text"
            id="nomeCriador"
            value={nome}
            onChange={handleNomeChange}
            placeholder="Nome Completo"
          />
        </div>
        <div>
          <label htmlFor="cpfCriador">CPF do Criador:</label>
          <input
            type="text"
            id="cpfCriador"
            value={cpf}
            onChange={handleCpfChange}
            placeholder="000.000.000-00"
          />
        </div>
      </div>
      <div className="input-row">
        <div>
          <label htmlFor="telefoneCriador">Telefone:</label>
          <input
            type="text"
            id="telefoneCriador"
            value={telefone}
            onChange={handleTelefoneChange}
            placeholder="(00)00000-0000"
          />
        </div>
        <div>
          <label htmlFor="usuarioCriador">Usuário (para login):</label>
          <input
            type="text"
            id="usuarioCriador"
            value={usuario}
            onChange={handleUsuarioChange}
            placeholder="ex: nome.sobrenome"
          />
        </div>
      </div>
      <div className="input-row">
        <div>
          <label htmlFor="senhaProvisoriaCriador">Senha Provisória:</label>
          <input
            type="text" // Pode ser alterado para type="password" se preferir mascarar
            id="senhaProvisoriaCriador"
            value={senha_provisoria}
            onChange={handleSenhaProvisoriaChange}
            placeholder="Senha temporária"
          />
        </div>
        {/* Espaço reservado para um possível sexto campo, ou pode ser removido se apenas 5 campos */}
        <div></div> 
      </div>
      <button onClick={handleEnviarSenha} disabled={!socket || !nome || !cpf || !telefone || !usuario || !senha_provisoria}>
        Enviar Senha Provisória
      </button>
    </div>
  );
}

export default EnviarSenhaProvisoria;
