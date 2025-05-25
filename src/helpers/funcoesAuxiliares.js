const { configuracoes: config } = require("../config");

/**
 * Monta a mensagem para envio de senha provisória.
 * @param {object} dados - Dados do usuário.
 * @param {string} dados.nome - Nome do usuário.
 * @param {string} dados.usuario - Login do usuário.
 * @param {string} dados.senha_provisoria - Senha provisória gerada.
 * @returns {object} Objeto contendo o logo e o texto da mensagem.
 * @returns {string} object.logo - Caminho para a imagem do logo.
 * @returns {string} object.texto - Texto da mensagem formatado.
 */
const montaMensagemEnvioSenha = (dados) => {
    return {
        logo: config.caminhoImagens + config.logo, // Concatena o caminho base das imagens com o nome do arquivo do logo
        texto: `
Olá *${dados.nome}*
Você esqueceu sua senha, nós estamos te enviando seu usuário e uma senha provisória.

Usuário: *${dados.usuario}*
 
Senha provisória: *${dados.senha_provisoria}*

Favor retornar à central dos resultados para cadastrar uma nova senha.
`,
    };
};

const montaMensagemErroEnvioSenha = (dados) => {
    return {
        texto: `
    ##INFORMAÇÃO CENTRAL DOS CRIADORES##
    ${dados.nome} tentou resetar a senha, mas houve algum erro ao enviar a senha provisória.
    O Número do telefone é: ${dados.telefone}
    O Usuário é: ${dados.usuario}

    `
    }
}

/**
 * Monta a mensagem de validação de cadastro.
 * @param {object} dados - Dados do usuário.
 * @param {string} dados.nome - Nome do usuário.
 * @returns {object} Objeto contendo o logo e o texto da mensagem.
 * @returns {string} object.logo - Caminho para a imagem do logo.
 * @returns {string} object.texto - Texto da mensagem formatado.
 */
const montaMensagemCadastroValidacao = (dados) => {
    let retorno = {
        logo: config.caminhoImagens + config.logo, // Concatena o caminho base das imagens com o nome do arquivo do logo
        texto: `
Olá ${dados.nome}, 

esta é uma menagem da Central dos Resultados para a validação do seu cadastro.

Seu Cadastro foi validado com sucesso, faça seu login no App.    
    `,
    };

    return retorno;
};

const montaMensagemErroCadastroValidacao = (dados) => {
    const retorno = {
        logo: config.caminhoImagens + config.logo, // Concatena o caminho base das imagens com o nome do arquivo do logo  
        texto: `
    ##INFORMAÇÃO CENTRAL DOS CRIADORES##

    ${dados.nome} tentou validar seu cadastro, mas houve algum erro
    O Número do telefone é: ${dados.telefone}      

    #######################
    `,
    }
    return retorno;
}

/**
 * Monta a mensagem de confirmação de vinculação de pássaro.
 * @param {object} dados - Dados da solicitação de vinculação.
 * @param {string} dados.criador - Nome do criador solicitante.
 * @param {string} dados.criador_cpf - CPF do criador solicitante.
 * @param {string} dados.telefone - Telefone do criador solicitante.
 * @param {string} dados.nome_passaro - Nome do pássaro.
 * @param {string} dados.anilha - Anilha do pássaro.
 * @param {string} dados.data_ultima_pontuacao - Data da última pontuação do pássaro.
 * @param {string} dados.sigla_clube - Sigla do clube.
 * @param {string} dados.nome_clube - Nome do clube.
 * @param {string} dados.criador_atual - Nome do proprietário atual do pássaro.
 * @param {string} dados.placa_identificacao - Nome do arquivo da imagem da placa de identificação (opcional).
 * @param {string} dados.relacao_sispass - Nome do arquivo da imagem da relação Sispass (opcional).
 * @param {string} dados.chave_passaro_vinculacao_solicitacao - Chave da solicitação de vinculação.
 * @returns {object} Objeto contendo o texto da mensagem, informações de imagens e botões de ação.
 * @returns {string | null} object.texto - Texto da mensagem formatado.
 * @returns {object | null} object.placaIdentifcacao - Informações da imagem da placa de identificação.
 * @returns {string} object.placaIdentifcacao.texto - Descrição da imagem.
 * @returns {string} object.placaIdentifcacao.imagem - Caminho para a imagem.
 * @returns {object | null} object.relacaoSispass - Informações da imagem da relação Sispass.
 * @returns {string} object.relacaoSispass.texto - Descrição da imagem.
 * @returns {string} object.relacaoSispass.imagem - Caminho para a imagem.
 * @returns {Array<object> | null} object.botoes - Array de objetos representando os botões de ação.
 * @returns {string} object.botoes[].id - ID do botão.
 * @returns {string} object.botoes[].text - Texto do botão.
 */
const montaMensagemVinculacaoConfirmacao = (dados) => {
    let retorno = {
        texto: null,
        placaIdentifcacao: null,
        relacaoSispass: null,
        botoes: null,
    };

    // A data da última pontuação é recebida mas não utilizada diretamente na formatação do texto abaixo.
    // const dt = dados.data_ultima_pontuacao; // Removido dt não utilizado
    // const dtSol = dt.getDate() + '/' + (dt.getMonth() + 1) + '/' + dt.getFullYear(); // Comentado pois dt não é mais definida
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

    // Log para depuração das imagens recebidas
    console.log("Imagem", dados.placa_identificacao);
    console.log("Imagem 2", dados.relacao_sispass);
    retorno.texto = texto;

    // Adiciona a imagem da placa de identificação se fornecida
    if (dados.placa_identificacao && dados.placa_identificacao.trim() !== "") {
        const caminhoPI = config.caminhoImagens + "/" + dados.placa_identificacao;
        retorno.placaIdentifcacao = {
            texto: "Placa de Identificação",
            imagem: caminhoPI,
        };
    }

    // Adiciona a imagem da relação Sispass se fornecida
    if (dados.relacao_sispass && dados.relacao_sispass.trim() !== "") {
        const caminhoRS = config.caminhoImagens + "/" + dados.relacao_sispass;
        retorno.relacaoSispass = {
            texto: "Relação Sispass",
            imagem: caminhoRS,
        };
    }

    // Define os botões de ação para confirmar ou recusar a vinculação
    let botoes = [
        {
            id: "retVinc_" + dados.chave_passaro_vinculacao_solicitacao + "_1", // ID para confirmar
            text: "Confirmar",
        },
        {
            id: "retVinc_" + dados.chave_passaro_vinculacao_solicitacao + "_0", // ID para recusar
            text: "Recusar",
        },
    ];
    retorno.botoes = botoes;
    return retorno;
};

module.exports = {
    montaMensagemVinculacaoConfirmacao,
    montaMensagemCadastroValidacao,
    montaMensagemErroCadastroValidacao,
    montaMensagemEnvioSenha,
    montaMensagemErroEnvioSenha
};
