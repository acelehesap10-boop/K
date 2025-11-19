/**
 * Blockchain Tracker Microservice
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { BlockchainTracker } = require('./index');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(express.json());
const { middlewareMetrics, metricsEndpoint } = require('../../metrics');
const { initTracing } = require('../../telemetry/node-otel');
initTracing('blockchain-tracker');
app.use(middlewareMetrics());

const tracker = new BlockchainTracker();

// Forward balance updates to WebSocket clients
tracker.on('balanceUpdate', (balance) => {
  io.emit('balanceUpdate', balance);
});

// REST API
app.get('/api/balances', (req, res) => {
  res.json(tracker.getBalances());
});

app.get('/api/wallets', (req, res) => {
  res.json(tracker.getTreasuryWallets());
});

app.post('/api/track', async (req, res) => {
  const results = await tracker.trackAllWallets();
  res.json(results);
});

app.get('/api/confirmation/:chain/:confirmations', (req, res) => {
  const { chain, confirmations } = req.params;
  const status = tracker.getConfirmationStatus(chain, parseInt(confirmations));
  res.json(status);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'blockchain-tracker',
    lastUpdate: tracker.lastUpdate,
  });
});
metricsEndpoint(app);

// WebSocket
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send current balances on connect
  socket.emit('balances', tracker.getBalances());

  socket.on('requestUpdate', async () => {
    const results = await tracker.trackAllWallets();
    socket.emit('balances', results);
  });
});

// Start monitoring
tracker.startMonitoring(60000); // Update every 60 seconds

const PORT = process.env.BLOCKCHAIN_TRACKER_PORT || 6002;
server.listen(PORT, () => {
  console.log(`Blockchain Tracker running on port ${PORT}`);
});

module.exports = { app, server, tracker };
