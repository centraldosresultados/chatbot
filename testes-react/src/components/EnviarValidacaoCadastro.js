import React, { useState } from 'react';

function EnviarValidacaoCadastro({ socket, setResponseArea }) {
  const [nomeCadastro, setNomeCadastro] = useState('');
  const [telefoneCadastro, setTelefoneCadastro] = useState('');

  const handleEnviarValidacao = () => {
    if (!nomeCadastro || !telefoneCadastro) {
      alert('Por favor, preencha Nome e Telefone.');
      return;
    }
    if (socket) {
      setResponseArea(prev => prev + 'Enviando solicitação de validação de cadastro...\n');
      socket.emit('enviarValidacaoCadastro', { nome: nomeCadastro, telefone: telefoneCadastro }, (response) => {
        setResponseArea(prev => prev + `Resposta de "enviarValidacaoCadastro":\n${JSON.stringify(response, null, 2)}\n`);
      });
    } else {
      alert('Socket não conectado.');
    }
  };

  return (
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
      <button onClick={handleEnviarValidacao} disabled={!socket || !nomeCadastro || !telefoneCadastro}>
        Enviar Validação Cadastro
      </button>
    </div>
  );
}

export default EnviarValidacaoCadastro;
