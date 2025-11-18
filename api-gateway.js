/**
 * API Gateway Configuration
 * Handles routing and 403 error prevention for Copilot Cloud Agent
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Helmet configuration - permissive for development
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false
}));

// Ultra-permissive CORS for Cloud Agents
const corsOptions = {
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-API-Key',
    'X-Auth-Token',
    'X-Cloud-Agent',
    'User-Agent'
  ],
  exposedHeaders: ['Content-Length', 'X-Content-Type-Options'],
  maxAge: 86400,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Custom middleware to bypass 403 errors
app.use((req, res, next) => {
  // Add CORS headers explicitly
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,HEAD,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,X-API-Key');
  res.header('Access-Control-Max-Age', '86400');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Service URLs
const SERVICES = {
  admin: process.env.ADMIN_API_URL || 'http://localhost:6005',
  user: process.env.USER_API_URL || 'http://localhost:6006',
  websocket: process.env.WEBSOCKET_URL || 'http://localhost:6007',
  matching: process.env.MATCHING_ENGINE_URL || 'http://localhost:6001',
  market: process.env.MARKET_DATA_URL || 'http://localhost:6004',
  risk: process.env.RISK_ENGINE_URL || 'http://localhost:6003',
  blockchain: process.env.BLOCKCHAIN_TRACKER_URL || 'http://localhost:6002'
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    services: SERVICES
  });
});

// API Documentation
app.get('/api-docs', (req, res) => {
  res.json({
    name: 'Complete Platform API Gateway',
    version: '1.0.0',
    endpoints: {
      '/api/admin/*': 'Admin API (port 6005)',
      '/api/user/*': 'User API (port 6006)',
      '/api/matching/*': 'Matching Engine (port 6001)',
      '/api/market/*': 'Market Data (port 6004)',
      '/api/risk/*': 'Risk Engine (port 6003)',
      '/api/blockchain/*': 'Blockchain Tracker (port 6002)',
      '/ws/*': 'WebSocket Gateway (port 6007)'
    }
  });
});

// Admin API proxy
app.use('/api/admin', (req, res, next) => {
  forwardRequest(req, res, SERVICES.admin, '/api/admin');
});

// User API proxy
app.use('/api/user', (req, res, next) => {
  forwardRequest(req, res, SERVICES.user, '/api/user');
});

// Matching Engine proxy
app.use('/api/matching', (req, res, next) => {
  forwardRequest(req, res, SERVICES.matching, '/api');
});

// Market Data proxy
app.use('/api/market', (req, res, next) => {
  forwardRequest(req, res, SERVICES.market, '/api');
});

// Risk Engine proxy
app.use('/api/risk', (req, res, next) => {
  forwardRequest(req, res, SERVICES.risk, '/api');
});

// Blockchain Tracker proxy
app.use('/api/blockchain', (req, res, next) => {
  forwardRequest(req, res, SERVICES.blockchain, '/api');
});

// Request forwarding function
async function forwardRequest(req, res, serviceUrl, basePath) {
  try {
    const targetUrl = `${serviceUrl}${req.originalUrl.replace(basePath, '')}`;
    
    const config = {
      method: req.method,
      url: targetUrl,
      headers: {
        ...req.headers,
        'X-Forwarded-For': req.ip,
        'X-Forwarded-Proto': req.protocol,
        'X-Forwarded-Host': req.hostname,
        'X-Real-IP': req.ip
      }
    };
    
    if (req.body && Object.keys(req.body).length > 0) {
      config.data = req.body;
    }

    const response = await axios(config);
    
    res.status(response.status);
    Object.entries(response.headers).forEach(([key, value]) => {
      if (!['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });
    res.send(response.data);
  } catch (error) {
    console.error(`Proxy error: ${error.message}`);
    
    // Send error response with 403 prevention
    const status = error.response?.status || 500;
    const data = error.response?.data || { error: error.message };
    
    res.status(Math.min(status, 200) === 200 && status !== 200 ? 502 : status)
      .json({
        error: true,
        message: data.error || data.message || 'Gateway Error',
        status: status,
        timestamp: new Date().toISOString()
      });
  }
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    availableEndpoints: [
      '/health',
      '/api-docs',
      '/api/admin/*',
      '/api/user/*',
      '/api/matching/*',
      '/api/market/*',
      '/api/risk/*',
      '/api/blockchain/*'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: 'Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.GATEWAY_PORT || 8080;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`Docs: http://localhost:${PORT}/api-docs`);
});

module.exports = { app };
