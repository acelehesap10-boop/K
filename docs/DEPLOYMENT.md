# Deployment Guide

## Quick Start

### Option 1: Docker Compose (Recommended for Development)

```bash
# Start all services
./scripts/docker-start.sh

# Or manually
cd infrastructure/docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all
docker-compose down
```

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Create logs directory
mkdir -p logs

# Start all services
./scripts/start-all.sh

# Stop all services
./scripts/stop-all.sh
```

### Option 3: Kubernetes (Production)

```bash
# Apply Kubernetes manifests
kubectl apply -f infrastructure/kubernetes/deployment.yml

# Check status
kubectl get pods -n exchange-platform

# View logs
kubectl logs -f deployment/user-api -n exchange-platform
```

## Infrastructure as Code

### Terraform Deployment (AWS)

```bash
cd infrastructure/terraform

# Initialize
terraform init

# Plan
terraform plan \
  -var="db_username=admin" \
  -var="db_password=YOUR_SECURE_PASSWORD"

# Apply
terraform apply \
  -var="db_username=admin" \
  -var="db_password=YOUR_SECURE_PASSWORD"

# Get outputs
terraform output cluster_endpoint
terraform output rds_endpoint
terraform output redis_endpoint
```

### Required AWS Resources

- **EKS Cluster** - Kubernetes orchestration
- **VPC** - Network isolation
- **RDS PostgreSQL** - TimescaleDB for time-series data
- **ElastiCache Redis** - Caching layer
- **S3** - Terraform state and backups
- **DynamoDB** - Terraform state locking

## Environment Variables

Create `.env` file:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/exchange
TIMESCALE_URI=postgresql://admin:password@localhost:5432/exchange_timeseries
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-super-secret-jwt-key-change-in-production
ADMIN_PASSWORD_HASH=bcrypt-hashed-password

# Services
MATCHING_ENGINE_PORT=6001
BLOCKCHAIN_TRACKER_PORT=6002
RISK_ENGINE_PORT=6003
MARKET_DATA_PORT=6004
ADMIN_API_PORT=6005
USER_API_PORT=6006
WEBSOCKET_PORT=6007

# AWS (if using)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Monitoring
PROMETHEUS_URL=http://localhost:9090
GRAFANA_URL=http://localhost:3000
```

## Service Dependencies

```
User API → Matching Engine
User API → Risk Engine
User API → Market Data

WebSocket Gateway → Matching Engine
WebSocket Gateway → Market Data
WebSocket Gateway → Blockchain Tracker

Risk Engine → (standalone)
Matching Engine → (standalone)
Market Data → (standalone)
Blockchain Tracker → (standalone)
Admin API → (standalone)
```

## Health Checks

All services expose `/health` endpoint:

```bash
# Check all services
for port in 6001 6002 6003 6004 6005 6006; do
  echo "Checking port $port..."
  curl -s http://localhost:$port/health | jq
done
```

## Monitoring & Observability

### Prometheus Metrics

Access: http://localhost:9090

Query examples:
```
# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status=~"5.."}[5m])

# Latency P99
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))
```

### Grafana Dashboards

Access: http://localhost:3000
Default credentials: admin/admin

Pre-configured dashboards:
- Service Health Overview
- Matching Engine Performance
- Risk Metrics
- Blockchain Tracker Status

### Logs

```bash
# Docker Compose
docker-compose logs -f [service-name]

# Kubernetes
kubectl logs -f deployment/[service-name] -n exchange-platform

# Local
tail -f logs/[service-name].log
```

## Scaling

### Horizontal Scaling

```bash
# Kubernetes
kubectl scale deployment user-api --replicas=10 -n exchange-platform

# Docker Compose
docker-compose up -d --scale user-api=5
```

### Autoscaling (Kubernetes)

HPA is pre-configured in `infrastructure/kubernetes/deployment.yml`:

```yaml
spec:
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## Backup & Recovery

### Database Backups

```bash
# MongoDB
mongodump --uri="mongodb://localhost:27017/exchange" --out=/backups/mongo

# TimescaleDB
pg_dump -h localhost -U admin exchange_timeseries > /backups/timescale.sql

# Redis
redis-cli --rdb /backups/redis.rdb
```

### Restore

```bash
# MongoDB
mongorestore --uri="mongodb://localhost:27017/exchange" /backups/mongo

# TimescaleDB
psql -h localhost -U admin -d exchange_timeseries < /backups/timescale.sql

# Redis
redis-cli --rdb /backups/redis.rdb
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Configure IP whitelist for admin access
- [ ] Enable 2FA for admin accounts
- [ ] Use HashiCorp Vault for secrets
- [ ] Configure TLS/SSL certificates
- [ ] Enable audit logging
- [ ] Set up intrusion detection
- [ ] Configure WAF rules
- [ ] Enable DDoS protection
- [ ] Implement rate limiting
- [ ] Use VPN for production access
- [ ] Regular security audits

## Disaster Recovery

### RTO/RPO Targets

- **RTO (Recovery Time Objective)**: < 1 hour
- **RPO (Recovery Point Objective)**: < 5 minutes

### DR Runbook

1. **Incident Detection**
   - Monitor alerts in PagerDuty
   - Check Grafana dashboards
   - Review error logs

2. **Failover to Secondary Region**
   ```bash
   kubectl config use-context prod-us-west-2
   kubectl apply -f infrastructure/kubernetes/deployment.yml
   ```

3. **Database Restoration**
   ```bash
   # Restore from latest backup
   ./scripts/restore-database.sh
   ```

4. **Verification**
   ```bash
   ./scripts/health-check-all.sh
   ```

## Performance Tuning

### Node.js Options

```bash
node --max-old-space-size=4096 server.js
```

### Database Optimization

```sql
-- TimescaleDB: Create hypertables
SELECT create_hypertable('trades', 'timestamp');
SELECT create_hypertable('order_book_snapshots', 'timestamp');

-- Indexes
CREATE INDEX idx_trades_symbol ON trades(symbol, timestamp DESC);
CREATE INDEX idx_orders_user ON orders(user_id, status);
```

### Redis Configuration

```
maxmemory 2gb
maxmemory-policy allkeys-lru
appendonly yes
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs [service-name]

# Check port conflicts
lsof -i :[port]

# Restart service
docker-compose restart [service-name]
```

### High Latency

```bash
# Check resource usage
docker stats

# Check network
docker-compose exec user-api ping matching-engine

# Check database connections
docker-compose exec mongodb mongo --eval "db.currentOp()"
```

### Memory Leaks

```bash
# Heap snapshot
node --expose-gc --inspect server.js

# Use Chrome DevTools for analysis
# chrome://inspect
```

## Support & Contact

- Technical Issues: GitHub Issues
- Security Issues: security@exchange-platform.com
- Admin Contact: berkecansuskun1998@gmail.com
