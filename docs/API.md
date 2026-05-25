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
- `genre` - Filter by genre ID
- `year_from` - Filter by minimum year
- `year_to` - Filter by maximum year
- `studio` - Filter by studio ID
- `min_rating` - Filter by minimum rating
- `ordering` - Sort results

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
      "title": "The Producers",
      "synopsis": "...",
      "release_year": 2015,
      "trailer_url": "https://www.youtube.com/watch?v=...",
      "poster_path": "/path/to/poster.jpg",
      "duration": 120,
      "avg_rating": 8.5,
      "status": "published",
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

**Response:**
```json
{
  "id": 1,
  "title": "The Producers",
  "synopsis": "...",
  "release_year": 2015,
  "genre": [
    {"id": 1, "name": "Drama"}
  ],
  "trailer_url": "https://www.youtube.com/watch?v=...",
  "poster_path": "/path/to/poster.jpg",
  "studio": {
    "id": 1,
    "name": "Studio Name"
  },
  "duration": 120,
  "popularity": 85.5,
  "avg_rating": 8.5,
  "status": "published",
  "images": [...]
}
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
  "genre": [1, 2, 3]
}
```

**Response:** 201 Created
```json
{
  "id": 100,
  "title": "New Film",
  "status": "draft",
  ...
}
```

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

### Submit for Approval (Admin Only)
```
POST /api/films/{id}/submit-approval/
Authorization: Token YOUR_TOKEN
```

**Response:**
```json
{
  "message": "Film berhasil disubmit untuk approval",
  "status": "Pending Approval"
}
```

---

### Approve Film (Super Admin Only)
```
POST /api/films/{id}/approve/
Authorization: Token YOUR_TOKEN
```

**Response:**
```json
{
  "message": "Film berhasil di-approve dan dipublish",
  "status": "Published"
}
```

---

### Reject Film (Super Admin Only)
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
  "reason": "Image quality is poor"
}
```

---

### Get Similar Films
```
GET /api/films/{id}/similar/
```

**Response:**
```json
[
  {
    "id": 2,
    "title": "Similar Film",
    "similarity_score": 0.85,
    ...
  }
]
```

---

### Sync Films from TMDB (Admin Only)
```
POST /api/films/sync/
Authorization: Token YOUR_TOKEN
Content-Type: application/json

{
  "limit": 15
}
```

**Response:**
```json
{
  "message": "Sinkronisasi berhasil diselesaikan.",
  "synced_count": 15,
  "mocked": false
}
```

---

## Actors API

### List Actors
```
GET /api/actors/
```

**Response:**
```json
{
  "count": 50,
  "results": [
    {
      "id": 1,
      "name": "Brad Pitt",
      "biography": "...",
      "profile_path": "/path/to/profile.jpg",
      "tmdb_id": 287
    }
  ]
}
```

---

### Get Actor Details
```
GET /api/actors/{id}/
```

---

## Users API

### Register
```
POST /api/auth/register/
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:** 201 Created
```json
{
  "id": 1,
  "username": "newuser",
  "email": "user@example.com",
  "token": "abc123def456..."
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
  "profile": {
    "display_name": "New User",
    "bio": "User biography",
    "avatar_url": "/path/to/avatar.jpg"
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

**Response:** 201 Created
```json
{
  "id": 1,
  "film": 1,
  "user": 1,
  "score": 8,
  "review": "Great film!",
  "created_at": "2026-05-25T11:00:00Z"
}
```

---

### Get Film Ratings
```
GET /api/ratings/?film={film_id}
```

**Response:**
```json
{
  "count": 10,
  "results": [
    {
      "id": 1,
      "film": 1,
      "user": {
        "id": 1,
        "username": "user1"
      },
      "score": 8,
      "review": "Great film!",
      "created_at": "2026-05-25T11:00:00Z"
    }
  ]
}
```

---

## Recommendations API

### Get Recommendations
```
GET /api/recommendations/?preferences=genre:1,era:2010s,duration:long
Authorization: Token YOUR_TOKEN
```

**Response:**
```json
[
  {
    "id": 1,
    "title": "Recommended Film",
    "similarity_score": 0.92,
    "reason": "Similar genre and era"
  }
]
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request parameters",
  "details": {
    "field": ["Error message"]
  }
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

### 500 Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## Rate Limiting

- **Limit**: 1000 requests per hour per user
- **Header**: `X-RateLimit-Remaining`

---

## Pagination

Default page size: 12 items

```bash
GET /api/films/?page=2&page_size=20
```

---

## Filtering Examples

### Search Films
```bash
GET /api/films/?search=brad
```

### Filter by Genre
```bash
GET /api/films/?genre=1
```

### Filter by Year Range
```bash
GET /api/films/?year_from=2010&year_to=2020
```

### Filter by Rating
```bash
GET /api/films/?min_rating=7.5
```

### Combine Filters
```bash
GET /api/films/?search=brad&genre=1&year_from=2010&min_rating=7.0
```

---

## Sorting

```bash
GET /api/films/?ordering=-popularity
GET /api/films/?ordering=title
GET /api/films/?ordering=-avg_rating
```

---

## API Versioning

Current API version: **v1**

All endpoints use: `/api/v1/...`

---

## Webhooks (Future)

Planned webhook events:
- `film.created`
- `film.updated`
- `rating.submitted`
- `recommendation.generated`

---

**Last Updated**: 2026-05-25  
**Version**: 1.0.0
