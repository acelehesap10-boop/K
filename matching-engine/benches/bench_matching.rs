use criterion::{black_box, criterion_group, criterion_main, Criterion};
use matching_engine::{Order, OrderBook, Side};

fn bench_match(c: &mut Criterion) {
    let mut ob = OrderBook::new();
    for i in 0..1000 {
        ob.add_order(&Order { id: i, side: Side::Ask, price: 100 + (i%20) as u64, size: 5 });
    }
    let incoming = Order { id: 999999, side: Side::Bid, price: 120, size: 1 };

    c.bench_function("simple-match", |b| {
        b.iter(|| ob.match_order(black_box(&incoming)));
    });
}

criterion_group!(benches, bench_match);
criterion_main!(benches);
