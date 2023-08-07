const { configuracoes: config } = require('../config')

const { createServer } = config.funcionamento == 'local' ? require('http') : require('https');
const httpServer = config.funcionamento == 'local' ? createServer() :
    createServer({
        key: readFileSync("/etc/letsencrypt/live/zapbot.centraldosresultados.com.br/privkey.pem"),
        cert: readFileSync("/etc/letsencrypt/live/zapbot.centraldosresultados.com.br/cert.pem")
    })
const { Server } = require("socket.io");

const conexaoIo = {
    io: undefined,
    novaConexao() {
        return new Promise((resolve, reject) => {
            this.io = new Server(httpServer, {
                cors: {
                    origin: '*'
                }
            })
            httpServer.listen(config.porta, () => {
                // console.log(config);
                console.log('Rodando');
            })
            resolve(this.io)
        })
    },
    async pegaConexao() {
        if (this.io != undefined)
            return this.io
        else if (this.io == undefined) {
            await this.novaConexao()
            return this.io
        }
    }
}

async function novaConexaoSocket (){
    return await new Promise((resolve, reject) => {
        const io = new Server(httpServer, {
            cors: {
                origin: '*'
            }
        })

        resolve(io);
    })
}

module.exports = {
    conexaoIo
}

