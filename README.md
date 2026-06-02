# 🎬 SahabatBradPitt

Platform database film modern dengan sistem rekomendasi berbasis AI, sinkronisasi otomatis dari TMDB API, dan UI yang responsif.

![Django](https://img.shields.io/badge/Django-4.2-green)
![Python](https://img.shields.io/badge/Python-3.10+-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## ✨ Fitur Utama

### 🎥 Database Film
- Katalog film lengkap dengan poster, sinopsis, trailer
- Galeri gambar backdrop
- Filter by genre, tahun, rating, studio
- Support TV Series

### 👤 Database Aktor
- Profil aktor lengkap dengan biography
- Filmography tracking
- Native name support untuk aktor Asia (Korean, Chinese, Japanese)
- Social media links (Instagram, Twitter, TikTok)

### ⭐ Sistem Rating & Review
- Rating 1-10 stars
- Review/ulasan film
- Watchlist untuk bookmark film
- Auto-calculate average rating

### 🤖 Sistem Rekomendasi AI (TOPSIS)
- Hybrid recommendation (Expert System + TOPSIS SPK)
- Content-based similarity
- Personalized berdasarkan preferensi user
- Multiple focus modes (rating, popular, genre, balanced)

### 🔄 Sinkronisasi TMDB
- Auto-sync filmografi aktor
- Rate limiter (40 req/10 sec - TMDB compliant)
- YouTube trailer auto-search
- Fallback chain (TMDB → YouTube API → Scraper)

### 🔐 Authentication & RBAC
- Token-based authentication
- Role-based access control (Admin, Superadmin)
- Approval workflow untuk content

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- TMDB API Key ([Get here](https://www.themoviedb.org/settings/api))
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/milanalfandiismail/SahabatBradPitt.git
cd SahabatBradPitt

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
copy .env.example .env
# Edit .env and add your TMDB_API_KEY

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# (Optional) Sync films from TMDB
python manage.py sync_tmdb --all

# Run development server
python manage.py runserver
```

> [!TIP]
> **WSGI & ASGI DI LOKAL (DEVELOPMENT):**
> Secara default, berkas `config/wsgi.py` dan `config/asgi.py` dikonfigurasi untuk `config.settings.production` demi keamanan deploy.
> Jika Anda ingin menguji server WSGI/ASGI di lokal secara manual (misalnya menggunakan Waitress, Gunicorn, atau Uvicorn di lokal), pastikan untuk mengubah nilai target modul settings di dalam berkas `config/wsgi.py` dan `config/asgi.py` ke:
> ```python
> os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
> ```
> *(Dan pastikan untuk mengembalikannya ke `'config.settings.production'` sebelum di-deploy ke live server).*


### Access Application
- **Frontend**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin
- **API**: http://localhost:8000/api

---

## 📁 Project Structure

```
SahabatBradPitt/
├── apps/
│   ├── films/           # Film, Genre, FilmImage models
│   ├── actors/          # Actor, Filmography models
│   ├── ratings/         # Rating, Watchlist models
│   ├── festivals/       # Festival, Studio models
│   ├── recommendations/ # TOPSIS recommendation engine
│   └── users/           # Auth, UserProfile, RBAC
├── config/
│   ├── settings/        # Django settings (base, dev, prod)
│   ├── urls.py          # URL routing
│   └── wsgi.py          # WSGI entry point
├── templates/            # HTML templates
├── static/              # Static files (CSS, JS)
├── media/                # User uploads
├── docs/                 # Documentation
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── manage.py
```

---

## 🐳 Docker Deployment

```bash
# Build and run
docker-compose up --build

# Access at http://localhost:8000
```

---

## 🌐 Deployment Options

| Platform | Guide |
|----------|-------|
| Windows (Waitress) | [docs/deployment/WINDOWS_WAITRESS_DEPLOYMENT.md](docs/deployment/WINDOWS_WAITRESS_DEPLOYMENT.md) |
| Docker | [docs/deployment/DOCKER_DEPLOYMENT.md](docs/deployment/DOCKER_DEPLOYMENT.md) |
| VPS + Nginx | [docs/deployment/VPS_NGINX_DEPLOYMENT.md](docs/deployment/VPS_NGINX_DEPLOYMENT.md) |
| PythonAnywhere | [docs/deployment/PYTHONANYWHERE_DEPLOYMENT.md](docs/deployment/PYTHONANYWHERE_DEPLOYMENT.md) |

> [!WARNING]
> **PENTING UNTUK PRODUCTION DEPLOYMENT:**
> Sebelum melakukan deployment ke server production (VPS, Docker, PythonAnywhere, Windows Waitress, dll.), pastikan pengaturan modul settings default pada berkas `config/wsgi.py` dan `config/asgi.py` diarahkan ke berkas konfigurasi *production* Anda:
> ```python
> os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
> ```
> Jika tidak sengaja terubah ke `.development` saat pengerjaan lokal, server production Anda akan berjalan dengan mode *Development* (`DEBUG=True` tetap aktif) yang sangat berbahaya bagi keamanan sistem dan database Anda!

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [docs/architecture/CODEBASE_DOCUMENTATION.md](docs/architecture/CODEBASE_DOCUMENTATION.md) | Comprehensive codebase documentation |
| [docs/api/API.md](docs/api/API.md) | Complete REST API reference |
| [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) | System architecture |
| [docs/architecture/DATABASE.md](docs/architecture/DATABASE.md) | Database schema |
| [docs/deployment/DEPLOYMENT.md](docs/deployment/DEPLOYMENT.md) | Deployment guides |
| [docs/guides/GUIDES.md](docs/guides/GUIDES.md) | Implementation guides |
| [docs/guides/RBAC_ROLE_SYSTEM.md](docs/guides/RBAC_ROLE_SYSTEM.md) | RBAC documentation |

---

## 🔌 API Examples

### Authentication
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'

# Use token
curl -H "Authorization: Token YOUR_TOKEN" http://localhost:8000/api/films/
```

### Films
```bash
# List films
GET /api/films/?genre=1&min_rating=7.0

# Get recommendations
POST /api/recommendations/
{
  "focus": "balanced",
  "genres": [28, 12],
  "era": "2010s",
  "duration": "sedang"
}
```

---

## 🛠️ Management Commands

```bash
# Sync films dari TMDB
python manage.py sync_tmdb 287              # Single actor (TMDB ID)
python manage.py sync_tmdb --all            # All featured actors
python manage.py sync_tmdb --all --min-rating 8.0

# Sync cast untuk existing films
python manage.py sync_films_cast

# Setup RBAC (Opsional, sudah berjalan otomatis saat migrate)
python manage.py setup_rbac                 # Inisialisasi ulang grup & permission
python manage.py change_user_role username admin # Mengatur role pengguna (admin/superadmin/user)
```

---

## ⚙️ Environment Variables

```ini
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=127.0.0.1,localhost

# TMDB API (wajib untuk sinkronisasi data film & aktor)
TMDB_API_KEY=your-tmdb-api-key-here

# YouTube API (opsional, untuk pencarian alternatif trailer film)
YOUTUBE_API_KEY=your-youtube-api-key-here

# Google Auth Client ID (wajib untuk fitur masuk via Google)
GOOGLE_CLIENT_ID=your-google-client-id-here

# Redis Cache URL (opsional, untuk clustering / performa tinggi di production)
# Jika tidak diisi, production akan otomatis menggunakan FileBasedCache (django_cache/)
REDIS_URL=redis://127.0.0.1:6379/1
```

---

## 🧪 Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Django 4.2, Django REST Framework |
| Caching | LocMemCache (dev), FileBasedCache / Redis (prod) |
| Database | SQLite (dev), PostgreSQL (prod) |
| Algorithms | NumPy, TOPSIS SPK |
| External APIs | TMDB, YouTube Data API |
| Auth | Token-based (DRF Token Auth) |
| Static Files | WhiteNoise |
| Deployment | Docker, Gunicorn, Waitress |

---

## 📊 Sistem Rekomendasi TOPSIS

TOPSIS (Technique for Order Preference by Similarity to Ideal Solution) digunakan untuk memberikan rekomendasi film berdasarkan multiple criteria:

**User-Based Recommendations:**
- Rating match (25%)
- Popularity (20%)
- Genre similarity (20%)
- Era match (10%)
- Duration match (10%)
- Watch history (15%)

**Content-Based Similarity:**
- Genre overlap (25%)
- Synopsis similarity (20%)
- Title match (10%)
- Same studio (15%)
- Same director (15%)
- Same cast (15%)

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add feature'`
4. Push branch: `git push origin feature/your-feature`
5. Create Pull Request

---

## 👨‍💻 Team

**Milan Alfandi Ismail**  
- GitHub: [@milanalfandiismail](https://github.com/milanalfandiismail)  

**Muhammad Ariandra Anugrah**    
- Github: [@Muhammad Ariandra Anugrah](https://github.com/bluumovingon)  

**Deri Fadillah**    
- Github: [@Deri Fadillah](https://github.com/derriifadill-boop)  

**Muhammad Rio**    
- Github: [@Muhammad Rio](https://github.com/MuhammadRio21)  

**Ridho Aliyya Ananda**    
- Github: [@Ridho Aliyya Ananda](https://github.com/ridhoananda729-coder)  

---

**Last Updated**: 2026-05-30
**Version**: 2.0.0
