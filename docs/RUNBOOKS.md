# Runbooks & SRE Playbooks

This file contains a short list of SRE runbooks and playbooks for incident response and operational tasks.

## Incident: Matching Engine Latency Spike

1. Identify spike using Prometheus alert (MatchingEngineHighLatency).
2. Use Jaeger to trace hot paths and check eBPF flame graphs.
3. If patch needed, open a hotfix PR with `matching-engine` changes; run benchmark in the rust-bench job.
4. Scale matching-engine pods or enable co-location nodes.

## Incident: Wallet Confirmations Stalled

1. Check blockchain-tracker logs, reorg handling, and mempool backlog.
2. Temporarily disable automatic withdrawals until reconciliation finishes.
3. Notify compliance and ops teams with proof-of-reserves snapshot.

## Incident: Unauthorized Admin Access

1. Revoke compromised credentials.
2. Trigger emergency freeze on admin privileges.
3. Rotate keys via Vault/HSM.
