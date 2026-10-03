#!/bin/bash
set -e

echo "===================================================="
echo "🌸 Iniciando Deploy Automático — O Que É Isso?"
echo "===================================================="

# Navegar até o diretório do projeto
cd "$(dirname "$0")"

echo "📥 [1/4] Baixando atualizações do GitHub (main)..."
git pull origin main

echo "🧹 [2/4] Removendo arquivos antigos não rastreados (mantendo .env e data/)..."
git clean -fd -e .env -e data/

echo "🐳 [3/4] Atualizando e reiniciando containers Docker..."
docker compose down
docker compose up -d --build --remove-orphans

echo "===================================================="
echo "✨ [4/4] Deploy concluído com sucesso!"
echo "===================================================="
