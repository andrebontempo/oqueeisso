#!/bin/bash
set -e

echo "===================================================="
echo "🌸 Iniciando Deploy Automático — O Que É Isso?"
echo "===================================================="

# Navegar até o diretório do projeto
cd "$(dirname "$0")"

echo "📥 [1/3] Baixando atualizações do GitHub (main)..."
git pull origin main

echo "🐳 [2/3] Atualizando e reiniciando containers Docker..."
docker compose down
docker compose up -d --build --remove-orphans

echo "===================================================="
echo "✨ [3/3] Deploy concluído com sucesso!"
echo "===================================================="
