/**
 * Market Data Service
 * Simulates real-time market data feeds for multiple asset classes
 */

const EventEmitter = require('events');

class MarketDataProvider extends EventEmitter {
  constructor() {
    super();
    this.subscriptions = new Map();
    this.latestPrices = new Map();
    this.assetConfigs = {
      'CRYPTO:BTC/USD': { basePrice: 43000, volatility: 0.03, tickSize: 0.01 },
      'CRYPTO:ETH/USD': { basePrice: 2300, volatility: 0.04, tickSize: 0.01 },
      'CRYPTO:SOL/USD': { basePrice: 105, volatility: 0.05, tickSize: 0.01 },
      'FOREX:EUR/USD': { basePrice: 1.0850, volatility: 0.008, tickSize: 0.0001 },
      'FOREX:GBP/USD': { basePrice: 1.2650, volatility: 0.009, tickSize: 0.0001 },
      'FOREX:USD/JPY': { basePrice: 148.50, volatility: 0.007, tickSize: 0.01 },
      'STOCKS:AAPL': { basePrice: 185.50, volatility: 0.02, tickSize: 0.01 },
      'STOCKS:MSFT': { basePrice: 378.25, volatility: 0.018, tickSize: 0.01 },
      'STOCKS:GOOGL': { basePrice: 142.80, volatility: 0.022, tickSize: 0.01 },
      'ETF:SPY': { basePrice: 478.30, volatility: 0.012, tickSize: 0.01 },
      'ETF:QQQ': { basePrice: 401.20, volatility: 0.015, tickSize: 0.01 },
      'COMMODITIES:GOLD': { basePrice: 2048.50, volatility: 0.015, tickSize: 0.10 },
      'COMMODITIES:OIL': { basePrice: 78.25, volatility: 0.025, tickSize: 0.01 },
      'FUTURES:ES': { basePrice: 4780.50, volatility: 0.014, tickSize: 0.25 },
      'OPTIONS:SPY_C_480': { basePrice: 12.50, volatility: 0.30, tickSize: 0.01 }
    };
  }

  subscribe(symbol, assetClass, callback) {
    const key = `${assetClass}:${symbol}`;
    
    if (!this.assetConfigs[key]) {
      console.warn(`No config for ${key}, using defaults`);
      this.assetConfigs[key] = { basePrice: 100, volatility: 0.02, tickSize: 0.01 };
    }

    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
      this.startFeed(key);
    }

    this.subscriptions.get(key).add(callback);
    
    // Send initial price
    if (this.latestPrices.has(key)) {
      callback(this.latestPrices.get(key));
    }

    return () => this.unsubscribe(key, callback);
  }

  unsubscribe(key, callback) {
    if (this.subscriptions.has(key)) {
      this.subscriptions.get(key).delete(callback);
      if (this.subscriptions.get(key).size === 0) {
        this.subscriptions.delete(key);
      }
    }
  }

  startFeed(key) {
    const config = this.assetConfigs[key];
    let currentPrice = config.basePrice;
    let lastUpdate = Date.now();

    const generateTick = () => {
      const now = Date.now();
      const timeDelta = (now - lastUpdate) / 1000; // seconds
      lastUpdate = now;

      // Geometric Brownian Motion
      const drift = 0; // Risk-neutral
      const randomShock = (Math.random() - 0.5) * 2; // -1 to 1
      const priceChange = currentPrice * (
        drift * timeDelta + 
        config.volatility * randomShock * Math.sqrt(timeDelta)
      );

      currentPrice = Math.max(config.tickSize, currentPrice + priceChange);
      currentPrice = Math.round(currentPrice / config.tickSize) * config.tickSize;

      const [assetClass, symbol] = key.split(':');
      const tick = {
        symbol,
        assetClass,
        price: currentPrice,
        bid: currentPrice - config.tickSize,
        ask: currentPrice + config.tickSize,
        volume: Math.floor(Math.random() * 1000) + 100,
        timestamp: now,
        latency: 0 // Simulated
      };

      this.latestPrices.set(key, tick);
      
      // Emit to subscribers
      if (this.subscriptions.has(key)) {
        for (const callback of this.subscriptions.get(key)) {
          callback(tick);
        }
      }

      this.emit('tick', tick);
    };

    // Generate ticks at random intervals (10-100ms)
    const scheduleNext = () => {
      if (this.subscriptions.has(key)) {
        generateTick();
        setTimeout(scheduleNext, 10 + Math.random() * 90);
      }
    };

    scheduleNext();
  }

  getLatestPrice(symbol, assetClass) {
    const key = `${assetClass}:${symbol}`;
    return this.latestPrices.get(key);
  }

  getOrderBook(symbol, assetClass, depth = 5) {
    const key = `${assetClass}:${symbol}`;
    const config = this.assetConfigs[key];
    const currentPrice = this.latestPrices.get(key)?.price || config?.basePrice || 100;
    
    const bids = [];
    const asks = [];
    const tickSize = config?.tickSize || 0.01;

    for (let i = 0; i < depth; i++) {
      bids.push({
        price: currentPrice - (i + 1) * tickSize,
        quantity: Math.floor(Math.random() * 500) + 100,
        orders: Math.floor(Math.random() * 10) + 1
      });

      asks.push({
        price: currentPrice + (i + 1) * tickSize,
        quantity: Math.floor(Math.random() * 500) + 100,
        orders: Math.floor(Math.random() * 10) + 1
      });
    }

    return { symbol, assetClass, bids, asks, lastPrice: currentPrice };
  }

  getSupportedAssets() {
    return Object.keys(this.assetConfigs).map(key => {
      const [assetClass, symbol] = key.split(':');
      return { symbol, assetClass };
    });
  }
}

module.exports = { MarketDataProvider };
