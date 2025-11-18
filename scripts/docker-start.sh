#!/bin/bash
# Start all services with Docker Compose

echo "🐳 Starting Exchange Platform with Docker Compose..."

cd "$(dirname "$0")/../infrastructure/docker"

docker-compose up -d

echo ""
echo "✅ All services started in Docker!"
echo ""
echo "Check status: docker-compose ps"
echo "View logs: docker-compose logs -f [service-name]"
echo "Stop all: docker-compose down"
echo ""
echo "Grafana: http://localhost:3000 (admin/admin)"
echo "Prometheus: http://localhost:9090"
