#!/bin/bash
# Stop all microservices

echo "🛑 Stopping Exchange Platform Services..."

# Kill all node processes for our services
pkill -f "node.*matching-engine"
pkill -f "node.*blockchain-tracker"
pkill -f "node.*risk-engine"
pkill -f "node.*market-data"
pkill -f "node.*admin-api"
pkill -f "node.*user-api"
pkill -f "node.*websocket-gateway"

echo "✅ All services stopped!"
