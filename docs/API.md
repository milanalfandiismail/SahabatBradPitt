# 📡 API Documentation

**Complete REST API reference for SahabatBradPitt project.**

---

## Authentication

All API endpoints require **Token-based authentication** (except public endpoints).

### Get Token
```bash
POST /api/auth/login/
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}

Response:
{
  "token": "abc123def456..."
}
```

### Use Token
```bash
curl -H "Authorization: Token abc123def456..." http://localhost:8000/api/films/
```

---

## Films API

### List Films
```
GET /api/films/
```

**Query Parameters:**
- `search` - Search by title or synopsis
- `genre` - Filter by genre ID (can be comma-separated for multiple: `genre=1,2,3`)
- `year_from` - Filter by minimum year
- `year_to` - Filter by maximum year
- `studio` - Filter by studio ID
- `min_rating` - Filter by minimum rating
- `ordering` - Sort results (e.g., `-popularity`, `-avg_rating`, `title`)
- `status` - Filter by status (admin only: `draft`, `pending_approval`, `published`, `rejected`)

**Example:**
```bash
GET /api/films/?search=brad&genre=1&min_rating=7.0
```

**Response:**
```json
{
  "count": 25,
  "next": "http://localhost:8000/api/films/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "tmdb_id": 550,
      "title": "Fight Club",
      "synopsis": "A ticking-time-bomb insomniac and a slippery soap salesman channel...",
      "release_year": 1999,
      "trailer_url": "https://www.youtube.com/watch?v=qtRKdVHc-cE",
      "poster_path": "/pB8BM7pdSp6B6Ih7QZ429c2O5Pn.jpg",
      "poster": null,
      "duration": 139,
      "avg_rating": 8.8,
      "popularity": 92.5,
      "status": "published",
      "studio_name": "Warner Bros. Pictures",
      "is_tv_series": false,
      "episodes_count": null,
      "genre_display": [
        {"id": 18, "name": "Drama"},
        {"id": 53, "name": "Thriller"}
      ],
      "cast": [
        {
          "actor_id": 287,
          "actor_name": "Brad Pitt",
          "actor_photo": "/m09Y1YfPPeNYYUSHnnVqahkrC1o.jpg",
          "role_name": "Tyler Durden",
          "role_type": "lead",
          "order": 1
        }
      ],
      "images": [
        {
          "id": 1,
          "file_path": "/path/to/image.jpg",
          "image_type": "backdrop"
        }
      ]
    }
  ]
}
```

---

### Get Film Details
```
GET /api/films/{id}/
```

---

### Create Film (Admin Only)
```
POST /api/films/
Authorization: Token YOUR_TOKEN
Content-Type: application/json

{
  "title": "New Film",
  "synopsis": "Film description",
  "release_year": 2024,
  "duration": 120,
  "trailer_url": "https://www.youtube.com/watch?v=...",
  "poster_path": "/path/to/poster.jpg",
  "genre": [1, 2, 3],
  "actors_data": [
    {"actor_id": 287, "role_name": "Lead Actor", "role_type": "lead", "order": 1}
  ]
}
```

**Response:** 201 Created
```json
{
  "id": 100,
  "title": "New Film",
  "status": "published",
  ...
}
```

> **Note:** Non-superadmin users create films with `status: pending_approval`. Superadmins create with `status: published`.

---

### Update Film (Admin Only)
```
PUT /api/films/{id}/
Authorization: Token YOUR_TOKEN
Content-Type: application/json

{
  "title": "Updated Title",
  "synopsis": "Updated description",
  ...
}
```

---

### Delete Film (Admin Only)
```
DELETE /api/films/{id}/
Authorization: Token YOUR_TOKEN
```

---

### Custom Actions

#### Get Film Statistics
```
GET /api/films/stats/
```
```json
{
  "total_films": 45,
  "avg_rating": 7.85,
  "total_duration_minutes": 6420,
  "avg_duration_minutes": 142.67,
  "by_genre": [{"genre__name": "Drama", "count": 30}],
  "by_year": [{"release_year": 2015, "count": 12}],
  "by_status": [{"status": "published", "count": 40}]
}
```

#### Get Similar Films (Content-Based Recommendation)
```
GET /api/films/{id}/similar/
```
```json
[
  {
    "id": 2,
    "title": "Se7en",
    "poster_path": "/6yogjS3nN3v8R7tT5cG6Q3tQ4T.jpg",
    "avg_rating": 8.6,
    "release_year": 1995,
    "duration": 127,
    "topsis_score": 0.8542,
    "reasoning": "Sangat mirip karena disutradarai oleh sutradara yang sama, memiliki banyak pemeran yang sama"
  }
]
```

#### Upload Gallery Image (Admin Only)
```
POST /api/films/{id}/images/
Authorization: Token YOUR_TOKEN
Content-Type: multipart/form-data

file: [image file]
image_type: backdrop  # or 'poster'
```

#### Delete Gallery Image (Admin Only)
```
DELETE /api/films/{id}/images/{image_id}/
Authorization: Token YOUR_TOKEN
```

#### Submit for Approval (Admin Only)
```
POST /api/films/{id}/submit_approval/
Authorization: Token YOUR_TOKEN
```

**Response:**
```json
{
  "message": "Film berhasil disubmit untuk approval",
  "status": "Pending Approval"
}
```

#### Approve Film (Super Admin Only)
```
POST /api/films/{id}/approve/
Authorization: Token YOUR_TOKEN
```

**Response:**
```json
{
  "message": "Film berhasil di-approve dan dipublish",
  "status": "Published",
  "data": {...}
}
```

#### Reject Film (Super Admin Only)
```
POST /api/films/{id}/reject/
Authorization: Token YOUR_TOKEN
Content-Type: application/json

{
  "reason": "Image quality is poor"
}
```

**Response:**
```json
{
  "message": "Film berhasil di-reject",
  "status": "Rejected",
  "reason": "Image quality is poor",
  "data": {...}
}
```

#### Trigger TMDB Sync (Admin Only) - Async Background Task
```
POST /api/films/sync/
Authorization: Token YOUR_TOKEN
Content-Type: application/json

{
  "actor_id": 287,
  "min_rating": 7.0
}
```

**Response:**
```json
{
  "message": "Sinkronisasi berjalan di background.",
  "status": "running"
}
```

#### Check Sync Status
```
GET /api/films/sync_status/
Authorization: Token YOUR_TOKEN
```

**Response (when running):**
```json
{
  "status": "running",
  "actor_id": 287
}
```

**Response (when completed):**
```json
{
  "status": "completed",
  "synced_count": 45,
  "actor_id": 287
}
```

---

## Genres API

### List Genres
```
GET /api/films/genres/
```

**Response:**
```json
{
  "count": 19,
  "results": [
    {"id": 28, "name": "Aksi", "tmdb_genre_id": 28},
    {"id": 12, "name": "Petualangan", "tmdb_genre_id": 12}
  ]
}
```

---

## Actors API

### List Actors
```
GET /api/actors/
```

**Query Parameters:**
- `search` - Search by name or native_name
- `genre` - Filter by specialty genre
- `ordering` - Sort (e.g., `name`, `-birth_year`)

**Response:**
```json
{
  "count": 50,
  "results": [
    {
      "id": 1,
      "tmdb_id": 287,
      "name": "Brad Pitt",
      "native_name": "브래드 피트",
      "bio": "William Bradley Pitt is an American actor and film producer...",
      "birth_year": 1963,
      "photo_path": "/m09Y1YfPPeNYYUSHnnVqahkrC1o.jpg",
      "status": "published",
      "filmography_count": 45
    }
  ]
}
```

---

### Get Actor Details
```
GET /api/actors/{id}/
```

**Response:**
```json
{
  "id": 1,
  "tmdb_id": 287,
  "name": "Brad Pitt (브래드 피트)",
  "native_name": "브래드 피트",
  "bio": "William Bradley Pitt...",
  "birth_year": 1963,
  "birthday": "1963-12-18",
  "place_of_birth": "Shawnee, Oklahoma, USA",
  "gender": 2,
  "known_for_department": "Acting",
  "instagram_id": "bradpitt",
  "twitter_id": null,
  "photo_path": "/m09Y1YfPPeNYYUSHnnVqahkrC1o.jpg",
  "filmographies": [
    {
      "id": 1,
      "film": {"id": 1, "title": "Fight Club", "poster_path": "..."},
      "role": "Tyler Durden",
      "role_type": "lead",
      "order": 1
    }
  ]
}
```

---

### Get Actor's Films
```
GET /api/actors/{id}/films/
```

---

## Auth API

### Register
```
POST /api/auth/register/
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "securepassword123",
  "password_confirm": "securepassword123",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response:** 201 Created
```json
{
  "id": 1,
  "username": "newuser",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe"
}
```

---

### Login
```
POST /api/auth/login/
Content-Type: application/json

{
  "username": "newuser",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "token": "abc123def456..."
}
```

---

### Logout
```
POST /api/auth/logout/
Authorization: Token YOUR_TOKEN
```

---

### Get Current User
```
GET /api/auth/me/
Authorization: Token YOUR_TOKEN
```

**Response:**
```json
{
  "id": 1,
  "username": "newuser",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "is_staff": false,
  "is_superuser": false,
  "groups": ["Member"],
  "profile": {
    "user_id": 1,
    "username": "newuser",
    "email": "user@example.com",
    "display_name": "John Doe",
    "bio": "",
    "avatar": null,
    "avatar_url": null,
    "pref_focus": "balanced",
    "pref_genres": [],
    "pref_genres_data": [],
    "pref_era": "",
    "pref_duration": "",
    "reviews_count": 5,
    "ratings_count": 10,
    "avg_rating": 7.8
  }
}
```

---

### Update Profile
```
PUT /api/auth/me/
Authorization: Token YOUR_TOKEN
Content-Type: application/json

{
  "profile": {
    "display_name": "Updated Name",
    "bio": "Updated bio"
  }
}
```

---

### Get User Preferences
```
GET /api/auth/me/preferences/
Authorization: Token YOUR_TOKEN
```

**Response:**
```json
{
  "pref_focus": "balanced",
  "pref_genres": [1, 2, 3],
  "pref_genres_data": [
    {"id": 1, "name": "Drama"},
    {"id": 2, "name": "Action"}
  ],
  "pref_era": "2010s",
  "pref_duration": "sedang"
}
```

---

### Update User Preferences
```
PUT /api/auth/me/preferences/
Authorization: Token YOUR_TOKEN
Content-Type: application/json

{
  "pref_focus": "rating",
  "pref_genres": [1, 2, 3],
  "pref_era": "2000s",
  "pref_duration": "panjang"
}
```

---

## Ratings API

### Submit Rating
```
POST /api/ratings/
Authorization: Token YOUR_TOKEN
Content-Type: application/json

{
  "film": 1,
  "score": 8,
  "review": "Great film!"
}
```

> **Note:** One rating per user per film. To update, use PUT on the existing rating.

**Response:** 201 Created
```json
{
  "id": 1,
  "film": 1,
  "user": 1,
  "score": 8,
  "review": "Great film!",
  "created_at": "2026-05-28T11:00:00Z"
}
```

---

### Get Film Ratings
```
GET /api/ratings/?film={film_id}
```

---

### Get User Ratings
```
GET /api/ratings/?user={user_id}
```

---

### Get My Ratings
```
GET /api/ratings/my/
Authorization: Token YOUR_TOKEN
```

---

### Update Rating
```
PUT /api/ratings/{id}/
Authorization: Token YOUR_TOKEN
Content-Type: application/json

{
  "score": 9,
  "review": "Even better on second watch!"
}
```

---

### Delete Rating
```
DELETE /api/ratings/{id}/
Authorization: Token YOUR_TOKEN
```

---

## Watchlist API

### Get Watchlist
```
GET /api/ratings/watchlist/
Authorization: Token YOUR_TOKEN (optional for public)
```

**Query Parameters:**
- `user` - Filter by user ID

---

### Add to Watchlist
```
POST /api/ratings/watchlist/
Authorization: Token YOUR_TOKEN
Content-Type: application/json

{
  "film": 1
}
```

**Response:** 201 Created
```json
{
  "id": 1,
  "user": 1,
  "film": 1,
  "added_at": "2026-05-28T11:00:00Z"
}
```

---

### Remove from Watchlist
```
DELETE /api/ratings/watchlist/{id}/
Authorization: Token YOUR_TOKEN
```

---

## Recommendations API

### Get Recommendations (POST Method - TOPSIS)
```
POST /api/recommendations/
Authorization: Token YOUR_TOKEN (optional for anonymous)
Content-Type: application/json

{
  "focus": "balanced",
  "genres": [1, 2, 3],
  "era": "2010s",
  "duration": "sedang"
}
```

**Focus Options:**
- `rating` - Prioritize high-rated films
- `popular` - Prioritize popular films
- `genre` - Prioritize genre match
- `balanced` - Balanced across all criteria

**Era Options:**
- `klasik` - Before 1990
- `90s` - 1990-1999
- `2000s` - 2000-2009
- `2010s` - 2010-2019
- `terbaru` - 2020 and later

**Duration Options:**
- `pendek` - Under 100 minutes
- `sedang` - 100-140 minutes
- `panjang` - Over 140 minutes

**Response:**
```json
{
  "message": "Berhasil menghitung rekomendasi hibrida dari 45 kandidat film.",
  "results": [
    {
      "id": 1,
      "title": "Inception",
      "poster_path": "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
      "avg_rating": 8.8,
      "release_year": 2010,
      "duration": 148,
      "topsis_score": 0.8542,
      "reasoning": "Cocok karena ratingnya yang sangat tinggi, sangat sesuai dengan genre pilihan"
    }
  ]
}
```

> **Note:** If user is authenticated and has saved preferences in profile, those will be used as fallback for missing fields.

---

## Festivals API

### List Festivals
```
GET /api/festivals/
```

**Response:**
```json
{
  "count": 5,
  "results": [
    {
      "id": 1,
      "name": "Festival de Cannes",
      "native_name": "Festival de Cannes",
      "country": "France",
      "city": "Cannes",
      "founded_year": 1946,
      "website": "https://www.festival-cannes.com"
    }
  ]
}
```

---

### Get Festival Details
```
GET /api/festivals/{id}/
```

---

### List Studios
```
GET /api/festivals/studios/
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request parameters"
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
  "detail": "You do not have permission to perform this action."
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

### 409 Conflict (Rating Exists)
```json
{
  "error": "Anda sudah pernah memberikan ulasan pada film ini. Silakan edit ulasan yang sudah ada."
}
```

---

## Rate Limiting

- **TMDB API**: 40 requests per 10 seconds
- **Application**: No strict rate limit, but use caching where possible

---

## Pagination

Default page size: 12 items (configurable in REST_FRAMEWORK settings)

```bash
GET /api/films/?page=2
GET /api/films/?page_size=20
```

---

## Filtering Examples

### Search Films
```bash
GET /api/films/?search=brad
```

### Filter by Genre (Multiple)
```bash
GET /api/films/?genre=1,2,3
```

### Filter by Year Range
```bash
GET /api/films/?year_from=2010&year_to=2020
```

### Filter by Rating
```bash
GET /api/films/?min_rating=7.5
```

### Filter by Studio
```bash
GET /api/films/?studio=1
```

### Combine Filters
```bash
GET /api/films/?search=brad&genre=1&year_from=2010&min_rating=7.0&ordering=-popularity
```

---

## Sorting

```bash
GET /api/films/?ordering=-popularity      # Most popular first
GET /api/films/?ordering=title           # Alphabetical
GET /api/films/?ordering=-avg_rating      # Highest rated
GET /api/films/?ordering=-release_year    # Newest first
GET /api/films/?ordering=release_year     # Oldest first
```

---

**Last Updated**: 2026-05-28
**Version**: 2.0.0
