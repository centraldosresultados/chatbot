const configuracoes = {
    funcionamento: 'local',
    porta: 3100,
    dataBase: {
        host: 'localhost',
        user: 'root',
        password: 'senha',
        dataBase: 'centralml_criadores'
    },
    //caminhoImagens: 'http://centralsite.com',
    //caminhoApi: 'http://centralsistema.com/api/centralCriadores',
    //logo: '/img/logoMobile.png'

    caminhoImagens: 'https://centraldosresultados.ml',
    caminhoApi: 'https://centraldosresultados.ml/api/centralCriadores',
    logo: '/img/logoMobile.png'

}

// const configuracoes = {
//     funcionamento: 'web',
//     porta: 3100,
//     dataBase: {
//         host: 'https://centraldosresultados.ml',
//         user: 'centralml_bases',
//         password: 'central123ml',
//         dataBase: 'centralml_criadores'
//     },
//     caminhoImagens: 'https://centraldosresultados.ml',
//     caminhoApi: 'https://centraldosresultados.ml/api/centralCriadores',
//     logo: '/img/logoMobile.png'
// }


//CONFIGURACAO FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyAoYrjtcIPnjd3RNYbYQEUL4kELiTveyFQ",
    authDomain: "central-criadores.firebaseapp.com",
    databaseURL: "https://central-criadores-default-rtdb.firebaseio.com",
    projectId: "central-criadores",
    storageBucket: "central-criadores.appspot.com",
    messagingSenderId: "397739573308",
    appId: "1:397739573308:web:bbcd19766d710fc2814339",
    measurementId: "G-H1KN7009EN"
};

const contatosConfirmacao = [
    {
        id: 28,
        nome: 'Silvério',
        telefone: '22999134200'
    },
    {
        id: 3,
        nome: 'Junior',
        telefone: '22998063980'
    }, {
        id: 2,
        nome: 'Jorge',
        telefone: '22999881992'
    }, {
        id: 4,
        nome: 'Sauro',
        telefone: '22998372564'
    }, {
        id: 14,
        nome: 'Samuel',
        telefone: '22997754504'
    }
]


module.exports = {
    configuracoes,
    //configuracoesWeb: configuracoes,
    contatosConfirmacao,
    firebaseConfig
}