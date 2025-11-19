const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const socketIO = require('socket.io');
const http = require('http');
require('dotenv').config();
// Monitoring
try {
  require('./observability/opentelemetry-init');
} catch (err) {
  console.warn('OpenTelemetry init failed', err);
}
const promClient = require('prom-client');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://localhost:5001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5000',
      'http://127.0.0.1:5001',
      'https://github.com',
      'https://github.dev',
      '*',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  },
});
const { middlewareMetrics, metricsEndpoint } = require('./metrics');
const { initTracing } = require('./telemetry/node-otel');
initTracing('api-server');
app.use(middlewareMetrics());

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

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
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Prometheus default metrics
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'kapp_' });

// Custom metrics
const orderLatency = new promClient.Histogram({
  name: 'matching_engine_request_duration_seconds',
  help: 'Duration of matching engine operations in seconds',
  buckets: [0.0001, 0.0005, 0.001, 0.005, 0.01],
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

// MongoDB bağlantısı
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/myapp';
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('MongoDB bağlantısı başarılı'))
  .catch((err) => console.error('MongoDB bağlantı hatası:', err));

// Socket.IO bağlantıları
io.on('connection', (socket) => {
  console.log('Yeni kullanıcı bağlandı:', socket.id);

  socket.on('message', (data) => {
    io.emit('message', data);
  });

  socket.on('disconnect', () => {
    console.log('Kullanıcı ayrıldı:', socket.id);
  });
});

// API Routes
app.get('/api', (req, res) => {
  res.json({
    message: 'API çalışıyor!',
    version: '1.0.0',
    features: [
      'Express Server',
      'MongoDB Database',

// Prometheus metrics endpoint
metricsEndpoint(app);
      'Socket.IO Real-time',
      'JWT Authentication',
      'File Upload',
      'CORS & Helmet Security',
    ],
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Hata yakalama middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Bir hata oluştu!',
    message: err.message,
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
  console.log(`http://localhost:${PORT}`);
});
