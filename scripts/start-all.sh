#!/bin/bash
# Start all microservices

echo "🚀 Starting Exchange Platform Services..."

# Start services in background
cd "$(dirname "$0")/.."

echo "Starting Matching Engine on port 6001..."
cd services/matching-engine && node server.js > ../../logs/matching-engine.log 2>&1 &
sleep 2

echo "Starting Blockchain Tracker on port 6002..."
cd ../blockchain-tracker && node server.js > ../../logs/blockchain-tracker.log 2>&1 &
sleep 2

echo "Starting Risk Engine on port 6003..."
cd ../risk-engine && node server.js > ../../logs/risk-engine.log 2>&1 &
sleep 2

echo "Starting Market Data Service on port 6004..."
cd ../market-data && node server.js > ../../logs/market-data.log 2>&1 &
sleep 2

echo "Starting Admin API on port 6005..."
cd ../admin-api && node server.js > ../../logs/admin-api.log 2>&1 &
sleep 2

echo "Starting User API on port 6006..."
cd ../user-api && node server.js > ../../logs/user-api.log 2>&1 &
sleep 2

echo "Starting WebSocket Gateway on port 6007..."
cd ../websocket-gateway && node server.js > ../../logs/websocket-gateway.log 2>&1 &

echo ""
echo "✅ All services started!"
echo ""
echo "Service Endpoints:"
echo "  Matching Engine:     http://localhost:6001"
echo "  Blockchain Tracker:  http://localhost:6002"
echo "  Risk Engine:         http://localhost:6003"
echo "  Market Data:         http://localhost:6004"
echo "  Admin API:           http://localhost:6005"
echo "  User API:            http://localhost:6006"
echo "  WebSocket Gateway:   ws://localhost:6007"
echo ""
echo "Logs directory: ./logs/"
echo ""
echo "To stop all services: ./scripts/stop-all.sh"
