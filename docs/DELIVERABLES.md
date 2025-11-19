# Deliverables Checklist

This repository scaffold includes the following deliverables — either implemented or scaffolded for future completion:

1. IaC: `infrastructure/terraform` skeleton — AWS EKS, Redis, Timescale
2. Helm charts: `infrastructure/helm/*` for microservices (matching-engine, admin-api, user-api, risk-engine)
3. GitOps: ArgoCD manifests in `infrastructure/argocd/apps`
4. CI/CD: GitHub Actions for linting, testing, rust bench and security scans
5. Monitoring: `infrastructure/monitoring` — Prometheus rules + dashboards + Jaeger simple deployment
6. Matching Engine: `matching-engine/` — Rust POC and benches
7. Connectors: `connectors/` — FIX / OUCH / ITCH skeletons
8. Smart Order Router: `sor/` simulator
9. Metrics & Tracing: Node/Python services instrumented with Prometheus and OpenTelemetry

Next steps to reach production-readiness:

- Implement Vault/HSM secrets integration and rotate keys
- Harden security: SCA/SAST + DAST workflows, Snyk/Trivy/OS tools
- Implement backup and DR plans with multi-region configs
- Add full FIX/OUCH/ITCH adapters and matching engine optimization with DPDK
- Provide SDKs and developer portal
