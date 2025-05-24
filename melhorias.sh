#!/bin/bash
# Script de melhorias automáticas para o projeto centralResultadosZapBot.js
# Execute com: bash melhorias.sh

set -e

# 1. Instalar dependências úteis
npm install dotenv eslint prettier winston eslint-config-prettier --save-dev

# 2. Criar arquivo .env.example
cat <<EOT > .env.example
# Exemplo de variáveis de ambiente
DB_HOST=localhost
DB_USER=usuario
DB_PASS=senha
DB_NAME=centralml_criadores
FIREBASE_API_KEY=sua_api_key
FIREBASE_AUTH_DOMAIN=seu_auth_domain
FIREBASE_DATABASE_URL=sua_database_url
FIREBASE_PROJECT_ID=seu_project_id
FIREBASE_STORAGE_BUCKET=seu_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
FIREBASE_APP_ID=seu_app_id
FIREBASE_MEASUREMENT_ID=seu_measurement_id
EOT

# 3. Criar arquivo CONTRIBUTING.md
cat <<EOT > CONTRIBUTING.md
# Contribuindo para o Projeto

1. Crie um fork do repositório.
2. Crie uma branch para sua feature ou correção.
3. Faça commits claros e objetivos.
4. Envie um Pull Request detalhando as mudanças.
5. Siga o padrão de código definido pelo ESLint/Prettier.
EOT

# 4. Adicionar scripts úteis ao package.json
npx npm-add-script -k "start" -v "node centralResultadosZapBot.js"
npx npm-add-script -k "lint" -v "eslint ."
npx npm-add-script -k "format" -v "prettier --write ."

# 5. Gerar configuração padrão do ESLint e Prettier
npx eslint --init
npx prettier --write .

# 6. Atualizar dependências vulneráveis
npm audit fix --force || true

# 7. Mensagem final
echo "\nMelhorias aplicadas! Revise os arquivos .env.example e CONTRIBUTING.md. Configure o ESLint conforme seu padrão e adicione 'prettier' ao array 'extends' no seu arquivo de configuração do ESLint."
