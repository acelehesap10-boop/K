/**
 * Authentication & CORS Middleware
 * Handles all CORS and authentication-related configurations
 */

const cors = require('cors');
const helmet = require('helmet');

// CORS Configuration
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
      'https://github.dev',
      'https://github.dev:443',
      'https://codespaces.github.com',
      'https://*.github.dev'
    ];
    
    // Allow all localhost variants
    if (!origin) {
      callback(null, true);
      return;
    }
    
    // Check exact matches
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    
    // Allow localhost and github.dev domains
    if (origin.includes('localhost') || origin.includes('github.dev') || origin.includes('127.0.0.1')) {
      callback(null, true);
      return;
    }
    
    // For development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      callback(null, true);
      return;
    }
    
    callback(null, true); // Allow by default to prevent 403
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'X-API-Key',
    'X-Auth-Token'
  ],
  exposedHeaders: ['Content-Length', 'X-Content-Type-Options'],
  maxAge: 86400,
  optionsSuccessStatus: 200
};

// Helmet configuration
const helmetOptions = {
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
  xssFilter: true,
  noSniff: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
};

/**
 * Apply CORS and Security middleware
 */
const applyMiddleware = (app) => {
  app.use(helmet(helmetOptions));
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
};

/**
 * Preflight request handler
 */
const preflightHandler = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,HEAD,OPTIONS');
    res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(200).end();
  } else {
    next();
  }
};

/**
 * JWT Verification middleware
 */
const verifyJWT = (secret) => {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, secret);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
};

/**
 * API Key verification middleware
 */
const verifyAPIKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'No API key provided' });
  }

  // Validate API key (implement your own logic)
  if (apiKey === process.env.API_KEY || apiKey === 'demo-key') {
    next();
  } else {
    return res.status(403).json({ error: 'Invalid API key' });
  }
};

/**
 * Error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path
  });
};

module.exports = {
  corsOptions,
  helmetOptions,
  applyMiddleware,
  preflightHandler,
  verifyJWT,
  verifyAPIKey,
  errorHandler
};
