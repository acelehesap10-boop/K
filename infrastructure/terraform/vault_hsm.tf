// Vault + HSM example
// NOTE: These resources are examples. Configure your provider credentials securely and 
// validate all changes in a non-production environment.

resource "aws_kms_key" "vault_unseal" {
  description = "KMS key for Vault auto-unseal"
  deletion_window_in_days = 30
  key_usage = "ENCRYPT_DECRYPT"
  enable_key_rotation = true
}

resource "aws_kms_alias" "vault_unseal_alias" {
  name = "alias/vault-unseal"
  target_key_id = aws_kms_key.vault_unseal.key_id
}

// CloudHSM cluster (optional) for extremely hardware-backed key storage
resource "aws_cloudhsm_v2_cluster" "hsm" {
  hsm_type = "hsm1.medium"
  subnet_ids = var.private_subnet_cidrs
  source_backup_id = null
}

output "vault_kms_key_arn" {
  value = aws_kms_key.vault_unseal.arn
}
