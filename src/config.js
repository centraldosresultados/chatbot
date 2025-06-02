/**
 * @file Arquivo de configuração do ChatBot.
 * @description Este arquivo centraliza todas as configurações utilizadas pela aplicação,
 * como informações de banco de dados, caminhos de API, configurações do Firebase,
 * e lista de contatos para confirmação.
 * @version 1.0.0
 */

/**
 * Objeto contendo as configurações principais da aplicação.
 * @property {string} funcionamento - Define o ambiente de funcionamento ("local" ou "web").
 * @property {number} porta - Porta utilizada pelo servidor.
 * @property {Object} dataBase - Configurações de conexão com o banco de dados MySQL.
 * @property {string} dataBase.host - Host do banco de dados.
 * @property {string} dataBase.user - Usuário do banco de dados.
 * @property {string} dataBase.password - Senha do banco de dados.
 * @property {string} dataBase.dataBase - Nome do banco de dados.
 * @property {string} caminhoImagens - URL base para as imagens utilizadas.
 * @property {string} caminhoApi - URL base para a API da Central dos Criadores.
 * @property {string} logo - Caminho para o arquivo de logo.
 */
// const configuracoes = {
//   funcionamento: "local", // Define se está rodando localmente ou em produção/web
//   porta: 3100, // Porta para o servidor HTTP/Socket.io
//   dataBase: {
//     // host: "localhost",
//     // user: "root",
//     // password: "senha", // ATENÇÃO: Considerar o uso de variáveis de ambiente para senhas
//     // dataBase: "central_criadores",
//     host: 'centraldosresultados.com',
//     user: 'central_resultados',
//     password: 'Central123Resultados',
//     dataBase: 'central_resultados_criadores'
//   },
//   caminhoImagens: "http://centralsite.com", // URL base para buscar imagens
//   caminhoApi: "http://centralsistema.com/api/centralCriadores", // URL da API principal
//   logo: "/img/logoMobile.png", // Caminho relativo para a logo

//   // Exemplo de configuração para ambiente web (comentado)
//   // caminhoImagens: 'https://itaperuna.net.br',
//   // caminhoApi: 'https://itaperuna.net/api/centralCriadores',
//   // logo: '/img/logoMobile.png'
// };

//Exemplo de configuração alternativa para ambiente web (comentado)
const configuracoes = {
    funcionamento: 'web',
    porta: 3100,
    dataBase: {
        host: 'https://centraldosresultados.com',
        user: 'central_resultados',
        password: 'Central123Resultados',
        dataBase: 'central_resultados_criadores'
    },
    caminhoImagens: 'https://centraldosresultados.com',
    caminhoApi: 'https://centraldosresultados.com/api/centralCriadores',
    logo: '/img/logoMobile.png'
}

/**
 * Objeto de configuração para a conexão com o Firebase.
 * @property {string} apiKey - Chave da API do Firebase.
 * @property {string} authDomain - Domínio de autenticação do Firebase.
 * @property {string} databaseURL - URL do Realtime Database do Firebase.
 * @property {string} projectId - ID do projeto no Firebase.
 * @property {string} storageBucket - Bucket de armazenamento do Firebase.
 * @property {string} messagingSenderId - ID do remetente de mensagens do Firebase.
 * @property {string} appId - ID do aplicativo Firebase.
 * @property {string} measurementId - ID de medição do Google Analytics para Firebase.
 */
const firebaseConfig = {
  apiKey: "AIzaSyAoYrjtcIPnjd3RNYbYQEUL4kELiTveyFQ", // Chave de API - Considerar variáveis de ambiente
  authDomain: "central-criadores.firebaseapp.com",
  databaseURL: "https://central-criadores-default-rtdb.firebaseio.com",
  projectId: "central-criadores",
  storageBucket: "central-criadores.appspot.com",
  messagingSenderId: "397739573308",
  appId: "1:397739573308:web:bbcd19766d710fc2814339",
  measurementId: "G-H1KN7009EN",
};

/**
 * Array de objetos representando os contatos de confirmação.
 * Cada objeto deve ter `id`, `nome` e `telefone`.
 * @type {Array<Object>}
 * @property {number} id - Identificador único do contato.
 * @property {string} nome - Nome do contato.
 * @property {string} telefone - Número de telefone do contato (sem formatação, apenas dígitos).
 */

const contatoAdministrador = {
  id: 1,
  nome: "Silvério",
  telefone: "22999134200", // Telefone do administrador
};

const contatosConfirmacao = [
  {
    id: 28,
    nome: "Silvério",
    telefone: "22999134200",
  },
  {
    id: 3,
    nome: "Junior",
    telefone: "22998063980",
  },
  {
    id: 2,
    nome: "Jorge",
    telefone: "22999881992",
  },
  // {
  //   id: 4,
  //   nome: "Sauro",
  //   telefone: "22998372564",
  // },
  // {
  //   id: 14,
  //   nome: "Samuel",
  //   telefone: "22997754504",
  // },
];

/**
 * Busca o ID de um contato de confirmação pelo número de telefone.
 * @param {string} numero - Número de telefone a ser buscado.
 * @returns {number | boolean} O ID do contato se encontrado, caso contrário `false`.
 */
const pegaIdContatoConfirmacao = (numero) => {
  const temp = contatosConfirmacao.filter((contato) => contato.telefone == numero);
  if (temp.length > 0) return temp[0]["id"];
  else return false;
};

module.exports = {
  configuracoes,
  //configuracoesWeb: configuracoes, // Opção comentada para exportar configurações web separadamente
  contatosConfirmacao,
  pegaIdContatoConfirmacao,
  firebaseConfig,
  contatoAdministrador
};
