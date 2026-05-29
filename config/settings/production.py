from .base import *
from decouple import config

DEBUG = False

ALLOWED_HOSTS = [h.strip() for h in config('ALLOWED_HOSTS', default='').split(',') if h.strip()]

# In production, we'll read database credentials from environment variables.
# By default, falls back to SQLite if DATABASE_URL is not set.
# TODO(security): configure PostgreSQL using dynamic secrets in production
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
        'OPTIONS': {
            'timeout': 20,  # Prevent 'database is locked' errors during heavy sync
        }
    }
}

# Production CORS Configuration
CORS_ALLOW_ALL_ORIGINS = False
# CORS_ALLOWED_ORIGINS = [
#     "https://your-domain.com",
# ]

# Security settings (HTTP Headers)
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=False, cast=bool)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True

# Anti-Clickjacking Frame Scopes
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# CSRF Cookie Protection
CSRF_COOKIE_HTTPONLY = False  # Harus False agar Javascript (fetch/AJAX) bisa membacanya
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SAMESITE = 'Lax'

# Tambahan penting untuk Reverse Proxy (PythonAnywhere / Nginx)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
CSRF_TRUSTED_ORIGINS = ['https://' + host for host in ALLOWED_HOSTS]
