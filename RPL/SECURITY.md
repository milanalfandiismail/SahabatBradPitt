# 🛡️ Panduan Mitigasi Keamanan (OWASP Top 10) - Sahabat Bradpitt

## Laporan Mitigasi Keamanan Siber & Pemodelan Ancaman (Threat Modeling)

Aplikasi Sahabat Bradpitt dibangun dengan standar keamanan tingkat lanjut untuk mengamankan data pengguna, menjaga integritas katalog film, dan mencegah penyusupan sistem. Berikut adalah peta mitigasi konkret terhadap kerentanan **OWASP Top 10** pada arsitektur Sahabat Bradpitt.

---

### A01:2021 - Broken Access Control (Kegagalan Kontrol Akses)
* **Lanskap Ancaman**: Pengguna biasa mencoba mengakses endpoint API admin untuk menyetujui suntingan data (*approvals*) atau mengedit data film secara ilegal.
* **Mitigasi pada Sahabat Bradpitt**:
  - Hak akses dikontrol ketat pada lapisan backend menggunakan **Role-Based Access Control (RBAC)** terpusat di Django.
  - Setiap endpoint sensitif diproteksi dengan kelas izin Django REST Framework seperti `IsAdminUser` atau kelas kustom `IsContributorOrReadOnly`.
  - Sistem tidak mengandalkan penyembunyian tombol di antarmuka HTML/JS (client-side protection), melainkan melakukan verifikasi sesi dan otorisasi ulang di setiap request backend API (server-side enforcement).

### A02:2021 - Cryptographic Failures (Kegagalan Kriptografi)
* **Lanskap Ancaman**: Peretas berhasil mengunduh database SQLite dan membaca data kata sandi pengguna secara bebas.
* **Mitigasi pada Sahabat Bradpitt**:
  - Tidak ada kata sandi yang disimpan dalam bentuk teks biasa (*plain text*).
  - Django secara bawaan mengamankan kata sandi dengan algoritma pengacakan **PBKDF2** yang diperkuat dengan *hashing* satu arah **SHA-256** dan *salt* unik per pengguna.
  - Seluruh komunikasi data antara klien dan server mewajibkan protokol terenkripsi **HTTPS (SSL/TLS)** pada server produksi (Nginx/Waitress) untuk mencegah penyadapan data di tengah jalan (*Man-in-the-Middle attack*).

### A03:2021 - Injection (Injeksi - SQLi & XSS)
* **Lanskap Ancaman**: Pengguna jahat memasukkan query SQL berbahaya ke dalam kotak pencarian film atau tag `<script>` jahat di kolom ulasan film.
* **Mitigasi pada Sahabat Bradpitt**:
  - **SQL Injection**: Sistem menggunakan **Django ORM** secara 100% untuk seluruh operasi CRUD dan query database. Django ORM secara otomatis menggunakan parameterisasi query (*parameterized queries*), memisahkan perintah SQL dengan input mentah pengguna secara aman.
  - **Cross-Site Scripting (XSS)**: Mesin template Django melakukan pembersihan (*auto-escaping*) bawaan pada seluruh variabel yang dirender ke halaman HTML. Karakter sensitif seperti `<`, `>`, `&`, `'`, dan `"` dikonversi menjadi entitas HTML aman secara otomatis, mencegah eksekusi skrip Javascript berbahaya di browser pengguna lain.

### A04:2021 - Insecure Design (Desain yang Tidak Aman)
* **Lanskap Ancaman**: Ketiadaan limitasi logika bisnis yang menyebabkan penyalahgunaan fitur (misal: spamming ulasan atau rating).
* **Mitigasi pada Sahabat Bradpitt**:
  - Menerapkan pembatasan logika bisnis di mana satu pengguna hanya diperkenankan memberikan tepat 1 (satu) rating dan ulasan per judul film. Modifikasi ulasan berikutnya akan diterjemahkan sebagai operasi pembaruan (*Update*), bukan pembuatan baru (*Create*).
  - Skema database dirancang dengan kendala integritas tingkat tinggi (*unique constraints*) antara user ID dan film ID pada tabel Rating.

### A05:2021 - Security Misconfiguration (Salah Konfigurasi Keamanan)
* **Lanskap Ancaman**: Mode debug server dibiarkan aktif di server produksi, memunculkan informasi struktur kode dan variabel lingkungan (*environment variables*) sensitif saat terjadi error.
* **Mitigasi pada Sahabat Bradpitt**:
  - Memisahkan konfigurasi lokal dan produksi menggunakan berkas variabel lingkungan `.env`.
  - Pada server produksi, parameter `DEBUG` wajib diset ke `False` (`DEBUG=False`), mengalihkan tampilan error bawaan Django ke halaman error 500/404 kustom yang aman bagi publik.
  - Kunci rahasia aplikasi (`SECRET_KEY`) dimuat secara aman dari environment variable di sistem operasi, bukan ditulis langsung (*hardcoded*) di dalam berkas `settings.py`.

### A06:2021 - Vulnerable and Outdated Components (Komponen Rentan & Usang)
* **Lanskap Ancaman**: Menggunakan versi Django atau pustaka pihak ketiga yang memiliki celah keamanan publik yang sudah diketahui (*CVE vulnerabilities*).
* **Mitigasi pada Sahabat Bradpitt**:
  - Penggunaan berkas `requirements.txt` yang melacak versi pustaka secara eksplisit.
  - Melakukan audit dependensi secara berkala menggunakan alat bantu analisis keamanan otomatis seperti `pip-audit` atau integrasi GitHub Dependabot.

### A07:2021 - Identification and Authentication Failures (Kegagalan Identifikasi & Otentikasi)
* **Lanskap Ancaman**: Serangan *brute-force* untuk menebak kata sandi admin atau pembajakan sesi login pengguna.
* **Mitigasi pada Sahabat Bradpitt**:
  - Keamanan sesi dilindungi dengan cookie sesi bertanda aman (`SESSION_COOKIE_SECURE=True` dan `CSRF_COOKIE_SECURE=True` pada tingkat produksi).
  - Cookie sesi dikonfigurasi dengan flag `HttpOnly` untuk menghalangi akses pembacaan sesi melalui skrip Javascript jahat di sisi klien, meminimalisir risiko pencurian token sesi.

### A08:2021 - Software and Data Integrity Failures (Kegagalan Integritas Perangkat Lunak & Data)
* **Lanskap Ancaman**: Mengunggah file jahat (seperti file skrip Python/PHP) melalui fitur upload foto aktor untuk mengeksekusi kode di dalam server (*Remote Code Execution*).
* **Mitigasi pada Sahabat Bradpitt**:
  - Django memvalidasi tipe konten file yang diunggah secara ketat di tingkat views (seperti pada unit test `test_upload_invalid_file_type` yang memastikan hanya tipe MIME bertipe `image/*` yang diterima).
  - Berkas media yang diunggah disimpan dengan nama acak/unik yang dihasilkan oleh sistem, dipisahkan dari direktori executable utama server.

### A09:2021 - Security Logging and Monitoring Failures (Kegagalan Logging & Pemantauan Keamanan)
* **Lanskap Ancaman**: Upaya peretasan yang gagal atau aktivitas penyusupan tidak tercatat, sehingga admin tidak mengetahui adanya serangan yang sedang berlangsung.
* **Mitigasi pada Sahabat Bradpitt**:
  - Sistem merekam riwayat kalkulasi rekomendasi penting ke dalam tabel `RecommendationLog`.
  - Log aktivitas server dikelola oleh modul logging standar Django yang mengarah ke file log lokal yang terenkripsi dan terlindung di dalam direktori penyimpanan server.

### A10:2021 - Server-Side Request Forgery (SSRF)
* **Lanskap Ancaman**: Penyerang memanipulasi parameter URL TMDB sync untuk memaksa server Sahabat Bradpitt menembak alamat IP privat internal jaringan cloud.
* **Mitigasi pada Sahabat Bradpitt**:
  - Endpoint target sinkronisasi TMDB (`api.themoviedb.org`) dikunci secara ketat dan di-*hardcode* di sisi backend service layer.
  - Parameter input dari pengguna (seperti `tmdb_id`) divalidasi sebagai tipe data integer murni sebelum disisipkan ke dalam request URL TMDB, mencegah manipulasi path URL.
