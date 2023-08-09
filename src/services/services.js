const axios = require('axios')
const { configuracoes: config } = require('../config')
const { encode } = require('js-base64')
const { localStorage } = require('node-localstorage')
const https = require('https');
const http = require('http')

const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest

function _converteParametrosparaUrl(parametros) {
    if (typeof parametros === 'object') {
        var retorno = {};

        for (let key in parametros) {
            let value = parametros[key];

            if (typeof value !== 'object') {
                retorno[key] = value != undefined ? encode(value.toString().replace('/', '_-_')) : undefined;
            } else if (typeof value === 'object') {
                retorno[key] = _converteParametrosparaUrl(value);
            }
        }
    } else {
        var retorno = parametros;
    }

    return retorno;
};

async function executaFuncaoClasse(classe, funcaoExecutar, parametros, tipo = 'get') {
    return await new Promise((resolve, reject) => {

        let urlBase = config.caminhoApi + '/' + classe + '/' + funcaoExecutar;
        if (tipo == 'get') {
            let temp = _converteParametrosparaUrl(parametros);
            let parametrosEnviar = typeof parametros === 'object' ? JSON.stringify(temp) : temp;
            console.log(config.caminhoApi + '/' + classe + '/' + funcaoExecutar + '/' + parametrosEnviar);

            https.get(urlBase + '/' + parametrosEnviar, function (res) {
                let retorno = '';
                res.on("data", function (chunk) {
                    retorno += chunk
                });
                res.on('end', () => {

                    const primeiroCaracter = retorno.substring(0, 1);
                    const tipoRetorno = typeof retorno;

                    retorno = tipoRetorno === 'string' && primeiroCaracter == '{' ? JSON.parse(retorno) : retorno;
                    resolve(retorno)

                })
            }).on('error', function (e) {
                console.log("Got error: " + e.message);
            });


            //return axios.get(urlBase + '/' + parametrosEnviar);        

        } else if (tipo == 'post') {
            // let temp = new URLSearchParams(parametros);
            // return axios({ 
            //     method: 'post', 
            //     responseType: 'json', 
            //     url: urlBase, 
            //     data: temp,            
            //     headers: { 'X-Requested-With': 'XMLHttpRequest' }
            // })
        }
    })

}

function buscarDadosLocais(dadosBuscar) {
    let dados = localStorage.getItem(dadosBuscar);
    return JSON.parse(dados);

}

function salvarDadosLocais(nomeArmazenamento, dadosSalvar) {
    localStorage.setItem(nomeArmazenamento, JSON.stringify(dadosSalvar));
}

module.exports = {
    executaFuncaoClasse,
    salvarDadosLocais,
    buscarDadosLocais
}