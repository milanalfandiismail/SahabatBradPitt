# SahabatBradPitt - Codebase Documentation

## 📋 Overview

**SahabatBradPitt** adalah platform web film (mirip Letterboxd) yang dibangun dengan Django. Aplikasi ini menampilkan database film dan aktor, lengkap dengan sistem rekomendasi berbasis konten dan sinkronisasi data dari TMDB API.

**Tech Stack:**
| Layer | Technology |
|-------|------------|
| Framework | Django 4.2 |
| API | Django REST Framework |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Static Files | WhiteNoise |
| External API | TMDB (The Movie Database) |
| Recommendation | TOPSIS Algorithm |
| Rate Limiting | Custom Thread-Safe Limiter |
| Deployment | Docker / Waitress (Windows) |

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (HTML Templates)                │
│  home.html | film_list | film_detail | actor_detail | festival  │
└─────────────────────────────────────────────────────────────────┘
                              │ ▲
                              ▼ │
┌─────────────────────────────────────────────────────────────────┐
│                    DJANGO REST FRAMEWORK                        │
│                   (API + SSR Protected Views)                   │
│  /api/films | /api/actors | /api/auth | /api/recommendations    │
└─────────────────────────────────────────────────────────────────┘
                              │ ▲
                              ▼ │
┌─────────────────────────────────────────────────────────────────┐
│                         MODELS LAYER                             │
│  Film │ Actor │ Genre │ Studio │ Rating │ Filmography │ User   │
└─────────────────────────────────────────────────────────────────┘
                              │ ▲
                              ▼ │
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICES LAYER                              │
│  TMDBService │ YouTubeService │ TOPSIS Engine │ Expert System    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   TMDB API      │
                    │ (Movie Database)│
                    └─────────────────┘
```

---

## 📁 Struktur Direktori

```
SahabatBradPitt/
├── config/                    # Django project configuration
│   ├── settings/
│   │   ├── base.py           # Base settings ( semua env )
│   │   ├── development.py    # Dev settings (SQLite, CORS all)
│   │   └── production.py     # Prod settings (PostgreSQL)
│   ├── urls.py               # URL routing utama
│   ├── wsgi.py               # WSGI entry point
│   └── asgi.py               # ASGI entry point
│
├── apps/                      # Django apps terorganisir
│   ├── films/                # Core app - Film, Genre, FilmImage
│   │   ├── models.py         # Film, Genre, FilmImage models
│   │   ├── views.py         # FilmViewSet, GenreViewSet
│   │   ├── serializers.py    # DRF serializers
│   │   ├── urls.py           # Router config
│   │   ├── admin.py          # Django admin config
│   │   ├── actor_config.py   # Featured actors config
│   │   ├── services/
│   │   │   ├── main_service.py   # TMDB sync engine (1000+ lines)
│   │   │   ├── limiter.py        # Rate limiter
│   │   │   └── parser.py         # Data parser
│   │   ├── youtube_service.py    # YouTube trailer finder
│   │   ├── youtube_scraper.py    # Fallback scraper
│   │   └── management/commands/
│   │       ├── sync_tmdb.py          # Sync single/multi actors
│   │       └── sync_films_cast.py   # Sync all film cast members
│   │
│   ├── actors/                # Aktor & Filmography
│   │   ├── models.py         # Actor, Filmography models
│   │   ├── views.py         # API views
│   │   └── urls.py          # Router config
│   │
│   ├── ratings/              # User ratings & watchlist
│   │   ├── models.py        # Rating, Watchlist models
│   │   ├── views.py        # API views
│   │   └── urls.py         # Router config
│   │
│   ├── festivals/            # Festival film & Studio
│   │   ├── models.py       # Festival, Studio, FestivalAward
│   │   ├── views.py         # API views
│   │   ├── tmdb_service.py  # TMDB API wrapper config
│   │   └── urls.py         # Router config
│   │
│   ├── recommendations/      # AI Recommendation Engine
│   │   ├── models.py        # Recommendation models (if any)
│   │   ├── views.py         # API views
│   │   ├── engine.py        # ExpertSystemFilter
│   │   ├── spk.py           # TOPSIS SPK Facade
│   │   ├── topsis_user.py   # User-based TOPSIS
│   │   └── topsis_similarity.py  # Content-based similarity
│   │
│   └── users/               # Auth, UserProfile, RBAC
│       ├── models.py        # User, UserProfile
│       ├── views.py         # API views
│       ├── views_html.py    # SSR HTML views
│       ├── permissions.py   # RBAC permissions
│       ├── serializers.py   # DRF serializers
│       ├── signals.py       # Auto-create profile
│       ├── urls.py          # Router config
│       └── management/commands/
│           ├── setup_rbac.py         # Setup roles/admin
│           └── change_user_role.py    # Change user role
│
├── templates/               # HTML templates (Frontend)
├── staticfiles/             # Compiled static files
├── static/                  # Source static files
├── media/                   # User uploads (avatars, posters)
├── docs/                    # Documentation
├── Dockerfile              # Docker image
├── docker-compose.yml      # Docker compose
├── requirements.txt        # Python dependencies
├── manage.py               # Django CLI
└── CLAUDE.md               # RTK instructions
```

---

## 🔗 Database Schema

```
┌──────────────────┐       ┌──────────────────┐
│      User        │       │   UserProfile    │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │──────<│ user_id (FK, 1:1)│
│ username         │       │ avatar           │
│ email            │       │ display_name    │
│ password         │       │ bio              │
│ is_staff         │       │ pref_focus       │
│ is_superuser     │       │ pref_genres (M2M)│
│ date_joined      │       │ pref_era         │
└──────────────────┘       │ pref_duration    │
                          └──────────────────┘

┌──────────────────┐       ┌──────────────────┐
│     Studio       │       │     Film         │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │──────<│ id (PK)          │
│ name             │       │ tmdb_id (UNIQUE) │
│ country          │       │ title            │
└──────────────────┘       │ synopsis         │
                           │ release_year    │
┌──────────────────┐       │ duration        │
│  Filmography      │       │ poster_path     │
├──────────────────┤       │ avg_rating      │
│ actor_id (FK)─────┼──┐   │ popularity      │
│ film_id (FK)──────┼──┘   │ status          │
│ role             │       │ trailer_url     │
│ role_type        │       │ studio_id (FK)  │
│ order            │       └──────────────────┘
└──────────────────┘              │
                                │
        ┌───────────────────────┴───────────────────┐
        │              M2M: Film <-> Genre           │
        │                                           │
┌──────────────────┐                        ┌──────────────────┐
│      Actor        │                        │      Genre        │
├──────────────────┤                        ├──────────────────┤
│ id (PK)          │──────> Filmography      │ id (PK)          │
│ tmdb_id (UNIQUE) │                        │ name             │
│ name             │                        │ tmdb_genre_id    │
│ native_name      │                        └──────────────────┘
│ bio              │
│ photo_path       │
│ birth_year      │
│ birthday        │
│ deathday        │
│ instagram_id    │
│ twitter_id      │
└──────────────────┘

┌──────────────────┐
│     Rating        │
├──────────────────┤
│ id (PK)          │
│ user_id (FK)───> User
│ film_id (FK)───> Film
│ score (1-10)    │
│ review          │
│ created_at      │
└──────────────────┘

┌──────────────────┐
│    Watchlist      │
├──────────────────┤
│ id (PK)          │
│ user_id (FK)───> User
│ film_id (FK)───> Film
│ added_at         │
└──────────────────┘

┌──────────────────┐
│    Festival      │
├──────────────────┤
│ id (PK)          │
│ name             │
│ tmdb_id (UNIQUE) │
│ country         │
│ city            │
│ founded_year    │
│ website          │
└──────────────────┘
```

---

## 🔌 API Endpoints

### Films API (`/api/films/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | List films (filterable) |
| `/` | POST | Create film (admin) |
| `/<id>/` | GET | Film detail |
| `/<id>/` | PUT/PATCH | Update film (admin) |
| `/<id>/` | DELETE | Delete film (admin) |

**Custom Actions (Admin):**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/films/<id>/sync/` | POST | Trigger TMDB sync for specific film |
| `/sync-status/` | GET | Check background sync progress |
| `/stats/` | GET | Film statistics (public/staff) |
| `/<id>/similar/` | GET | Find similar films |
| `/<id>/images/` | POST | Upload gallery image |
| `/<id>/images/<image_id>/` | DELETE | Delete gallery image |
| `/<id>/submit_approval/` | POST | Submit for approval |
| `/<id>/approve/` | POST | Approve film (superadmin) |
| `/<id>/reject/` | POST | Reject film (superadmin) |

**Query Parameters:**
- `search` - Search by title/synopsis
- `genre` - Filter by genre ID
- `year_from`, `year_to` - Filter by year range
- `studio` - Filter by studio ID
- `min_rating` - Minimum rating filter
- `status` - Filter by status (staff only)

### Actors API (`/api/actors/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | List actors |
| `/<id>/` | GET | Actor detail with filmography |
| `/<id>/films/` | GET | Films by actor |

### Auth API (`/api/auth/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/register/` | POST | User registration |
| `/login/` | POST | User login |
| `/logout/` | POST | User logout |
| `/me/` | GET | Current user profile |
| `/change-password/` | POST | Change password |

### Ratings API (`/api/ratings/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | List ratings |
| `/` | POST | Create rating |
| `/<id>/` | PUT/PATCH | Update rating |
| `/<id>/` | DELETE | Delete rating |
| `/my/` | GET | Current user ratings |

### Recommendations API (`/api/recommendations/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | POST | Calculate recommendations via TOPSIS |

**Request Body (POST):**
```json
{
    "focus": "balanced",
    "genres": [1, 2, 3],
    "era": "2010s",
    "duration": "sedang"
}
```

**Response:**
```json
{
    "message": "Berhasil menghitung rekomendasi...",
    "results": [
        {
            "id": 123,
            "title": "Film Title",
            "poster_path": "/path/to/poster.jpg",
            "avg_rating": 8.5,
            "release_year": 2015,
            "duration": 120,
            "topsis_score": 0.8542,
            "reasoning": "Cocok karena ratingnya yang sangat tinggi, sangat sesuai dengan genre pilihan"
        }
    ]
}
```

### Users API (`/api/auth/users/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/register/` | POST | User registration |
| `/login/` | POST | User login |
| `/logout/` | POST | User logout |
| `/me/` | GET | Current user profile |
| `/me/preferences/` | GET/PUT | User preferences |

### Festivals API (`/api/festivals/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | List festivals |
| `/<id>/` | GET | Festival detail |
| `/<id>/awards/` | GET | Festival awards |
| `/studios/` | GET | List studios |
| `/studios/` | POST | Create studio (admin) |

**Custom Actions:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/wikipedia-import/` | POST | Import festival data from Wikipedia |

### Watchlist API (`/api/ratings/watchlist/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | List watchlist items |
| `/` | POST | Add to watchlist |
| `/<id>/` | DELETE | Remove from watchlist |
| `?user=<id>` | GET | Filter by user |

---

## 🔬 Sistem Rekomendasi (TOPSIS)

### Algoritma TOPSIS

**TOPSIS** (Technique for Order Preference by Similarity to Ideal Solution) adalah metode Multi-Criteria Decision Making (MCDM).

```
┌──────────────────────────────────────────────────────────────────┐
│                     TOPSIS Workflow                               │
├──────────────────────────────────────────────────────────────────┤
│  1. Decision Matrix (X)     ┌─────────────────────────────┐     │
│                               │ C1    C2    C3    ... Cn   │     │
│     ┌────────────────────┐   │ A1   x11  x12   x13  ... x1n│     │
│     │ Film 1             │   │ A2   x21  x22   x23  ... x2n│     │
│     │ Film 2             │   │ ...                       │     │
│     │ ...                │   │ Am   xm1  xm2   xm3  ... xmn│     │
│     │ Film m             │   └─────────────────────────────┘     │
│     └────────────────────┘                                      │
│                                                                  │
│  2. Normalize R = X / sqrt(sum(X²))                              │
│                                                                  │
│  3. Weighted V = R × Weights                                     │
│                                                                  │
│  4. Ideal Solution A+: max(V)                                    │
│     Negative Ideal A-: min(V)                                    │
│                                                                  │
│  5. Distance: D+ = sqrt(sum((V - A+)²))                          │
│                D- = sqrt(sum((V - A-)²))                         │
│                                                                  │
│  6. Score = D- / (D+ + D-)                                       │
│     Higher score = Better match                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Recommendation Types

#### 1. User-Based (topsis_user.py)

Rekomendasi berdasarkan preferensi user.

| Kriteria | Bobot Default | Deskripsi |
|----------|---------------|-----------|
| C1 - avg_rating | 0.25 | Rating film |
| C2 - popularity | 0.20 | Popularitas TMDB |
| C3 - genre_match | 0.20 | Kecocokan genre favorit |
| C4 - era_match | 0.10 | Era sesuai preferensi |
| C5 - duration_match | 0.10 | Durasi sesuai preferensi |
| C6 - history_match | 0.15 | Mirip film yang disukai |

**Focus Modes:**
```python
# Different weight profiles based on user preference
focus = "rating"    → [0.65, 0.05, 0.1, 0.1, 0.05, 0.05]
focus = "popular"  → [0.05, 0.65, 0.1, 0.1, 0.05, 0.05]
focus = "genre"    → [0.1, 0.1, 0.5, 0.1, 0.1, 0.1]
focus = "balanced" → [0.25, 0.2, 0.2, 0.1, 0.1, 0.15]
```

#### 2. Content-Based Similarity (topsis_similarity.py)

Rekomendasi film mirip dengan film tertentu.

| Kriteria | Bobot | Deskripsi |
|----------|-------|-----------|
| Genre | 0.25 | Jaccard similarity |
| Synopsis | 0.20 | Word overlap (Jaccard) |
| Title | 0.10 | Franchise detection |
| Studio | 0.15 | Same production |
| Director | 0.15 | Same director |
| Cast | 0.15 | Actor overlap |

**Similarity Score Formula:**
```python
# Jaccard Similarity untuk set
jaccard(A, B) = |A ∩ B| / |A ∪ B|

# Genre similarity: Jaccard(genre_base, genre_candidate)
# Cast similarity: Jaccard(cast_base, cast_candidate)

# TOPSIS Score calculation
score = D_minus / (D_plus + D_minus)
```

---

## 🌐 TMDB Sync Engine

### TMDBService Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     sync_multiple_actors()                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FEATURED_ACTORS (15+ actors)                                    │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  TMDBRateLimiter (40 req/10 sec)                        │     │
│  │  Thread-safe rate limiting untuk API compliance          │     │
│  └─────────────────────────────────────────────────────────┘     │
│         │                                                        │
│         ▼                                                        │
│  for each actor:                                                 │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  sync_single_actor(actor)                                │     │
│  │  ┌──────────────────────────────────────────────────┐   │     │
│  │  │  1. GET /person/{id}/combined_credits             │   │     │
│  │  │     → Filmography actor (movie + TV)             │   │     │
│  │  │  2. GET /person/{id}                              │   │     │
│  │  │     → Biography, profile, birthday                │   │     │
│  │  │  3. _format_latin_native_name()                  │   │     │
│  │  │     → Handle Asian names (Hangul/Hanzi/etc)        │   │     │
│  │  │  4. For each film in credits:                     │   │     │
│  │  │     a. GET /movie/{id}                            │   │     │
│  │  │     b. Extract runtime, synopsis, studio          │          │
│  │  │     c. Extract director from credits             │          │
│  │  │     d. Search trailer via YouTubeService         │          │
│  │  │     e. Create/Update Film, Actor, Filmography    │          │
│  │  │     f. Sync all cast members (top 100)          │          │
│  │  │  5. Wait if rate limit exceeded                  │          │
│  │  └──────────────────────────────────────────────────┘   │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                  │
│  return: { total_actors, total_films }                          │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Features

#### 1. Unicode Name Handling

Format nama aktor untuk berbagai script:

```python
# Supported Scripts
scripts = [
    'hangul',      # 한국어 (Korean)
    'japanese',    # 日本語 (Japanese)
    'chinese',     # 漢字 (Hanzi)
    'thai',        # ภาษาไทย (Thai)
    'cyrillic',    # Кириллица (Russian)
    'greek',       # Ελληνικά (Greek)
    'arabic',      # العربية (Arabic)
    'hebrew',      # עברית (Hebrew)
    'devanagari',  # देवनागरी (Hindi)
]

# Example: "Brad Pitt (브래드 피트)" - "Seoul (서울)"
# Format: "Latin Name (Native Name)"
```

#### 2. Native Name Protection

Proteksi nama existing agar tidak ditimpa saat sync:

```python
def _get_protected_actor_names(tmdb_id, name, native_name):
    # 1. Jika nama lama sudah lengkap dengan parentheses, pertahankan!
    # 2. Jika nama lama ada native_name, pertahankan!
    # 3. Proteksi huruf Latin vs murni non-Latin
    # 4. Prioritaskan nama yang lebih informatif
```

#### 3. TV Show Filtering

Skip kategori TV show non-fiksi:

```python
SKIPPED_TV_GENRES = {
    99,      # Documentary
    10763,   # News
    10764,   # Reality
    10766,   # Soap
    10767,   # Talk Show
}
```

#### 4. Rate Limiting

```python
class TMDBRateLimiter:
    max_requests = 40    # TMDB limit
    time_window = 10     # per 10 seconds
```

---

## 🚀 YouTube Trailer Service

### Fallback Chain

```
┌─────────────────────────────────────────────────────────────┐
│               search_trailer(title, year)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: TMDB Videos (FREE - no API call)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Priority:                                              │   │
│  │ 1. Official & 1080p+ & Trailer                       │   │
│  │ 2. Official & Trailer                                 │   │
│  │ 3. 1080p+ & Trailer                                   │   │
│  │ 4. Any Trailer                                        │   │
│  │ 5. Teaser                                             │   │
│  │ 6. Clip/Featurette                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│            │ OK? → Return YouTube URL                      │
│            │ FAIL                                           │
│            ▼                                                 │
│  Step 2: YouTube Data API (requires API key)                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Search query: "{title} {year} trailer"             │   │
│  │ Cache: 30 days                                       │   │
│  └──────────────────────────────────────────────────────┘   │
│            │ OK? → Return YouTube URL                      │
│            │ FAIL                                           │
│            ▼                                                 │
│  Step 3: Fallback Scraping (no API key needed)              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ build_search_queries() → Multiple query variants     │   │
│  │ scrape_youtube_video_id() → HTML scraping             │   │
│  └──────────────────────────────────────────────────────┘   │
│            │ OK? → Return YouTube URL                      │
│            │ FAIL                                           │
│            ▼                                                 │
│  Step 4: Return search URL (fallback)                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication & Authorization

### Permission Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    PERMISSION LEVELS                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Public                                                  │
│     ├── GET / (homepage)                                    │
│     ├── GET /movies/ (film list)                            │
│     ├── GET /movies/<id>/ (film detail)                     │
│     ├── GET /actors/ (actor list)                           │
│     ├── GET /actors/<id>/ (actor detail)                    │
│     └── GET /api/films/ (REST API - read only)              │
│                                                             │
│  2. Authenticated User                                       │
│     ├── POST /api/auth/login/                               │
│     ├── POST /api/auth/register/                            │
│     ├── GET /profile/ (SSR)                                 │
│     ├── POST /api/ratings/ (create ratings)                 │
│     ├── POST /api/ratings/watchlist/ (add to watchlist)     │
│     └── GET /recommendations/ (AI recommendations)          │
│                                                             │
│  3. Admin (is_staff=True)                                   │
│     ├── POST/PUT/DELETE /api/films/ (CRUD films)            │
│     ├── POST/PUT/DELETE /api/actors/ (CRUD actors)          │
│     ├── GET /admin-films/ (Sineas Portal)                    │
│     └── POST /api/films/sync/ (TMDB sync)                   │
│                                                             │
│  4. Superadmin (is_superuser=True)                           │
│     ├── Full access to all resources                        │
│     └── Django Admin Site                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### RBAC Groups

```python
# Groups
- Superadmin    → Full access, Django admin
- Admin         → Content management, TMDB sync
- Editor        → Edit films/actors
- Member        → Standard user (login/register/rate)
```

### Permission Classes

```python
class IsSuperadmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_superuser or
               request.user.groups.filter(name='Superadmin').exists()

class IsAdminOrSuperadmin(BasePermission):
    def has_permission(self, request, view):
        return (request.user.is_superuser or
                request.user.is_staff or
                request.user.groups.filter(name__in=['Admin', 'Superadmin']).exists())
```

---

## 🛠️ Management Commands

### Sync TMDB

```bash
# Sync single actor
python manage.py sync_tmdb 287        # TMDB ID untuk Brad Pitt

# Sync all featured actors (15+ actors)
python manage.py sync_tmdb --all

# With custom min rating
python manage.py sync_tmdb --all --min-rating 8.0
```

### Sync Film Cast

```bash
# Sync cast for all existing films
python manage.py sync_films_cast
```

### Setup RBAC

```bash
# Create default groups and admin user
python manage.py setup_rbac
```

### Change User Role

```bash
# Add user to admin group
python manage.py change_user_role username admin
```

---

## 📦 Deployment

### Docker Deployment

```bash
# Build and run
docker-compose up --build

# Access at http://localhost:8000
```

### Windows (Waitress)

```bash
# Install requirements
pip install -r requirements.txt
pip install waitress

# Run server
waitress-serve --port=8000 --threads=8 --connection-limit=200 config.wsgi:application
```

### Environment Variables (.env)

```ini
DEBUG=False
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=127.0.0.1,localhost,your-domain.com
TMDB_API_KEY=your-tmdb-api-key
YOUTUBE_API_KEY=your-youtube-api-key
```

---

## ⚠️ Pitfalls & Gotchas

### 1. SQLite Database Locking

```python
# ⚠️ MULTITHREADING + SQLITE = ERROR!
# In main_service.py, multithreading is disabled:

for actor in actor_list:  # Serial loop instead
    actor_name, synced, error = sync_single_actor(actor)
```

**Solution:** Gunakan PostgreSQL untuk production atau disable multithreading.

### 2. TMDB Rate Limiting

```python
# TMDB limit: 40 requests per 10 seconds
# Rate limiter handles this automatically
rate_limiter = TMDBRateLimiter(max_requests=40, time_window=10)
```

### 3. Non-Fiction TV Filtering

```python
# Skip: Documentary, News, Reality, Soap, Talk shows
SKIPPED_TV_GENRES = {99, 10763, 10764, 10766, 10767}
```

### 4. Image Auto-Delete Signals

File gambar di-delete otomatis saat model dihapus atau diupdate:

```python
@receiver(post_delete, sender=Film)
def auto_delete_film_poster_on_delete(sender, instance, **kwargs):
    if instance.poster and os.path.isfile(instance.poster.path):
        os.remove(instance.poster.path)
```

### 5. Gunicorn on Windows

```python
# ⚠️ Gunicorn TIDAK support Windows!
# Use Waitress instead for Windows deployment
```

---

## 🎯 Design Patterns

### 1. Mixin Pattern (ViewSet Composition)

FilmViewSet menggunakan multiple mixins untuk memisahkan concerns:

```python
class FilmViewSet(FilmApprovalMixin, FilmActionsMixin, FilmGalleryMixin, FilmViewSetBase):
    """
    Komposisi mixin untuk FilmViewSet
    """
    pass

# Dipecah menjadi:
# - FilmViewSetBase: CRUD + queryset + permissions
# - FilmApprovalMixin: submit_approval, approve, reject
# - FilmActionsMixin: sync, sync_status, stats, similar
# - FilmGalleryMixin: manage_images_post, manage_images_delete
```

### 2. QuerySet Manager Pattern

Custom QuerySet dengan method chaining:

```python
class FilmQuerySet(models.QuerySet):
    def published_only(self):
        return self.filter(status='published')
    
    def search(self, q):
        # ... search logic
    
    def filter_by_genres(self, genre_ids):
        # ... filter logic

# Usage:
films = (Film.objects
    .published_only()
    .filter_by_genres([1, 2])
    .search("action")
    .order_by('-avg_rating'))
```

### 3. Signal Pattern (Auto-Operations)

Django signals untuk auto-update:

```python
# Auto-calculate avg_rating saat Rating dibuat/dihapus
@receiver(post_save, sender=Rating)
def rating_saved(sender, instance, **kwargs):
    update_film_avg_rating(instance.film)

# Auto-delete files saat model dihapus
@receiver(post_delete, sender=Film)
def auto_delete_film_poster_on_delete(sender, instance, **kwargs):
    if instance.poster and os.path.isfile(instance.poster.path):
        os.remove(instance.poster.path)

# Auto-create profile saat User dibuat
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
```

### 4. Facade Pattern (TOPSIS SPK)

```python
class TopsisSPK:
    """Facade untuk sistem rekomendasi TOPSIS"""
    
    @classmethod
    def calculate_scores(cls, candidates, preferences, weights=None):
        return calculate_user_scores(candidates, preferences, weights)
    
    @classmethod
    def calculate_similarity_scores(cls, base_film, candidates):
        return calculate_similarity_scores(base_film, candidates)
```

---

## 📊 Data Flow Diagrams

### User Rating Flow

```
User Rates Film
      │
      ▼
POST /api/ratings/ { score: 8, review: "Great!" }
      │
      ▼
┌─────────────────────────────────────────┐
│         Rating.objects.create()          │
│  - user_id = request.user                │
│  - film_id = film_id                    │
│  - score = 8                            │
│  - review = "Great!"                   │
└─────────────────────────────────────────┘
      │
      ▼
Signal: rating_saved(instance.film)
      │
      ▼
┌─────────────────────────────────────────┐
│    update_film_avg_rating(film)          │
│  - Calculate AVG(score) from ratings     │
│  - Update film.avg_rating                │
│  - Save to database                      │
└─────────────────────────────────────────┘
```

### TMDB Sync Flow

```
Management Command: sync_tmdb
      │
      ▼
TMDBService.sync_multiple_actors()
      │
      ▼
For each actor in FEATURED_ACTORS:
      │
      ├── GET /person/{id}/combined_credits
      │     └── Filter by min_rating
      │
      ├── For each movie in credits:
      │     ├── GET /movie/{id} (full detail)
      │     ├── Extract: runtime, synopsis, studio
      │     ├── Extract: director from crew
      │     ├── Search: trailer via YouTubeService
      │     ├── GET: all cast members (top 100)
      │     │     └── Create/update Actor records
      │     └── Create: Filmography records
      │
      └── rate_limiter.wait_if_needed()
```

---

## 🔧 Troubleshooting

### Database Locked Error

```bash
# If you get "database is locked" error:
# 1. Increase SQLite timeout
DATABASES = {
    'OPTIONS': {'timeout': 20}
}

# 2. Or switch to PostgreSQL for production
```

### TMDB API Errors

```bash
# If API returns 401 Unauthorized:
# Check your TMDB_API_KEY in .env file

# If rate limited (429):
# Wait 10 seconds, the rate limiter handles this

# If no movies found:
# Check min_rating setting (default: 7.0)
python manage.py sync_tmdb --all --min-rating 6.0
```

### Image Not Loading

```bash
# Check MEDIA_ROOT and MEDIA_URL settings
# Ensure ./media/ directory exists and is writable
chmod 755 media/
```

---

## 📚 Additional Documentation

- [Windows Waitress Deployment](../deployment/WINDOWS_WAITRESS_DEPLOYMENT.md) - Panduan deploy di Windows
- [TMDB API Documentation](https://developer.themoviedb.org/docs) - Official TMDB docs
- [TOPSIS Algorithm](https://en.wikipedia.org/wiki/TOPSIS) - Wikipedia explanation
