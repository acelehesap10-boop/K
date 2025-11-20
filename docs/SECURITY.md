# Security & Secrets Management

This document explains how we secure secrets using HashiCorp Vault and hardware-backed key storage where available.

## Goals

- Centralize secrets using HashiCorp Vault
- Use Vault Kubernetes auth + CSI driver for secret injection
- Use HSM for high-value signing/keys (cloud KMS or hardware HSM)
- Automatic key rotation & access logging

## Setup Vault Helm (Kubernetes)

1. Add HashiCorp Helm repo:

```bash
helm repo add hashicorp https://helm.releases.hashicorp.com
helm repo update
helm install vault hashicorp/vault -f infrastructure/helm/vault/values.yaml --namespace vault --create-namespace
```

2. Unseal & initialize: (Prefer Auto/unsealer with cloud KMS)

```bash
kubectl exec -n vault vault-0 -- vault operator init -key-shares=1 -key-threshold=1
kubectl exec -n vault vault-0 -- vault operator unseal <UNSEAL_KEY>
```

3. Configure Kubernetes auth and create a policy for `matching-engine` to read encryption keys and secrets.

Example policy:

```
path "secret/data/exchange/*" {
  capabilities = ["read", "list"]
}
```

4. Use Vault Agent Injector or CSI driver to mount secrets into pods. Example in Helm values set `injector.enabled=true`.

## HSM / KMS

- For production, store root keys in an HSM-backed KMS (AWS CloudHSM or KeyVault/HSM combo).
- Use cloud KMS with auto-unsealer configured in Vault Helm values.

## Rotations & SSO

- Configure automated rotation of DB/Encryption keys using Vault's TTL features.
- Use OIDC/SSO for admin access; `berkecansuskun1998@gmail.com` admin policy should require MFA + IP whitelist + multi-party approvals.
