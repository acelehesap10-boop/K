#!/usr/bin/env python3
"""
Simple Smart Order Router (SOR) simulator that routes orders across simulated venues
with different latencies and liquidity. This prototype allows building and validating
POV/TWAP/VWAP and latency-aware routing policies.
"""
import random
import time
from dataclasses import dataclass
from typing import List, Dict


@dataclass
class Venue:
    name: str
    latency_ms: float
    price: float
    depth: int


def generate_venues(n=3):
    return [Venue(name=f'V{i}', latency_ms=random.uniform(1, 20), price=100 + random.uniform(-1, 1), depth=1000) for i in range(n)]


def score_venue(v: Venue, order_size: int):
    # Simple scoring using latency and depth
    liquidity_score = min(order_size / (v.depth + 1), 1.0)
    latency_penalty = v.latency_ms / 1000.0
    return liquidity_score - latency_penalty


def route_order(venues: List[Venue], order_size: int):
    # Choose venue by highest score
    scored = [(score_venue(v, order_size), v) for v in venues]
    scored.sort(reverse=True, key=lambda x: x[0])
    return scored[0][1]


if __name__ == '__main__':
    venues = generate_venues(5)
    print('Simulated venues:')
    for v in venues:
        print(vars(v))

    order_size = 50
    chosen = route_order(venues, order_size)
    print('Order size', order_size, 'chosen venue:', chosen.name, 'latency ms:', chosen.latency_ms)
