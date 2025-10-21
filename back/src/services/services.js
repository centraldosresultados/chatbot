const { configuracoes: config } = require("../config");
const { encode } = require("js-base64");
const https = require("https"); // Adicionado require para https

function _converteParametrosparaUrl(parametros) {
  let convertedParams; // Alterado para evitar redeclaração de 'retorno'

  if (typeof parametros === "object") {
    convertedParams = {};

    for (let key in parametros) {
      let value = parametros[key];

      if (typeof value !== "object") {
        convertedParams[key] =
          value != undefined
            ? encode(value.toString().replace("/", "_-_"))
            : undefined;
      } else if (typeof value === "object") {
        convertedParams[key] = _converteParametrosparaUrl(value);
      }
    }
  } else {
    convertedParams = parametros;
  }

  return convertedParams;
}

async function executaFuncaoClasse(
  classe,
  funcaoExecutar,
  parametros,
  tipo = "get",
) {
  return await new Promise((resolve) => {
    let urlBase = config.caminhoApi + "/" + classe + "/" + funcaoExecutar;
    if (tipo == "get") {
      let temp = _converteParametrosparaUrl(parametros);
      let parametrosEnviar =
        typeof parametros === "object" ? JSON.stringify(temp) : temp;
      console.log(
        config.caminhoApi +
          "/" +
          classe +
          "/" +
          funcaoExecutar +
          "/" +
          parametrosEnviar,
      );

      https.get(urlBase + "/" + parametrosEnviar, (resp) => { // Adicionado https.
        let data = "";

        // Abaixo, o código continua igual ao que você já possui...
        resp.on("data", (chunk) => {
          data += chunk;
        });

        resp.on("end", () => {
          const primeiroCaracter = data.substring(0, 1);
          const tipoRetorno = typeof data;

          data =
            tipoRetorno === "string" && primeiroCaracter == "{"
              ? JSON.parse(data)
              : data;
          resolve(data);
        });
      }).on("error", (e) => {
        console.log("Got error: " + e.message);
      });

      //return axios.get(urlBase + '/' + parametrosEnviar);
    } else if (tipo == "post") {
      // let temp = new URLSearchParams(parametros);
      // return axios({
      //     method: 'post',
      //     responseType: 'json',
      //     url: urlBase,
      //     data: temp,
      //     headers: { 'X-Requested-With': 'XMLHttpRequest' }
      // })
    }
  });
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
  buscarDadosLocais,
};
