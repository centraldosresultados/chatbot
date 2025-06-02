const mysql = require("mysql");

// Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app");
const {
  getDatabase,
  ref,
  set,
  get,
  child,
  push,
} = require("firebase/database");

const { configuracoes: config, firebaseConfig } = require("../config");

// Configuração da conexão com o banco de dados MySQL
const con = mysql.createConnection({
  host: config.dataBase.host,       // Host do banco de dados
  user: config.dataBase.user,       // Usuário do banco de dados
  password: config.dataBase.password, // Senha do banco de dados
  database: config.dataBase.dataBase, // Nome do banco de dados
});

// Inicializa o Firebase
initializeApp(firebaseConfig);
const db = getDatabase(); // Obtém a referência do banco de dados Firebase
const dataBase = "vinculacoes_solicitacoes"; // Nome da coleção/nó no Firebase Realtime Database
const dbRef = ref(db); // Referência base do banco de dados Firebase

/**
 * Busca todas as solicitações de vinculação no Firebase Realtime Database.
 * @async
 * @returns {Promise<object|null>} Uma Promise que resolve com os dados das solicitações ou null em caso de erro.
 */
const buscarSolicitacaoFB = async () => {
  return await new Promise((resolve) => {
    get(child(dbRef, `${dataBase}/`)) // Busca os dados do nó especificado
      .then((dados) => {
        console.log("Retorno Database", dados.val()); // Log dos dados retornados
        resolve(dados.val()); // Resolve a Promise com os dados
      })
      .catch((error) => {
        console.log("Erro Retorno Database", error); // Log em caso de erro
        resolve(null); // Resolve a Promise com null em caso de erro
      });
  });
};

/**
 * Salva uma solicitação de vinculação no Firebase Realtime Database.
 * @async
 * @param {object} solicitacao - Objeto da solicitação a ser salva.
 * @param {string} solicitacao.id - ID da solicitação (usado para resolver a Promise).
 * @param {string} [keyAlt] - Chave alternativa para a solicitação. Se não fornecida, uma nova chave é gerada.
 * @returns {Promise<string|undefined>} Uma Promise que resolve com o ID da solicitação salva ou undefined em caso de erro não tratado explicitamente.
 */
const salvarSolicitacaoFB = async (solicitacao, keyAlt = undefined) => {
  return await new Promise((resolve) => {
    // Define a chave para a solicitação: usa keyAlt se fornecida, senão gera uma nova chave
    const key = keyAlt !== undefined ? keyAlt : push(child(dbRef, dataBase)).key;
    set(ref(db, dataBase + "/" + key.toString()), solicitacao) // Salva a solicitação no Firebase
      .then(() => {
        resolve(solicitacao.id); // Resolve a Promise com o ID da solicitação
      })
      .catch((error) => {
        console.log("Erro insert FB", error); // Log em caso de erro
        resolve(undefined); // Resolve com undefined em caso de erro para indicar falha
      });
  });
};

/**
 * Busca uma solicitação de vinculação no banco de dados MySQL pela chave.
 * @param {string} chave - Chave da solicitação de vinculação.
 * @param {function} callback - Função de callback que recebe os dados da solicitação.
 */
const buscarSolicitacao = (chave, callback) => {
  const sql = `select * from view_tb_passaros_vinculacoes_solicitacoes where chave_passaro_vinculacao_solicitacao = ${mysql.escape(chave)}`; // Query SQL para buscar a solicitação, usando mysql.escape para prevenir SQL injection
  con.query(sql, (erro, dados) => {
    if (erro) {
      console.error("Erro ao buscar solicitação no MySQL:", erro); // Log do erro
      callback(null, erro); // Chama o callback com null para dados e o objeto de erro
      return;
    }
    callback(dados); // Chama o callback com os dados encontrados
  });
};

const buscaTodosCriadores = () => {
  return new Promise((resolve) => {
    const sql = "SELECT chave_cadastro, nome, tel_1 FROM view_criadores"; // Query SQL para buscar todos os criadores
    con.query(sql, (erro, dados) => {
      if (erro) {
        console.error("Erro ao buscar criadores no MySQL:", erro); // Log do erro
        resolve(null, erro); // Chama o callback com null para dados e o objeto de erro
        return;
      }
      resolve(dados); // Chama o callback com os dados encontrados
    });
  });
}

module.exports = {
  buscarSolicitacao, // Exporta a função para buscar no MySQL
  salvarSolicitacaoFB, // Exporta a função para salvar no Firebase
  buscarSolicitacaoFB, // Exporta a função para buscar no Firebase
  buscaTodosCriadores
};


