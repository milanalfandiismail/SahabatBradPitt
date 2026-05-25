# 💾 Database Documentation

**Database schema, relationships, and data models for SahabatBradPitt project.**

---

## Database Overview

### Development
- **Type**: SQLite
- **File**: `db.sqlite3`
- **Configuration**: Zero setup required

### Production
- **Type**: PostgreSQL
- **Connection**: Via environment variable `DATABASE_URL`

---

## Entity Relationship Diagram

```
Film (1) ──── (M) FilmImage
Film (1) ──── (M) Rating
Film (M) ──── (M) Genre
Film (M) ──── (M) Actor
Film (M) ──── (1) Studio
User (1) ──── (1) Profile
User (1) ──── (M) Rating
```

---

## Core Tables

### Film
**Purpose**: Store film information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Unique identifier |
| `tmdb_id` | INTEGER | UNIQUE, NULL | TMDB API ID |
| `title` | VARCHAR(255) | NOT NULL | Film title |
| `synopsis` | TEXT | | Film description |
| `release_year` | INTEGER | NULL | Release year |
| `trailer_url` | VARCHAR(500) | | YouTube trailer URL |
| `poster_path` | VARCHAR(255) | | TMDB poster path |
| `duration` | INTEGER | NULL | Duration in minutes |
| `popularity` | FLOAT | DEFAULT 0.0 | TMDB popularity score |
| `avg_rating` | FLOAT | DEFAULT 0.0 | Average user rating |
| `status` | VARCHAR(20) | DEFAULT 'published' | draft/pending/published/rejected |
| `rejection_reason` | TEXT | | Reason for rejection |
| `is_local_edit` | BOOLEAN | DEFAULT FALSE | Has local modifications |
| `studio_id` | INTEGER | FK | Studio reference |
| `created_by_id` | INTEGER | FK, NULL | Admin who created |
| `updated_by_id` | INTEGER | FK, NULL | Admin who updated |
| `created_at` | DATETIME | AUTO | Creation timestamp |
| `updated_at` | DATETIME | AUTO | Update timestamp |

**Indexes**:
- `tmdb_id` (UNIQUE)
- `status`
- `created_at`

---

### FilmImage
**Purpose**: Store film gallery images

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Unique identifier |
| `film_id` | INTEGER | FK, NOT NULL | Film reference |
| `file_path` | VARCHAR(255) | NOT NULL | TMDB image path |
| `image_type` | VARCHAR(50) | DEFAULT 'backdrop' | backdrop/poster |

**Unique Constraint**: `(film_id, file_path)`

**Indexes**:
- `film_id`
- `(film_id, file_path)` (UNIQUE)

---

### Genre
**Purpose**: Store film genres

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Unique identifier |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | Genre name |
| `tmdb_genre_id` | INTEGER | UNIQUE, NULL | TMDB genre ID |

---

### Actor
**Purpose**: Store actor information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Unique identifier |
| `tmdb_id` | INTEGER | UNIQUE, NOT NULL | TMDB actor ID |
| `name` | VARCHAR(255) | NOT NULL | Actor name |
| `biography` | TEXT | | Actor biography |
| `profile_path` | VARCHAR(255) | | TMDB profile image |

---

### Studio
**Purpose**: Store production studios

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Unique identifier |
| `name` | VARCHAR(255) | NOT NULL | Studio name |
| `country` | VARCHAR(100) | | Country of origin |

---

### User
**Purpose**: Store user accounts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Unique identifier |
| `username` | VARCHAR(150) | UNIQUE, NOT NULL | Username |
| `email` | VARCHAR(254) | UNIQUE, NOT NULL | Email address |
| `password` | VARCHAR(128) | NOT NULL | Hashed password |
| `is_staff` | BOOLEAN | DEFAULT FALSE | Is admin |
| `is_superuser` | BOOLEAN | DEFAULT FALSE | Is super admin |
| `is_active` | BOOLEAN | DEFAULT TRUE | Account active |
| `created_at` | DATETIME | AUTO | Creation timestamp |

---

### Profile
**Purpose**: Store user profile information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Unique identifier |
| `user_id` | INTEGER | FK, UNIQUE | User reference |
| `display_name` | VARCHAR(255) | | Display name |
| `bio` | TEXT | | User biography |
| `avatar_url` | VARCHAR(500) | | Avatar image URL |

---

### Rating
**Purpose**: Store user film ratings and reviews

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Unique identifier |
| `film_id` | INTEGER | FK, NOT NULL | Film reference |
| `user_id` | INTEGER | FK, NOT NULL | User reference |
| `score` | INTEGER | NOT NULL | Rating 1-10 |
| `review` | TEXT | | Review text |
| `created_at` | DATETIME | AUTO | Creation timestamp |

**Unique Constraint**: `(film_id, user_id)` - One rating per user per film

**Indexes**:
- `film_id`
- `user_id`
- `(film_id, user_id)` (UNIQUE)

---

### Token
**Purpose**: Store API authentication tokens

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `key` | VARCHAR(40) | PRIMARY KEY | Token string |
| `user_id` | INTEGER | FK, UNIQUE | User reference |
| `created` | DATETIME | AUTO | Creation timestamp |

---

## Many-to-Many Relationships

### Film_Genre
**Purpose**: Link films to genres

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER | PRIMARY KEY |
| `film_id` | INTEGER | FK |
| `genre_id` | INTEGER | FK |

**Unique Constraint**: `(film_id, genre_id)`

---

### Film_Actor
**Purpose**: Link films to actors

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER | PRIMARY KEY |
| `film_id` | INTEGER | FK |
| `actor_id` | INTEGER | FK |

**Unique Constraint**: `(film_id, actor_id)`

---

## Data Types Reference

| Type | SQLite | PostgreSQL | Description |
|------|--------|------------|-------------|
| `INTEGER` | INTEGER | INTEGER | Whole numbers |
| `VARCHAR(n)` | TEXT | VARCHAR(n) | Text up to n chars |
| `TEXT` | TEXT | TEXT | Large text |
| `FLOAT` | REAL | FLOAT | Decimal numbers |
| `BOOLEAN` | INTEGER (0/1) | BOOLEAN | True/False |
| `DATETIME` | DATETIME | TIMESTAMP | Date and time |

---

## Query Examples

### Get Film with All Related Data
```sql
SELECT 
    f.*,
    GROUP_CONCAT(g.name) as genres,
    GROUP_CONCAT(a.name) as actors,
    COUNT(r.id) as rating_count,
    AVG(r.score) as avg_score
FROM Film f
LEFT JOIN Film_Genre fg ON f.id = fg.film_id
LEFT JOIN Genre g ON fg.genre_id = g.id
LEFT JOIN Film_Actor fa ON f.id = fa.film_id
LEFT JOIN Actor a ON fa.actor_id = a.id
LEFT JOIN Rating r ON f.id = r.film_id
WHERE f.id = 1
GROUP BY f.id;
```

### Get Top Rated Films
```sql
SELECT f.*, AVG(r.score) as avg_rating
FROM Film f
LEFT JOIN Rating r ON f.id = r.film_id
WHERE f.status = 'published'
GROUP BY f.id
ORDER BY avg_rating DESC
LIMIT 10;
```

### Get User's Ratings
```sql
SELECT f.title, r.score, r.review, r.created_at
FROM Rating r
JOIN Film f ON r.film_id = f.id
WHERE r.user_id = 1
ORDER BY r.created_at DESC;
```

### Get Films by Genre
```sql
SELECT DISTINCT f.*
FROM Film f
JOIN Film_Genre fg ON f.id = fg.film_id
JOIN Genre g ON fg.genre_id = g.id
WHERE g.name = 'Drama'
AND f.status = 'published'
ORDER BY f.popularity DESC;
```

---

## Migrations

### Current Migrations
```
0001_initial.py          - Initial schema
0002_*                   - Gallery unique constraint
0003_*                   - Approval workflow fields
0004_*                   - Additional fields
```

### Running Migrations
```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Show migration status
python manage.py showmigrations

# Rollback migration
python manage.py migrate films 0002
```

---

## Backup & Restore

### SQLite Backup
```bash
# Backup
cp db.sqlite3 db.sqlite3.backup

# Restore
cp db.sqlite3.backup db.sqlite3
```

### PostgreSQL Backup
```bash
# Backup
pg_dump dbname > backup.sql

# Restore
psql dbname < backup.sql
```

---

## Performance Optimization

### Indexes
- ✅ `Film.tmdb_id` - For TMDB sync lookups
- ✅ `Film.status` - For filtering published films
- ✅ `FilmImage.(film_id, file_path)` - For unique constraint
- ✅ `Rating.(film_id, user_id)` - For unique constraint

### Query Optimization
```python
# ❌ Bad - N+1 queries
films = Film.objects.all()
for film in films:
    print(film.genre.all())  # Query per film

# ✅ Good - Single query
films = Film.objects.prefetch_related('genre')
for film in films:
    print(film.genre.all())  # No additional queries
```

---

## Data Integrity

### Constraints
- ✅ Foreign key constraints
- ✅ Unique constraints
- ✅ NOT NULL constraints
- ✅ Check constraints (status values)

### Validation
- ✅ Model-level validation
- ✅ Serializer-level validation
- ✅ Database-level constraints

---

## Monitoring

### Database Size
```bash
# SQLite
ls -lh db.sqlite3

# PostgreSQL
SELECT pg_size_pretty(pg_database_size('dbname'));
```

### Query Performance
```python
from django.db import connection
from django.test.utils import CaptureQueriesContext

with CaptureQueriesContext(connection) as context:
    films = Film.objects.all()
    print(f"Queries: {len(context)}")
```

---

**Last Updated**: 2026-05-25  
**Version**: 1.0.0
