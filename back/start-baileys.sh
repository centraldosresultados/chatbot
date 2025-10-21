#!/bin/bash

echo "🔄 Preparando ambiente Baileys..."

# Renomear arquivo se necessário
cd src/services
if [ -f "conexaoZap.mjs" ]; then
    echo "📝 Renomeando conexaoZap.mjs para conexaoZap.js..."
    mv conexaoZap.mjs conexaoZap.js
fi
cd ../..

# Limpar credenciais antigas
if [ -d ".wwebjs_auth" ]; then
    echo "🗑️  Removendo credenciais antigas (.wwebjs_auth)..."
    rm -rf .wwebjs_auth
fi

if [ -d "auth_info_baileys" ]; then
    echo "🗑️  Removendo credenciais Baileys antigas..."
    rm -rf auth_info_baileys
fi

echo ""
echo "🚀 Iniciando servidor Express com Baileys..."
echo ""

node express.js

