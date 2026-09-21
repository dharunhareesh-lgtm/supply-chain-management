#!/bin/bash
# ==============================================================================
# Dravix SCM Safe Deployment & Update Script for AWS EC2 (Docker Compose)
# ==============================================================================
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "======================================================================"
echo " Starting Dravix SCM Deployment on AWS EC2"
echo "======================================================================"

# 1. Check for .env.docker
if [ ! -f .env.docker ]; then
    echo "❌ Error: .env.docker not found in $PROJECT_DIR"
    echo "👉 Please copy .env.docker.example to .env.docker and configure your settings:"
    echo "   cp .env.docker.example .env.docker"
    exit 1
fi

# 2. Check for local_dump_clean.sql
if [ ! -f local_dump_clean.sql ]; then
    echo "❌ Error: Database initialization file local_dump_clean.sql not found!"
    exit 1
fi

# 3. Pull latest Git updates if inside a git repository
if [ -d .git ]; then
    echo "📥 Pulling latest git updates..."
    git pull origin main || echo "⚠️ Git pull skipped or not on main branch."
fi

# 4. Build and start containers in detached mode
echo "🚀 Building and starting Docker Compose services..."
if docker compose version &>/dev/null; then
    docker compose --env-file .env.docker up -d --build
else
    echo "⚠️ Warning: 'docker compose' plugin not found, falling back to 'docker-compose'..."
    docker-compose --env-file .env.docker up -d --build
fi

echo ""
echo "======================================================================"
echo " Container Status:"
echo "======================================================================"
if docker compose version &>/dev/null; then
    docker compose ps
else
    docker-compose ps
fi

echo ""
echo "✅ Dravix SCM deployment complete!"
echo "🌐 Access your application at: http://<YOUR_EC2_PUBLIC_IP>"
echo "📜 View real-time logs with: docker compose logs -f"
echo "======================================================================"
