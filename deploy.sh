#!/bin/bash
# Sanctum Production Server Bootstrap & Deployment Script
# Run this on your Ubuntu server to configure and spin up the backend stack.

set -e

echo "=== Sanctum Server Deploy Tool ==="
echo "=================================="

# 1 & 2. Check and Install Docker if missing
if ! [ -x "$(command -v docker)" ]; then
  echo "[1/4] Docker is not installed. Updating package repositories..."
  sudo apt-get update -y
  echo "[2/4] Installing Docker CE..."
  sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
  sudo mkdir -p /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update -y
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  echo "✔ Docker CE and Compose plugin installed!"
else
  echo "[1/4] ✔ Docker is already installed. Skipping installer and apt updates."
fi

# 3. Create app deployment structure and config files
echo "[3/4] Structuring deployment folder (~/sanctum)..."
mkdir -p ~/sanctum
cd ~/sanctum

# Create a baseline .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating default environment config file (.env)..."
  cat <<EOT >> .env
# Database Credentials
DB_USER=vault_admin
DB_PASSWORD=$(openssl rand -hex 16)

# Security Credentials
JWT_SECRET=$(openssl rand -hex 32)
VAULT_ENCRYPTION_KEY=$(openssl rand -hex 16)

# Cloudflare Tunnel
TUNNEL_TOKEN=${TUNNEL_TOKEN:-}
EOT
  echo "✔ Created secure configuration (.env) with random credentials. Please review this file."
else
  echo "✔ Configuration file (.env) already exists. Skipping recreation."
fi

# Ensure TUNNEL_TOKEN is updated if passed from environment
if [ ! -z "$TUNNEL_TOKEN" ]; then
  # Remove existing TUNNEL_TOKEN line if any
  sed -i '/TUNNEL_TOKEN/d' .env 2>/dev/null || true
  echo "TUNNEL_TOKEN=$TUNNEL_TOKEN" >> .env
  echo "✔ Updated TUNNEL_TOKEN in config file."
fi

# 4. Pull and Start Services
if [ -f docker-compose.prod.yml ]; then
  echo "[4/4] Starting services..."
  docker compose -f docker-compose.prod.yml pull
  docker compose -f docker-compose.prod.yml up -d
  
  echo "Waiting for Ollama service to start up..."
  until docker exec vault_ollama ollama list >/dev/null 2>&1; do
    sleep 2
  done
  
  echo "Pulling Llama 3.2 model in the background..."
  docker exec -d vault_ollama ollama pull llama3.2
  
  echo "=== Sanctum services successfully started! ==="
  echo "Spring Boot Server running at: http://localhost:8080"
  echo "Database (Postgres) running at: localhost:5432"
  echo "✔ Ollama pulling llama3.2 in the background."
else
  echo "[4/4] Warning: docker-compose.prod.yml not found in ~/sanctum."
  echo "Please make sure to push your code to GitHub and trigger the CI/CD pipeline, which will copy docker-compose.prod.yml automatically!"
fi

