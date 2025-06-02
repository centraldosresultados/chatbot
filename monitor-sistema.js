#!/usr/bin/env node

/**
 * @file Script de monitoramento do sistema WhatsApp Chatbot
 * @description Verifica a saúde do sistema e gera relatórios de status
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

/**
 * Classe para monitoramento do sistema
 */
class MonitorSistema {
    constructor() {
        this.basePath = __dirname;
        this.relatorio = {
            timestamp: new Date().toISOString(),
            status: 'OK',
            verificacoes: [],
            avisos: [],
            erros: []
        };
    }

    /**
     * Adiciona verificação ao relatório
     * @param {string} componente - Nome do componente
     * @param {boolean} status - Status da verificação
     * @param {string} detalhes - Detalhes da verificação
     */
    adicionarVerificacao(componente, status, detalhes) {
        this.relatorio.verificacoes.push({
            componente,
            status: status ? 'OK' : 'ERRO',
            detalhes,
            timestamp: new Date().toISOString()
        });

        if (!status) {
            this.relatorio.erros.push(`${componente}: ${detalhes}`);
            this.relatorio.status = 'PROBLEMAS_DETECTADOS';
        }
    }

    /**
     * Adiciona aviso ao relatório
     * @param {string} mensagem - Mensagem de aviso
     */
    adicionarAviso(mensagem) {
        this.relatorio.avisos.push(mensagem);
    }

    /**
     * Verifica se um arquivo existe
     * @param {string} arquivo - Caminho do arquivo
     * @returns {boolean}
     */
    verificarArquivo(arquivo) {
        const caminhoCompleto = path.join(this.basePath, arquivo);
        return fs.existsSync(caminhoCompleto);
    }

    /**
     * Verifica se um diretório existe
     * @param {string} diretorio - Caminho do diretório
     * @returns {boolean}
     */
    verificarDiretorio(diretorio) {
        const caminhoCompleto = path.join(this.basePath, diretorio);
        return fs.existsSync(caminhoCompleto) && fs.statSync(caminhoCompleto).isDirectory();
    }

    /**
     * Executa todas as verificações do sistema
     */
    async executarVerificacoes() {
        console.log('🔍 Iniciando monitoramento do sistema...\n');

        // Verificação de arquivos core
        this.verificarArquivosCore();
        
        // Verificação de dependências
        this.verificarDependencias();
        
        // Verificação da estrutura
        this.verificarEstrutura();
        
        // Verificação do React
        this.verificarReact();
        
        // Verificação de configurações
        this.verificarConfiguracoes();

        // Gera relatório final
        this.gerarRelatorio();
    }

    /**
     * Verifica arquivos principais do sistema
     */
    verificarArquivosCore() {
        const arquivosCore = [
            'centralResultadosZapBot.js',
            'src/services/conexaoZap.js',
            'src/services/socket.js',
            'src/config.js',
            'src/helpers/notificaAdministrador.js',
            'package.json'
        ];

        arquivosCore.forEach(arquivo => {
            const existe = this.verificarArquivo(arquivo);
            this.adicionarVerificacao(
                `Arquivo Core: ${arquivo}`,
                existe,
                existe ? 'Arquivo encontrado' : 'Arquivo não encontrado'
            );
        });
    }

    /**
     * Verifica dependências do projeto
     */
    verificarDependencias() {
        try {
            const packageJson = JSON.parse(fs.readFileSync(path.join(this.basePath, 'package.json'), 'utf8'));
            const nodeModulesExiste = this.verificarDiretorio('node_modules');
            
            this.adicionarVerificacao(
                'Dependencies',
                nodeModulesExiste,
                nodeModulesExiste ? 'node_modules encontrado' : 'node_modules não encontrado - execute npm install'
            );

            // Verifica dependências principais
            const depsEssenciais = ['whatsapp-web.js', 'socket.io', 'qrcode'];
            depsEssenciais.forEach(dep => {
                const temDep = packageJson.dependencies && packageJson.dependencies[dep];
                this.adicionarVerificacao(
                    `Dependência: ${dep}`,
                    !!temDep,
                    temDep ? `Versão: ${temDep}` : 'Dependência não encontrada'
                );
            });

        } catch (error) {
            this.adicionarVerificacao('package.json', false, `Erro ao ler: ${error.message}`);
        }
    }

    /**
     * Verifica estrutura de diretórios
     */
    verificarEstrutura() {
        const diretorios = [
            'src',
            'src/services',
            'src/helpers',
            'src/components',
            'testes-react',
            'testes-react/src',
            'testes-react/src/components'
        ];

        diretorios.forEach(dir => {
            const existe = this.verificarDiretorio(dir);
            this.adicionarVerificacao(
                `Diretório: ${dir}`,
                existe,
                existe ? 'Estrutura OK' : 'Diretório não encontrado'
            );
        });
    }

    /**
     * Verifica projeto React
     */
    verificarReact() {
        const arquivosReact = [
            'testes-react/package.json',
            'testes-react/src/App.js',
            'testes-react/src/components/EnviarSenhaProvisoria.js',
            'testes-react/src/components/EnviarValidacaoCadastro.js'
        ];

        arquivosReact.forEach(arquivo => {
            const existe = this.verificarArquivo(arquivo);
            this.adicionarVerificacao(
                `React: ${arquivo}`,
                existe,
                existe ? 'Componente OK' : 'Componente não encontrado'
            );
        });

        // Verifica node_modules do React
        const reactNodeModules = this.verificarDiretorio('testes-react/node_modules');
        this.adicionarVerificacao(
            'React Dependencies',
            reactNodeModules,
            reactNodeModules ? 'Dependências React OK' : 'Execute npm install em testes-react/'
        );
    }

    /**
     * Verifica configurações
     */
    verificarConfiguracoes() {
        // Verifica arquivo .env (opcional)
        const envExiste = this.verificarArquivo('.env');
        if (!envExiste) {
            this.adicionarAviso('Arquivo .env não encontrado - usando configurações padrão');
        }

        // Verifica diretório de autenticação
        const authDirExiste = this.verificarDiretorio('.wwebjs_auth');
        this.adicionarVerificacao(
            'WhatsApp Auth',
            authDirExiste,
            authDirExiste ? 'Diretório de autenticação encontrado' : 'Primeira execução - QR Code será necessário'
        );
    }

    /**
     * Gera relatório final
     */
    gerarRelatorio() {
        console.log('📊 RELATÓRIO DE MONITORAMENTO DO SISTEMA\n');
        console.log(`⏰ Timestamp: ${this.relatorio.timestamp}`);
        console.log(`🎯 Status Geral: ${this.relatorio.status === 'OK' ? '✅ OK' : '⚠️ ' + this.relatorio.status}\n`);

        // Verificações
        console.log('🔍 VERIFICAÇÕES:');
        this.relatorio.verificacoes.forEach(verif => {
            const icon = verif.status === 'OK' ? '✅' : '❌';
            console.log(`   ${icon} ${verif.componente}: ${verif.detalhes}`);
        });

        // Avisos
        if (this.relatorio.avisos.length > 0) {
            console.log('\n⚠️ AVISOS:');
            this.relatorio.avisos.forEach(aviso => {
                console.log(`   🔔 ${aviso}`);
            });
        }

        // Erros
        if (this.relatorio.erros.length > 0) {
            console.log('\n❌ ERROS ENCONTRADOS:');
            this.relatorio.erros.forEach(erro => {
                console.log(`   🚨 ${erro}`);
            });
        }

        console.log('\n📈 RESUMO:');
        const totalVerificacoes = this.relatorio.verificacoes.length;
        const verificacoesOK = this.relatorio.verificacoes.filter(v => v.status === 'OK').length;
        console.log(`   📊 Verificações: ${verificacoesOK}/${totalVerificacoes} OK`);
        console.log(`   ⚠️ Avisos: ${this.relatorio.avisos.length}`);
        console.log(`   ❌ Erros: ${this.relatorio.erros.length}`);

        if (this.relatorio.status === 'OK') {
            console.log('\n🎉 Sistema está funcionando corretamente!');
        } else {
            console.log('\n🔧 Sistema necessita atenção. Verifique os itens acima.');
        }
    }
}

// Executa o monitoramento se o script for chamado diretamente
if (require.main === module) {
    const monitor = new MonitorSistema();
    monitor.executarVerificacoes();
}

module.exports = MonitorSistema;
