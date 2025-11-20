use std::collections::BTreeMap;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Order {
    pub id: u64,
    pub side: Side,
    pub price: u64,
    pub size: u64,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub enum Side {
    Bid,
    Ask,
}

#[derive(Default)]
pub struct OrderBook {
    bids: BTreeMap<u64, u64>,
    asks: BTreeMap<u64, u64>,
}

impl OrderBook {
    pub fn new() -> Self {
        Self {
            bids: BTreeMap::new(),
            asks: BTreeMap::new(),
        }
    }

    pub fn add_order(&mut self, order: &Order) {
        match order.side {
            Side::Bid => {
                *self.bids.entry(order.price).or_insert(0) += order.size;
            }
            Side::Ask => {
                *self.asks.entry(order.price).or_insert(0) += order.size;
            }
        }
    }

    pub fn match_order(&mut self, incoming: &Order) -> Option<(u64, u64)> {
        // Very naive matching: top-of-book matching
        if incoming.side == Side::Bid {
            let top_ask = self.asks.iter_mut().next();
            if let Some((&price, size)) = top_ask {
                if incoming.price >= price {
                    let trade = std::cmp::min(*size, incoming.size);
                    *size -= trade;
                    if *size == 0 {
                        self.asks.remove(&price);
                    }
                    return Some((price, trade));
                }
            }
        } else {
            let top_bid = self.bids.iter_mut().rev().next();
            if let Some((&price, size)) = top_bid {
                if incoming.price <= price {
                    let trade = std::cmp::min(*size, incoming.size);
                    *size -= trade;
                    if *size == 0 {
                        self.bids.remove(&price);
                    }
                    return Some((price, trade));
                }
            }
        }
        None
    }
}

fn main() {
    env_logger::init();
    let mut ob = OrderBook::new();
    ob.add_order(&Order { id: 1, side: Side::Ask, price: 100, size: 5 });
    let incoming = Order { id: 2, side: Side::Bid, price: 110, size: 3 };
    if let Some((price, size)) = ob.match_order(&incoming) {
        println!("Matched at {} size {}", price, size);
    } else {
        println!("No match");
    }
}
