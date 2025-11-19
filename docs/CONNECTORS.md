# Connectors Roadmap

Implementation steps and notes for FIX / OUCH / ITCH adapters.

FIX:

- Use `fixparser` (Node) for light-weight session acceptance. For production, prefer QuickFIX/J or QuickFIX/Go.
- Implement session-level ACLs, sequence numbers, and secure FIX over TLS.
- Map FIX incoming orders to internal API (or direct RPC to matching engine).

OUCH/ITCH:

- Implement binary decode of OUCH/ITCH messages in Rust for performance.
- Replay harness: capture OUCH feeds, store as files for deterministic replay into matching-engine.
- Build test harness for drop-copy and clearing files.

Testing and Performance:

- Add jitter and network simulation to test SOR & matching engine under reordering and replays.
- Add acceptance tests using crate's test harness and CI benchmarking.
