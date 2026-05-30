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

### Access Application
- **Frontend**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin
- **API**: http://localhost:8000/api

---

## 🗄️ Pilihan Database & Branch (SQLite vs PostgreSQL)

Proyek ini mendukung dua pilihan konfigurasi database berdasarkan branch git yang aktif:

### 1. Branch `main` (SQLite - Default Development)
- **Karakteristik**: Sangat mudah dijalankan tanpa perlu instalasi server database eksternal.
- **Tipe Database**: SQLite (menyimpan berkas data lokal `db.sqlite3` di folder root).
- **Branch Git**: `git checkout main`
- **Konfigurasi `config/settings/development.py`**:
  ```python
  DATABASES = {
      'default': {
          'ENGINE': 'django.db.backends.sqlite3',
          'NAME': BASE_DIR / 'db.sqlite3',
      }
  }
  ```

### 2. Branch `main-postgresql` (PostgreSQL - Untuk Production & Konkurensi Tinggi)
- **Karakteristik**: Siap menangani akses pengguna dalam jumlah besar, menjaga integritas transaksi dengan MVCC (penguncian baris), dan memiliki performa pencarian yang dioptimalkan.
- **Tipe Database**: PostgreSQL (nama database: `sahabat_brad_pitt`).
- **Branch Git**: `git checkout main-postgresql`
- **Konfigurasi `config/settings/development.py`**:
  ```python
  DATABASES = {
      'default': {
          'ENGINE': 'django.db.backends.postgresql',
          'NAME': 'sahabat_brad_pitt',
          'USER': 'postgres',
          'PASSWORD': 'milan123qaz!@#',
          'HOST': 'localhost',
          'PORT': '5432',
      }
  }
  ```

---

## 🔄 Pemindahan Data (Migrasi dari SQLite ke PostgreSQL)

Jika Anda berpindah dari branch `main` ke branch `main-postgresql` dan ingin mentransfer seluruh data uji coba yang sudah ada di file SQLite (`db.sqlite3` sebesar ~20.6MB) langsung ke server PostgreSQL lokal, Anda dapat menggunakan script pemindahan otomatis:

```bash
# Pastikan virtual environment Anda sudah aktif
python auto_migrate.py
```

### Fitur & Proteksi Keamanan Script:
- **Direct ORM Streaming**: Memindahkan data secara terkompresi langsung dari SQLite ke PostgreSQL menggunakan ORM dalam batch kecil (2.000 data) tanpa perantara file JSON, memotong waktu migrasi menjadi hanya **~7 detik** untuk 90.000 data.
- **Sistem Proteksi Branch**: Melakukan validasi otomatis terhadap engine database default di settings. Jika engine bukan PostgreSQL, script akan dihentikan secara aman guna melindungi berkas SQLite asli Anda dari penulisan ulang yang salah.
- **Kemanan File Media Lokal**: Memutus sementara sinyal-sinyal Django (`pre_save`, `post_save`, `delete`) untuk menjamin berkas gambar fisik (poster film, foto aktor) di folder `media/` tetap utuh.
- **Auto-Truncation**: Memotong nilai data CharField secara otomatis jika panjangnya melampaui `max_length` model di SQLite (misal field `role` sepanjang 300 karakter akan dipotong menjadi 255 karakter) agar tidak terjadi crash *right-truncation* di PostgreSQL.
- **PostgreSQL Sequence Reset**: Menyelaraskan seluruh primary key sequence AutoField secara otomatis sehingga operasi tulis data baru setelah migrasi tidak mengalami error `UniqueConstraintError`.

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
| Windows (Waitress) | [docs/WINDOWS_WAITRESS_DEPLOYMENT.md](docs/WINDOWS_WAITRESS_DEPLOYMENT.md) |
| Docker | [docs/DOCKER_DEPLOYMENT.md](docs/DOCKER_DEPLOYMENT.md) |
| VPS + Nginx | [docs/VPS_NGINX_DEPLOYMENT.md](docs/VPS_NGINX_DEPLOYMENT.md) |
| PythonAnywhere | [docs/PYTHONANYWHERE_DEPLOYMENT.md](docs/PYTHONANYWHERE_DEPLOYMENT.md) |

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [docs/CODEBASE_DOCUMENTATION.md](docs/CODEBASE_DOCUMENTATION.md) | Comprehensive codebase documentation |
| [docs/API.md](docs/API.md) | Complete REST API reference |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture |
| [docs/DATABASE.md](docs/DATABASE.md) | Database schema |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deployment guides |
| [docs/GUIDES.md](docs/GUIDES.md) | Implementation guides |
| [docs/RBAC_ROLE_SYSTEM.md](docs/RBAC_ROLE_SYSTEM.md) | RBAC documentation |

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

# Setup RBAC
python manage.py setup_rbac                 # Create groups & admin
python manage.py change_user_role username admin
```

---

## ⚙️ Environment Variables

```ini
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=127.0.0.1,localhost

# TMDB API (wajib untuk sync)
TMDB_API_KEY=your-tmdb-api-key

# YouTube API (optional, untuk trailer search)
YOUTUBE_API_KEY=your-youtube-api-key
```

---

## 🧪 Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Django 4.2, Django REST Framework |
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
