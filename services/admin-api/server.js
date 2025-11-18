/**
 * Admin API Service
 * Restricted access for platform administrators
 * Admin: berkecansuskun1998@gmail.com
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://localhost:5001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5000',
      'http://127.0.0.1:5001',
      'https://github.com',
      'https://github.dev'
    ];
    
    if (!origin || allowedOrigins.includes(origin) || origin.includes('localhost')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// In-memory admin store (use database in production)
const admins = new Map([
  ['berkecansuskun1998@gmail.com', {
    email: 'berkecansuskun1998@gmail.com',
    passwordHash: bcrypt.hashSync('Admin@2024!', 10), // Change in production
    role: 'SUPER_ADMIN',
    permissions: ['ALL'],
    requireMFA: true,
    ipWhitelist: [] // Empty = all IPs allowed
  }]
]);

// Middleware: Verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Middleware: Check permissions
const checkPermission = (permission) => (req, res, next) => {
  if (req.admin.permissions.includes('ALL') || req.admin.permissions.includes(permission)) {
    next();
  } else {
    res.status(403).json({ error: 'Insufficient permissions' });
  }
};

// Login
app.post('/api/admin/login', async (req, res) => {
  const { email, password, mfaCode } = req.body;
  
  const admin = admins.get(email);
  if (!admin) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const validPassword = await bcrypt.compare(password, admin.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // MFA check (simplified - use TOTP in production)
  if (admin.requireMFA && !mfaCode) {
    return res.status(403).json({ error: 'MFA required', requireMFA: true });
  }

  const token = jwt.sign(
    { 
      email: admin.email, 
      role: admin.role,
      permissions: admin.permissions 
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    admin: {
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions
    }
  });
});

// Platform statistics
app.get('/api/admin/stats', verifyToken, checkPermission('VIEW_STATS'), (req, res) => {
  res.json({
    totalUsers: 1250,
    activeUsers: 340,
    totalVolume24h: 45680000,
    totalTrades24h: 15420,
    systemHealth: 'HEALTHY',
    services: {
      matchingEngine: 'ONLINE',
      marketData: 'ONLINE',
      riskEngine: 'ONLINE',
      blockchainTracker: 'ONLINE'
    }
  });
});

// User management
app.get('/api/admin/users', verifyToken, checkPermission('MANAGE_USERS'), (req, res) => {
  res.json({
    users: [
      { id: 'u1', email: 'user1@example.com', status: 'ACTIVE', kycStatus: 'VERIFIED' },
      { id: 'u2', email: 'user2@example.com', status: 'ACTIVE', kycStatus: 'PENDING' }
    ]
  });
});

// Risk parameters
app.get('/api/admin/risk-params', verifyToken, checkPermission('MANAGE_RISK'), (req, res) => {
  res.json({
    maxLeverage: 10,
    maintenanceMargin: 0.05,
    initialMargin: 0.10,
    liquidationBuffer: 0.03
  });
});

app.post('/api/admin/risk-params', verifyToken, checkPermission('MANAGE_RISK'), (req, res) => {
  // Require human approval for critical changes
  res.json({
    success: true,
    message: 'Risk parameters updated',
    requiresApproval: true,
    approvalId: `APP-${Date.now()}`
  });
});

// Trading controls
app.post('/api/admin/halt-trading', verifyToken, checkPermission('TRADING_CONTROL'), (req, res) => {
  const { symbol, assetClass, reason } = req.body;
  
  res.json({
    success: true,
    message: `Trading halted for ${assetClass}:${symbol}`,
    reason,
    timestamp: Date.now()
  });
});

app.post('/api/admin/resume-trading', verifyToken, checkPermission('TRADING_CONTROL'), (req, res) => {
  const { symbol, assetClass } = req.body;
  
  res.json({
    success: true,
    message: `Trading resumed for ${assetClass}:${symbol}`,
    timestamp: Date.now()
  });
});

// Audit logs
app.get('/api/admin/audit-logs', verifyToken, checkPermission('VIEW_AUDIT'), (req, res) => {
  res.json({
    logs: [
      {
        id: 'log1',
        action: 'RISK_PARAMS_UPDATED',
        admin: req.admin.email,
        timestamp: Date.now() - 3600000,
        details: { maxLeverage: { old: 10, new: 15 } }
      },
      {
        id: 'log2',
        action: 'TRADING_HALTED',
        admin: req.admin.email,
        timestamp: Date.now() - 7200000,
        details: { symbol: 'BTC/USD', reason: 'High volatility' }
      }
    ]
  });
});

// System health
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'admin-api' });
});

const PORT = process.env.ADMIN_API_PORT || 6005;
app.listen(PORT, () => {
  console.log(`Admin API running on port ${PORT}`);
  console.log(`Admin account: berkecansuskun1998@gmail.com`);
  console.log(`Default password: Admin@2024! (CHANGE IN PRODUCTION)`);
});

module.exports = { app };
