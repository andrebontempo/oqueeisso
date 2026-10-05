#!/bin/bash
set -e

echo "===================================================="
echo "🌸 Iniciando Deploy Automático — O Que É Isso?"
echo "===================================================="

# Navegar até o diretório do projeto
cd "$(dirname "$0")"

# Evitar erro de safe.directory caso pertenca a outro usuario na VPS
git config --global --add safe.directory /opt/docker/oqueeisso 2>/dev/null || true

echo "📥 [1/4] Baixando atualizações do GitHub (main)..."
git fetch origin main
git reset --hard origin/main

echo "🧹 [2/4] Removendo arquivos antigos não rastreados (mantendo .env e data/)..."
git clean -fd -e .env -e data/

echo "🐳 [3/4] Atualizando e reiniciando containers Docker..."
docker rm -f oqueeisso_app oqueeisso_mongo oqueeisso-app oqueeisso-mongo 2>/dev/null || true
docker compose down --remove-orphans
docker compose up -d --build --remove-orphans

echo "===================================================="
echo "✨ [4/4] Deploy concluído com sucesso!"
echo "===================================================="

