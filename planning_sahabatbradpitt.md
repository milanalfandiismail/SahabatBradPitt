# Planning Proyek — SAHABATBRADPITT

## Deskripsi Proyek
Aplikasi web database film berbasis Django dengan fitur eksplorasi film, direktori aktor, sistem rating & ulasan, manajemen akun pengguna, direktori festival dan studio, serta rekomendasi film berbasis AI (Sistem Pakar + SPK). Data film disinkronkan dari TMDB/OMDb API.

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Backend | Python 3.11 + Django |
| ORM | Django ORM + makemigrations |
| Database | PostgreSQL (prod) / SQLite (dev) |
| Autentikasi | Django Auth (built-in) |
| External API | TMDB API / OMDb API |
| Frontend | HTML5 + CSS3 + JavaScript (Vanilla) |
| API Docs | Django REST Framework Browsable API |
| Deployment | Railway / Fly.io / PythonAnywhere |
| Version Control | GitHub / GitLab |

---

## Arsitektur — Clean MVC

```
Browser
  └── HTTP Request
        └── URL Router (urls.py)
              └── View / Controller (views.py)
                    ├── Django ORM → PostgreSQL
                    └── Service Layer → TMDB/OMDb API
                          └── JSON Response → HTML/JS (Frontend)
```

Setiap lapisan punya tanggung jawab tunggal dan tidak saling bergantung langsung.

---

## Struktur Folder

```
sahabatbradpitt/
├── config/
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   └── wsgi.py
├── apps/
│   ├── films/
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── services.py        # TMDB sync logic
│   ├── actors/
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   └── urls.py
│   ├── users/
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   └── urls.py
│   ├── ratings/
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   └── urls.py
│   └── festivals/
│       ├── models.py
│       ├── views.py
│       ├── serializers.py
│       └── urls.py
│   └── recommendations/
│       ├── engine.py          # Sistem Pakar (rule-based)
│       ├── spk.py             # SPK TOPSIS (scoring & ranking)
│       ├── views.py
│       └── urls.py
├── static/
│   ├── css/
│   ├── js/
│   └── images/
├── templates/
│   ├── base.html
│   ├── films/
│   ├── actors/
│   ├── users/
│   ├── festivals/
│   └── recommendations/
├── manage.py
├── requirements.txt
└── .env
```

---

## Model Database

### Film
```python
class Film(models.Model):
    tmdb_id       = models.IntegerField(unique=True, null=True)
    title         = models.CharField(max_length=255)
    synopsis      = models.TextField(blank=True)
    release_year  = models.IntegerField(null=True)
    genre         = models.ManyToManyField('Genre')
    director      = models.ForeignKey('Actor', on_delete=models.SET_NULL, null=True)
    trailer_url   = models.URLField(blank=True)
    poster        = models.ImageField(upload_to='posters/', blank=True)
    studio        = models.ForeignKey('Studio', on_delete=models.SET_NULL, null=True, blank=True)
    duration      = models.IntegerField(null=True, blank=True)  # dalam menit
    popularity    = models.FloatField(default=0)
    avg_rating    = models.FloatField(default=0)
    created_at    = models.DateTimeField(auto_now_add=True)
```

### Actor (Aktor / Sutradara)
```python
class Actor(models.Model):
    tmdb_id       = models.IntegerField(unique=True, null=True)
    name          = models.CharField(max_length=255)
    bio           = models.TextField(blank=True)
    birth_year    = models.IntegerField(null=True)
    photo         = models.ImageField(upload_to='actors/', blank=True)
    genre_spec    = models.ManyToManyField('Genre', blank=True)
```

### Filmografi (relasi Actor ↔ Film)
```python
class Filmography(models.Model):
    actor         = models.ForeignKey(Actor, on_delete=models.CASCADE)
    film          = models.ForeignKey(Film, on_delete=models.CASCADE)
    role          = models.CharField(max_length=255)
```

### UserProfile
```python
class UserProfile(models.Model):
    user          = models.OneToOneField(User, on_delete=models.CASCADE)
    avatar        = models.ImageField(upload_to='avatars/', blank=True)
    display_name  = models.CharField(max_length=100, blank=True)
    bio           = models.TextField(blank=True)
```

### Rating & Ulasan
```python
class Rating(models.Model):
    user          = models.ForeignKey(User, on_delete=models.CASCADE)
    film          = models.ForeignKey(Film, on_delete=models.CASCADE)
    score         = models.IntegerField()           # 1–10
    review        = models.TextField(blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'film')
```

### Festival
```python
class Festival(models.Model):
    name          = models.CharField(max_length=255)
    country       = models.CharField(max_length=100)
    category      = models.CharField(max_length=100)
    films         = models.ManyToManyField(Film, blank=True)
```

### Studio
```python
class Studio(models.Model):
    name          = models.CharField(max_length=255)
    country       = models.CharField(max_length=100)
    films         = models.ManyToManyField(Film, blank=True)
```

### Genre
```python
class Genre(models.Model):
    name          = models.CharField(max_length=100, unique=True)
```

---

## Fitur & Endpoint API

### Fitur 1 — Database & Eksplorasi Film
| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/films/` | List film, support filter genre/tahun/rating/popularitas |
| GET | `/api/films/<id>/` | Detail film: sinopsis, cast, trailer |
| GET | `/api/films/search/?q=` | Pencarian real-time |
| POST | `/api/films/sync/` | Trigger sinkronisasi dari TMDB (admin only) |

### Fitur 2 — Database Performers & Filmografi
| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/actors/` | List aktor/aktris/sutradara, filter genre & era |
| GET | `/api/actors/<id>/` | Profil + filmografi lengkap |

### Fitur 3 — Rating & Ulasan
| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/ratings/?film=<id>` | Semua rating untuk film tertentu |
| POST | `/api/ratings/` | Buat rating baru (auth required) |
| PUT | `/api/ratings/<id>/` | Edit ulasan sendiri |
| DELETE | `/api/ratings/<id>/` | Hapus ulasan sendiri |

### Fitur 4 — Manajemen Akun
| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/api/auth/register/` | Daftar akun baru |
| POST | `/api/auth/login/` | Login, dapat session/token |
| POST | `/api/auth/logout/` | Logout |
| GET | `/api/users/me/` | Profil + statistik personal |
| PUT | `/api/users/me/` | Edit avatar, nama, bio |

**Response `/api/users/me/`:**
```json
{
  "id": 1,
  "username": "johndoe",
  "display_name": "John Doe",
  "avatar": "/media/avatars/johndoe.jpg",
  "bio": "Pecinta film horror",
  "stats": {
    "total_ratings": 24,
    "total_reviews": 10,
    "avg_score_given": 7.4,
    "last_recommendation": "2024-01-10"
  }
}
```

### Fitur 5 — Festival & Studio
| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/festivals/` | List festival, filter negara & kategori |
| GET | `/api/festivals/<id>/` | Detail festival + film terkait |
| GET | `/api/studios/` | List studio produksi |
| GET | `/api/studios/<id>/` | Detail studio + katalog film |

### Fitur 6 — Rekomendasi Film (AI)
| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/api/recommendations/` | Kirim preferensi user, terima top 5 rekomendasi |

**Input:**
```json
{
  "mood": "santai",
  "genres": ["komedi", "animasi"],
  "era": "2010s",
  "duration": "pendek",
  "min_rating": 7
}
```

**Output:**
```json
{
  "results": [
    {
      "film_id": 12,
      "title": "Judul Film",
      "score": 0.91,
      "reason": "Cocok karena genre komedi, rating tinggi, dan rilis 2015"
    }
  ]
}
```

---

## Alur Autentikasi

```
POST /api/auth/register/  →  buat User + UserProfile
POST /api/auth/login/     →  Django session / DRF Token
                              ↓
Header: Authorization: Token <token>
                              ↓
Middleware cek token → lanjut ke view
```

Endpoint yang butuh auth: semua `/api/ratings/` (POST/PUT/DELETE) dan `/api/users/me/`.

---

## Sinkronisasi TMDB

```
Management command: python manage.py sync_tmdb
  └── Panggil TMDB API → /movie/popular, /person/<id>
        └── Mapping field:
              title, synopsis, release_year, genre, popularity,
              trailer_url, poster, duration (runtime), studio
        └── Upsert ke model Film, Actor, Genre, Studio
              └── Simpan ke PostgreSQL
```

Field `tmdb_id` dipakai sebagai identifier unik agar tidak duplikat saat sync ulang.

---

## AI Engine — Rekomendasi Film

### Alur Sistem
```
User input (mood, genre, era, durasi, min_rating)
  │
  ▼
[Sistem Pakar — engine.py]
  Rule IF-THEN untuk filter kandidat film
  Contoh rule:
    IF mood == "santai" AND genre == "komedi" → tambah film komedi ringan
    IF era == "2010s" → filter release_year 2010–2019
    IF min_rating >= 7 → filter avg_rating >= 7
  │
  ▼
Kandidat film (sudah difilter)
  │
  ▼
[SPK TOPSIS — spk.py]
  Kriteria & bobot:
    - avg_rating    → bobot 40%
    - popularity    → bobot 30%
    - kesesuaian genre → bobot 20%
    - kesesuaian era   → bobot 10%
  Hitung skor TOPSIS tiap kandidat
  │
  ▼
Top 5 film + skor + alasan rekomendasi
```

### Sistem Pakar — Rule Table
| Kondisi Input | Aksi Filter |
|---|---|
| mood = "santai" | genre in [komedi, animasi, keluarga] |
| mood = "tegang" | genre in [thriller, horor, aksi] |
| mood = "sedih" | genre in [drama, romance] |
| mood = "semangat" | genre in [aksi, petualangan, sci-fi] |
| era = "klasik" | release_year < 1990 |
| era = "90s" | release_year 1990–1999 |
| era = "2000s" | release_year 2000–2009 |
| era = "2010s" | release_year 2010–2019 |
| era = "terbaru" | release_year >= 2020 |
| durasi = "pendek" | duration < 100 menit |
| durasi = "panjang" | duration >= 140 menit |

### SPK TOPSIS — Kriteria
| Kriteria | Bobot | Tipe |
|---|---|---|
| avg_rating | 40% | Benefit (makin tinggi makin baik) |
| popularity | 30% | Benefit |
| kesesuaian genre | 20% | Benefit |
| kesesuaian era | 10% | Benefit |

### Model Tambahan
```python
# Tidak butuh model baru — engine bekerja di atas data Film yang sudah ada
# Opsional: simpan history rekomendasi
class RecommendationLog(models.Model):
    user       = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    input_data = models.JSONField()      # preferensi user
    results    = models.JSONField()      # top 5 output
    created_at = models.DateTimeField(auto_now_add=True)
```

---

## Dependencies (requirements.txt)

```
Django>=4.2
djangorestframework
psycopg2-binary
Pillow
python-decouple
requests
django-cors-headers
numpy                  # untuk kalkulasi TOPSIS
```

---

## Catatan Deployment

- Gunakan `.env` untuk semua secret (DB url, TMDB API key, Django secret key)
- Static files: `collectstatic` + WhiteNoise atau S3
- Database production: PostgreSQL (Railway/Fly.io sudah menyediakan)
- Pastikan `DEBUG=False` dan `ALLOWED_HOSTS` diset di production
