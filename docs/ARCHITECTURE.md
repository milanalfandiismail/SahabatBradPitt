# 🏗️ Architecture Documentation

**System design, components, and data flow for SahabatBradPitt project.**

---

## System Architecture Overview

```mermaid
graph TB
    Client["🌐 Client<br/>(Browser)"]
    Frontend["📱 Frontend<br/>(HTML/CSS/JS)"]
    Django["🐍 Django<br/>(REST API)"]
    DB[(💾 Database<br/>(SQLite/PostgreSQL))]
    TMDB["🎬 TMDB API"]
    YouTube["▶️ YouTube API"]
    Cache["⚡ Cache<br/>(Redis/Memory)"]
    
    Client -->|HTTP/AJAX| Frontend
    Frontend -->|REST API| Django
    Django -->|Query| DB
    Django -->|Fetch Data| TMDB
    Django -->|Search Trailer| YouTube
    Django -->|Cache| Cache
    Cache -->|Return| Django
```

---

## Component Architecture

```mermaid
graph LR
    subgraph Frontend["Frontend Layer"]
        HTML["HTML Templates"]
        CSS["CSS Styling"]
        JS["JavaScript Logic"]
    end
    
    subgraph API["API Layer"]
        Auth["Authentication"]
        Endpoints["REST Endpoints"]
        Serializers["Serializers"]
    end
    
    subgraph Business["Business Logic"]
        Services["Services"]
        Models["Models"]
        Validators["Validators"]
    end
    
    subgraph Data["Data Layer"]
        ORM["Django ORM"]
        DB["Database"]
        Cache["Cache"]
    end
    
    Frontend -->|API Calls| API
    API -->|Process| Business
    Business -->|Query| Data
    Data -->|Return| Business
    Business -->|Response| API
    API -->|JSON| Frontend
```

---

## Module Structure

```
SahabatBradPitt/
│
├── apps/
│   ├── films/                    # Film management
│   │   ├── models.py            # Film, FilmImage models
│   │   ├── views.py             # FilmViewSet
│   │   ├── serializers.py       # Film serializers
│   │   ├── services.py          # TMDB sync service
│   │   ├── youtube_service.py   # YouTube trailer service
│   │   └── urls.py              # Film endpoints
│   │
│   ├── actors/                   # Actor management
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   └── urls.py
│   │
│   ├── users/                    # User authentication
│   │   ├── models.py            # User profile
│   │   ├── views.py             # Auth endpoints
│   │   ├── serializers.py
│   │   └── urls.py
│   │
│   ├── ratings/                  # Rating system
│   │   ├── models.py            # Rating model
│   │   ├── views.py
│   │   ├── serializers.py
│   │   └── urls.py
│   │
│   ├── festivals/                # Festival management
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   └── urls.py
│   │
│   └── recommendations/          # Recommendation engine
│       ├── models.py
│       ├── views.py
│       ├── spk.py               # TOPSIS algorithm
│       └── urls.py
│
├── config/
│   ├── settings/
│   │   ├── base.py              # Base settings
│   │   ├── development.py       # Dev settings
│   │   └── production.py        # Prod settings
│   ├── urls.py                  # URL routing
│   └── wsgi.py                  # WSGI config
│
├── templates/                    # HTML templates
│   ├── base.html
│   ├── home.html
│   ├── film_detail.html
│   ├── film_list.html
│   ├── actor_detail.html
│   ├── profile.html
│   └── ...
│
├── static/                       # Static files
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── main.js
│
├── docs/                         # Documentation
│   ├── README.md
│   ├── TECH_STACK.md
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DATABASE.md
│   ├── GUIDES.md
│   └── DEPLOYMENT.md
│
└── manage.py                     # Django CLI
```

---

## Data Flow Diagrams

### Film Detail Page Flow

```mermaid
sequenceDiagram
    participant User as User<br/>(Browser)
    participant Frontend as Frontend<br/>(HTML/JS)
    participant API as Django API
    participant DB as Database
    participant TMDB as TMDB API
    
    User->>Frontend: Click film link
    Frontend->>API: GET /api/films/{id}/
    API->>DB: Query film data
    DB-->>API: Return film + images
    API-->>Frontend: JSON response
    Frontend->>Frontend: Render film details
    Frontend->>Frontend: Load gallery images
    User->>Frontend: Click gallery image
    Frontend->>Frontend: Open lightbox modal
    User->>Frontend: Click play trailer
    Frontend->>Frontend: Extract video ID
    Frontend->>Frontend: Load YouTube embed
```

### Trailer Search Flow

```mermaid
sequenceDiagram
    participant Sync as Sync Service
    participant TMDB as TMDB API
    participant YouTube as YouTube API
    participant Cache as Cache
    participant DB as Database
    
    Sync->>TMDB: Fetch film details
    TMDB-->>Sync: Return film + videos
    Sync->>Sync: Extract TMDB trailer
    alt TMDB has trailer
        Sync->>DB: Save trailer URL
    else No TMDB trailer
        Sync->>YouTube: Search trailer
        YouTube-->>Sync: Return video ID
        Sync->>Cache: Cache result (30 days)
        Sync->>DB: Save trailer URL
    end
```

### Approval Workflow

```mermaid
stateDiagram-v2
    [*] --> Draft: Admin creates film
    Draft --> PendingApproval: Admin submits
    PendingApproval --> Published: Super admin approves
    PendingApproval --> Rejected: Super admin rejects
    Rejected --> Draft: Admin can resubmit
    Published --> [*]
    
    note right of Draft
        Only admin can see
    end note
    
    note right of PendingApproval
        Waiting for super admin
    end note
    
    note right of Published
        Visible to public
    end note
```

---

## Database Schema Overview

```mermaid
erDiagram
    FILM ||--o{ FILMIMAGE : has
    FILM ||--o{ RATING : has
    FILM }o--|| STUDIO : "belongs to"
    FILM }o--o{ GENRE : "has many"
    FILM }o--o{ ACTOR : "features"
    USER ||--o{ RATING : writes
    USER ||--o{ PROFILE : has
    
    FILM {
        int id PK
        int tmdb_id UK
        string title
        text synopsis
        int release_year
        string trailer_url
        string poster_path
        string status
        datetime created_at
    }
    
    FILMIMAGE {
        int id PK
        int film_id FK
        string file_path
        string image_type
    }
    
    RATING {
        int id PK
        int film_id FK
        int user_id FK
        int score
        text review
        datetime created_at
    }
    
    USER {
        int id PK
        string username UK
        string email UK
        string password
        datetime created_at
    }
    
    PROFILE {
        int id PK
        int user_id FK
        string display_name
        text bio
        string avatar_url
    }
    
    GENRE {
        int id PK
        string name UK
        int tmdb_genre_id
    }
    
    ACTOR {
        int id PK
        int tmdb_id UK
        string name
        string biography
        string profile_path
    }
    
    STUDIO {
        int id PK
        string name
        string country
    }
```

---

## API Layer Architecture

```mermaid
graph TB
    Request["HTTP Request"]
    Router["URL Router"]
    Auth["Authentication"]
    Permission["Permission Check"]
    ViewSet["ViewSet"]
    Serializer["Serializer"]
    Service["Service Layer"]
    Model["Model/ORM"]
    DB["Database"]
    Response["HTTP Response"]
    
    Request -->|Route| Router
    Router -->|Dispatch| ViewSet
    ViewSet -->|Check| Auth
    Auth -->|Verify| Permission
    Permission -->|Validate| Serializer
    Serializer -->|Process| Service
    Service -->|Query| Model
    Model -->|Execute| DB
    DB -->|Return| Model
    Model -->|Return| Service
    Service -->|Return| Serializer
    Serializer -->|Serialize| ViewSet
    ViewSet -->|Return| Response
```

---

## Caching Strategy

```mermaid
graph LR
    Request["API Request"]
    CacheCheck{"Cache<br/>Hit?"}
    CacheGet["Get from Cache"]
    DBQuery["Query Database"]
    CacheSet["Set Cache<br/>(30 days)"]
    Response["Return Response"]
    
    Request -->|Check| CacheCheck
    CacheCheck -->|Yes| CacheGet
    CacheCheck -->|No| DBQuery
    CacheGet --> Response
    DBQuery --> CacheSet
    CacheSet --> Response
```

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant User as User
    participant Frontend as Frontend
    participant API as Django API
    participant DB as Database
    
    User->>Frontend: Enter credentials
    Frontend->>API: POST /api/auth/login/
    API->>DB: Verify credentials
    DB-->>API: User found
    API->>API: Generate token
    API-->>Frontend: Return token
    Frontend->>Frontend: Store token
    Frontend->>API: GET /api/films/ (with token)
    API->>API: Verify token
    API-->>Frontend: Return data
```

---

## Deployment Architecture

```mermaid
graph TB
    Client["🌐 Client"]
    CDN["📦 CDN<br/>(Static Files)"]
    LB["⚖️ Load Balancer"]
    Web1["🐍 Web Server 1"]
    Web2["🐍 Web Server 2"]
    Cache["⚡ Redis Cache"]
    DB["💾 PostgreSQL"]
    
    Client -->|HTTPS| CDN
    Client -->|HTTPS| LB
    LB -->|Route| Web1
    LB -->|Route| Web2
    Web1 -->|Query| Cache
    Web2 -->|Query| Cache
    Web1 -->|Query| DB
    Web2 -->|Query| DB
    Cache -->|Return| Web1
    Cache -->|Return| Web2
    DB -->|Return| Web1
    DB -->|Return| Web2
```

---

## Key Design Patterns

### 1. **ViewSet Pattern**
```python
class FilmViewSet(viewsets.ModelViewSet):
    queryset = Film.objects.all()
    serializer_class = FilmSerializer
    permission_classes = [IsAdminUser]
```

### 2. **Service Layer Pattern**
```python
class TMDBService:
    def sync_brad_pitt_movies(self, limit=15):
        # Business logic here
        pass
```

### 3. **Serializer Pattern**
```python
class FilmSerializer(serializers.ModelSerializer):
    class Meta:
        model = Film
        fields = ['id', 'title', 'synopsis', ...]
```

### 4. **Permission Pattern**
```python
def get_permissions(self):
    if self.action in ['list', 'retrieve']:
        return [permissions.AllowAny()]
    return [permissions.IsAdminUser()]
```

---

## Performance Considerations

### Database Optimization
- ✅ Indexed queries on frequently searched fields
- ✅ Select_related for foreign keys
- ✅ Prefetch_related for many-to-many
- ✅ Query result caching

### API Optimization
- ✅ Pagination for large datasets
- ✅ Filtering and searching
- ✅ Response compression
- ✅ Rate limiting

### Frontend Optimization
- ✅ Lazy loading images
- ✅ Minified CSS/JavaScript
- ✅ Responsive images
- ✅ Browser caching

---

## Security Architecture

```mermaid
graph TB
    Request["HTTP Request"]
    HTTPS["🔒 HTTPS/TLS"]
    CORS["🔐 CORS Check"]
    Auth["🔑 Token Auth"]
    Validation["✓ Input Validation"]
    Sanitization["🧹 Sanitization"]
    DB["💾 Parameterized Queries"]
    Response["HTTP Response"]
    
    Request -->|Encrypt| HTTPS
    HTTPS -->|Check| CORS
    CORS -->|Verify| Auth
    Auth -->|Validate| Validation
    Validation -->|Clean| Sanitization
    Sanitization -->|Execute| DB
    DB -->|Return| Response
```

---

**Last Updated**: 2026-05-25  
**Version**: 1.0.0
