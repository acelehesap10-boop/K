const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const socketIO = require('socket.io');
const http = require('http');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB bağlantısı
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/myapp';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB bağlantısı başarılı'))
  .catch(err => console.error('MongoDB bağlantı hatası:', err));

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
      'Socket.IO Real-time',
      'JWT Authentication',
      'File Upload',
      'CORS & Helmet Security'
    ]
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Hata yakalama middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Bir hata oluştu!',
    message: err.message 
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
  console.log(`http://localhost:${PORT}`);
});
