import React, { useState } from 'react';
import { validacoesAPI } from '../services/api';

function EnviarValidacaoCadastro({ setResponseArea }) {
  const [nomeCadastro, setNomeCadastro] = useState('');
  const [telefoneCadastro, setTelefoneCadastro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEnviarValidacao = async () => {
    if (!nomeCadastro || !telefoneCadastro) {
      alert('Por favor, preencha Nome e Telefone.');
      return;
    }

    setLoading(true);
    setResponseArea(prev => prev + 'Enviando solicitação de validação de cadastro...\n');
    
    try {
      // Nota: A API espera idc e idn, mas aqui temos nome e telefone
      // Isso pode precisar de ajuste no backend ou buscar dados primeiro
      const response = await validacoesAPI.enviar(nomeCadastro, telefoneCadastro);
      setResponseArea(prev => prev + `Resposta de "enviarValidacaoCadastro":\n${JSON.stringify(response, null, 2)}\n`);
      
      if (response.success) {
        setNomeCadastro('');
        setTelefoneCadastro('');
      }
    } catch (error) {
      setResponseArea(prev => prev + `Erro: ${error.message}\n`);
      alert(`Erro ao enviar validação: ${error.message}`);
    } finally {
      setLoading(false);
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
      <button onClick={handleEnviarValidacao} disabled={loading || !nomeCadastro || !telefoneCadastro}>
        {loading ? 'Enviando...' : 'Enviar Validação Cadastro'}
      </button>
    </div>
  );
}

export default EnviarValidacaoCadastro;
