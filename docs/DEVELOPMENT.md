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
```

### 3. Run Database

```bash
# Create tables
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# (Optional) Setup RBAC groups
python manage.py setup_rbac
```

### 4. Start Development Server

```bash
python manage.py runserver
```

### 5. Access

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
- [docs/WINDOWS_WAITRESS_DEPLOYMENT.md](WINDOWS_WAITRESS_DEPLOYMENT.md) - Windows deployment
- [docs/DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) - Docker deployment
- [docs/CODEBASE_DOCUMENTATION.md](CODEBASE_DOCUMENTATION.md) - Full codebase docs

---

**Last Updated**: 2026-05-29
**Version**: 1.0.0