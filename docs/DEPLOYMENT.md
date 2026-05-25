# 🚀 Deployment Guide

**Complete deployment instructions for SahabatBradPitt project.**

---

## Deployment Checklist

- [ ] Environment setup
- [ ] Database configuration
- [ ] Static files collection
- [ ] Security settings
- [ ] API keys configuration
- [ ] Email setup (optional)
- [ ] Monitoring setup
- [ ] Backup strategy
- [ ] SSL/TLS certificate
- [ ] Domain configuration

---

## Pre-Deployment

### 1. Environment Variables

Create `.env` file with production values:

```env
# Django
DEBUG=False
SECRET_KEY=your-very-secret-key-here
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@localhost/sahabatbradpitt

# APIs
TMDB_API_KEY=your-tmdb-api-key
YOUTUBE_API_KEY=your-youtube-api-key

# Email (Optional)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Security
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_HSTS_SECONDS=31536000
```

### 2. Generate Secret Key

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 3. Database Setup

**PostgreSQL Installation**

```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql

# Start service
sudo systemctl start postgresql
```

**Create Database**

```bash
sudo -u postgres psql
CREATE DATABASE sahabatbradpitt;
CREATE USER sahabatuser WITH PASSWORD 'securepassword';
ALTER ROLE sahabatuser SET client_encoding TO 'utf8';
ALTER ROLE sahabatuser SET default_transaction_isolation TO 'read committed';
ALTER ROLE sahabatuser SET default_transaction_deferrable TO on;
ALTER ROLE sahabatuser SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE sahabatbradpitt TO sahabatuser;
\q
```

---

## Deployment Options

### Option 1: Heroku (Easiest)

**Step 1: Install Heroku CLI**

```bash
curl https://cli.heroku.com/install.sh | sh
```

**Step 2: Login to Heroku**

```bash
heroku login
```

**Step 3: Create Heroku App**

```bash
heroku create sahabatbradpitt
```

**Step 4: Add PostgreSQL**

```bash
heroku addons:create heroku-postgresql:hobby-dev
```

**Step 5: Set Environment Variables**

```bash
heroku config:set DEBUG=False
heroku config:set SECRET_KEY=your-secret-key
heroku config:set TMDB_API_KEY=your-api-key
heroku config:set YOUTUBE_API_KEY=your-api-key
```

**Step 6: Deploy**

```bash
git push heroku main
```

**Step 7: Run Migrations**

```bash
heroku run python manage.py migrate
heroku run python manage.py createsuperuser
```

---

### Option 2: DigitalOcean (Recommended)

**Step 1: Create Droplet**

1. Go to DigitalOcean
2. Create new Droplet
3. Select Ubuntu 22.04
4. Choose $5/month plan
5. Add SSH key

**Step 2: Initial Setup**

```bash
# SSH into droplet
ssh root@your_droplet_ip

# Update system
apt-get update
apt-get upgrade -y

# Install dependencies
apt-get install -y python3-pip python3-venv postgresql postgresql-contrib nginx git
```

**Step 3: Clone Repository**

```bash
cd /home
git clone https://github.com/yourusername/SahabatBradPitt.git
cd SahabatBradPitt
```

**Step 4: Setup Virtual Environment**

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn
```

**Step 5: Configure PostgreSQL**

```bash
sudo -u postgres psql
CREATE DATABASE sahabatbradpitt;
CREATE USER sahabatuser WITH PASSWORD 'securepassword';
GRANT ALL PRIVILEGES ON DATABASE sahabatbradpitt TO sahabatuser;
\q
```

**Step 6: Collect Static Files**

```bash
python manage.py collectstatic --noinput
```

**Step 7: Run Migrations**

```bash
python manage.py migrate
python manage.py createsuperuser
```

**Step 8: Configure Gunicorn**

Create `/etc/systemd/system/gunicorn.service`:

```ini
[Unit]
Description=gunicorn daemon for SahabatBradPitt
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/home/SahabatBradPitt
ExecStart=/home/SahabatBradPitt/venv/bin/gunicorn \
    --workers 3 \
    --bind unix:/home/SahabatBradPitt/gunicorn.sock \
    config.wsgi:application

[Install]
WantedBy=multi-user.target
```

**Step 9: Configure Nginx**

Create `/etc/nginx/sites-available/sahabatbradpitt`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location = /favicon.ico { access_log off; log_not_found off; }
    
    location /static/ {
        alias /home/SahabatBradPitt/staticfiles/;
    }

    location /media/ {
        alias /home/SahabatBradPitt/media/;
    }

    location / {
        include proxy_params;
        proxy_pass http://unix:/home/SahabatBradPitt/gunicorn.sock;
    }
}
```

**Step 10: Enable Nginx Site**

```bash
sudo ln -s /etc/nginx/sites-available/sahabatbradpitt /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**Step 11: Start Gunicorn**

```bash
sudo systemctl start gunicorn
sudo systemctl enable gunicorn
```

---

### Option 3: AWS (Scalable)

**Step 1: Create EC2 Instance**

1. Go to AWS Console
2. Launch EC2 instance (Ubuntu 22.04)
3. Configure security groups
4. Add SSH key pair

**Step 2: Connect and Setup**

```bash
ssh -i your-key.pem ubuntu@your-instance-ip

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install dependencies
sudo apt-get install -y python3-pip python3-venv postgresql postgresql-contrib nginx git
```

**Step 3: Follow DigitalOcean steps 3-11**

---

## SSL/TLS Certificate

### Using Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renew
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Update Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # ... rest of config
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Monitoring & Logging

### Application Logging

```python
# settings/production.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': '/var/log/django/error.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'ERROR',
            'propagate': True,
        },
    },
}
```

### System Monitoring

```bash
# Monitor CPU/Memory
top

# Monitor disk space
df -h

# Monitor logs
tail -f /var/log/nginx/access.log
tail -f /var/log/django/error.log
```

---

## Backup Strategy

### Database Backup

```bash
# Daily backup
0 2 * * * pg_dump sahabatbradpitt > /backups/db_$(date +\%Y\%m\%d).sql

# Restore
psql sahabatbradpitt < /backups/db_20260525.sql
```

### Media Files Backup

```bash
# Backup media directory
0 3 * * * tar -czf /backups/media_$(date +\%Y\%m\%d).tar.gz /home/SahabatBradPitt/media/
```

### Automated Backup Script

```bash
#!/bin/bash
BACKUP_DIR="/backups"
DB_NAME="sahabatbradpitt"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
pg_dump $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup media
tar -czf $BACKUP_DIR/media_$DATE.tar.gz /home/SahabatBradPitt/media/

# Keep only last 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
```

---

## Performance Optimization

### Caching

```python
# Redis cache
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}
```

### Database Optimization

```bash
# Analyze query performance
EXPLAIN ANALYZE SELECT * FROM films WHERE status = 'published';

# Vacuum database
VACUUM ANALYZE;
```

### CDN Setup

1. Use CloudFront (AWS) or Cloudflare
2. Point static files to CDN
3. Cache static assets for 1 year

---

## Security Hardening

### Django Settings

```python
# settings/production.py
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
X_FRAME_OPTIONS = 'DENY'
SECURE_CONTENT_SECURITY_POLICY = {
    'default-src': ("'self'",),
    'script-src': ("'self'", "'unsafe-inline'"),
    'style-src': ("'self'", "'unsafe-inline'"),
}
```

### Firewall Rules

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

### Regular Updates

```bash
# Weekly security updates
0 2 * * 0 apt-get update && apt-get upgrade -y
```

---

## Troubleshooting

### 502 Bad Gateway

**Problem**: Nginx can't connect to Gunicorn

**Solution**:
```bash
# Check Gunicorn status
sudo systemctl status gunicorn

# Check socket
ls -la /home/SahabatBradPitt/gunicorn.sock

# Restart Gunicorn
sudo systemctl restart gunicorn
```

### Static Files Not Loading

**Problem**: CSS/JS not loading

**Solution**:
```bash
# Collect static files
python manage.py collectstatic --noinput

# Check permissions
sudo chown -R www-data:www-data /home/SahabatBradPitt/staticfiles/
```

### Database Connection Error

**Problem**: Can't connect to PostgreSQL

**Solution**:
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -U sahabatuser -d sahabatbradpitt -h localhost
```

---

## Post-Deployment

### Verification Checklist

- [ ] Website loads on HTTPS
- [ ] Static files load correctly
- [ ] API endpoints respond
- [ ] Database queries work
- [ ] Email notifications send
- [ ] Logs are being written
- [ ] Backups are running
- [ ] Monitoring is active

### Monitoring URLs

- **Admin Panel**: https://yourdomain.com/admin
- **API**: https://yourdomain.com/api/films/
- **Health Check**: https://yourdomain.com/api/health/

---

## Scaling

### Horizontal Scaling

1. Add more Gunicorn workers
2. Use load balancer (Nginx, HAProxy)
3. Separate database server
4. Redis cache server

### Vertical Scaling

1. Upgrade server resources
2. Optimize database queries
3. Enable caching
4. Use CDN for static files

---

**Last Updated**: 2026-05-25  
**Version**: 1.0.0
