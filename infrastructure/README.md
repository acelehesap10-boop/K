## Infrastructure

This folder contains Terraform and Helm charts for deploying the platform.

Steps to run locally (development):

1. Configure `terraform` backend in `main.tf` (S3 + DynamoDB recommended for lock).
2. Run:

```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

3. Install Helm charts:

```bash
helm install matching-engine infrastructure/helm/matching-engine
```

4. ArgoCD applications in `infrastructure/argocd/apps` point to these helm charts (requires ArgoCD setup on cluster).

## Vault + HSM (auto-unseal)

We use a KMS key or CloudHSM cluster to enable Vault auto-unseal. Add the following example to your Terraform pipeline (modify names and access):

```
module "vault_unseal" {
	source = "./vault_hsm"
}

output "vault_unseal_key_arn" {
	value = module.vault_unseal.kms_arn
}
```

In production, use a trusted KMS or HSM and integrate with access logs and rotation policies.

Security: integrate Vault or HSM by adding a HashiCorp Vault module in `terraform` and using `vault_kv_secret` to inject secrets.
