# Smart Order Router (SOR) Simulator

This folder contains an example latency-aware SOR: a small simulator which evaluates venues based on latency and available depth and chooses the best venue.

Run:

```bash
python3 sor/simulator.py
```

You can extend this to support TWAP, VWAP, POV, Iceberg and multi-venue splitting. The scoring function should incorporate fill probability, latency, historical liquidity and fees.
