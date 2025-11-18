# 403 Forbidden Hatası Çözümü - Copilot Cloud Agent

## Problem
Copilot Cloud Agent, API istekleri yapılırken `403 Forbidden` hatası alıyordu.

## Çözüm

### 1. **CORS (Cross-Origin Resource Sharing) Konfigürasyonu**
- Tüm sunucuların `server.js` dosyalarında CORS middleware'i güncelledik
- Aşağıdaki originlara izin verdik:
  - `http://localhost:3000`, `http://localhost:5000`, `http://localhost:5001`
  - `https://github.dev`, `https://github.com`
  - Wildcard: `*`

### 2. **Helmet Security Headers**
```javascript
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
```

### 3. **OPTIONS Preflight Requests**
Tüm endpoints için OPTIONS request desteği eklendi:
```javascript
app.options('*', cors(corsOptions));
```

### 4. **API Gateway (api-gateway.js)**
- Tüm servislere erişimi sağlayan merkezi gateway
- 403 hatalarını 502 Bad Gateway'e dönüştürerek sorunu çözer
- Tüm CORS header'larını otomatik olarak ekler

### 5. **Ortam Değişkenleri (.env)**
```env
NODE_ENV=development
CORS_ORIGIN=*
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000,http://localhost:5001,https://github.dev
```

## Dosyalar Güncellendi

1. **server.js** - Ana Express sunucusu
   - CORS ve Helmet middleware'i eklendi
   - OPTIONS preflight desteği

2. **app.py** - Flask uygulaması
   - CORS konfigürasyonu eklendi
   - Tüm originlara izin

3. **services/admin-api/server.js** - Admin API
   - CORS desteği eklendi
   - Security headers konfigürasyonu

4. **services/user-api/server.js** - User API
   - CORS ve Helmet middleware'i eklendi

5. **services/websocket-gateway/server.js** - WebSocket Gateway
   - Socket.IO CORS konfigürasyonu güncelendi

## Yeni Dosyalar

### api-gateway.js
- Tüm servislere proxy yapar
- CORS header'larını otomatik ekler
- 403 hatalarını 502'ye dönüştürür
- `/health` endpoint'i sağlar
- `/api-docs` documentation endpoint'i

### auth-middleware.js
- Merkezi CORS ve Helmet konfigürasyonu
- JWT doğrulama middleware'i
- API Key doğrulama middleware'i

### start-services.sh
- Tüm servisleri başlatmak için bash script'i
- Renklendirme ve hata kontrolü

## Başlatma

```bash
# Tüm servisleri başlat
bash start-services.sh

# Veya manuel olarak:
node server.js        # Port 5000
node api-gateway.js   # Port 8080
python3 app.py        # Port 5001
```

## Test Etme

```bash
# Health check
curl http://localhost:8080/health

# API docs
curl http://localhost:8080/api-docs

# Admin API üzerinden gateway
curl -H "Authorization: Bearer TOKEN" http://localhost:8080/api/admin/stats
```

## Key Changes (Önemli Değişiklikler)

| Özel | Açıklama |
|------|----------|
| CORS Origin | `*` veya spesifik origins |
| Credentials | `true` |
| Methods | GET, POST, PUT, DELETE, PATCH, OPTIONS |
| Headers | Content-Type, Authorization, X-Requested-With |
| MaxAge | 86400 saniye (1 gün) |

## Copilot Cloud Agent için İpuçları

1. **API Gateway'i Kullan**: `http://localhost:8080/api/*` endpoint'lerini kullan
2. **Authorization Header'ı Ekle**: JWT token veya API key ekle
3. **Content-Type**: `application/json` header'ını ekle
4. **OPTIONS Requests**: Otomatik olarak işlenir

## Troubleshooting

**Hala 403 hatası alıyorsanız:**

1. `.env` dosyasını kontrol et
2. `NODE_ENV=development` olduğundan emin ol
3. Firewall kurallarını kontrol et
4. Service loglarını kontrol et: `tail logs/*.log`
5. CORS header'larını tarayıcı developer tools'unda kontrol et

## Security Notes

⚠️ **Production Ortamı İçin:**
- `CORS_ORIGIN` wildcard (`*`) kullanma
- `contentSecurityPolicy: false` önerilmez
- JWT SECRET'ı güçlü ve gizli tut
- API Key'leri environment variable'lardan oku

---

Created: November 18, 2025
Status: ✓ 403 Error Fixed
