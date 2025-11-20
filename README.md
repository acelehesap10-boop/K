# Kapsamlı Full-Stack Web Uygulaması 🚀

Modern web teknolojileri ve zengin kütüphanelerle donatılmış profesyonel bir full-stack web uygulaması.

## 🎯 Özellikler

### Backend

- **Node.js** - Express.js framework
- **Python** - Flask framework
- **MongoDB** - NoSQL veritabanı
- **Socket.IO** - Gerçek zamanlı iletişim
- **JWT** - Güvenli kimlik doğrulama
- **Redis & Celery** - Kuyruk yönetimi

### Frontend

- **React** - Modern UI kütüphanesi
- **Next.js** - React framework
- **TypeScript** - Tip güvenli JavaScript
- **Tailwind CSS** - Utility-first CSS
- **Webpack & Babel** - Build araçları

### AI & Machine Learning

## 🧩 Yeni eklentiler ve prototipler

Bu repo yeni prototipleri içerir:

- `connectors/` — FIX acceptor (Node) / OUCH-ITCH skeleton (Rust)
- `sor/` — Smart Order Router simulator (Python): latency-aware routing prototype
- `matching-engine/README-dpdk.md` — DPDK/Netmap entegrasyonu için notlar ve feature flag

Bu prototipleri çalıştırmak için `scripts/run-sor.sh` veya `connectors/fix` dizininde `npm install` ve `npm start` çalıştırabilirsiniz.

### Data Science

- **Pandas** - Veri analizi
- **NumPy** - Sayısal hesaplamalar
- **Matplotlib & Seaborn** - Veri görselleştirme
- **SciPy** - Bilimsel hesaplamalar

### Testing & Quality

- **Pytest** - Python test framework
- **Selenium** - Browser automation
- **Black** - Python code formatter
- **Flake8** - Python linter
- **MyPy** - Static type checker
- **ESLint & Prettier** - JavaScript linter/formatter

## 📦 Kurulum

### Gereksinimler

- Node.js 22.x
- Python 3.12.x
- MongoDB (opsiyonel)

### Kurulum Adımları

```bash
# Node.js bağımlılıkları zaten yüklü
# Python bağımlılıkları zaten yüklü

# .env dosyası oluşturun
cp .env.example .env
```

## 🚀 Tek komutla geliştirme (local)

Varsa Docker/compose ile hızlı başlatma:

```bash
./scripts/docker-start.sh
```

ya da VS Code Tasks ile:

```
# Run Task -> Start Node Server
# Run Task -> Start Python Server
```

## 🚀 Kullanım

### Node.js Server Başlatma

```bash
npm start
# veya development mode için
npm run dev
```

Server: http://localhost:5000

### Python Flask Server Başlatma

```bash
npm run python
# veya
python app.py
```

Server: http://localhost:5001

### Web Arayüzü

index.html dosyasını tarayıcınızda açın

## 📚 API Endpoints

### Node.js API

- `GET /api` - API bilgileri
- `GET /api/health` - Sağlık kontrolü

### Python API

- `GET /` - Flask API bilgileri
- `GET /api/python/health` - Sağlık kontrolü
- `POST /api/python/data` - Veri işleme

## 🔧 Geliştirme

### Kod Formatla

```bash
# JavaScript
npm run format

# Python
black .
```

### Linting

```bash
# JavaScript
npm run lint

# Python
flake8
mypy

### VS Code - Önerilen Uzantılar ve Ayarlar

Bu proje için önerilen VS Code uzantıları workspace'e eklendi; VS Code açıldığında eklenmeleri istenecektir.

- ESLint
- Prettier
- Python (ms-python.python)
- Pylance (ms-python.vscode-pylance)
- Docker
- GitLens
- Remote - Containers
- Copilot Studio (opsiyonel)
- Copilot Vision (opsiyonel)

Dev container kullanmak için `.devcontainer/devcontainer.json` dosyasını takip edebilirsiniz; uzantılar devcontainer içinde otomatik eklenecektir.

Not: "Raptor mini (Preview)" gibi özel önizleme uzantılarını tüm istemciler için etkinleştirmek istiyorsanız, uzantı ID'sini biliyorsanız onu `.vscode/extensions.json` dosyasına ekleyebilir veya ek config ayarları ile kurumunuzun VS Code ayarlarında zorlayabilirsiniz.
```

## 📝 Proje Yapısı

```
K/
├── server.js           # Node.js Express server
├── app.py             # Python Flask server
├── index.html         # Ana web arayüzü
├── package.json       # Node.js bağımlılıkları
├── .env.example       # Ortam değişkenleri şablonu
└── README.md          # Bu dosya
```

## 🛠️ Yüklü Teknolojiler

### Node.js Paketleri

express, react, react-dom, next, typescript, tailwindcss, axios, socket.io, mongoose, bcrypt, jsonwebtoken, cors, dotenv, helmet, express-validator, multer, nodemon, webpack, babel, eslint, prettier

### Python Paketleri

django, flask, fastapi, sqlalchemy, requests, beautifulsoup4, selenium, pandas, numpy, scipy, matplotlib, seaborn, scikit-learn, tensorflow, keras, torch, torchvision, pillow, opencv-python, nltk, spacy, redis, celery, pytest, black, flake8, mypy

## 🔒 Güvenlik

- Helmet.js ile HTTP güvenlik başlıkları
- CORS yapılandırması
- JWT token tabanlı kimlik doğrulama
- Environment variables ile hassas bilgi yönetimi

## 📄 Lisans

ISC
