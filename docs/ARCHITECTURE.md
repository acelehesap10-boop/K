# Architecture Overview

This repo contains a scaffolded unified multi-asset exchange platform with the following components:

- Frontend: Vercel / Next.js patterns (placeholder `index.html`)
- Gateway: `api-gateway.js` (reverse proxy + security rules)
- Microservices: Node-based services for `matching-engine`, `risk-engine`, `market-data`, `blockchain-tracker`, `admin-api`, `user-api`, `websocket-gateway`.
- Matching Engine: Rust micromatching engine under `matching-engine/` with basic microsecond-aware algorithm and benches.
- Infrastructure: Terraform modules for EKS, TimescaleDB RDS, and ElastiCache Redis. Helm charts for each microservice.
- GitOps: ArgoCD apps under `infrastructure/argocd/apps` keep helm charts continuously deployed.
- Observability: Prometheus + Grafana + Jaeger with OpenTelemetry instrumentation for Node + Python services. Prometheus metrics included in `infrastructure/docker/docker-compose.yml`.
- Security: Placeholder scripts and GitHub Actions for SAST/SCA/DAST (Snyk, Trivy) and SBOM generation.

Next steps: expand infra to support multi-region active-active, Vault/HSM integration, and CI/CD image signing.
