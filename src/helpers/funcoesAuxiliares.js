const { configuracoes: config } = require('../config')


const montaMensagemEnvioSenha = dados => {
    return {
        logo: config.caminhoImagens + config.logo,
        texto: `
Olá *${dados.nome}*
Você esqueceu sua senha, nós estamos te enviando seu usuário e uma senha provisória.

Usuário: *${dados.usuario}*
 
Senha provisória: *${dados.senha_provisoria}*

Favor retornar à central dos criadores para cadastrar uma nova senha
`
    }
}

const montaMensagemCadastroValidacao = dados => {
    let retorno = {
        logo: config.caminhoImagens + config.logo,
        texto: `
Olá ${dados.nome}, 

esta é uma menagem da Central dos Resultados para a validação do seu cadastro.

Favor clicar no botão Confirmar para validar seu cadastro e ter acesso à Central dos Criadores.    
    `,
        botao: [{
            id: "retValidaCad_" + dados.codigo_criador,
            text: "Validar Cadastro"
        }]
    }

    return retorno;
}

const montaMensagemVinculacaoConfirmacao = (dados) => {
    let retorno = {
        texto: null,
        placaIdentifcacao: null,
        relacaoSispass: null,
        botoes: null
    };

    const dt = dados.data_ultima_pontuacao;
    //const dtSol = dt.getDate() + '/' + (dt.getMonth() + 1) + '/' + dt.getFullYear();
    const texto = `
====== APENAS TESTE =========    
Solicitação de Vinculação de Pássaro.
Criador: ${dados.criador}  
CPF: ${dados.criador_cpf}
Telefone: ${dados.telefone}

Pássaro: ${dados.nome_passaro}
Anilha: ${dados.anilha} 

Última Pontuação: ${dados.data_ultima_pontuacao} 
Clube: ${dados.sigla_clube} - ${dados.nome_clube}       

Proprietário atual: ${dados.criador_atual} 

===== FAVOR RESPONDER ESTA MENSAGEM =====
===== 1 - PARA CONFIRMAR A VINCULACAO ===
===== 2 - PARA RECUSAR A VINCULACAO =====

`;

console.log('Imagem', dados.placa_identificacao);
console.log('Imagem 2', dados.relacao_sispass);
    retorno.texto = texto;

    if (dados.placa_identificacao != '') {
        caminhoPI = config.caminhoImagens + '/' + dados.placa_identificacao;
        retorno.placaIdentifcacao = {
            texto: 'Placa de Identificação',
            imagem: caminhoPI
        }
    }

    if (dados.relacao_sispass != '') {
        caminhoRS = config.caminhoImagens + '/' + dados.relacao_sispass;
        retorno.relacaoSispass = {
            texto: 'Relação Sispass',
            imagem: caminhoRS
        }
    }

    let botoes = [
        {
            id: "retVinc_" + dados.chave_passaro_vinculacao_solicitacao + '_1',
            text: "Confirmar"
        },
        {
            id: "retVinc_" + dados.chave_passaro_vinculacao_solicitacao + '_0',
            text: "Recusar"
        }
    ]
    retorno.botoes = botoes;
    return retorno
}

module.exports = {
    montaMensagemVinculacaoConfirmacao,
    montaMensagemCadastroValidacao,
    montaMensagemEnvioSenha
}