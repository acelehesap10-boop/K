terraform {
  required_version = ">= 1.4.0"
}

provider "aws" {
  region = var.aws_region
}

provider "kubernetes" {
  host                   = var.kubernetes_host
  cluster_ca_certificate = base64decode(var.kubernetes_ca)
  token                  = var.kubernetes_token
}

provider "helm" {
  kubernetes {
    host                   = var.kubernetes_host
    cluster_ca_certificate = base64decode(var.kubernetes_ca)
    token                  = var.kubernetes_token
  }
}
