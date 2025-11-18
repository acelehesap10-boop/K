/**
 * User API Service
 * Public-facing API for traders and users
 */

const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const MATCHING_ENGINE_URL = process.env.MATCHING_ENGINE_URL || 'http://localhost:6001';
const MARKET_DATA_URL = process.env.MARKET_DATA_URL || 'http://localhost:6004';
const RISK_ENGINE_URL = process.env.RISK_ENGINE_URL || 'http://localhost:6003';

// Middleware: Verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Public endpoints
app.get('/api/assets', async (req, res) => {
  try {
    const response = await axios.get(`${MARKET_DATA_URL}/api/assets`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

app.get('/api/price/:assetClass/:symbol', async (req, res) => {
  try {
    const { assetClass, symbol } = req.params;
    const response = await axios.get(`${MARKET_DATA_URL}/api/price/${assetClass}/${symbol}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch price' });
  }
});

app.get('/api/orderbook/:assetClass/:symbol', async (req, res) => {
  try {
    const { assetClass, symbol } = req.params;
    const response = await axios.get(`${MARKET_DATA_URL}/api/orderbook/${assetClass}/${symbol}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order book' });
  }
});

// Protected endpoints
app.post('/api/orders', verifyToken, async (req, res) => {
  try {
    const order = { ...req.body, userId: req.user.userId };
    
    // Pre-trade risk check
    const riskCheck = await axios.post(`${RISK_ENGINE_URL}/api/risk/pre-trade`, {
      userId: req.user.userId,
      symbol: order.symbol,
      assetClass: order.assetClass,
      side: order.side,
      quantity: order.quantity,
      price: order.price
    });

    if (!riskCheck.data.approved) {
      return res.status(400).json({ 
        error: 'Risk check failed', 
        reason: riskCheck.data.reason 
      });
    }

    // Submit order to matching engine
    const response = await axios.post(`${MATCHING_ENGINE_URL}/api/orders`, order);
    
    // Update position in risk engine if filled
    if (response.data.success && response.data.matches?.length > 0) {
      const totalFilled = response.data.order.quantity - response.data.order.remaining;
      await axios.post(`${RISK_ENGINE_URL}/api/risk/update-position`, {
        userId: req.user.userId,
        symbol: order.symbol,
        assetClass: order.assetClass,
        quantity: order.side === 'BUY' ? totalFilled : -totalFilled,
        avgPrice: order.price
      });
    }

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit order', details: error.message });
  }
});

app.delete('/api/orders/:symbol/:assetClass/:orderId', verifyToken, async (req, res) => {
  try {
    const { symbol, assetClass, orderId } = req.params;
    const response = await axios.delete(
      `${MATCHING_ENGINE_URL}/api/orders/${symbol}/${assetClass}/${orderId}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

app.get('/api/portfolio', verifyToken, async (req, res) => {
  try {
    const response = await axios.get(
      `${RISK_ENGINE_URL}/api/risk/portfolio/${req.user.userId}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

app.get('/api/risk/var', verifyToken, async (req, res) => {
  try {
    const { confidenceLevel = 0.95, timeHorizon = 1 } = req.query;
    const response = await axios.post(
      `${RISK_ENGINE_URL}/api/risk/var/${req.user.userId}`,
      { confidenceLevel: parseFloat(confidenceLevel), timeHorizon: parseInt(timeHorizon) }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate VaR' });
  }
});

// Demo login (for testing)
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simplified auth - use proper authentication in production
  const token = jwt.sign(
    { userId: 'demo-user', email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, userId: 'demo-user', email });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'user-api' });
});

const PORT = process.env.USER_API_PORT || 6006;
app.listen(PORT, () => {
  console.log(`User API running on port ${PORT}`);
});

module.exports = { app };
