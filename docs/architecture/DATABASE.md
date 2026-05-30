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
| `tmdb_poster` | VARCHAR(255) | | TMDB poster path |
| `local_poster` | IMAGE | NULL | Local uploaded poster |
| `duration` | INTEGER | NULL | Duration in minutes |
| `popularity` | FLOAT | DEFAULT 0.0 | TMDB popularity score |
| `avg_rating` | FLOAT | DEFAULT 0.0 | Average user rating |
| `status` | VARCHAR(20) | DEFAULT 'published' | draft/pending_approval/published/rejected |
| `rejection_reason` | TEXT | | Reason for rejection |
| `is_local_edit` | BOOLEAN | DEFAULT FALSE | Has local modifications |
| `studio_id` | INTEGER | FK (Studio) | Studio reference |
| `created_by_id` | INTEGER | FK (User), NULL | Admin who created |
| `updated_by_id` | INTEGER | FK (User), NULL | Admin who updated |
| `is_tv_series` | BOOLEAN | DEFAULT FALSE | Is TV series |
| `episodes_count` | INTEGER | NULL | Number of episodes (for TV series) |
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
| `name` | VARCHAR(255) | NOT NULL | Actor name (with native format) |
| `native_name` | VARCHAR(255) | DEFAULT '' | Native name for non-Latin actors |
| `bio` | TEXT | | Actor biography |
| `birth_year` | INTEGER | NULL | Birth year |
| `birthday` | DATE | NULL | Birth date |
| `deathday` | DATE | NULL | Death date |
| `place_of_birth` | VARCHAR(255) | | Birth place |
| `gender` | INTEGER | NULL | 0=Not specified, 1=Female, 2=Male, 3=Non-binary |
| `known_for_department` | VARCHAR(255) | | Department (Acting, Directing, etc.) |
| `tmdb_photo` | VARCHAR(255) | | TMDB profile image path |
| `local_photo` | IMAGE | NULL | Local uploaded photo |
| `instagram_id` | VARCHAR(255) | NULL | Instagram username |
| `twitter_id` | VARCHAR(255) | NULL | Twitter/X username |
| `facebook_id` | VARCHAR(255) | NULL | Facebook username |
| `tiktok_id` | VARCHAR(255) | NULL | TikTok username |
| `status` | VARCHAR(20) | DEFAULT 'published' | draft/pending_approval/published/rejected |
| `rejection_reason` | TEXT | | Reason for rejection |
| `is_local_edit` | BOOLEAN | DEFAULT FALSE | Has local modifications |
| `created_by_id` | INTEGER | FK (User), NULL | Admin who created |
| `updated_by_id` | INTEGER | FK (User), NULL | Admin who updated |
| `created_at` | DATETIME | AUTO | Creation timestamp |
| `updated_at` | DATETIME | AUTO | Update timestamp |

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

### UserProfile
**Purpose**: Store user profile and preferences

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Unique identifier |
| `user_id` | INTEGER | FK (User), UNIQUE | User reference (1:1) |
| `avatar` | IMAGE | NULL | Uploaded avatar image |
| `avatar_uploaded_at` | DATETIME | NULL | Last avatar upload time |
| `display_name` | VARCHAR(100) | | Display name |
| `bio` | TEXT | | User biography |
| `pref_focus` | VARCHAR(20) | DEFAULT 'balanced' | rating/popular/genre/balanced |
| `pref_genres` | M2M (Genre) | | Favorite genres (ManyToMany) |
| `pref_era` | VARCHAR(20) | | klasisk/90s/2000s/2010s/terbaru |
| `pref_duration` | VARCHAR(20) | | pendek/sedang/panjang |
| `created_at` | DATETIME | AUTO | Creation timestamp |
| `updated_at` | DATETIME | AUTO | Update timestamp |

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

### Filmography
**Purpose**: Link actors to films (many-to-many with role info)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Unique identifier |
| `actor_id` | INTEGER | FK (Actor), NOT NULL | Actor reference |
| `film_id` | INTEGER | FK (Film), NOT NULL | Film reference |
| `role` | VARCHAR(255) | DEFAULT 'Actor' | Character name |
| `role_type` | VARCHAR(20) | DEFAULT 'supporting' | lead/supporting/cameo/director/producer/writer/other |
| `order` | INTEGER | DEFAULT 0 | Sort order in credits |

**Unique Constraint**: `(actor_id, film_id, role)`

---

### Watchlist
**Purpose**: Store user's watchlist items

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Unique identifier |
| `user_id` | INTEGER | FK (User), NOT NULL | User reference |
| `film_id` | INTEGER | FK (Film), NOT NULL | Film reference |
| `added_at` | DATETIME | AUTO | Time added to watchlist |

**Unique Constraint**: `(user_id, film_id)`

---

### Festival
**Purpose**: Store film festival information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Unique identifier |
| `name` | VARCHAR(255) | NOT NULL | Festival name |
| `native_name` | VARCHAR(255) | DEFAULT '' | Native name |
| `country` | VARCHAR(100) | DEFAULT '' | Country |
| `city` | VARCHAR(100) | DEFAULT '' | City |
| `founded_year` | INTEGER | NULL | Year founded |
| `description` | TEXT | DEFAULT '' | Festival description |
| `tmdb_logo` | VARCHAR(255) | DEFAULT '' | TMDB logo path |
| `local_logo` | IMAGE | NULL | Local uploaded logo |
| `website` | VARCHAR(255) | DEFAULT '' | Official website |
| `tmdb_id` | INTEGER | UNIQUE, NULL | TMDB festival ID |
| `is_active` | BOOLEAN | DEFAULT TRUE | Is festival still active |
| `category` | VARCHAR(100) | DEFAULT '' | Category (backwards compat) |

---

### FestivalAward
**Purpose**: Store festival award nominations and wins

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Unique identifier |
| `festival_id` | INTEGER | FK (Festival), NOT NULL | Festival reference |
| `film_id` | INTEGER | FK (Film), NULL | Film reference |
| `actor_id` | INTEGER | FK (Actor), NULL | Actor reference |
| `category` | VARCHAR(255) | NOT NULL | Award category |
| `year` | INTEGER | NOT NULL | Award year |
| `award_type` | VARCHAR(50) | DEFAULT 'winner' | winner/nominee |

---

### RecommendationLog
**Purpose**: Log recommendation transactions for analytics

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Unique identifier |
| `user_id` | INTEGER | FK (User), NULL | User reference (NULL for anonymous) |
| `input_data` | JSON | NOT NULL | User preferences input |
| `results` | JSON | NOT NULL | TOPSIS calculation results |
| `created_at` | DATETIME | AUTO | Creation timestamp |

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

## SQLite to PostgreSQL Migration (Multi-DB ORM Sync)

Untuk memindahkan data dari SQLite (`db.sqlite3`) langsung ke PostgreSQL target pada branch `main-postgresql`, proyek ini menggunakan script **`auto_migrate.py`** berbasis Django Multi-DB ORM Sync.

### Fitur Utama Script
- **ORM Direct Sync**: Memindahkan data antar database tanpa menulis/membaca file perantara JSON (`dumpdata` / `loaddata`) sehingga sangat cepat (~7 detik untuk 90.000 data).
- **Proses Batching**: Memecah pemindahan data besar (seperti `Filmography` dengan 47.000 data dan `Actor` dengan 30.000 data) ke dalam batch kecil (2.000 data) guna membatasi penggunaan RAM.
- **Proteksi Branch Defensif**: Memvalidasi apakah engine database default di Django settings memang PostgreSQL sebelum memproses data, guna mencegah terhapusnya database SQLite lokal di branch `main`.
- **Pembersihan Database Target (Idempotent)**: Menghapus data lama secara otomatis di PostgreSQL sebelum migrasi baru dimulai agar proses aman dijalankan berulang kali.
- **Penonaktifan Signals**: Memutuskan seluruh sinyal `pre_save`/`post_save`/`delete` untuk menjaga keutuhan file media fisik (poster/foto/logo) dan menghindari penambahan record ganda secara otomatis.
- **Pemotongan String Otomatis**: Memotong string yang melebihi kapasitas `max_length` model secara dinamis guna menghindari crash `StringDataRightTruncation` pada PostgreSQL.
- **Penyelarasan Sequence**: Menjalankan SQL `sqlsequencereset` otomatis untuk menyelaraskan nilai serial sequence agar pembuatan data baru setelah migrasi tidak bentrok.

### Cara Menjalankan
Pastikan Anda berada di branch `main-postgresql` yang memiliki konfigurasi PostgreSQL di `development.py`, lalu jalankan:
```bash
python auto_migrate.py
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

**Last Updated**: 2026-05-28
**Version**: 2.0.0
