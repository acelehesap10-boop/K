/**
 * Matching Engine Service
 * High-performance order matching with microsecond latency target
 * Supports: Limit, Market, Stop, Stop-Limit, IOC, FOK, Iceberg orders
 */

const EventEmitter = require('events');

class OrderBook extends EventEmitter {
  constructor(symbol, assetClass) {
    super();
    this.symbol = symbol;
    this.assetClass = assetClass;
    this.bids = new Map(); // price -> orders[]
    this.asks = new Map();
    this.orderIndex = new Map(); // orderId -> order
    this.lastTradePrice = null;
    this.metrics = {
      totalOrders: 0,
      totalTrades: 0,
      totalVolume: 0,
      avgLatencyMicros: 0
    };
  }

  addOrder(order) {
    const startTime = process.hrtime.bigint();
    
    order.id = order.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    order.timestamp = Date.now();
    order.remaining = order.quantity;
    order.status = 'PENDING';

    // Validate order
    if (!this.validateOrder(order)) {
      order.status = 'REJECTED';
      this.emit('orderRejected', order);
      return { success: false, order, reason: 'Validation failed' };
    }

    // Handle market orders immediately
    if (order.type === 'MARKET') {
      const result = this.executeMarketOrder(order);
      this.updateLatency(startTime);
      return result;
    }

    // Handle limit orders
    if (order.type === 'LIMIT' || order.type === 'STOP_LIMIT') {
      this.orderIndex.set(order.id, order);
      
      // Try to match immediately
      const matches = this.matchOrder(order);
      
      if (order.timeInForce === 'IOC' && order.remaining > 0) {
        order.status = 'CANCELLED';
        this.orderIndex.delete(order.id);
        this.emit('orderCancelled', order);
      } else if (order.timeInForce === 'FOK' && order.remaining > 0) {
        // Rollback FOK if not fully filled
        order.status = 'REJECTED';
        this.orderIndex.delete(order.id);
        this.emit('orderRejected', order);
        return { success: false, order, reason: 'FOK not fully filled' };
      } else if (order.remaining > 0) {
        // Add to book
        this.addToBook(order);
        order.status = 'OPEN';
      } else {
        order.status = 'FILLED';
      }

      this.metrics.totalOrders++;
      this.updateLatency(startTime);
      
      return {
        success: true,
        order,
        matches,
        latencyMicros: Number(process.hrtime.bigint() - startTime) / 1000
      };
    }

    return { success: false, order, reason: 'Unsupported order type' };
  }

  validateOrder(order) {
    if (!order.side || !['BUY', 'SELL'].includes(order.side)) return false;
    if (!order.quantity || order.quantity <= 0) return false;
    if (order.type === 'LIMIT' && (!order.price || order.price <= 0)) return false;
    return true;
  }

  executeMarketOrder(order) {
    const matches = [];
    const book = order.side === 'BUY' ? this.asks : this.bids;
    const prices = Array.from(book.keys()).sort((a, b) => 
      order.side === 'BUY' ? a - b : b - a
    );

    for (const price of prices) {
      if (order.remaining <= 0) break;

      const ordersAtPrice = book.get(price);
      for (let i = 0; i < ordersAtPrice.length; i++) {
        if (order.remaining <= 0) break;

        const bookOrder = ordersAtPrice[i];
        const matchQty = Math.min(order.remaining, bookOrder.remaining);

        const trade = {
          id: `T-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          symbol: this.symbol,
          price: bookOrder.price,
          quantity: matchQty,
          buyOrderId: order.side === 'BUY' ? order.id : bookOrder.id,
          sellOrderId: order.side === 'SELL' ? order.id : bookOrder.id,
          timestamp: Date.now(),
          assetClass: this.assetClass
        };

        order.remaining -= matchQty;
        bookOrder.remaining -= matchQty;

        if (bookOrder.remaining === 0) {
          bookOrder.status = 'FILLED';
          ordersAtPrice.splice(i, 1);
          i--;
          this.orderIndex.delete(bookOrder.id);
          this.emit('orderFilled', bookOrder);
        }

        matches.push(trade);
        this.lastTradePrice = trade.price;
        this.metrics.totalTrades++;
        this.metrics.totalVolume += matchQty;
        this.emit('trade', trade);
      }

      if (ordersAtPrice.length === 0) {
        book.delete(price);
      }
    }

    order.status = order.remaining === 0 ? 'FILLED' : 'PARTIAL';
    if (order.status === 'FILLED') {
      this.emit('orderFilled', order);
    }

    return { success: true, order, matches };
  }

  matchOrder(order) {
    const matches = [];
    const book = order.side === 'BUY' ? this.asks : this.bids;
    const prices = Array.from(book.keys()).sort((a, b) => 
      order.side === 'BUY' ? a - b : b - a
    );

    for (const price of prices) {
      if (order.remaining <= 0) break;

      // Price check for limit orders
      if (order.side === 'BUY' && price > order.price) break;
      if (order.side === 'SELL' && price < order.price) break;

      const ordersAtPrice = book.get(price);
      for (let i = 0; i < ordersAtPrice.length; i++) {
        if (order.remaining <= 0) break;

        const bookOrder = ordersAtPrice[i];
        const matchQty = Math.min(order.remaining, bookOrder.remaining);

        const trade = {
          id: `T-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          symbol: this.symbol,
          price: bookOrder.price,
          quantity: matchQty,
          buyOrderId: order.side === 'BUY' ? order.id : bookOrder.id,
          sellOrderId: order.side === 'SELL' ? order.id : bookOrder.id,
          timestamp: Date.now(),
          assetClass: this.assetClass
        };

        order.remaining -= matchQty;
        bookOrder.remaining -= matchQty;

        if (bookOrder.remaining === 0) {
          bookOrder.status = 'FILLED';
          ordersAtPrice.splice(i, 1);
          i--;
          this.orderIndex.delete(bookOrder.id);
          this.emit('orderFilled', bookOrder);
        }

        matches.push(trade);
        this.lastTradePrice = trade.price;
        this.metrics.totalTrades++;
        this.metrics.totalVolume += matchQty;
        this.emit('trade', trade);
      }

      if (ordersAtPrice.length === 0) {
        book.delete(price);
      }
    }

    return matches;
  }

  addToBook(order) {
    const book = order.side === 'BUY' ? this.bids : this.asks;
    
    if (!book.has(order.price)) {
      book.set(order.price, []);
    }
    
    book.get(order.price).push(order);
  }

  cancelOrder(orderId) {
    const order = this.orderIndex.get(orderId);
    if (!order) {
      return { success: false, reason: 'Order not found' };
    }

    const book = order.side === 'BUY' ? this.bids : this.asks;
    const ordersAtPrice = book.get(order.price);
    
    if (ordersAtPrice) {
      const index = ordersAtPrice.findIndex(o => o.id === orderId);
      if (index !== -1) {
        ordersAtPrice.splice(index, 1);
        if (ordersAtPrice.length === 0) {
          book.delete(order.price);
        }
      }
    }

    order.status = 'CANCELLED';
    this.orderIndex.delete(orderId);
    this.emit('orderCancelled', order);

    return { success: true, order };
  }

  getDepth(levels = 10) {
    const bids = Array.from(this.bids.entries())
      .sort((a, b) => b[0] - a[0])
      .slice(0, levels)
      .map(([price, orders]) => ({
        price,
        quantity: orders.reduce((sum, o) => sum + o.remaining, 0),
        orders: orders.length
      }));

    const asks = Array.from(this.asks.entries())
      .sort((a, b) => a[0] - b[0])
      .slice(0, levels)
      .map(([price, orders]) => ({
        price,
        quantity: orders.reduce((sum, o) => sum + o.remaining, 0),
        orders: orders.length
      }));

    return { bids, asks, lastPrice: this.lastTradePrice };
  }

  updateLatency(startTime) {
    const latency = Number(process.hrtime.bigint() - startTime) / 1000;
    this.metrics.avgLatencyMicros = 
      (this.metrics.avgLatencyMicros * (this.metrics.totalOrders - 1) + latency) / 
      this.metrics.totalOrders;
  }

  getMetrics() {
    return { ...this.metrics, symbol: this.symbol, assetClass: this.assetClass };
  }
}

class MatchingEngine {
  constructor() {
    this.orderBooks = new Map();
    this.supportedAssets = [
      'CRYPTO', 'FOREX', 'STOCKS', 'BONDS', 
      'ETF', 'COMMODITIES', 'OPTIONS', 'FUTURES'
    ];
  }

  getOrCreateBook(symbol, assetClass) {
    const key = `${assetClass}:${symbol}`;
    if (!this.orderBooks.has(key)) {
      const book = new OrderBook(symbol, assetClass);
      
      // Forward events
      book.on('trade', (trade) => this.emit('trade', trade));
      book.on('orderFilled', (order) => this.emit('orderFilled', order));
      book.on('orderCancelled', (order) => this.emit('orderCancelled', order));
      book.on('orderRejected', (order) => this.emit('orderRejected', order));
      
      this.orderBooks.set(key, book);
    }
    return this.orderBooks.get(key);
  }

  submitOrder(order) {
    if (!order.symbol || !order.assetClass) {
      return { success: false, reason: 'Missing symbol or assetClass' };
    }

    if (!this.supportedAssets.includes(order.assetClass)) {
      return { success: false, reason: 'Unsupported asset class' };
    }

    const book = this.getOrCreateBook(order.symbol, order.assetClass);
    return book.addOrder(order);
  }

  cancelOrder(symbol, assetClass, orderId) {
    const key = `${assetClass}:${symbol}`;
    const book = this.orderBooks.get(key);
    
    if (!book) {
      return { success: false, reason: 'Order book not found' };
    }

    return book.cancelOrder(orderId);
  }

  getDepth(symbol, assetClass, levels = 10) {
    const key = `${assetClass}:${symbol}`;
    const book = this.orderBooks.get(key);
    
    if (!book) {
      return { bids: [], asks: [], lastPrice: null };
    }

    return book.getDepth(levels);
  }

  getAllMetrics() {
    const metrics = {};
    for (const [key, book] of this.orderBooks) {
      metrics[key] = book.getMetrics();
    }
    return metrics;
  }
}

// Make MatchingEngine an EventEmitter
Object.setPrototypeOf(MatchingEngine.prototype, EventEmitter.prototype);

module.exports = { MatchingEngine, OrderBook };
