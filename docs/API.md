# Exchange Platform API Documentation

## Service Architecture

The platform consists of 7 microservices:

1. **Matching Engine** (Port 6001) - Order matching and execution
2. **Blockchain Tracker** (Port 6002) - Multi-chain wallet monitoring
3. **Risk Engine** (Port 6003) - Portfolio risk & margin management
4. **Market Data** (Port 6004) - Real-time market data feeds
5. **Admin API** (Port 6005) - Administrative functions
6. **User API** (Port 6006) - Public trading API
7. **WebSocket Gateway** (Port 6007) - Real-time data streaming

## Authentication

Most endpoints require JWT authentication:

```bash
Authorization: Bearer <jwt_token>
```

### Get Token (Demo)
```bash
POST /api/login
Content-Type: application/json

{
  "email": "demo@example.com",
  "password": "demo"
}
```

## User API Endpoints

### Market Data

#### Get Supported Assets
```bash
GET /api/assets
```

#### Get Current Price
```bash
GET /api/price/:assetClass/:symbol

Example: GET /api/price/CRYPTO/BTC/USD
```

#### Get Order Book
```bash
GET /api/orderbook/:assetClass/:symbol?depth=10

Example: GET /api/orderbook/FOREX/EUR/USD?depth=5
```

### Trading

#### Submit Order
```bash
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "symbol": "BTC/USD",
  "assetClass": "CRYPTO",
  "side": "BUY",
  "type": "LIMIT",
  "quantity": 0.5,
  "price": 43000,
  "timeInForce": "GTC"
}
```

**Order Types:**
- `MARKET` - Execute at best available price
- `LIMIT` - Execute at specified price or better
- `STOP` - Stop loss order
- `STOP_LIMIT` - Stop limit order

**Time In Force:**
- `GTC` - Good Till Cancel
- `IOC` - Immediate Or Cancel
- `FOK` - Fill Or Kill

#### Cancel Order
```bash
DELETE /api/orders/:symbol/:assetClass/:orderId
Authorization: Bearer <token>
```

### Portfolio & Risk

#### Get Portfolio
```bash
GET /api/portfolio
Authorization: Bearer <token>
```

Response:
```json
{
  "userId": "demo-user",
  "positions": [
    {
      "symbol": "BTC/USD",
      "assetClass": "CRYPTO",
      "quantity": 0.5,
      "avgPrice": 42500,
      "unrealizedPnL": 250,
      "requiredMargin": 2125
    }
  ],
  "cash": 50000,
  "totalEquity": 50250,
  "usedMargin": 2125,
  "availableMargin": 48125,
  "risk": {
    "var95": { "VaR": 1005, "ES": 1206 },
    "liquidation": { "shouldLiquidate": false }
  }
}
```

#### Calculate VaR
```bash
GET /api/risk/var?confidenceLevel=0.95&timeHorizon=1
Authorization: Bearer <token>
```

## Admin API Endpoints

### Authentication

#### Admin Login
```bash
POST /api/admin/login
Content-Type: application/json

{
  "email": "berkecansuskun1998@gmail.com",
  "password": "Admin@2024!",
  "mfaCode": "123456"
}
```

### Platform Management

#### Get Platform Stats
```bash
GET /api/admin/stats
Authorization: Bearer <admin_token>
```

#### Halt Trading
```bash
POST /api/admin/halt-trading
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "symbol": "BTC/USD",
  "assetClass": "CRYPTO",
  "reason": "High volatility detected"
}
```

#### Resume Trading
```bash
POST /api/admin/resume-trading
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "symbol": "BTC/USD",
  "assetClass": "CRYPTO"
}
```

#### Update Risk Parameters
```bash
POST /api/admin/risk-params
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "maxLeverage": 15,
  "maintenanceMargin": 0.04
}
```

**Note:** Critical parameter changes require human approval.

#### Get Audit Logs
```bash
GET /api/admin/audit-logs
Authorization: Bearer <admin_token>
```

## Blockchain Tracker API

### Get Treasury Wallets
```bash
GET /api/wallets
```

Response:
```json
{
  "ETH": "0x163c9a2fa9eaf8ebc5bb5b8f8e916eb8f24230a1",
  "SOL": "Gp4itYBqqkNRNYtC22QAPyTThPB6Kzx8M1yy2rpXBGxbc",
  "TRX": "THbevzbdxMmUNaN3XFWPkaJe8oSq2C2739",
  "BTC": "bc1pzmdep9lzgzswy0nmepvwmexj286kufcfwjfy4fd6dwuedzltntxse9xmz8"
}
```

### Get Balances
```bash
GET /api/balances
```

### Trigger Update
```bash
POST /api/track
```

### Check Confirmation Status
```bash
GET /api/confirmation/:chain/:confirmations

Example: GET /api/confirmation/BTC/6
```

## WebSocket API

### Connect
```javascript
const socket = io('ws://localhost:6007');
```

### Subscribe to Price Updates
```javascript
socket.emit('subscribe:price', {
  symbol: 'BTC/USD',
  assetClass: 'CRYPTO'
});

socket.on('price:update', (data) => {
  console.log(data);
  // { symbol, assetClass, price, bid, ask, volume, timestamp }
});
```

### Subscribe to Order Book Depth
```javascript
socket.emit('subscribe:depth', {
  symbol: 'EUR/USD',
  assetClass: 'FOREX'
});

socket.on('depth:update', (data) => {
  console.log(data);
  // { bids: [...], asks: [...], lastPrice }
});
```

### Subscribe to Blockchain Updates
```javascript
socket.emit('subscribe:blockchain');

socket.on('blockchain:update', (data) => {
  console.log(data);
  // { ETH: {...}, SOL: {...}, TRX: {...}, BTC: {...} }
});
```

### Submit Order via WebSocket
```javascript
socket.emit('order:submit', {
  symbol: 'BTC/USD',
  assetClass: 'CRYPTO',
  side: 'BUY',
  type: 'LIMIT',
  quantity: 0.1,
  price: 43000
}, (response) => {
  console.log(response);
});
```

## Supported Asset Classes

1. **CRYPTO** - Cryptocurrencies (BTC/USD, ETH/USD, SOL/USD)
2. **FOREX** - Foreign Exchange (EUR/USD, GBP/USD, USD/JPY)
3. **STOCKS** - Equities (AAPL, MSFT, GOOGL)
4. **ETF** - Exchange Traded Funds (SPY, QQQ)
5. **COMMODITIES** - Raw materials (GOLD, OIL)
6. **FUTURES** - Futures contracts (ES, NQ)
7. **OPTIONS** - Options contracts
8. **BONDS** - Fixed income

## Rate Limits

- Public endpoints: 100 requests/minute
- Authenticated endpoints: 500 requests/minute
- Admin endpoints: 1000 requests/minute
- WebSocket connections: 10/IP

## Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## SLA Targets

- API Response Time P50: < 50ms
- API Response Time P99: < 200ms
- System Availability: 99.95%
- Order Matching Latency P50: < 100µs
