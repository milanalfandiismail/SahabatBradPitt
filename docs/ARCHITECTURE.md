# 🏗️ Architecture Documentation

**System design dan struktur project SahabatBradPitt untuk development.**

---

## Overview

```
┌─────────────────────────────────────────────────────────┐
│                     BROWSER                              │
│              (HTML/CSS/JS Templates)                    │
└─────────────────────┬─────────────────────────────────────┘
                      │ HTTP
                      ▼
┌─────────────────────────────────────────────────────────┐
│                   DJANGO                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │   Views     │  │    API      │  │   Admin     │       │
│  │  (SSR)      │  │  (DRF)      │  │  Panel      │       │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘       │
│         │               │                               │
│         └───────────────┼───────────────────────────┐   │
│                         ▼                               │   │
│  ┌─────────────────────────────────────────────────┐     │   │
│  │              MODELS LAYER                        │     │   │
│  │  Film │ Actor │ Rating │ User │ Genre │ etc.   │     │   │
│  └───────────────────────┬─────────────────────────┘     │   │
│                          │                               │   │
│         ┌────────────────┴────────────────┐              │   │
│         ▼                                 ▼              │   │
│  ┌─────────────┐                 ┌─────────────┐        │   │
│  │   SQLite    │                 │  TMDB API   │        │   │
│  │   (local)   │                 │  (external) │        │   │
│  └─────────────┘                 └─────────────┘        │   │
└─────────────────────────────────────────────────────────┘
```

---

## Apps Structure

```
apps/
├── films/              # Film management
│   ├── models.py      # Film, Genre, FilmImage
│   ├── views.py       # FilmViewSet (CRUD + custom actions)
│   ├── serializers.py  # DRF serializers
│   ├── urls.py        # /api/films/
│   └── services/
│       ├── main_service.py    # TMDB sync engine
│       ├── limiter.py         # Rate limiter
│       └── parser.py          # Data parser
│
├── actors/             # Actor management
│   ├── models.py      # Actor, Filmography
│   ├── views.py
│   └── urls.py        # /api/actors/
│
├── ratings/            # Rating & Watchlist
│   ├── models.py      # Rating, Watchlist
│   ├── views.py
│   └── urls.py        # /api/ratings/
│
├── festivals/          # Festival & Studio
│   ├── models.py      # Festival, Studio, FestivalAward
│   └── views.py
│
├── recommendations/    # AI Recommendation Engine
│   ├── views.py       # RecommendationAPIView
│   ├── engine.py      # ExpertSystemFilter (kandidat filter)
│   ├── spk.py         # TOPSIS Facade
│   ├── topsis_user.py      # User-based scoring
│   └── topsis_similarity.py # Content-based similarity
│
└── users/              # Auth & Profile
    ├── models.py      # UserProfile (with preferences)
    ├── views.py       # Login, Register, Profile APIs
    ├── views_html.py  # SSR login/signup/profile pages
    ├── permissions.py  # IsAdminOrSuperadmin, IsSuperadmin
    └── urls.py        # /api/auth/
```

---

## Data Models

### Core Models

```
Film
├── id (PK)
├── tmdb_id (unique)
├── title
├── synopsis
├── release_year
├── poster_path (TMDB)
├── poster (local upload)
├── duration
├── popularity (TMDB)
├── avg_rating (calculated)
├── status (draft/pending_approval/published/rejected)
├── is_tv_series
├── episodes_count
├── studio (FK)
└── genre (M2M)

Actor
├── id (PK)
├── tmdb_id (unique)
├── name
├── native_name (Korean/Chinese/Japanese)
├── bio
├── birth_year
├── photo_path
└── filmographies (reverse M2M via Filmography)

Filmography (junction table)
├── actor (FK)
├── film (FK)
├── role (character name)
├── role_type (lead/supporting/director/etc)
└── order

Rating
├── user (FK)
├── film (FK)
├── score (1-10)
└── review

Watchlist
├── user (FK)
└── film (FK)
```

### Model Relationships

```
User 1──1 UserProfile
User 1──M Rating
User 1──M Watchlist
Film 1──M Rating
Film 1──M Watchlist
Film M──M Genre (via Film_Genre)
Film M──M Actor (via Filmography)
Film 1──M FilmImage
Film 1──1 Studio
```

---

## Request Flow

### 1. API Request (REST)

```
GET /api/films/?genre=1&min_rating=7.0
    │
    ▼
URL Router → FilmViewSet.list()
    │
    ▼
QuerySet: Film.objects.filter_by_genres([1]).filter_by_min_rating(7.0)
    │
    ▼
Serializer: FilmSerializer(films, many=True)
    │
    ▼
JSON Response
```

### 2. SSR Request (HTML Pages)

```
GET /profile/
    │
    ▼
URL Router → profile_html_view()
    │
    ▼
@login_required decorator → Check auth → Redirect if not logged in
    │
    ▼
render(request, 'auth/profile.html', context)
    │
    ▼
HTML Response
```

### 3. TMDB Sync Flow

```
python manage.py sync_tmdb 287
    │
    ▼
TMDBService.sync_multiple_actors()
    │
    ▼
For each actor:
    │
    ├── GET /person/{id}/combined_credits
    ├── For each movie:
    │   ├── GET /movie/{id} (detail + videos)
    │   ├── Create/Update Film
    │   ├── Create/Update Actor
    │   ├── Link Filmography
    │   └── Search YouTube trailer
    │
    └── rate_limiter.wait_if_needed()
```

---

## TOPSIS Algorithm

### User-Based Recommendations

```
Input: preferences (focus, genres, era, duration, user_id)

Step 1: ExpertSystemFilter.get_candidates()
        → Filter films by era, duration, genres

Step 2: calculate_user_scores(candidates, preferences)
        → Build decision matrix X[m,6]
        → Normalize: R = X / sqrt(sum(X²))
        → Weight: V = R × weights
        → A+ = max(V), A- = min(V)
        → D+ = distance to A+, D- = distance to A-
        → Score = D- / (D+ + D-)

Output: Top N films sorted by score
```

### Content-Based Similarity

```
Input: base_film, candidate_films

Step 1: Extract features from base_film
        → Genres, Synopsis words, Cast, Director, Studio

Step 2: For each candidate:
        → Calculate similarity for each feature
        → Genre: Jaccard similarity
        → Synopsis: Word overlap
        → Cast: Actor intersection
        → Director: Binary match
        → Studio: Binary match

Step 3: Apply TOPSIS with custom weights
        → [0.25, 0.20, 0.10, 0.15, 0.15, 0.15]

Output: Similar films ranked by score
```

---

## Permission System

### Permission Levels

```
Public (Anyone)
├── GET / (homepage)
├── GET /movies/ (film list)
├── GET /api/films/ (read only)

Authenticated (Logged in)
├── POST /api/ratings/
├── GET /profile/
├── POST /api/recommendations/

Admin (is_staff=True)
├── POST/PUT/DELETE /api/films/
├── POST /api/films/sync/
├── GET /admin-films/

Superadmin (is_superuser=True)
├── POST /api/films/{id}/approve/
├── POST /api/films/{id}/reject/
├── Full Django Admin access
```

### Decorators Used

```python
@login_required          # Django - for SSR views
@permission_classes      # DRF - for API views
IsAdminOrSuperadmin      # Custom - for admin actions
IsSuperadmin             # Custom - for superadmin only
```

---

## Service Layer

### TMDBService (films/services/main_service.py)

```python
class TMDBService:
    def sync_actor_movies(actor_id, min_rating=7.0):
        """Sync all movies for one actor"""
        
    def sync_multiple_actors(actor_list, min_rating=7.0):
        """Sync multiple actors (serial to avoid DB lock)"""
        
    def _format_latin_native_name(name, original_name, ...):
        """Handle Korean/Chinese/Japanese names"""
        
    def _get_protected_actor_names(tmdb_id, name, native_name):
        """Protect existing actor names from overwrite"""
```

### YouTubeTrailerService (films/youtube_service.py)

```python
class YouTubeTrailerService:
    def search_trailer(title, year, tmdb_videos):
        """Find trailer with fallback chain:
        1. TMDB videos (free)
        2. YouTube API (needs key)
        3. Scraper fallback (no key needed)
        """
```

---

## Configuration

### Settings Files

```
config/settings/
├── base.py       # Shared settings (all environments)
│                 # - INSTALLED_APPS
│                 # - MIDDLEWARE
│                 # - REST_FRAMEWORK
│                 # - TMDB settings
│
├── development.py  # Local dev
│                   # - DEBUG=True
│                   # - SQLite
│                   # - CORS_ALLOW_ALL_ORIGINS=True
│
└── production.py    # Production (belum ada)
                    # - DEBUG=False
                    # - PostgreSQL
                    # - Tight ALLOWED_HOSTS
```

### Environment Variables (.env)

```
DEBUG=True                  # Dev only
SECRET_KEY=xxx              # Required
ALLOWED_HOSTS=127.0.0.1,localhost
TMDB_API_KEY=xxx           # Required for sync
YOUTUBE_API_KEY=xxx        # Optional (fallback scraper exists)
```

---

## Key Files

| File | Purpose |
|------|---------|
| `config/urls.py` | Main URL routing |
| `apps/films/models.py` | Film, Genre, FilmImage |
| `apps/films/views.py` | FilmViewSet + mixins |
| `apps/recommendations/topsis_user.py` | User recommendations |
| `apps/recommendations/topsis_similarity.py` | Similar films |
| `apps/films/services/main_service.py` | TMDB sync (1000+ lines) |

---

## Development Workflow

### 1. Model Changes
```bash
python manage.py makemigrations
python manage.py migrate
```

### 2. Add New Endpoint
```python
# apps/films/views.py
@action(detail=True, methods=['get'])
def my_action(self, request, pk=None):
    film = self.get_object()
    # do something
    return Response(...)
```

### 3. Sync TMDB Data
```bash
python manage.py sync_tmdb --all
```

---

## Common Patterns

### QuerySet Chain
```python
films = (Film.objects
    .filter(status='published')
    .filter_by_genres([1, 2])
    .filter_by_year_range(2010, 2020)
    .search('action')
    .order_by('-avg_rating'))
```

### ViewSet with Custom Actions
```python
class FilmViewSet(FilmApprovalMixin, FilmActionsMixin, FilmGalleryMixin, FilmViewSetBase):
    """Komposisi mixin untuk separation of concerns"""
    pass
```

### Signal Auto-Update
```python
@receiver(post_save, sender=Rating)
def rating_saved(sender, instance, **kwargs):
    # Auto-calculate avg_rating
```

---

**Last Updated**: 2026-05-29
**Version**: 2.0.0