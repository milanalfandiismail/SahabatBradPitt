# 🚀 Deployment Guide

**Complete guide untuk men-deploy SahabatBradPitt ke berbagai platform production.**

---

## 📋 Deployment Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT DECISION FLOWCHART                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Pilih Platform:                                                        │
│                                                                          │
│   ┌──────────────────┐                                                    │
│   │ Windows Local   │──▶ WINDOWS_WAITRESS_DEPLOYMENT.md               │
│   └──────────────────┘     (Simple, untuk development/uji coba)         │
│                                                                          │
│   ┌──────────────────┐                                                    │
│   │ Docker           │──▶ DOCKER_DEPLOYMENT.md                          │
│   └──────────────────┘     (Portable, konsisten, recommended)          │
│                                                                          │
│   ┌──────────────────┐                                                    │
│   │ VPS (Ubuntu)    │──▶ VPS_NGINX_DEPLOYMENT.md                       │
│   └──────────────────┘     (Full control, scalable)                     │
│                                                                          │
│   ┌──────────────────┐                                                    │
│   │ PythonAnywhere  │──▶ PYTHONANYWHERE_DEPLOYMENT.md                   │
│   └──────────────────┘     (Managed, easy setup)                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Quick Decision Guide

| Platform | Best For | Difficulty | Cost |
|----------|----------|------------|------|
| **Windows + Waitress** | Local dev, testing | Easy | Free |
| **Docker** | Consistent environments | Medium | Free |
| **VPS + Nginx** | Production, full control | Hard | $5-20/mo |
| **PythonAnywhere** | Quick deployment, beginners | Easy | Free-$50/mo |

---

## 📦 Pre-Deployment Checklist

### 1. Environment Configuration

```bash
# .env production setup
DEBUG=False
SECRET_KEY=$(python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())")
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,server-ip
TMDB_API_KEY=your-tmdb-api-key
YOUTUBE_API_KEY=your-youtube-api-key
```

### 2. Generate New Secret Key

```bash
# Generate secure secret key
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Or use django-extensions
pip install django-extensions
python manage.py generate_secret_key
```

### 3. Database Preparation

**SQLite (Development)**
```bash
# Just backup the file
cp db.sqlite3 db.sqlite3.backup
```

**PostgreSQL (Production - Recommended)**
```bash
# Create production database
sudo -u postgres psql
CREATE DATABASE sahabatbradpitt;
CREATE USER sahabatuser WITH PASSWORD 'strongpassword';
GRANT ALL PRIVILEGES ON DATABASE sahabatbradpitt TO sahabatuser;
ALTER ROLE sahabatuser SET client_encoding TO 'utf8';
\q
```

### 3.1 Migrasi Data dari SQLite ke PostgreSQL (Opsional)
Jika Anda sudah memiliki data uji coba atau data asli di SQLite (`db.sqlite3`) dan ingin memindahkannya langsung secara utuh ke PostgreSQL (tanpa kehilangan relasi dan file media), jalankan script migrasi direct ORM yang telah tersedia:
```bash
python auto_migrate.py
```
Script ini sangat cepat, hemat memori (memakai pemrosesan batch), mematikan sinyal database otomatis (agar file fisik tidak ikut terhapus), dan menyelaraskan AutoField sequence di PostgreSQL.

### 4. Static Files Collection

```bash
# Collect all static files (CSS, JS)
python manage.py collectstatic --noinput

# Verify static files
ls -la staticfiles/
```

### 5. Database Migrations

```bash
# Make migrations (if models changed)
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Setup RBAC (optional)
python manage.py setup_rbac
```

---

## 🐳 Platform-Specific Guides

### Option 1: Docker Deployment

```bash
# Quick start
git clone https://github.com/milanalfandiismail/SahabatBradPitt.git
cd SahabatBradPitt

# Setup environment
cp .env.example .env
# Edit .env with production values

# Build and run
docker-compose up --build -d

# Setup database
docker-compose exec web python manage.py migrate
docker-compose exec web python manage.py createsuperuser
```

**Access:**
- App: http://localhost:8000
- Logs: `docker-compose logs -f`

**Update Deployment:**
```bash
git pull origin main
docker-compose up --build -d
docker-compose exec web python manage.py migrate
```

---

### Option 2: VPS (Ubuntu/Debian) + Nginx

```bash
# 1. Server setup
ssh root@your-server-ip
apt update && apt upgrade -y
apt install python3-pip python3-venv nginx git -y

# 2. Clone & setup
cd /home
git clone https://github.com/milanalfandiismail/SahabatBradPitt.git
cd SahabatBradPitt

# 3. Virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 4. Environment & database
cp .env.example .env
nano .env  # Edit production values
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser

# 5. Gunicorn service
sudo nano /etc/systemd/system/sahabatbradpitt.service
# [Service] section with gunicorn config

# 6. Nginx config
sudo nano /etc/nginx/sites-available/sahabatbradpitt
# Server block with proxy to gunicorn socket

# 7. Start services
sudo systemctl daemon-reload
sudo systemctl start sahabatbradpitt
sudo systemctl enable sahabatbradpitt
sudo ln -s /etc/nginx/sites-available/sahabatbradpitt /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

---

### Option 3: Windows + Waitress

```powershell
# 1. Setup virtual environment
python -m venv venv
.\venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt
pip install waitress

# 3. Environment
copy .env.example .env
# Edit .env

# 4. Database
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser

# 5. Run server
waitress-serve --port=8000 --url-scheme=https --threads=8 config.wsgi:application
```

**Background Service (Optional):**
```powershell
# Using NSSM
nssm install SahabatBradPitt
# GUI opens - set paths and arguments
# Path: C:\path\to\venv\Scripts\waitress-serve.exe
# Arguments: --port=8000 --threads=8 config.wsgi:application
# Directory: C:\path\to\SahabatBradPitt
```

---

### Option 4: PythonAnywhere

```bash
# 1. Bash console
git clone https://github.com/milanalfandiismail/SahabatBradPitt.git
cd SahabatBradPitt

# 2. Virtual environment
mkvirtualenv --python=/usr/bin/python3.10 venv
pip install -r requirements.txt

# 3. Environment & database
cp .env.example .env
nano .env
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser

# 4. Web app configuration
# Dashboard > Web > Add new app > Manual config
# Set source: /home/username/SahabatBradPitt
# Set virtualenv: /home/username/.virtualenvs/venv

# 5. WSGI config (replace content)
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings.production'

# 6. Static files
# Dashboard > Web > Static files
# /static/ -> /home/username/SahabatBradPitt/staticfiles
# /media/ -> /home/username/SahabatBradPitt/media

# 7. Reload web app
```

---

## 🔐 Security Configuration

### Environment Variables

```bash
# Always use strong, unique SECRET_KEY
# Never commit .env to version control
echo ".env" >> .gitignore

# Production .env example
DEBUG=False
SECRET_KEY=your-very-long-random-secret-key-here
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
TMDB_API_KEY=your-tmdb-api-key
YOUTUBE_API_KEY=your-youtube-api-key
```

### Django Security Settings (Production)

```python
# config/settings/production.py
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
X_FRAME_OPTIONS = 'DENY'
SECURE_CONTENT_TYPE_NOSNIFF = True
```

### Firewall Setup

```bash
# Ubuntu/Debian
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable

# Verify
sudo ufw status
```

---

## 🌐 SSL/TLS Certificate

### Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (auto-enabled by default)
sudo systemctl status certbot.timer

# Manual test renewal
sudo certbot renew --dry-run
```

### Nginx HTTPS Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # ... rest of config
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 📊 Monitoring & Logging

### Application Logs

```bash
# Django logs
python manage.py migrate  # Check for issues
python manage.py check     # Full system check

# Gunicorn logs
journalctl -u sahabatbradpitt -f

# Docker logs
docker-compose logs -f web
```

### System Monitoring

```bash
# Resource usage
htop          # CPU/Memory
df -h         # Disk space
free -h       # Memory

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Health Check

```bash
# Test endpoint
curl -I https://yourdomain.com/api/films/

# Expected response
HTTP/2 200
content-type: application/json
```

---

## 💾 Backup Strategy

### Database Backup

**SQLite:**
```bash
# Manual backup
cp db.sqlite3 db_backup_$(date +%Y%m%d).sqlite3

# Automated daily (cron)
0 2 * * * cp /path/to/db.sqlite3 /backup/db_$(date +\%Y\%m\%d).sqlite3
```

**PostgreSQL:**
```bash
# Manual backup
pg_dump -U sahabatuser sahabatbradpitt > backup_$(date +%Y%m%d).sql

# Automated daily (cron)
0 2 * * * pg_dump sahabatbradpitt | gzip > /backup/db_$(date +\%Y\%m\%d).sql.gz
```

### Media Files Backup

```bash
# Backup media directory
tar -czf media_backup_$(date +%Y%m%d).tar.gz /path/to/media/

# Restore
tar -xzf media_backup_20260501.tar.gz -C /path/to/
```

### Complete Backup Script

```bash
#!/bin/bash
# backup.sh - Run daily via cron

BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d_%H%M%S)
PROJECT_DIR="/home/milan/SahabatBradPitt"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
pg_dump sahabatbradpitt | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Media backup
tar -czf $BACKUP_DIR/media_$DATE.tar.gz $PROJECT_DIR/media/

# Keep only last 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

---

## 🔧 Troubleshooting

### Common Issues

**502 Bad Gateway (Nginx can't reach Gunicorn)**
```bash
# Check Gunicorn status
sudo systemctl status sahabatbradpitt

# Check socket exists
ls -la /home/milan/SahabatBradPitt/sahabatbradpitt.sock

# Restart Gunicorn
sudo systemctl restart sahabatbradpitt
```

**Static files not loading**
```bash
# Re-collect static files
python manage.py collectstatic --noinput

# Check permissions
sudo chown -R www-data:www-data /home/milan/SahabatBradPitt/staticfiles/

# Nginx config
sudo nginx -t
sudo systemctl restart nginx
```

**Database connection error**
```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Test connection
psql -U sahabatuser -d sahabatbradpitt -h localhost

# Check pg_hba.conf for authentication
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

**Docker container exits immediately**
```bash
# Check logs
docker-compose logs web

# Common fix - rebuild
docker-compose down
docker-compose up --build -d

# Check environment variables
docker-compose exec web env
```

### Debug Mode (Temporary)

```python
# Only for debugging - NEVER in production
DEBUG=True  # In .env

# Check logs
tail -f /var/log/django.log
```

---

## 🚀 Production Checklist

### Before Going Live

- [ ] DEBUG=False
- [ ] Strong SECRET_KEY
- [ ] ALLOWED_HOSTS configured
- [ ] TMDB_API_KEY set
- [ ] Database migrated
- [ ] Static files collected
- [ ] Admin user created
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Backups scheduled
- [ ] Monitoring active

### Post-Deployment Verification

```bash
# Test all endpoints
curl https://yourdomain.com/api/films/
curl https://yourdomain.com/admin/
curl https://yourdomain.com/

# Check SSL
openssl s_client -connect yourdomain.com:443 -showcerts

# Verify security headers
curl -I https://yourdomain.com/ | grep -E "(X-Frame-Options|Content-Security-Policy|Strict-Transport)"
```

---

## 📚 Additional Resources

### Documentation
- [CODEBASE_DOCUMENTATION.md](CODEBASE_DOCUMENTATION.md) - Full codebase docs
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [API.md](API.md) - API reference
- [DEVELOPMENT.md](DEVELOPMENT.md) - Local development

### External
- [TMDB API](https://developer.themoviedb.org/docs) - Movie database
- [Django Docs](https://docs.djangoproject.com/) - Django documentation
- [Gunicorn](https://docs.gunicorn.org/) - WSGI server
- [Let's Encrypt](https://letsencrypt.org/) - Free SSL certificates

---

## 💡 Tips

### Performance Optimization
```bash
# Use PostgreSQL for production
# Enable caching (Redis recommended)
# Use CDN for static files
# Configure appropriate workers

# Gunicorn workers (4 workers per core)
workers = cores * 2 + 1
```

### Scaling
```bash
# Horizontal scaling (multiple servers)
# - Use load balancer (Nginx/HAProxy)
# - Separate database server
# - Use Redis for session/cache

# Vertical scaling (bigger server)
# - Upgrade RAM/CPU
# - Optimize database queries
# - Enable query caching
```

---

**Last Updated**: 2026-05-29
**Version**: 2.0.0