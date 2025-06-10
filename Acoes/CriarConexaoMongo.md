### Criação de Tela de Envio para Todos e Comunicação com MongoDb

# Objetivo
Criar uma tela de envio para todos e comunicação entre o ChatBot e MongoDb.

### Atenção
Seja minuscioso e atento a cada detalhe.
Leia todo documento, elabore uma estratégia e só então execute as ações.

# Modelo das tabelas
1 - Tabela para Validações de cadastro
tb_envio_validacoes
{
    id: idUnico,
    data: data formato timestamp
    telefone: args.telefone,
    nome: args.nome,
    status_mensagem: alimentar esse campo com status da mensagem
}

2 - Tabela para informar envio de senhas
tb_envio_senhas
{
    id: idUnico,
    data: data formato timestamp,
    telefone: args.telefone,
    nome: args.nome,
    status_mensagem: alimentar esse campo com status da mensagem
}

3 - Tabela para registrar os envios de mensagem
tb_envio_mensagens
{
    id: idUnico,
    data: data formato timestamp
    criadores: {
        id: idUnico,
        // todos campos de cada criador ao enviar,
        status_mensagem: status da mensagem enviada,  
    }
}

### Informações Gerais
Backend - Aplicação Principal centralResultadosZapBot.js
Frontend - diretorio testes-react


### Acoes Backend
1 - Criar uma entrada no socket.io com nome listarTodosCriadores que execute a função buscarTodosCriadores e exporte o resultado.
1.2 - Criar função enviarMensagemParaTodos que receba uma mensagem, e os destinatarios selecionados e envie a mensagem para os contatos selecionados e retorne um resultado.
2 - Criar Conexão com uma base MongoDb em ambas aplicações com variáel de configuração no arquivo config.js.
3 - Na função enviarValidacaoCadastro alimentar a tabela tb_envio_valicacoes.
4 - Na função enviarSenhaProvisoria alimentar a tabela tb_envio_validacoes.
5 - Ajustar a função enviarMensagemParaTodos para enviar apenas para os criadores selecionados no frontend
6 - Na função enviarMensagemParaTodos alimentar a tabela tb_envio_mensagens.
7 - Em todas as funções que alimentam as tabelas, atualizar o status das mensagens sempre que alterado, podendo ser: Enviada, Entregue e Lida.
8 - Crie um campo nas tabelas para identificação da mensagem, para atualização do status.


### Acoes FrontEnd
1 - Troque o sistema de Abas por um menu lateral
2.1 - Validações de Cadastro.
2.1.2 - Liste nessa tela os dados da tb_envio_validacoes em ordem decrescente.
2.2 - Envio de Senhas.
2.2.1 - Liste nessa tela todos os dados da tb_envio_senhas em ordem decrescente.
2.3 - Crie um tela Enviar Mensagem Para todos - Essa deve ser a tela inciial da aplicação.
2.3.1 - Um campo para digitar a mensagem e um botão para enviar as mensagens.
2.3.2 - Chamar a função listarTodosContatos no backend e listar na tela em uma lista estilizada com os campos codigo, nome, telefone, data_cadastro (formatado 'd/m/Y H:i:s), status_mensagem.
2.3.2.1 - Na lista deve ter no início de cada linha um checkbox para selecionar os destinatários.
2.3.2.1 - A lista deve ter no cabeçalho a opção de ordenar por cada campo em ordens crescente e decrescente.
2.4 - Lista Mensagens Enviadas
2.4.1 - Um select que mostre cada item da tb_envio_mensagens em ordem decrescente.
2.4.2 - Ao selecionar um item do select liste abaixo os destinatários.

#Importante
É imprescindível aliemntar as tabelas com o status das mensagens, Enviada, Entregue e Lida.
Crie um campo nas tabelas se necessário para que seja possível ao modificar o status da mensagem ser atualizado no MongoDb.

#Recomendações
Faça todas as alterações solicitadas e deixe os testes que eu faço após finalizado.

Bom Trabalho!

Qualquer dúvida me pergunte.