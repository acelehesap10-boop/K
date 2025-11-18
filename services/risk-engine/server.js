/**
 * Risk Engine Microservice
 */

const express = require('express');
const { RiskEngine } = require('./index');

const app = express();
app.use(express.json());

const riskEngine = new RiskEngine();

// API Endpoints
app.post('/api/risk/pre-trade', (req, res) => {
  const { userId, symbol, assetClass, side, quantity, price } = req.body;
  const result = riskEngine.preTradeRiskCheck(userId, symbol, assetClass, side, quantity, price);
  res.json(result);
});

app.post('/api/risk/update-position', (req, res) => {
  const { userId, symbol, assetClass, quantity, avgPrice } = req.body;
  const position = riskEngine.updatePosition(userId, symbol, assetClass, quantity, avgPrice);
  res.json(position);
});

app.get('/api/risk/portfolio/:userId', (req, res) => {
  const summary = riskEngine.getPortfolioSummary(req.params.userId);
  res.json(summary);
});

app.post('/api/risk/liquidation-check/:userId', (req, res) => {
  const result = riskEngine.checkLiquidation(req.params.userId);
  res.json(result);
});

app.post('/api/risk/var/:userId', (req, res) => {
  const { confidenceLevel, timeHorizon } = req.body;
  const var_result = riskEngine.calculateVaR(req.params.userId, confidenceLevel, timeHorizon);
  res.json(var_result);
});

app.post('/api/risk/greeks', (req, res) => {
  const { optionType, spot, strike, timeToExpiry, volatility, riskFreeRate } = req.body;
  const greeks = riskEngine.calculateGreeks(optionType, spot, strike, timeToExpiry, volatility, riskFreeRate);
  res.json(greeks);
});

app.post('/api/risk/price-update', (req, res) => {
  const { symbol, assetClass, price } = req.body;
  riskEngine.updatePrice(symbol, assetClass, price);
  res.json({ success: true });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'risk-engine' });
});

const PORT = process.env.RISK_ENGINE_PORT || 6003;
app.listen(PORT, () => {
  console.log(`Risk Engine running on port ${PORT}`);
});

module.exports = { app, riskEngine };
