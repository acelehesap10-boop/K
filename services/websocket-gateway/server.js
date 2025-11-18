/**
 * WebSocket Gateway
 * Unified WebSocket endpoint for all real-time data
 */

const http = require('http');
const socketIO = require('socket.io');
const axios = require('axios');

const server = http.createServer();
const io = socketIO(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:5000",
      "http://localhost:5001",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5000",
      "http://127.0.0.1:5001",
      "https://github.com",
      "https://github.dev",
      "*"
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400
  }
});

const MARKET_DATA_URL = process.env.MARKET_DATA_URL || 'http://localhost:6004';
const MATCHING_ENGINE_URL = process.env.MATCHING_ENGINE_URL || 'http://localhost:6001';
const BLOCKCHAIN_TRACKER_URL = process.env.BLOCKCHAIN_TRACKER_URL || 'http://localhost:6002';

io.on('connection', (socket) => {
  console.log('WebSocket client connected:', socket.id);

  // Market data subscriptions
  socket.on('subscribe:price', async (data) => {
    const { symbol, assetClass } = data;
    console.log(`Client ${socket.id} subscribed to ${assetClass}:${symbol}`);
    
    // Forward to market data service
    // In production, use service-to-service WebSocket or message queue
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(
          `${MARKET_DATA_URL}/api/price/${assetClass}/${symbol}`
        );
        socket.emit('price:update', response.data);
      } catch (error) {
        console.error('Price fetch error:', error.message);
      }
    }, 1000);

    socket.on('disconnect', () => clearInterval(interval));
  });

  socket.on('subscribe:depth', async (data) => {
    const { symbol, assetClass } = data;
    console.log(`Client ${socket.id} subscribed to depth ${assetClass}:${symbol}`);
    
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(
          `${MATCHING_ENGINE_URL}/api/depth/${symbol}/${assetClass}`
        );
        socket.emit('depth:update', response.data);
      } catch (error) {
        console.error('Depth fetch error:', error.message);
      }
    }, 500);

    socket.on('disconnect', () => clearInterval(interval));
  });

  socket.on('subscribe:blockchain', async () => {
    console.log(`Client ${socket.id} subscribed to blockchain updates`);
    
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${BLOCKCHAIN_TRACKER_URL}/api/balances`);
        socket.emit('blockchain:update', response.data);
      } catch (error) {
        console.error('Blockchain fetch error:', error.message);
      }
    }, 5000);

    socket.on('disconnect', () => clearInterval(interval));
  });

  // Order submission
  socket.on('order:submit', async (order, callback) => {
    try {
      const response = await axios.post(`${MATCHING_ENGINE_URL}/api/orders`, order);
      if (callback) callback(response.data);
    } catch (error) {
      if (callback) callback({ success: false, error: error.message });
    }
  });

  socket.on('order:cancel', async (data, callback) => {
    try {
      const { symbol, assetClass, orderId } = data;
      const response = await axios.delete(
        `${MATCHING_ENGINE_URL}/api/orders/${symbol}/${assetClass}/${orderId}`
      );
      if (callback) callback(response.data);
    } catch (error) {
      if (callback) callback({ success: false, error: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('WebSocket client disconnected:', socket.id);
  });
});

const PORT = process.env.WEBSOCKET_PORT || 6007;
server.listen(PORT, () => {
  console.log(`WebSocket Gateway running on port ${PORT}`);
});

module.exports = { server, io };
