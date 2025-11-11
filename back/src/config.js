/**
 * @file Arquivo de configuração do ChatBot.
 * @description Este arquivo centraliza todas as configurações utilizadas pela aplicação,
 * como informações de banco de dados, caminhos de API, configurações do Firebase,
 * e lista de contatos para confirmação.
 * @version 1.0.0
 */

// Carrega variáveis de ambiente se disponível
import dotenv from 'dotenv';
dotenv.config();

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
const configuracoes = {
    funcionamento: process.env.APP_ENVIRONMENT || "local",
    porta: parseInt(process.env.APP_PORT) || 11001,
    dataBase: {
        host: process.env.DB_HOST || 'centraldosresultados.com',
        user: process.env.DB_USER || 'central_resultados',
        password: process.env.DB_PASSWORD || 'Central123Resultados',
        dataBase: process.env.DB_NAME || 'central_resultados_criadores'
    },
    mongoDB: {
        uri: process.env.MONGODB_URI || 'mongodb+srv://silveriosepulveda:g7SbMKPby7roGi7P@cluster0.dcuqscr.mongodb.net/central-mensagens?retryWrites=true&w=majority&appName=Cluster0'
    },
    caminhoImagens: process.env.APP_IMAGES_PATH || 'https://centraldosresultados.com',
    caminhoApi: process.env.APP_API_PATH || 'https://centraldosresultados.com/api/centralCriadores',
    logo: process.env.APP_LOGO_PATH || '/img/logoMobile.png'
};

// const configuracoes = {
//     funcionamento: 'web',
//     porta: 11001,
//     dataBase: {
//         host: process.env.DB_HOST || 'centraldosresultados.com',
//         user: process.env.DB_USER || 'central_resultados',
//         password: process.env.DB_PASSWORD || 'Central123Resultados',
//         dataBase: process.env.DB_NAME || 'central_resultados_criadores'
//     },
//     mongoDB: {
//         uri: 'mongodb+srv://silveriosepulveda:g7SbMKPby7roGi7P@cluster0.dcuqscr.mongodb.net/central-mensagens?retryWrites=true&w=majority&appName=Cluster0',
//         // Para ambiente de produção, usar:
//         // uri: 'mongodb+srv://usuario:senha@cluster.mongodb.net/central-mensagens'
//     },
//     caminhoImagens: 'https://centraldosresultados.com',
//     caminhoApi: 'https://centraldosresultados.com/api/centralCriadores',
//     logo: '/img/logoMobile.png'
// }

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
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyAoYrjtcIPnjd3RNYbYQEUL4kELiTveyFQ",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "central-criadores.firebaseapp.com",
    databaseURL: process.env.FIREBASE_DATABASE_URL || "https://central-criadores-default-rtdb.firebaseio.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "central-criadores",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "central-criadores.appspot.com",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "397739573308",
    appId: process.env.FIREBASE_APP_ID || "1:397739573308:web:bbcd19766d710fc2814339",
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-H1KN7009EN",
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
    nome: process.env.ADMIN_NAME || "Silvério",
    telefone: process.env.ADMIN_PHONE || "22999890738",
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

export {
    configuracoes,
    contatosConfirmacao,
    pegaIdContatoConfirmacao,
    firebaseConfig,
    contatoAdministrador
};
