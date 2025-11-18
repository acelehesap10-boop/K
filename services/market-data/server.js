/**
 * Market Data Microservice
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { MarketDataProvider } = require('./index');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(express.json());

const marketData = new MarketDataProvider();

// REST API
app.get('/api/assets', (req, res) => {
  res.json(marketData.getSupportedAssets());
});

app.get('/api/price/:assetClass/:symbol', (req, res) => {
  const { assetClass, symbol } = req.params;
  const price = marketData.getLatestPrice(symbol, assetClass);
  res.json(price || { error: 'Not found' });
});

app.get('/api/orderbook/:assetClass/:symbol', (req, res) => {
  const { assetClass, symbol } = req.params;
  const depth = parseInt(req.query.depth) || 5;
  const book = marketData.getOrderBook(symbol, assetClass, depth);
  res.json(book);
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'market-data' });
});

// WebSocket
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  const subscriptions = [];

  socket.on('subscribe', (data) => {
    const { symbol, assetClass } = data;
    const unsubscribe = marketData.subscribe(symbol, assetClass, (tick) => {
      socket.emit('tick', tick);
    });
    subscriptions.push(unsubscribe);
  });

  socket.on('subscribeOrderBook', (data) => {
    const { symbol, assetClass } = data;
    const interval = setInterval(() => {
      const book = marketData.getOrderBook(symbol, assetClass);
      socket.emit('orderbook', book);
    }, 200);

    socket.on('disconnect', () => clearInterval(interval));
  });

  socket.on('disconnect', () => {
    subscriptions.forEach(unsub => unsub());
  });
});

const PORT = process.env.MARKET_DATA_PORT || 6004;
server.listen(PORT, () => {
  console.log(`Market Data Service running on port ${PORT}`);
});

module.exports = { app, server, marketData };
