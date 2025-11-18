/**
 * Risk Engine Service
 * Portfolio risk calculations, VaR, margin requirements, liquidation logic
 */

class RiskEngine {
  constructor() {
    this.portfolios = new Map();
    this.riskLimits = {
      maxLeverage: 10,
      maintenanceMargin: 0.05, // 5%
      initialMargin: 0.10, // 10%
      liquidationBuffer: 0.03 // 3%
    };
    this.priceFeeds = new Map();
  }

  // Portfolio management
  getOrCreatePortfolio(userId) {
    if (!this.portfolios.has(userId)) {
      this.portfolios.set(userId, {
        userId,
        positions: new Map(),
        cash: 0,
        marginType: 'CROSS',
        totalEquity: 0,
        usedMargin: 0,
        availableMargin: 0,
        unrealizedPnL: 0,
        realizedPnL: 0
      });
    }
    return this.portfolios.get(userId);
  }

  // Update position
  updatePosition(userId, symbol, assetClass, quantity, avgPrice) {
    const portfolio = this.getOrCreatePortfolio(userId);
    const positionKey = `${assetClass}:${symbol}`;
    
    if (!portfolio.positions.has(positionKey)) {
      portfolio.positions.set(positionKey, {
        symbol,
        assetClass,
        quantity: 0,
        avgPrice: 0,
        unrealizedPnL: 0,
        requiredMargin: 0
      });
    }

    const position = portfolio.positions.get(positionKey);
    const totalValue = (position.quantity * position.avgPrice) + (quantity * avgPrice);
    const totalQty = position.quantity + quantity;
    
    if (totalQty !== 0) {
      position.avgPrice = totalValue / totalQty;
      position.quantity = totalQty;
    } else {
      // Position closed
      portfolio.realizedPnL += position.unrealizedPnL;
      portfolio.positions.delete(positionKey);
    }

    this.updatePortfolioMetrics(userId);
    return position;
  }

  // Update portfolio metrics
  updatePortfolioMetrics(userId) {
    const portfolio = this.getOrCreatePortfolio(userId);
    let totalUnrealized = 0;
    let totalMarginRequired = 0;

    for (const [key, position] of portfolio.positions) {
      const currentPrice = this.priceFeeds.get(key) || position.avgPrice;
      const marketValue = position.quantity * currentPrice;
      const costBasis = position.quantity * position.avgPrice;
      
      position.unrealizedPnL = marketValue - costBasis;
      position.requiredMargin = Math.abs(marketValue) * this.riskLimits.initialMargin;
      
      totalUnrealized += position.unrealizedPnL;
      totalMarginRequired += position.requiredMargin;
    }

    portfolio.unrealizedPnL = totalUnrealized;
    portfolio.totalEquity = portfolio.cash + totalUnrealized;
    portfolio.usedMargin = totalMarginRequired;
    portfolio.availableMargin = portfolio.totalEquity - totalMarginRequired;

    return portfolio;
  }

  // Pre-trade risk check
  preTradeRiskCheck(userId, symbol, assetClass, side, quantity, price) {
    const portfolio = this.getOrCreatePortfolio(userId);
    const notionalValue = quantity * price;
    const requiredMargin = notionalValue * this.riskLimits.initialMargin;

    // Check available margin
    if (requiredMargin > portfolio.availableMargin) {
      return {
        approved: false,
        reason: 'INSUFFICIENT_MARGIN',
        required: requiredMargin,
        available: portfolio.availableMargin
      };
    }

    // Check leverage
    const newUsedMargin = portfolio.usedMargin + requiredMargin;
    const leverage = newUsedMargin / portfolio.totalEquity;
    
    if (leverage > this.riskLimits.maxLeverage) {
      return {
        approved: false,
        reason: 'LEVERAGE_EXCEEDED',
        current: leverage,
        max: this.riskLimits.maxLeverage
      };
    }

    return {
      approved: true,
      requiredMargin,
      projectedLeverage: leverage
    };
  }

  // Liquidation check
  checkLiquidation(userId) {
    const portfolio = this.getOrCreatePortfolio(userId);
    
    if (portfolio.totalEquity <= 0) {
      return {
        shouldLiquidate: true,
        reason: 'NEGATIVE_EQUITY',
        equity: portfolio.totalEquity
      };
    }

    const marginRatio = portfolio.usedMargin / portfolio.totalEquity;
    const liquidationThreshold = 1 - this.riskLimits.maintenanceMargin;

    if (marginRatio >= liquidationThreshold) {
      return {
        shouldLiquidate: true,
        reason: 'MARGIN_CALL',
        marginRatio,
        threshold: liquidationThreshold,
        deficit: portfolio.usedMargin - (portfolio.totalEquity * liquidationThreshold)
      };
    }

    return {
      shouldLiquidate: false,
      marginRatio,
      buffer: liquidationThreshold - marginRatio
    };
  }

  // VaR calculation (simplified Historical VaR)
  calculateVaR(userId, confidenceLevel = 0.95, timeHorizon = 1) {
    const portfolio = this.getOrCreatePortfolio(userId);
    
    // Simplified VaR calculation
    // In production, use historical returns and Monte Carlo simulation
    const portfolioValue = portfolio.totalEquity;
    const volatility = 0.02; // 2% daily volatility (placeholder)
    const zScore = confidenceLevel === 0.95 ? 1.645 : 
                   confidenceLevel === 0.99 ? 2.326 : 1.645;
    
    const VaR = portfolioValue * volatility * zScore * Math.sqrt(timeHorizon);
    const ES = VaR * 1.2; // Expected Shortfall approximation

    return {
      VaR,
      ES,
      confidenceLevel,
      timeHorizon,
      method: 'PARAMETRIC',
      portfolioValue
    };
  }

  // Greeks calculation (for options)
  calculateGreeks(optionType, spot, strike, timeToExpiry, volatility, riskFreeRate) {
    // Black-Scholes model (simplified)
    const d1 = (Math.log(spot / strike) + (riskFreeRate + volatility ** 2 / 2) * timeToExpiry) /
               (volatility * Math.sqrt(timeToExpiry));
    const d2 = d1 - volatility * Math.sqrt(timeToExpiry);

    // Standard normal CDF approximation
    const normalCDF = (x) => {
      return 0.5 * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3)));
    };

    const normalPDF = (x) => {
      return Math.exp(-x ** 2 / 2) / Math.sqrt(2 * Math.PI);
    };

    const delta = optionType === 'CALL' ? normalCDF(d1) : normalCDF(d1) - 1;
    const gamma = normalPDF(d1) / (spot * volatility * Math.sqrt(timeToExpiry));
    const theta = -(spot * normalPDF(d1) * volatility) / (2 * Math.sqrt(timeToExpiry)) -
                  riskFreeRate * strike * Math.exp(-riskFreeRate * timeToExpiry) * 
                  (optionType === 'CALL' ? normalCDF(d2) : normalCDF(-d2));
    const vega = spot * normalPDF(d1) * Math.sqrt(timeToExpiry);
    const rho = strike * timeToExpiry * Math.exp(-riskFreeRate * timeToExpiry) *
                (optionType === 'CALL' ? normalCDF(d2) : normalCDF(-d2));

    return { delta, gamma, theta, vega, rho };
  }

  // Update price feed
  updatePrice(symbol, assetClass, price) {
    const key = `${assetClass}:${symbol}`;
    this.priceFeeds.set(key, price);
    
    // Update all portfolios with this position
    for (const [userId] of this.portfolios) {
      this.updatePortfolioMetrics(userId);
      
      // Check for liquidations
      const liquidationCheck = this.checkLiquidation(userId);
      if (liquidationCheck.shouldLiquidate) {
        this.emit('liquidationAlert', { userId, ...liquidationCheck });
      }
    }
  }

  // Get portfolio summary
  getPortfolioSummary(userId) {
    const portfolio = this.getOrCreatePortfolio(userId);
    const var95 = this.calculateVaR(userId, 0.95);
    const var99 = this.calculateVaR(userId, 0.99);
    const liquidationCheck = this.checkLiquidation(userId);

    return {
      ...portfolio,
      positions: Array.from(portfolio.positions.values()),
      risk: {
        var95,
        var99,
        liquidation: liquidationCheck
      }
    };
  }
}

// Make RiskEngine an EventEmitter
const EventEmitter = require('events');
Object.setPrototypeOf(RiskEngine.prototype, EventEmitter.prototype);

module.exports = { RiskEngine };
