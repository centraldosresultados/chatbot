const mysql = require('mysql');

// Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app");
const { getDatabase, ref, set, onValue, get, child, push } = require('firebase/database')


const { configuracoes: config, firebaseConfig } = require('../config');
const { executaFuncaoClasse } = require('./services');

const con = mysql.createConnection({
    host: config.dataBase.host,
    user: config.dataBase.user,
    password: config.dataBase.password,
    database: config.dataBase.dataBase
})

const conFirebase = initializeApp(firebaseConfig)
const db = getDatabase();
const dataBase = 'vinculacoes_solicitacoes';
const dbRef = ref(db);


//const tabela = db.ref(dataBase)

// const solRef = ref(db, dataBase)
// onValue(solRef, (snapshot) => {
//     const data = snapshot.val();
//     console.log('Alteracao', data);
// })

const buscarSolicitacaoFB = async (id) => {
    return await new Promise((resolve, reject) => {

        get(child(dbRef, `${dataBase}/`)).then( dados =>{
            console.log('Retorno Database', dados.val());
        }).catch(error => {
            console.log('Erro Retorno Database', error);
        })
    })
}

const salvarSolicitacaoFB = async (solicitacao) => {
    return await new Promise((resolve, reject) => {
        const key = push(child(dbRef, dataBase)).key;
        
        set(ref(db, dataBase + '/' + key), solicitacao).then(() => {
            resolve(solicitacao.id)          
        }).catch(error => {
            console.log('Erro insert FB', error);
        })
    })
    
}

const buscarSolicitacao = (chave, callback) => {
    const sql = `select * from view_tb_passaros_vinculacoes_solicitacoes where chave_passaro_vinculacao_solicitacao = ${chave}`;
    con.query(sql, (erro, dados) => {
        callback(dados);
    })
    // executaFuncaoClasse('centralCriadores', 'buscarPassaroVinculacaoSolicitacao', chave).then(retorno => {
    //     callback(retorno.data)
    // })
}

// const confirmaVinculacao = ((mensagem, clientBot) => {
//     function pegaIdUsuario(telefone) {
//         let usuarioSistema = config.contatosConfirmacao.filter(contato => {
//             return contato.telefone == usuarioEntrada
//         });

//         if (usuarioSistema[0] != undefined)
//             return usuarioSistema[0].id
//         else
//             return false;
//     }

//     const p = mensagem.selectedButtonId.split('_');
//     const usuarioEntrada = mensagem.from.split('@')[0];
//     const idUsuario = pegaIdUsuario(usuarioEntrada)

//     if (idUsuario) {
//         executaFuncaoClasse('centralCriadores', 'confirmaSolicitacaoVinculacao', p[1]).then( retorno =>{
//             console.log(retorno.data);
//         })        
//     }

//     //con.query()
// })

module.exports = {
    buscarSolicitacao,
    //confirmaVinculacao
    salvarSolicitacaoFB,
    buscarSolicitacaoFB
}

