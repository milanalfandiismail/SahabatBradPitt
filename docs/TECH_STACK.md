# 🛠️ Tech Stack Documentation

**Complete technology stack and dependencies for SahabatBradPitt project.**

---

## Backend Stack

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| **Django** | 4.0+ | Web framework |
| **Django REST Framework** | 3.14+ | REST API |
| **Python** | 3.8+ | Programming language |

### Database
| Technology | Purpose |
|------------|---------|
| **SQLite** | Development database |
| **PostgreSQL** | Production database |

### APIs & Services
| Service | Purpose | Authentication |
|---------|---------|-----------------|
| **TMDB API** | Movie data sync | API Key |
| **YouTube Data API** | Trailer search | API Key |

### Caching & Performance
| Technology | Purpose |
|------------|---------|
| **Django Cache Framework** | Query caching |
| **MD5 Hashing** | Cache key generation |

### Authentication
| Technology | Purpose |
|------------|---------|
| **Token Authentication** | API authentication |
| **Django Auth** | User management |

---

## Frontend Stack

### Core Technologies
| Technology | Purpose |
|------------|---------|
| **HTML5** | Structure |
| **CSS3 (Vanilla)** | Styling |
| **JavaScript (ES6+)** | Interactivity |

### CSS Framework
- **Tailwind CSS** - Utility-first CSS framework
- **Custom CSS** - Additional styling

### JavaScript Libraries
| Library | Purpose |
|---------|---------|
| **Fetch API** | HTTP requests |
| **DOM API** | DOM manipulation |
| **Material Icons** | Icon library |

### Frontend Features
- ✅ Responsive design
- ✅ Dark mode support
- ✅ Lightbox modal
- ✅ Real-time search
- ✅ Form validation
- ✅ Toast notifications

---

## Development Tools

### Package Management
```bash
pip              # Python package manager
npm              # Node.js package manager (optional)
```

### Version Control
```bash
git              # Version control
GitHub           # Repository hosting
```

### Development Server
```bash
python manage.py runserver    # Django dev server
```

### Database Management
```bash
python manage.py migrate      # Run migrations
python manage.py makemigrations  # Create migrations
```

---

## Dependencies

### Python Dependencies

**Core:**
```
Django==4.2.0
djangorestframework==3.14.0
django-cors-headers==4.0.0
python-decouple==3.8
requests==2.31.0
```

**Database:**
```
psycopg2-binary==2.9.6  # PostgreSQL adapter
```

**Caching:**
```
django-redis==5.2.0  # Redis cache backend (optional)
```

### Installation
```bash
pip install -r requirements.txt
```

---

## Environment Configuration

### Required Environment Variables

```env
# Django
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=127.0.0.1,localhost

# APIs
TMDB_API_KEY=your-tmdb-api-key
YOUTUBE_API_KEY=your-youtube-api-key

# Database (Production)
DATABASE_URL=postgresql://user:password@localhost/dbname

# Email (Optional)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### Setup .env File
```bash
# Create .env file
cp .env.example .env

# Edit .env with your values
nano .env
```

---

## Database Technologies

### SQLite (Development)
- **File-based database**
- **Zero configuration**
- **Perfect for development**

### PostgreSQL (Production)
- **Robust relational database**
- **Scalable**
- **Production-ready**

### ORM
- **Django ORM** - Object-relational mapping

---

## Caching Strategy

### Cache Backends
```python
# Development (In-memory)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# Production (Redis)
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
    }
}
```

### Cache Usage
```python
from django.core.cache import cache

# Set cache
cache.set('key', value, timeout=3600)

# Get cache
value = cache.get('key')

# Delete cache
cache.delete('key')
```

---

## API Integration

### TMDB API
```python
# Endpoint
https://api.themoviedb.org/3/

# Authentication
api_key=YOUR_API_KEY

# Example
GET /person/287/movie_credits?api_key=YOUR_API_KEY
```

### YouTube Data API
```python
# Endpoint
https://www.googleapis.com/youtube/v3/

# Authentication
key=YOUR_API_KEY

# Example
GET /search?q=trailer&key=YOUR_API_KEY
```

---

## Performance Optimization

### Caching
- ✅ Query result caching (30 days)
- ✅ YouTube trailer caching
- ✅ API response caching

### Database
- ✅ Indexed queries
- ✅ Select_related for foreign keys
- ✅ Prefetch_related for many-to-many

### Frontend
- ✅ Lazy loading images
- ✅ Minified CSS/JavaScript
- ✅ Responsive images

---

## Security

### HTTPS
- ✅ SSL/TLS in production
- ✅ Secure cookies

### Authentication
- ✅ Token-based API auth
- ✅ CSRF protection
- ✅ Password hashing

### Input Validation
- ✅ Server-side validation
- ✅ SQL injection prevention
- ✅ XSS protection

---

## Deployment

### Hosting Options
- **Heroku** - Easy deployment
- **AWS** - Scalable infrastructure
- **DigitalOcean** - Affordable VPS
- **PythonAnywhere** - Python-specific hosting

### Web Server
- **Gunicorn** - WSGI HTTP Server
- **Nginx** - Reverse proxy

### Process Manager
- **Supervisor** - Process management
- **Systemd** - Linux service manager

---

## Development Workflow

### Local Development
```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

### Testing
```bash
# Run tests
python manage.py test

# Run specific test
python manage.py test apps.films.tests
```

### Code Quality
```bash
# Format code
black .

# Lint code
flake8 .

# Type checking
mypy .
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-05-25 | Initial release |

---

**Last Updated**: 2026-05-25  
**Maintained By**: Development Team
