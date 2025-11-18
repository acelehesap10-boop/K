#!/bin/bash

# Complete Server Startup Script
# Starts all services with proper CORS and 403 error prevention

set -e

echo "================================"
echo "Starting Complete Platform Stack"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  print_error "Node.js is not installed"
  exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
  print_error "npm is not installed"
  exit 1
fi

print_status "Node.js $(node --version)"
print_status "npm $(npm --version)"

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install --silent 2>/dev/null || print_warning "Dependencies already installed"

# Create .env if not exists
if [ ! -f .env ]; then
  print_warning ".env file not found, creating..."
  cp .env.example .env 2>/dev/null || cat > .env << 'EOF'
NODE_ENV=development
PORT=5000
FLASK_PORT=5001
GATEWAY_PORT=8080

# Service URLs
ADMIN_API_URL=http://localhost:6005
USER_API_URL=http://localhost:6006
WEBSOCKET_URL=http://localhost:6007
MATCHING_ENGINE_URL=http://localhost:6001
MARKET_DATA_URL=http://localhost:6004
RISK_ENGINE_URL=http://localhost:6003
BLOCKCHAIN_TRACKER_URL=http://localhost:6002

# Database
MONGODB_URI=mongodb://localhost:27017/myapp

# Authentication
JWT_SECRET=your-jwt-secret-key-change-in-production
API_KEY=demo-api-key

# Logging
LOG_LEVEL=info
DEBUG=true
EOF
  print_status "Created .env file"
fi

# Start services
echo ""
echo "Starting services..."

# Function to start a service
start_service() {
  local name=$1
  local file=$2
  local port=$3
  
  print_status "Starting $name on port $port..."
  node "$file" &
  SERVICE_PIDS[$name]=$!
}

# Start main server
print_status "Starting main API server on port 5000..."
node server.js &
MAIN_SERVER_PID=$!

# Start Flask app
if command -v python3 &> /dev/null; then
  print_status "Starting Flask app on port 5001..."
  python3 app.py &
  FLASK_PID=$!
fi

# Start API Gateway
print_status "Starting API Gateway on port 8080..."
node api-gateway.js &
GATEWAY_PID=$!

# Start services
for service in admin-api user-api websocket-gateway; do
  if [ -f "services/$service/server.js" ]; then
    print_status "Starting $service..."
    node "services/$service/server.js" &
  fi
done

print_status "All services started!"
echo ""
echo "================================"
echo "Service Endpoints"
echo "================================"
echo "Main Server: http://localhost:5000"
echo "Flask App: http://localhost:5001"
echo "API Gateway: http://localhost:8080"
echo "Admin API: http://localhost:6005"
echo "User API: http://localhost:6006"
echo "WebSocket Gateway: http://localhost:6007"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for all background jobs
wait
