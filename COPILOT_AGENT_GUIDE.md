# GitHub Copilot Cloud Agent - Kullanıcı Rehberi

## 🎯 Genel Bakış

**Copilot Cloud Agent**, GitHub API ile entegre edilmiş, otomatik kod yönetimi, CI/CD pipeline'ı ve deployment işlemleri yapabilen güçlü bir araçtır.

## 🚀 Başlangıç

### Gerekli Ortam Değişkenleri

`.env` dosyasına aşağıdaki ayarları ekleyin:

```env
# GitHub Configuration
GITHUB_TOKEN=ghp_your_personal_access_token_here
GITHUB_REPO=K
GITHUB_OWNER=acelehesap10-boop

# API Gateway
API_GATEWAY_URL=http://localhost:8080
GATEWAY_PORT=8080

# Node Environment
NODE_ENV=development
```

### GitHub Personal Access Token Oluşturma

1. GitHub'a gidin: https://github.com/settings/tokens
2. **Generate new token** → **Generate new token (classic)**
3. Aşağıdaki scopes'u seçin:
   - ✓ `repo` (Full control of private repositories)
   - ✓ `admin:repo_hook` (Full control of repository hooks)
   - ✓ `read:user` (Read user profile data)

4. Token'ı `.env` dosyasına yapıştırın

## 📋 CLI Komutları

### Başlat

```bash
# Interactive Menu ile başlat
npm run agent

# Veya direkt çalıştır
node copilot-agent.js
```

### Kullanılabilir İşlemler

#### 1️⃣ **Health Check**
```bash
npm run agent
# Seç: ✓ Health Check
```
Tüm servislerin durumunu kontrol et.

#### 2️⃣ **Repository Listele**
```bash
# Menu'de seç: 📦 List Repositories
```
Kullanıcının tüm repository'lerini göster.

#### 3️⃣ **Pull Request'leri Listele**
```bash
# Menu'de seç: 📋 List Pull Requests
```
Açık PR'ları göster.

#### 4️⃣ **Issues Listele**
```bash
# Menu'de seç: 🔴 List Issues
```
Açık issue'ları göster.

#### 5️⃣ **Branch Oluştur**
```bash
# Menu'de seç: 🌿 Create Branch
# Branch adı girin: feature/new-feature
```

#### 6️⃣ **Dosya Oluştur/Düzenle**
```bash
# Menu'de seç: 📝 Create/Update File
# Dosya yolu: src/api/new-endpoint.js
# İçerik: [Kodunuzu yapıştırın]
# Commit mesajı: feat: Add new API endpoint
```

#### 7️⃣ **Pull Request Oluştur**
```bash
# Menu'de seç: 📤 Create Pull Request
# Title: Feature: Add new API endpoint
# Body: Detailed description
# Head branch: feature/new-feature
```

#### 8️⃣ **Deployment Hazırlığı**
```bash
# Menu'de seç: 🚀 Prepare Deployment
```
Tüm kontrolleri yapıp deployment'a hazırla.

## 🔌 API Gateway

### Başlat

```bash
npm run gateway
# veya
node api-gateway.js
```

### Endpoints

| Endpoint | Açıklama |
|----------|----------|
| `/health` | API Gateway durumu |
| `/api-docs` | API dokumentasyonu |
| `/api/admin/*` | Admin API proxy (6005) |
| `/api/user/*` | User API proxy (6006) |
| `/api/matching/*` | Matching Engine proxy (6001) |
| `/api/market/*` | Market Data proxy (6004) |
| `/api/risk/*` | Risk Engine proxy (6003) |
| `/api/blockchain/*` | Blockchain Tracker proxy (6002) |

### Test Örnekleri

```bash
# Health check
curl http://localhost:8080/health

# API docs
curl http://localhost:8080/api-docs

# Admin API
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8080/api/admin/stats
```

## 🧪 Test Suite

Test suite'i çalıştır:

```bash
node copilot-test.js
```

Çıktı:
```
✓ API Gateway Health Check passed
✓ API Status Check passed
✓ Deployment Preparation passed

Test Results
✓ Passed: 3
✗ Failed: 0
All tests passed! ✨
```

## 🔐 Özellikleri

### GitHub Integration
- ✓ Repository yönetimi
- ✓ Pull Request otomasyonu
- ✓ Issue tracking
- ✓ Branch yönetimi
- ✓ Dosya oluşturma/düzenleme

### API Management
- ✓ Gateway ile merkezi erişim
- ✓ CORS otomatik yönetimi
- ✓ Health monitoring
- ✓ Service proxy'si

### Deployment
- ✓ Pre-deployment checks
- ✓ Service health verification
- ✓ Environment configuration
- ✓ Rollback support

## 📊 Mimari

```
┌─────────────────────────────────────┐
│   GitHub Copilot Cloud Agent        │
│  (copilot-agent.js)                 │
└────────────────┬────────────────────┘
                 │
                 ├──→ GitHub API
                 │    (@octokit/rest)
                 │
                 └──→ API Gateway
                      (api-gateway.js)
                      ↓
                ┌─────────────────────┐
                │  Service Routers    │
                ├─────────────────────┤
                │ Admin API (6005)    │
                │ User API (6006)     │
                │ WebSocket (6007)    │
                │ Matching (6001)     │
                │ Market Data (6004)  │
                │ Risk Engine (6003)  │
                │ Blockchain (6002)   │
                └─────────────────────┘
```

## 🛠️ Troubleshooting

### Problem: "GITHUB_TOKEN bulunamadı"
**Çözüm:** `.env` dosyasında `GITHUB_TOKEN` ayarlayın

### Problem: API Gateway 403 hatası
**Çözüm:** CORS ayarları otomatik uygulanıyor, gateway'i restart edin

### Problem: Service'ler yanıt vermiyor
**Çözüm:** Services'i başlatın
```bash
npm run start-all
```

### Problem: Port zaten kullanımda
**Çözüm:** Port'u değiştirin
```bash
GATEWAY_PORT=8081 node api-gateway.js
```

## 📚 İleri Kullanım

### Programmatik Kullanım

```javascript
const CopilotAgent = require('./copilot-agent.js');

const agent = new CopilotAgent();

// Repository'leri listele
await agent.listRepositories();

// PR oluştur
await agent.createPullRequest(
  'Feature: New API',
  'Detailed description',
  'feature/new-api'
);

// Health check
await agent.healthCheck();
```

### Custom Workflow

```javascript
const agent = new CopilotAgent();

// 1. Branch oluştur
await agent.createBranch('feature/custom-feature');

// 2. Dosya ekle
await agent.createOrUpdateFile(
  'src/features/custom.js',
  'module.exports = {};',
  'feat: Add custom feature',
  'feature/custom-feature'
);

// 3. PR aç
await agent.createPullRequest(
  'Feature: Custom Feature',
  'This adds custom feature support',
  'feature/custom-feature'
);
```

## 🔄 CI/CD Integration

### GitHub Actions ile Entegrasyon

`.github/workflows/copilot-deployment.yml`:

```yaml
name: Copilot Deployment

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run start-all
      - run: npm run test
      - run: node copilot-test.js
```

## 📈 Performance Tips

1. **Batch Operations**: Çoklu işlemler için loop kullan
2. **Error Handling**: Try-catch blokları ekle
3. **Logging**: Önemli işlemleri log'la
4. **Monitoring**: Health check'leri düzenli çalıştır

## 🔒 Security Best Practices

1. **Token Management**
   - Token'ı .env'de sakla
   - GitHub'dan token'ı regenerate et
   - Token'ı paylaşma

2. **API Access**
   - Rate limiting'i göz önüne al
   - Request'leri log'la
   - Unauthorized access'i monitor et

3. **Branch Protection**
   - Main branch'ı koru
   - Code review zorunlu kıl
   - CI/CD checks'i etkinleştir

## 📞 Support

**Issues**: GitHub Issues'i kullan
**Documentation**: `403_HATASI_ÇOZUM.md` ve `CORS_FIX_SUMMARY.md`'yi oku

## 📝 License

MIT License - Özgürce kullanabilirsiniz

---

**Copilot Cloud Agent v1.0**
**Last Updated:** November 18, 2025
**Status:** ✅ Ready for Production
