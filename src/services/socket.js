const { readFileSync } = require("fs");
const { configuracoes: config } = require("../config");

const { createServer } =
  config.funcionamento == "local" ? require("http") : require("https");
const httpServer =
  config.funcionamento == "local"
    ? createServer()
    : createServer({
        key: readFileSync(
          "/etc/letsencrypt/live/chatbot.centraldosresultados.com/privkey.pem",
        ),
        cert: readFileSync(
          "/etc/letsencrypt/live/chatbot.centraldosresultados.com/cert.pem",
        ),
      });
const { Server } = require("socket.io");

(() => {
  const conexaoIo = {
    io: undefined,
    novaConexao() {
      return new Promise((resolve) => {
        this.io = new Server(httpServer, {
          cors: {
            origin: "*",
          },
        });
        httpServer.listen(config.porta, () => {
          // console.log(config);
          console.log("Rodando");
        });
        resolve(this.io);
      });
    },
    async pegaConexao() {
      if (this.io != undefined) return this.io;
      else if (this.io == undefined) {
        await this.novaConexao();
        return this.io;
      }
    },
  };

  conexaoIo.novaConexao();

  module.exports = {
    conexaoIo,
  };
})();
