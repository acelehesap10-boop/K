use criterion::{black_box, criterion_group, criterion_main, Criterion};
use matching_engine::{Order, OrderBook, Side};

fn latency_bench(c: &mut Criterion) {
    let mut ob = OrderBook::new();
    for i in 0..10_000 {
        ob.add_order(&Order { id: i, side: Side::Ask, price: 100 + (i % 100) as u64, size: 5 });
    }

    c.bench_function("latency-match-10k", |b| {
        b.iter(|| {
            let incoming = Order { id: 9999999, side: Side::Bid, price: 150, size: 1 };
            ob.match_order(black_box(&incoming))
        });
    });
}

criterion_group!(benches, latency_bench);
criterion_main!(benches);
