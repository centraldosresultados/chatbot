import React, { useState } from 'react';
import { senhasAPI } from '../services/api';

function EnviarSenhaProvisoria({ setResponseArea }) {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [usuario, setUsuario] = useState('');
  const [senha_provisoria, setSenha_provisoria] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNomeChange = (e) => setNome(e.target.value);
  const handleCpfChange = (e) => setCpf(e.target.value);
  const handleTelefoneChange = (e) => setTelefone(e.target.value);
  const handleUsuarioChange = (e) => setUsuario(e.target.value);
  const handleSenhaProvisoriaChange = (e) => setSenha_provisoria(e.target.value);

  const handleEnviarSenha = async () => {
    if (!nome || !cpf || !telefone || !usuario || !senha_provisoria) {
      alert('Por favor, preencha todos os campos: Nome, CPF, Telefone, Usuário e Senha Provisória.');
      return;
    }

    setLoading(true);
    setResponseArea(prev => prev + 'Enviando solicitação de senha provisória...\n');
    
    try {
      // Nota: A API espera apenas idc, mas aqui temos todos os dados
      // Pode precisar de um endpoint específico ou ajuste no backend
      const payload = { nome, cpf, telefone, usuario, senha_provisoria };
      const response = await senhasAPI.enviar(payload);
      setResponseArea(prev => prev + `Resposta de "enviarSenhaProvisoriaCriador":\n${JSON.stringify(response, null, 2)}\n`);
      
      if (response.success) {
        setNome('');
        setCpf('');
        setTelefone('');
        setUsuario('');
        setSenha_provisoria('');
      }
    } catch (error) {
      setResponseArea(prev => prev + `Erro: ${error.message}\n`);
      alert(`Erro ao enviar senha: ${error.message}`);
    } finally {
      setLoading(false);
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
            type="text"
            id="senhaProvisoriaCriador"
            value={senha_provisoria}
            onChange={handleSenhaProvisoriaChange}
            placeholder="Senha temporária"
          />
        </div>
        <div></div> 
      </div>
      <button onClick={handleEnviarSenha} disabled={loading || !nome || !cpf || !telefone || !usuario || !senha_provisoria}>
        {loading ? 'Enviando...' : 'Enviar Senha Provisória'}
      </button>
    </div>
  );
}

export default EnviarSenhaProvisoria;
