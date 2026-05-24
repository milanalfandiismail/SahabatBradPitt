# Fase 19 — Pagination, Active Navbar, & Watchlist Tab

## Background

Tiga fitur UX yang saling independen:
1. **Pagination + Lazy Loading** — film_list & actor_list stuck di satu halaman (tidak ada `next` cursor)
2. **Active Navbar** — semua link selalu dimunculkan dengan style seragam tanpa menandai halaman aktif
3. **Watchlist Tab** — profil user hanya punya satu tab "Film yang Saya Ulas", belum ada watchlist

---

## Analisis State Saat Ini

| Aspek | Kondisi Sekarang |
|---|---|
| DRF Pagination | **Belum ada** — tidak ada `DEFAULT_PAGINATION_CLASS` di settings, semua endpoint return array flat tanpa `next`/`previous` |
| film_list.html | Fetch satu kali semua data, tidak ada paging |
| actor_list.html | Fetch satu kali semua data |
| Navbar active | Hardcoded `border-b-2 border-[#715A5A]` hanya di link Home |
| Watchlist model | **Belum ada** — perlu dibuat dari nol |
| Profile tabs | Satu section "Film yang Saya Ulas", tidak ada tab navigation |

---

## Open Questions

> [!IMPORTANT]
> **Ukuran page untuk pagination**: Berapa film per "batch" lazy load?
> - Film list: **12** per batch (seperti Netflix)
> - Actor list: **20** per batch (grid lebih padat)
>
> Kalau tidak ada preferensi, saya akan pakai angka ini.

> [!NOTE]
> **Watchlist: simpan di model baru atau di tabel Rating?**
> Saya rekomendasikan **model baru** `Watchlist` di app `ratings` (karena berhubungan dengan interaksi user-film), bukan menambah field ke Rating yang sudah punya struktur tersendiri.

---

## Proposed Changes

### 1. Pagination — Backend

#### [MODIFY] [settings.py](file:///e:/GIT/SahabatBradPitt/sahabatbradpitt/settings.py)
Tambahkan `REST_FRAMEWORK` config dengan `DEFAULT_PAGINATION_CLASS` menggunakan `PageNumberPagination` dan `PAGE_SIZE = 12`.

```python
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 12,
}
```

> [!WARNING]
> Ini akan mengubah **semua endpoint** dari array flat menjadi `{ count, next, previous, results: [...] }`. Template yang sudah ada sudah pakai `data.results || data` jadi aman, tapi perlu dicek ulang di `film_detail.html` (fetch cast) dan `home.html`.

---

### 2. Pagination — Frontend (Lazy Loading / Infinite Scroll)

Pendekatan: **IntersectionObserver** — saat user scroll mendekati bawah halaman, trigger fetch halaman berikutnya otomatis. Lebih smooth dibanding tombol "Load More".

#### [MODIFY] [film_list.html](file:///e:/GIT/SahabatBradPitt/templates/film_list.html)
- Tambah variabel `currentPage`, `totalCount`, `isLoading`, `hasMore`
- `fetchFilms(page)` — fetch dengan `?page=N`, append ke grid (bukan replace)
- Reset ke page 1 ketika filter berubah
- `IntersectionObserver` target: sentinel `<div id="load-more-sentinel">` di bawah grid
- Tampilkan count total: `"Menampilkan X dari Y film"`
- Tampilkan spinner kecil saat load berikutnya (bukan replace seluruh grid)

#### [MODIFY] [actor_list.html](file:///e:/GIT/SahabatBradPitt/templates/actor_list.html)
- Sama dengan film_list, tapi PAGE_SIZE actor lebih banyak (20)
- Tambah search input sederhana di actor list (bonus)
- `IntersectionObserver` untuk infinite scroll

---

### 3. Active Navbar

#### [MODIFY] [base.html](file:///e:/GIT/SahabatBradPitt/templates/base.html)
Ganti 4 link navbar yang hardcoded menjadi dinamis via JavaScript:

```js
// Di dalam <script> di base.html
const path = window.location.pathname;
const navLinks = {
    '/': 'nav-home',
    '/movies/': 'nav-movies',
    '/actors/': 'nav-actors',
    '/recommendations/': 'nav-recommendations',
};
// Logic: exact match untuk '/', startsWith untuk yang lain
```

Style aktif: `text-white border-b-2 border-[#715A5A] font-semibold`
Style inaktif: `text-[#D3DAD9]/60 hover:text-white`

---

### 4. Watchlist — Backend

#### [NEW] Migration di `apps/ratings/`
Model `Watchlist`:
```python
class Watchlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='watchlist')
    film = models.ForeignKey(Film, on_delete=models.CASCADE, related_name='watchlisted_by')
    added_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ('user', 'film')
        ordering = ['-added_at']
```

#### [MODIFY] [apps/ratings/models.py](file:///e:/GIT/SahabatBradPitt/apps/ratings/models.py)
Tambahkan class `Watchlist`.

#### [NEW] WatchlistSerializer di `apps/ratings/serializers.py`
Expose: `id`, `film`, `film_title`, `poster_path`, `release_year`, `avg_rating`, `added_at`.

#### [MODIFY] [apps/ratings/views.py](file:///e:/GIT/SahabatBradPitt/apps/ratings/views.py)
Tambahkan `WatchlistViewSet`:
- `GET /api/watchlist/?user=<id>` — list watchlist user
- `POST /api/watchlist/` — tambah film ke watchlist (auth required)
- `DELETE /api/watchlist/<id>/` — hapus dari watchlist (owner only)

#### [MODIFY] `urls.py` (root)
Register `WatchlistViewSet` di router.

---

### 5. Watchlist + Tab — Frontend

#### [MODIFY] [profile.html](file:///e:/GIT/SahabatBradPitt/templates/profile.html)

**Tab Navigation** di bawah stats panel:
```
[ Ulasan Saya ]  [ Watchlist ]
```
- Tab aktif: border-bottom merah + teks putih
- Tab switch: JS toggle `hidden` antar section

**Watchlist Section** (baru, hidden by default):
- Grid `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5`
- Setiap card: poster, judul, rating, tombol ❌ hapus dari watchlist
- Empty state: icon `bookmark_off` + pesan "Belum ada film di watchlist"

**Tambahan kecil di film_detail.html:**
- Tombol **"+ Watchlist"** di samping tombol rating/review
- Jika sudah ada di watchlist: tampil "✓ Di Watchlist" (toggle)

---

## Urutan Eksekusi

```
1. settings.py → tambah REST_FRAMEWORK pagination config
2. apps/ratings/models.py → tambah Watchlist model
3. makemigrations ratings + migrate
4. apps/ratings/serializers.py → WatchlistSerializer
5. apps/ratings/views.py → WatchlistViewSet
6. urls.py → register watchlist router
7. base.html → active navbar JS
8. film_list.html → lazy load / IntersectionObserver
9. actor_list.html → lazy load / IntersectionObserver
10. profile.html → tab UI + watchlist section
11. (bonus) film_detail.html → tombol "+ Watchlist"
```

---

## Verification Plan

### Automated
- `python manage.py check` — 0 issues
- `python manage.py makemigrations --check` — no pending migrations

### Manual
- Buka `/movies/` → scroll ke bawah → batch ke-2 muncul otomatis
- Buka `/actors/` → scroll → infinite scroll berjalan
- Navigasi ke `/movies/` → link "Movies" aktif (bold + underline)
- Navigasi ke `/actors/` → link "Actors" aktif
- Navigasi ke `/` → link "Home" aktif
- Profile → klik tab "Watchlist" → konten berubah
- Dari film detail → klik "+ Watchlist" → muncul di tab watchlist user
