const mysql = require('mysql');

// Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app");
const { getDatabase, ref, set, get, child, push } = require('firebase/database')

const { configuracoes: config, firebaseConfig } = require('../config');

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

const buscarSolicitacaoFB = async (id) => {
    return await new Promise((resolve, reject) => {

        get(child(dbRef, `${dataBase}/`)).then(dados => {
            console.log('Retorno Database', dados.val());
        }).catch(error => {
            console.log('Erro Retorno Database', error);
        })
    })
}

const salvarSolicitacaoFB = async (solicitacao, keyAlt = undefined) => {
    return await new Promise((resolve, reject) => {
        //console.log(keyAlt);
        const key = keyAlt != undefined ? keyAlt : push(child(dbRef, dataBase)).key;
        set(ref(db, dataBase + '/' + key.toString()), solicitacao).then(() => {
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
}


module.exports = {
    buscarSolicitacao,
    salvarSolicitacaoFB,
    buscarSolicitacaoFB
}

