/**
 * Matching Engine Microservice
 * Exposes matching engine via REST API and WebSocket
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { MatchingEngine } = require('./index');

const app = express();
const { middlewareMetrics, metricsEndpoint } = require('../../metrics');
const { initTracing } = require('../../telemetry/node-otel');
initTracing('matching-engine');
app.use(middlewareMetrics());
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(express.json());

const engine = new MatchingEngine();

// Forward engine events to WebSocket clients
engine.on('trade', (trade) => {
  io.emit('trade', trade);
});

engine.on('orderFilled', (order) => {
  io.emit('orderFilled', order);
});

engine.on('orderCancelled', (order) => {
  io.emit('orderCancelled', order);
});

// REST API
app.post('/api/orders', (req, res) => {
  const result = engine.submitOrder(req.body);
  res.json(result);
});

app.delete('/api/orders/:symbol/:assetClass/:orderId', (req, res) => {
  const { symbol, assetClass, orderId } = req.params;
  const result = engine.cancelOrder(symbol, assetClass, orderId);
  res.json(result);
});

app.get('/api/depth/:symbol/:assetClass', (req, res) => {
  const { symbol, assetClass } = req.params;
  const levels = parseInt(req.query.levels) || 10;
  const depth = engine.getDepth(symbol, assetClass, levels);
  res.json(depth);
});

app.get('/api/metrics', (req, res) => {
  res.json(engine.getAllMetrics());
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'matching-engine' });
});

// Prometheus metrics endpoint
metricsEndpoint(app);

// WebSocket
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('submitOrder', (order, callback) => {
    const result = engine.submitOrder(order);
    if (callback) callback(result);
  });

  socket.on('cancelOrder', (data, callback) => {
    const result = engine.cancelOrder(data.symbol, data.assetClass, data.orderId);
    if (callback) callback(result);
  });

  socket.on('subscribeDepth', (data) => {
    const { symbol, assetClass } = data;
    const interval = setInterval(() => {
      const depth = engine.getDepth(symbol, assetClass);
      socket.emit('depth', { symbol, assetClass, depth });
    }, 100); // 100ms updates

    socket.on('disconnect', () => clearInterval(interval));
  });
});

const PORT = process.env.MATCHING_ENGINE_PORT || 6001;
server.listen(PORT, () => {
  console.log(`Matching Engine running on port ${PORT}`);
});

module.exports = { app, server, engine };
