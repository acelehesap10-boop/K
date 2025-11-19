// OUCH/ITCH skeleton - parse minimal messages and forward order events
// This is a placeholder for a high-performance adapter implemented in Rust

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct OuchOrder {
    pub order_id: u64,
    pub symbol: String,
    pub side: String,
    pub price: u64,
    pub quantity: u64,
}

pub fn parse_ouch(_payload: &[u8]) -> Option<OuchOrder> {
    // Implement binary decoding for OUCH protocol here
    None
}
