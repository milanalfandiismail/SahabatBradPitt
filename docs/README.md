# 📚 SahabatBradPitt Documentation

**Welcome! Panduan lengkap untuk project SahabatBradPitt.**

---

## 📖 Quick Navigation

| Document | Purpose |
|----------|---------|
| **[DEVELOPMENT.md](./guides/DEVELOPMENT.md)** | Local development quick start |
| **[CODEBASE_DOCUMENTATION.md](./architecture/CODEBASE_DOCUMENTATION.md)** | Comprehensive codebase docs |
| **[ARCHITECTURE.md](./architecture/ARCHITECTURE.md)** | System architecture & patterns |
| **[API.md](./api/API.md)** | Complete REST API reference |
| **[DATABASE.md](./architecture/DATABASE.md)** | Database schema & models |
| **[GUIDES.md](./guides/GUIDES.md)** | Implementation guides |
| **[DEPLOYMENT.md](./deployment/DEPLOYMENT.md)** | Deployment guide (all platforms) |
| **[RBAC_ROLE_SYSTEM.md](./guides/RBAC_ROLE_SYSTEM.md)** | Role-based access control |

## 🌐 Platform-Specific Deployment

| Platform | Guide |
|----------|-------|
| Windows (Waitress) | [WINDOWS_WAITRESS_DEPLOYMENT.md](./deployment/WINDOWS_WAITRESS_DEPLOYMENT.md) |
| Docker | [DOCKER_DEPLOYMENT.md](./deployment/DOCKER_DEPLOYMENT.md) |
| VPS + Nginx | [VPS_NGINX_DEPLOYMENT.md](./deployment/VPS_NGINX_DEPLOYMENT.md) |
| PythonAnywhere | [PYTHONANYWHERE_DEPLOYMENT.md](./deployment/PYTHONANYWHERE_DEPLOYMENT.md) |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Django 4.0+
- Node.js (for frontend development)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/SahabatBradPitt.git
cd SahabatBradPitt

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup database
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

### Access Application
- **Frontend**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin
- **API**: http://localhost:8000/api

---

## ✨ Key Features

### 1. **Gallery Lightbox Modal**
- View film gallery images in a beautiful lightbox
- Image counter and navigation
- Keyboard shortcuts (ESC to close)

### 2. **YouTube Trailer Integration**
- Automatic trailer search from TMDB
- YouTube Data API fallback
- 1080p default quality
- 30-day caching

### 3. **Admin Film Management**
- Create/edit films manually
- Approval workflow (draft → pending → published)
- Image upload support
- Status tracking

### 4. **Recommendation System**
- TOPSIS-based film recommendations
- Hybrid approach (Expert System + SPK)
- Genre, era, duration, and rating matching
- Personalized suggestions based on user preferences
- Content-based similarity (find similar films)
- User preference profiles

### 5. **User Reviews & Ratings**
- Rate films (1-10 stars)
- Write detailed reviews
- Community engagement

---

## 📊 Project Statistics

| Metric | Value |
|--------|-------|
| **Backend** | Django REST Framework |
| **Frontend** | Vanilla HTML/CSS/JavaScript |
| **Database** | SQLite (dev), PostgreSQL (prod) |
| **API Endpoints** | 50+ |
| **Features** | 10+ |
| **Test Coverage** | 80%+ |

---

## 🔗 API Overview

### Authentication
All API endpoints use **Token-based authentication**:

```bash
curl -H "Authorization: Token YOUR_TOKEN" http://localhost:8000/api/films/
```

### Main Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/films/` | GET | List all films |
| `/api/films/` | POST | Create new film |
| `/api/films/{id}/` | GET | Get film details |
| `/api/films/{id}/` | PUT | Update film |
| `/api/films/{id}/submit-approval/` | POST | Submit for approval |
| `/api/films/{id}/approve/` | POST | Approve film |
| `/api/actors/` | GET | List actors |
| `/api/ratings/` | POST | Submit rating |

See [API.md](./api/API.md) for complete reference.

---

## 🏗️ Architecture

```
SahabatBradPitt/
├── apps/
│   ├── films/          # Film management
│   ├── actors/         # Actor management
│   ├── users/          # User authentication
│   ├── ratings/        # Rating system
│   ├── festivals/      # Festival management
│   └── recommendations/# Recommendation engine
├── config/             # Django configuration
├── templates/          # HTML templates
├── static/             # CSS, JavaScript
├── docs/               # Documentation
└── manage.py           # Django CLI
```

See [ARCHITECTURE.md](./architecture/ARCHITECTURE.md) for detailed architecture.

---

## 📖 Implementation Guides

### Adding a New Film
1. Go to Admin Panel
2. Create new film (draft status)
3. Upload images
4. Submit for approval
5. Super admin approves

See [GUIDES.md](./guides/GUIDES.md) for step-by-step guide.

### Integrating YouTube Trailers
- Automatic from TMDB API
- Manual input via admin panel
- 1080p default quality

### Using Gallery Lightbox
- Click any gallery image
- Navigate with prev/next buttons
- Close with ESC or click outside

---

## 🔐 Security

- ✅ Token-based authentication
- ✅ CSRF protection
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ Rate limiting
- ✅ Input validation

See [DEPLOYMENT.md](./deployment/DEPLOYMENT.md) for security best practices.

---

## 📝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Create Pull Request

---

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review API reference

---

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

---

**Last Updated**: 2026-05-25  
**Version**: 1.0.0
