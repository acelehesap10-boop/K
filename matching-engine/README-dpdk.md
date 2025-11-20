# DPDK / Kernel-Bypass Notes for Matching-Engine

This document outlines steps and code hooks to enable low-latency kernel-bypass frameworks such as DPDK or Netmap for the matching engine.

Important: DPDK and kernel-bypass require privileged access and fine-tuned NICs. Implementation is high-effort and platform-specific.

Suggested path:

1. Split the network I/O into a separate crate/module `matching_engine::net` with a trait `Transport`.
2. Implement two backends:
   - `kernel` — standard tokio/async-sockets for development
   - `dpdk` — uses DPAA/DPDK/poll-mode driver through FFI
3. Provide `feature = "dpdk"` to enable compilation of the `dpdk` backend.
4. Add micro-benchmarks to measure per-hop network latency and order processing.

Cargo feature example in `Cargo.toml`:

```
[features]
dpdk = ["dpdk-sys"]
```

Remember to measure context-switches, NUMA affinity, and enable hugepages on the host.
