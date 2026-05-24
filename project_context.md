# Konteks Proyek (Project Context) — SAHABATBRADPITT

Berkas ini berfungsi sebagai dokumen referensi utama yang menjelaskan arsitektur, skema basis data, alur bisnis, serta sistem keamanan dari aplikasi web database film **SAHABATBRADPITT**.

---

## 1. Ikhtisar & Arsitektur Utama

Aplikasi ini dibangun menggunakan arsitektur **Clean MVC** menggunakan framework **Django** dan **Django REST Framework (DRF)**.

```
                  +-----------------------------------+
                  |          HTTP Request             |
                  +-----------------------------------+
                                    |
                                    v
                  +-----------------------------------+
                  |      URL Router (config/urls.py)  |
                  +-----------------------------------+
                                    |
                                    v
                  +-----------------------------------+
                  |     REST Views / ViewSets         |
                  +-----------------------------------+
                   /                |                \
                  /                 |                 \
                 v                  v                  v
    +------------------+  +-------------------+  +-------------------+
    |    Sistem Pakar  |  |    TOPSIS SPK     |  |    TMDB Service   |
    |   (Rule Filter)  |  | (Matrix Ranking)  |  |  (TMDB Sync API)  |
    +------------------+  +-------------------+  +-------------------+
                 \                  |                  /
                  \                 |                 /
                   v                v                v
                  +-----------------------------------+
                  |      Database (Django ORM)        |
                  +-----------------------------------+
```

Setiap lapisan dirancang secara modular dan terisolasi di dalam paket `apps/` untuk kemudahan pengembangan di masa depan.

---

## 2. Skema & Relasi Basis Data (Models)

Seluruh entitas database dirancang secara optimal menggunakan Django ORM:

*   **`Genre` (films.Genre):** Menyimpan daftar genre resmi beserta `tmdb_genre_id` sebagai kunci pemetaan data luar.
*   **`Film` (films.Film):** Menyimpan data detail film. Poster disimpan dalam bentuk path teks (`poster_path`) yang hemat disk, serta memiliki relasi `ForeignKey` dengan `Studio` dan `ManyToManyField` dengan `Genre`.
*   **`Actor` (actors.Actor):** Profil pemain/sutradara, menyimpan bio, tahun lahir, dan foto.
*   **`Filmography` (actors.Filmography):** Tabel perantara komposit unik antara `Actor` ↔ `Film` yang memetakan peranan fisik (misal: "Aktor Utama", "Sutradara").
*   **`UserProfile` (users.UserProfile):** Profil tambahan pengguna (display_name, bio, avatar_path) yang otomatis terbuat via signals saat akun user didaftarkan.
*   **`Rating` (ratings.Rating):** Tabel ulasan pengguna dengan skor integer (1-10) yang unik per user-film. Dilengkapi signal otomatis untuk menghitung ulang rata-rata rating film (`avg_rating`).
*   **`Studio` & `Festival` (festivals):** Direktori pendukung pendistribusian film dan pameran penghargaan.
*   **`RecommendationLog` (recommendations.RecommendationLog):** Pencatatan riwayat kuesioner preferensi pengguna beserta hasil Top 5 TOPSIS.

---

## 3. Integrasi & Sinkronisasi TMDB API

Sistem ini didesain memiliki integrasi langsung dengan **TMDB API** untuk mempopulerkan basis data lokal secara riil dengan katalog film berkualitas tinggi dari multiple aktor Hollywood terkenal:

*   **Peta Alur Kerja Layanan (`apps/films/services.py`):**
    *   Mengakses endpoint `/genre/movie/list` untuk melaraskan seluruh daftar genre resmi.
    *   Mengakses endpoint `/person/{actor_id}/movie_credits` untuk menarik daftar filmografi aktor berdasarkan TMDB Person ID.
    *   Mengakses endpoint detail `/movie/{id}` secara rekursif untuk menyelaraskan durasi menit (*runtime*), daftar kru sutradara asli, dan perusahaan studio produksi resmi.
    *   **Filter Rating Otomatis:** Hanya film dengan rating TMDB >= threshold (default: 7.0) yang disimpan ke database untuk menjaga kualitas katalog. Film yang belum memiliki rating (seperti film mendatang/unreleased dengan `vote_count = 0`, contohnya *Project Hail Mary* yang dibintangi Ryan Gosling) tidak di-skip agar data film mendatang tetap tersinkronisasi.
    *   **Rate Limiting Protection:** Delay 0.5 detik antar request untuk menghindari TMDB API rate limiting.

*   **Arsitektur Multi-Actor Sync:**
    *   **Generic Actor Sync:** Method `sync_actor_movies(actor_id, actor_name, min_rating)` dapat menarik filmografi aktor manapun dari TMDB.
    *   **Batch Processing:** Method `sync_multiple_actors(actor_list, min_rating)` memproses multiple aktor sekaligus dengan logging progress real-time.
    *   **Actor Configuration:** File `apps/films/actor_config.py` berisi daftar 14 aktor Hollywood terkenal (Brad Pitt, Leonardo DiCaprio, Tom Cruise, Robert Downey Jr., Christian Bale, Matt Damon, Denzel Washington, Morgan Freeman, Scarlett Johansson, Natalie Portman, Cate Blanchett, Meryl Streep, Jennifer Lawrence, Ryan Gosling) dengan TMDB ID dan bio masing-masing.
    *   **Backward Compatibility:** Method `sync_brad_pitt_movies()` tetap tersedia sebagai wrapper untuk kompatibilitas dengan code existing.

*   **Ketangguhan Hibrida (Fail-Safe Mock):**
    *   Jika variabel `TMDB_API_KEY` di berkas `.env` masih bernilai kosong/placeholder, layanan secara cerdas mengalihkan aliran eksekusi ke fungsi internal `_create_mock_data()` untuk mempopulerkan 4 film Brad Pitt legendaris beserta detail lengkapnya. Hal ini menjamin kelancaran unit test lokal tanpa koneksi internet.

*   **Resolusi Konflik Data (Database Constraint Handling):**
    *   Untuk mencegah kegagalan `UNIQUE constraint failed: films_genre.name` saat migrasi dari data dummy ke data asli TMDB, proses sinkronisasi menggunakan metode `update_or_create` dengan kriteria pencarian berbasis **Nama Genre (`name`)**, kemudian menyelaraskan `tmdb_genre_id` aslinya.
    *   Duplicate films (aktor yang main di film yang sama) ditangani otomatis dengan `update_or_create` berdasarkan `tmdb_id` sebagai unique key.

*   **Manajemen Perintah CLI:**
    *   **Sync Single Actor:** `.venv\Scripts\python manage.py sync_tmdb` (default: Brad Pitt dengan min_rating=7.0)
    *   **Sync Specific Actors:** `.venv\Scripts\python manage.py sync_tmdb --actors 287,6193,500 --min-rating 7.0`
    *   **Sync All Featured Actors:** `.venv\Scripts\python manage.py sync_tmdb --all-actors --min-rating 7.0`
    *   **Custom Rating Threshold:** Gunakan `--min-rating` untuk set minimum rating (contoh: `--min-rating 7.5` untuk film top-tier)

*   **Hasil Sinkronisasi (Status Terkini):**
    *   **14 aktor Hollywood** (termasuk Ryan Gosling) telah disinkronkan ke database lokal
    *   **Katalog film lengkap** tersimpan dengan data lengkap (aktor, sutradara, studio, genre) termasuk film mendatang seperti *Project Hail Mary*
    *   Katalog premium siap digunakan untuk rekomendasi AI dan eksplorasi pengguna


---

## 4. Sistem Rekomendasi Hibrida AI

Sistem rekomendasi dihitung secara dinamis di backend melalui dua tahapan komputasi:

### Tahap 1: Penyaringan Aturan (Sistem Pakar)
Menerima preferensi input kuesioner pengguna (`mood`, `genres`, `era`, `duration`, `min_rating`). Aturan logika IF-THEN diterapkan menggunakan filter ORM Django untuk membatasi ruang pencarian kandidat film secara presisi. Jika hasil filter menghasilkan nol kandidat, *logika pelonggaran otomatis* akan melonggarkan kriteria secara bertahap.

### Tahap 2: Pengurutan Kedekatan Relatif (TOPSIS)
Menggunakan **TOPSIS SPK** berbasis library `numpy` untuk memberikan peringkat pada kandidat film hasil saringan Sistem Pakar.
*   **Kriteria & Bobot Benefit:**
    1.  C1: Rata-rata Rating Pengguna (`avg_rating`) — Bobot **40%**
    2.  C2: Popularitas TMDB (`popularity`) — Bobot **30%**
    3.  C3: Kesesuaian pilihan Genre — Bobot **20%**
    4.  C4: Kesesuaian pilihan Era Rilis — Bobot **10%**
*   Komputasi TOPSIS melakukan normalisasi matriks keputusan, perkalian bobot, pencarian Solusi Ideal Positif ($A^+$) & Negatif ($A^-$), serta menghitung jarak Euclid ($D^+$ & $D^-$) untuk mengembalikan skor kedekatan relatif ($V_i \in [0, 1]$). Lima film teratas dikembalikan beserta reasoning kecocokan yang dinamis.

---

## 5. Otorisasi Berbasis Peran (RBAC)

Hak akses diatur secara ketat menggunakan otorisasi bawaan Django dan Django REST Framework Permissions:

| Endpoint | Method | Keterangan Akses | Otorisasi yang Diterapkan |
|---|---|---|---|
| `/api/films/` | GET | Melihat daftar/pencarian film | `AllowAny` (Publik) |
| `/api/films/` | POST/PUT | Menambah/mengubah data film | `IsAdminUser` (Hanya Admin) |
| `/api/films/sync/` | POST | Memicu sinkronisasi manual TMDB | `IsAdminUser` (Hanya Admin) |
| `/api/ratings/` | GET | Melihat daftar rating/ulasan film | `AllowAny` (Publik) |
| `/api/ratings/` | POST | Membuat rating baru pada film | `IsAuthenticated` (Pengguna terdaftar) |
| `/api/ratings/<id>/` | PUT/DELETE| Mengubah/menghapus rating sendiri | `IsOwnerOrReadOnly` (Hanya Pemilik) |
| `/api/recommendations/`| POST | Mengambil rekomendasi hibrida AI | `AllowAny` (Tamu & Pengguna terdaftar) |

---

## 6. Protokol Keamanan Web (Security Compliance)

*   **SQL Injection:** Mitigasi total dengan memproses seluruh pembacaan/penulisan database via Django ORM (parameterized query level driver).
*   **XSS Protection:** Pengiriman data murni via JSON format. Django auto-escaping aktif pada Visualizer DRF. API didesain tanpa assignment manipulasi DOM tidak aman (seperti `innerHTML`) untuk pengembangan UI di masa depan.
*   **CSRF Protection:** Stateless Token Authentication (`Authorization: Token <token>`) diaktifkan untuk API klien (kebal CSRF). Penggunaan session untuk visualisasi DRF dikawal ketat oleh `CsrfViewMiddleware`.
*   **Pengamanan Session & Cookie (Production):**
    *   `SESSION_COOKIE_HTTPONLY = True` & `CSRF_COOKIE_HTTPONLY = True` (mencegah pencurian token via XSS).
    *   `CSRF_COOKIE_SAMESITE = 'Lax'` (mencegah pengiriman cookie lintas asal tak dikenal).
    *   Perlindungan anti-clickjacking (`X-Frame-Options = 'DENY'`).

---

## 7. Arsitektur Frontend & Otorisasi Klien

Aplikasi ini menggunakan integrasi frontend premium bertema HSL Cinematic Noir yang disajikan secara efisien dan aman:

### A. Rute Visual & Penyajian Templat
Seluruh navigasi visual disajikan melalui Django **`TemplateView`** di `config/urls.py` yang memicu pemuatan shell modular:
*   **Shell Bersama (`base.html`):** Berfungsi sebagai tata letak induk (*layout frame*) terpadu yang memuat asset global dan merender Navbar & Footer secara konsisten di setiap halaman.
*   **Halaman Khusus:** Tersebar secara modular di `templates/` (`home.html`, `film_list.html`, `film_detail.html`, `actor_list.html`, `actor_detail.html`, `trending.html`, `recommendations.html`, `login.html`, `signup.html`, `profile.html`) yang memperluas (`{% extends %}`) shell induk.

### B. Aliran Data Asinkronus (Fetch API) & Otorisasi Stateless
*   **Decoupled Rendering:** Halaman visual tidak melakukan rendering data di sisi server, melainkan bertindak sebagai shell asinkron yang melakukan request Fetch secara paralel ke REST API `/api/...` setelah halaman dimuat.
*   **Otorisasi Klien:** Kredensial Token hasil login disimpan secara terproteksi di `localStorage` klien peramban dan disisipkan pada setiap request terproteksi menggunakan tajuk `Authorization: Token <token>`.
*   **Cegah Celah XSS ( DOM Mitigation):** Manipulasi DOM di sisi Javascript sepenuhnya menghindari `innerHTML` atau `document.write` untuk menangkal serangan Cross-Site Scripting (XSS). Klien mengandalkan pembuatan node dinamis via `document.createElement()` dan `.textContent` secara ketat.
### C. Sinkronisasi Data & Penanganan Bug Frontend (Fase 11)
*   **Pembenahan Pemuatan Asinkron & Validasi HTML:** Mengoreksi bug pemecahan URL di mana trailing slashes pada rute film detail dan aktor detail menyebabkan pemetaan `pathname.split('/')` bergeser. Menggunakan filter `.filter(Boolean)` dan mengambil indeks terakhir (`[length - 1]`) menjamin parsing ID yang konsisten dan anti-gagal, melenyapkan bug pemuatan tak berujung (infinite loading). Selain itu, tag penutup penulisan `<textarea>` ulasan yang salah ditutup dengan `</button>` telah diperbaiki menjadi `</textarea>` demi menjamin validitas parsing struktur pohon DOM peramban yang sebelumnya memicu *crash* eksekusi JS pada pemuatan detail film.
*   **Akurasi Relasi Serializer:** Meluruskan sinkronisasi properti dari `.genres` ke `.genre` pada seluruh rendering kartu/halaman agar selaras dengan serializer `FilmSerializer` Django REST Framework (plural vs singular).
*   **Penyelarasan Kartu Rekomendasi & DOM Sanitization:** Melakukan restrukturisasi visual pada feed hasil rekomendasi TOPSIS AI. Judul film sekarang dibungkus dalam blok `min-w-0 flex-1` untuk mencegah teks panjang merusak tata letak badge persentase kecocokan (*match*). DOM rendering juga dibersihkan sepenuhnya dari properti `innerHTML` dan digantikan dengan manipulasi node aman (`document.createElement()`, `.textContent`, `appendChild`) demi kepatuhan XSS.
*   **Sinkronisasi Dinamis & Akurasi Rating TMDB:** Meng-upgrade mekanisme penarikan aktor Brad Pitt di mana backend secara cerdas memanggil API TMDB `/person/287` secara dinamis guna mempopulerkan biodata riil dan tautan gambar profil terbaru yang valid (`/m09Y1YfPPeNYYUSHnnVqahkrC1o.jpg`), mengatasi potret kosong/rusak. Selain itu, sinkronisasi film kini memetakan data `vote_average` dari TMDB ke dalam field `avg_rating` database lokal sebagai nilai default, melenyapkan kendala visual rating "N/A" pada film yang baru saja disinkronkan.

### D. Multithread Optimization & Frontend Cleanup (Fase 14)

*   **Multithread TMDB Sync dengan Rate Limiting:** Implementasi `TMDBRateLimiter` class untuk enforce TMDB API rate limit (40 requests per 10 seconds) dengan thread-safe sliding window algorithm. Refactoring `sync_multiple_actors()` untuk menggunakan `ThreadPoolExecutor` dengan 4 concurrent workers, menghasilkan **3x speedup** (dari ~5.4 menit → ~1.5-2 menit untuk sync 13 aktor). Rate limiter dipanggil sebelum setiap API request di `sync_actor_movies()` untuk memastikan compliance dengan TMDB API limits. Per-actor error handling memastikan jika 1 aktor gagal sync, yang lain tetap berjalan. Backward compatibility dijaga dengan optional `rate_limiter` parameter.

*   **Film Detail Actors Filter Fix:** Memperbaiki bug di `ActorViewSet.get_queryset()` yang menyebabkan film detail page menampilkan semua actors dari database. Menambahkan filter `film_id` yang query actors via `Filmography` relation (`queryset.filter(filmographies__film_id=film_id)`), sehingga film detail page sekarang hanya menampilkan actors yang benar-benar bermain di film tersebut.

*   **Frontend Generic Cleanup:** Menghapus semua references spesifik ke "Brad Pitt" di frontend (4 locations: `recommendations.html`, `home.html` 2x, `actor_list.html`) dan mengubahnya menjadi generic text yang sesuai dengan multi-actor catalog. Implementasi photo placeholder dengan Material Icons "help" untuk actors tanpa foto di `actor_list.html` dan `home.html` featured actors section, menggantikan unsplash fallback image yang sama untuk semua actors tanpa foto.

*   **Thread Safety & Performance:** `TMDBRateLimiter` menggunakan `threading.Lock()` untuk thread-safe access ke shared request tracking list. Django ORM thread-safe by default dengan setiap thread mendapat database connection sendiri. Conservative approach dengan 4 workers (bukan 8-10) untuk minimize risk rate limiting sambil tetap mendapat significant speedup.

### E. Film-Based Cast Sync & Photo Placeholder Enhancements (Fase 15)

*   **Film-Based Sync Method:** Implementasi method baru `sync_films_cast_members()` di `apps/films/services.py` yang memungkinkan sinkronisasi cast members berdasarkan **film** (bukan aktor). Method ini fetch all films dari database dan untuk setiap film, fetch credits dari TMDB API (`/movie/{id}?append_to_response=credits`) kemudian sync top 30 cast members + director. Complementary dengan actor-based sync yang existing, memberikan flexibility untuk sync dari perspective film OR aktor. New management command `python manage.py sync_films_cast` memudahkan execution.

*   **Cast Members Limit Enhancement:** Meningkatkan limit cast members dari 10 ke 30 per film di `sync_actor_movies()` method untuk coverage yang lebih complete. Dengan 487 films × 30 actors = ~14,610 actor-film relations (vs ~4,870 sebelumnya), database menjadi 3x lebih complete dengan cast information.

*   **Photo Placeholder Consistency:** Memperbaiki photo placeholder di `film_detail.html` (cast list) dan `actor_detail.html` (header photo) untuk menggunakan Material Icons "help" (tanda tanya) dengan background color `bg-[#37353E]` ketika actor tidak memiliki foto. Menggantikan unsplash fallback image yang sama untuk semua actors tanpa foto, memberikan visual indication yang lebih jelas. Sekarang consistent across all templates (actor_list, home, film_detail, actor_detail).

*   **Database Fresh Start:** Database di-reset untuk fresh start dengan new film-based sync approach, ready untuk re-population dengan complete cast members menggunakan new sync method.

---

### F. Frontend Clarity & Native Actor Names (Fase 16)

*   **Native Actor Name Support:** Menambahkan field `native_name` (CharField) ke model `Actor`. Di `services.py`, saat fetch person detail dari TMDB, sistem mengekstrak `also_known_as` list dan mendeteksi nama non-ASCII (Korea/Mandarin/Jepang/Arab dll) menggunakan `str.isascii()`. Nama native pertama yang ditemukan disimpan ke `native_name`. Frontend menampilkan nama native di bawah nama Latin — contoh: `Scarlett Johansson` → `스칼렛 요한슨`.

*   **Film Detail — Cast Section Enhancement:** Jumlah aktor yang ditampilkan di halaman detail film ditingkatkan dari **4 menjadi 8** aktor, dengan grid adaptif `grid-cols-2 sm:grid-cols-4 lg:grid-cols-8`. Setiap kartu cast kini menampilkan:
    *   **Badge role berwarna**: Sutradara → merah `bg-[#C0392B]/20`, Pemeran → marun `bg-[#715A5A]/20`
    *   **Nama native** di bawah nama Latin jika tersedia
    *   Role badge diambil dari field `film_role` yang di-annotate oleh `ActorViewSet` via `Subquery` Django ORM

*   **ActorViewSet — `film_role` Annotation:** `apps/actors/views.py` menggunakan `Subquery` + `OuterRef` Django ORM ketika ada query param `?film=`. Setiap aktor di-annotate dengan role spesifiknya di film tersebut dari tabel `Filmography`. `ActorSerializer` meng-expose `film_role` dan `native_name` sebagai fields baru.

*   **Actor Detail — UX Improvements:**
    *   **Nama native di header**: Elemen native name tampil di bawah `<h1>` jika `actor.native_name` tersedia
    *   **Info badges**: Badge `📅 Lahir {year}` dan `🎬 {N} Film` di bawah nama memberikan snapshot cepat
    *   **Bio collapsible**: Bio > 400 karakter dipotong dengan tombol "Baca Selengkapnya ↓" / "Sembunyikan ↑"
    *   **Role badge berwarna di filmography**: Setiap kartu film di daftar filmografi menampilkan badge berwarna (Sutradara merah, Pemeran marun)

*   **Database Migration:** `apps/actors/migrations/0003_add_native_name.py` — migration baru diterapkan tanpa memerlukan reset database.

---

### G. Dynamic Hero Section (Fase 17)

*   **Hero Section Fully Dynamic:** Seluruh data statis di hero section `templates/home.html` (judul hardcoded "Fight Club", rating 9.5, tahun 1999, sinopsis manual, backdrop statis Google image) telah dihapus sepenuhnya. Hero kini mengambil data real-time dari `/api/films/?ordering=-popularity`.

*   **Auto-Rotate Hero (Cinematic Slideshow):** Hero menampilkan **5 film paling populer** secara bergantian dengan interval 8 detik (`setInterval`). Film yang tampil di-rotate menggunakan `heroIndex` counter dengan `renderHero()` function yang dipanggil ulang setiap giliran.

*   **Dot Indicator Interaktif:** Di bawah konten hero, terdapat 5 dot indicator yang berubah warna & lebar ketika film aktif (`bg-[#C0392B] w-5` untuk aktif, `bg-white/30` untuk inaktif). User bisa klik dot untuk lompat ke film tertentu.

*   **Loading Skeleton:** Saat data API belum tersedia, hero menampilkan skeleton loading (`animate-pulse`) berupa blok abu-abu transparan yang mengimitasi shape judul, badge, sinopsis, dan tombol — menghindari flash konten kosong.

*   **Backdrop TMDB Original:** Poster film digunakan sebagai backdrop hero dengan ukuran `/t/p/original` (resolusi tertinggi dari TMDB CDN), dikombinasikan dengan `bg-cover bg-center` dan gradient overlay dari kiri untuk mempertahankan legibility teks.

*   **Integrasi dengan Trending Carousel:** Satu API call `/api/films/?ordering=-popularity` digunakan bersama oleh hero (top-5) dan carousel trending di bawahnya, menghindari request duplikat.

---

### H. Empty State & Error State — Home Page (Fase 18)

*   **Pola 3-State di Setiap Section:** Setiap bagian `home.html` kini memiliki tiga state yang ter-handle dengan baik:
    1.  **Loading** → Skeleton `animate-pulse` berbentuk sesuai konten (bukan teks "Memuat...")
    2.  **Empty** → Icon Material (`movie_off`, `person_off`) + pesan deskriptif yang membantu
    3.  **Error** → Icon `wifi_off` merah + pesan gangguan server, dipicu oleh `.catch()`

*   **Hero Empty/Error State:** Jika database kosong, hero menampilkan icon `movie_off`, judul "Katalog Kosong", pesan singkat, dan hint perintah CLI `python manage.py sync_tmdb --all-actors`. Jika API error, tampil pesan gangguan server.

*   **Semua `fetch()` Diperkuat:** Seluruh `fetch()` call di `home.html` ditambahkan:
    *   `if (!res.ok) throw new Error(...)` — cek HTTP status sebelum `.json()`
    *   `.catch(err => {...})` — tangkap network error / server down
    *   Empty state check: `if (films.length === 0)` / `if (actors.length === 0)`

*   **Helper `showEmptyCard(container, message)`:** Fungsi reusable untuk menampilkan empty/error card di section Editor's Choice dan Top Rated Movie dengan styling konsisten.

---

### I. Perbaikan Minor UI � Role Badge Full Text & Label Aktor Dinamis (Fase 22)

*   **Role Badge Teks Penuh (film_detail.html):** Badge peran di cast card halaman detail film sebelumnya memotong teks setelah 18 karakter (misal: `"Pemeran (John Len�"`). Pemotongan ini dihapus sehingga teks role tampil penuh � `"Pemeran (John Lennon)"`. CSS diubah dari class truncate ke `leading-snug text-center` agar badge wrapping dengan rapi.

*   **Role Badge Teks Penuh (actor_detail.html):** Badge peran di filmography card halaman detail aktor memiliki truncate 16 karakter + class `truncate max-w-[70%]`. Keduanya dihapus sehingga role tampil lengkap di setiap kartu filmografi.

*   **Label Aktor Dinamis (actor_list.html):** Label statis `"Sineas"` yang generik diganti dengan label dinamis yang ditentukan dari data `filmographies` milik setiap aktor:
    *   Jika ada role sutradara/director DAN pemeran/actor ? **"Aktor & Sutradara"**
    *   Jika hanya role sutradara/director ? **"Sutradara"**
    *   Jika hanya role pemeran/actor ? **"Aktor"**
    *   Label diikuti tahun lahir jika tersedia � contoh: `"Sutradara � 1954"` atau `"Aktor � 1963"`

*   **Sorting Alphabetical:** Parameter `ordering=name` ditambahkan pada API request di `actor_list.html`. Backend `ActorViewSet` sudah memiliki `order_by('name')` sebagai default queryset, sehingga list aktor selalu tampil secara konsisten sesuai urutan abjad nama.

*   **Performa � Prefetch Related:** `ActorViewSet.queryset` di `apps/actors/views.py` ditambahkan `prefetch_related('filmographies__film')` untuk menghindari N+1 database query saat serializer mengakses data `filmographies` setiap aktor. Query yang sebelumnya O(N) menjadi O(1) dengan JOIN prefetch Django.

---

### J. Split Hero Layout & Trending Page Poster Styling (Fase 23)

*   **Split Layout Hero Section (home.html):** Desain tata letak hero banner telah dirombak dari text-on-backdrop menjadi split layout. Teks kini rata kiri dan poster gambar (tanpa crop, menggunakan aspect ratio asli) diletakkan rata kanan. Struktur menggunakan flexbox `md:flex-row` dengan rasio 50:50 agar seimbang tanpa ruang kosong (whitespace) berlebih.
*   **Penyederhanaan Trending Carousel (home.html):** Menghapus penanda angka urutan berukuran besar (1-5) pada kartu carousel Trending This Week untuk memberikan tampilan yang lebih bersih (clean) dan fokus pada sampul film.
*   **Poster Styling di Trending Page (trending.html):** Orientasi gambar pada sorotan film (Top Spotlight) Rank 1, 2, dan 3 yang sebelumnya menggunakan crop lanskap (`aspect-video`) telah diperbaiki menjadi orientasi vertikal poster (`aspect-[2/3]`). Kartu Rank 2 dan 3 diubah tata letaknya dari bertumpuk menjadi horizontal flex (gambar di kiri, teks di kanan) agar rapi, mudah dibaca, dan menghargai orisinalitas poster film dari TMDB.

---

### K. Optimasi Sync TMDB & Biografi Aktor Asli (Fase 25)

*   **Penyelarasan Limit Cast:** Untuk menghemat resource dan mengurangi *overhead* pada proses pemanggilan API TMDB, penarikan daftar pemeran (cast) per film dikurangi dari Top 30 menjadi **Top 10** (bersama dengan 1 sutradara). Hal ini menjamin katalog tetap kaya tanpa mengorbankan waktu sinkronisasi.
*   **Penarikan Bio Asli (*Real Biography*):** Metode sinkronisasi dirombak agar tidak lagi menggunakan templat bio tiruan (misal: "Aktor/aktris yang bermain di..."). Setiap anggota cast dan sutradara yang masuk ke database akan dilakukan *fetching* biografi aslinya langsung dari endpoint `/person/{id}` di TMDB.
*   **Pencegahan Redundansi API:** Agar tidak terjadi panggilan ganda (*API spamming* / *rate limiting*), sebelum menembak endpoint biografi personal, sistem mengecek *database* terlebih dahulu; jika aktor tersebut sudah pernah di-sync dan memiliki bio asli, tahap request dilewati, memberikan akselerasi siginifikan saat aktor yang sama bermain di banyak film.

---
