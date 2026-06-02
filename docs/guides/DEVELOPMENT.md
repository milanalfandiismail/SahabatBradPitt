# 🚀 Development Guide

**Quick start guide untuk development local SahabatBradPitt.**

---

## Prerequisites

- Python 3.10+
- Git
- TMDB API Key ([Get here](https://www.themoviedb.org/settings/api))

---

## Local Setup

### 1. Clone & Setup

```bash
# Clone repository
git clone https://github.com/milanalfandiismail/SahabatBradPitt.git
cd SahabatBradPitt

# Create virtual environment
python -m venv .venv

# Activate
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Setup

```bash
# Copy example env
copy .env.example .env

# Edit .env - minimum yang perlu di-set:
# DEBUG=True
# SECRET_KEY=apa-saja
# ALLOWED_HOSTS=127.0.0.1,localhost
# TMDB_API_KEY=your-api-key-here
# GOOGLE_CLIENT_ID=your-google-client-id-here (wajib untuk Google Login)
```

### 3. Run Database

```bash
# Create tables (dan inisialisasi grup role RBAC secara otomatis)
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# (Opsional) Setup RBAC manual (jika ingin inisialisasi ulang grup & permissions)
python manage.py setup_rbac
```

### 4. Start Development Server

```bash
python manage.py runserver
```

### 5. Konfigurasi Settings untuk ASGI & WSGI (Development vs Production)

Secara default, berkas `config/wsgi.py` dan `config/asgi.py` dikonfigurasi untuk menggunakan settings production demi kenyamanan deploy:
```python
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
```

Saat melakukan pengembangan lokal (development), jika Anda ingin menguji WSGI/ASGI entry point secara manual (misal menjalankan server waitress atau uvicorn lokal), ubah target modul settings tersebut ke:
```python
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
```

> [!IMPORTANT]
> **JANGAN LUPA:** Selalu kembalikan nilai target settings tersebut kembali ke `config.settings.production` sebelum melakukan push/deployment ke server production agar aplikasi tidak berjalan dalam mode development (`DEBUG=True` dsb.) di server live.

### 6. Access

- **Website**: http://localhost:8000
- **Admin**: http://localhost:8000/admin
- **API**: http://localhost:8000/api

---

## Daily Development

### Activate Environment
```bash
# Windows
.venv\Scripts\activate

# Linux/Mac
source .venv/bin/activate
```

### Run Server
```bash
python manage.py runserver
```

### Sync Films (Optional)
```bash
# Sync single actor
python manage.py sync_tmdb 287

# Sync all featured actors
python manage.py sync_tmdb --all

# Custom min rating
python manage.py sync_tmdb --all --min-rating 8.0
```

---

## Useful Commands

```bash
# Create migrations after model changes
python manage.py makemigrations
python manage.py migrate

# Collect static files
python manage.py collectstatic

# Open Django shell
python manage.py shell

# Check for issues
python manage.py check

# Show migrations status
python manage.py showmigrations
```

---

## Project Structure

```
SahabatBradPitt/
├── apps/           # Django apps (films, actors, etc.)
├── config/         # Django settings
├── templates/      # HTML templates
├── static/         # CSS, JS
├── media/          # User uploads
├── docs/           # Documentation
└── manage.py       # Django CLI
```

---

## Quick API Test

```bash
# Login (get token)
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "yourpassword"}'

# List films
curl http://localhost:8000/api/films/

# Get recommendations
curl -X POST http://localhost:8000/api/recommendations/ \
  -H "Content-Type: application/json" \
  -d '{"focus": "balanced", "genres": [1, 2]}'
```

---

## Troubleshooting

### Error: "TMDB API Key not configured"
- Check `.env` file exists
- Make sure `TMDB_API_KEY=your-key` is set

### Error: "Database locked"
- Close other instances of the app
- SQLite doesn't support concurrent writes

### Error: "Module not found"
- Make sure virtual environment is activated
- Run `pip install -r requirements.txt`

### Static files not loading
```bash
python manage.py collectstatic --noinput
```

---

## Next Steps

Setelah development local berjalan, lihat:
- [docs/deployment/WINDOWS_WAITRESS_DEPLOYMENT.md](../deployment/WINDOWS_WAITRESS_DEPLOYMENT.md) - Windows deployment
- [docs/deployment/DOCKER_DEPLOYMENT.md](../deployment/DOCKER_DEPLOYMENT.md) - Docker deployment
- [docs/architecture/CODEBASE_DOCUMENTATION.md](../architecture/CODEBASE_DOCUMENTATION.md) - Full codebase docs

---

**Last Updated**: 2026-05-29
**Version**: 1.0.0