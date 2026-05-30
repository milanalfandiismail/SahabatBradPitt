# 🎤 Slide Outline & Video Walkthrough Script - Sahabat Bradpitt

## Panduan Presentasi Sidang Tugas Akhir / Skripsi

Dokumen ini disusun untuk membantu Anda mempersiapkan **Slide Presentasi** (12 slide formal) dan **Video Demo Aplikasi** (durasi 3-5 menit) dengan alur yang padat, sistematis, dan dijamin bebas dari error/kegagalan teknis saat demonstrasi.

---

### Part 1: Outline Slide Presentasi (12 Slide Akademik)

| No. Slide | Topik Slide | Konten Utama & Fokus Pembahasan |
|:---|:---|:---|
| **Slide 1** | **Judul & Identitas** | Judul Proyek: *Rancang Bangun Sistem Informasi Film Sahabat Bradpitt dan SPK Personalisasi Rekomendasi Menggunakan Metode TOPSIS*. Sertakan Nama, NIM, dan Logo Kampus. |
| **Slide 2** | **Latar Belakang** | Masalah ledakan informasi film, keterbatasan rekomendasi global TMDB yang kurang personal, serta pentingnya pencatatan penghargaan (*accolades*) film terintegrasi. |
| **Slide 3** | **Rumusan Masalah** | 1. Bagaimana mengimplementasikan SPK TOPSIS untuk rekomendasi personal?<br/>2. Bagaimana menyinkronkan data lokal dengan TMDB & Wikipedia secara efisien?<br/>3. Bagaimana mengoptimalkan UX mobile halaman profil? |
| **Slide 4** | **Metodologi & SDLC** | Penggunaan metode **Waterfall / Agile SDLC**. Jelaskan batasan 3-Layer Architecture (Presentation, Business Logic, Data Access). |
| **Slide 5** | **Dasar Teori (TOPSIS)** | Konsep matematis TOPSIS: Matriks keputusan $X$, bobot kriteria kustom pengguna, pencarian nilai ideal positif $A^+$ dan negatif $A^-$, serta rumus nilai kedekatan relatif $V_i$. |
| **Slide 6** | **Analisis Kebutuhan (SRS)** | Penjelasan singkat Use Case diagram (aktor RBAC: Tamu, Member, Kontributor, Admin) dan Non-Functional Requirements (OWASP Top 10 security). |
| **Slide 7** | **Desain Sistem & Database** | Class Diagram (skema tabel `Film`, `Actor`, `Festival` terupdate dengan kolom `local_*` & `tmdb_*`) beserta relasi database. |
| **Slide 8** | **Implementasi Backend** | Implementasi modular Python: Django REST Framework serializers, TOPSIS engine, Wikipedia Accolades importer (`release_year` fix). |
| **Slide 9** | **Implementasi Frontend** | Penyesuaian responsif mobile: Accordion preferensi TOPSIS, active tab bar transition, pagination lokal "Lihat Selengkapnya". |
| **Slide 10** | **Hasil Pengujian (Unit Test)** | Hasil eksekusi 9 automated unit tests (100% PASS) dan tabel Black-box testing (Smart search, RBAC, Wikipedia sync). |
| **Slide 11** | **Refleksi & Rencana Iterasi** | Limitasi sistem (SQLite lock mitigation) dan rencana masa depan (Celery async worker & PostgreSQL migration). |
| **Slide 12** | **Penutup & Kesimpulan** | Kesimpulan akhir kelayakan sistem Sahabat Bradpitt dan sesi Tanya Jawab. |

---

### Part 2: Script Video Demo Aplikasi (Durasi 3-5 Menit)

Gunakan panduan klik UI dan narasi suara di bawah ini untuk merekam demo aplikasi Anda secara profesional:

#### Segmen 1: Pembukaan & Tampilan Beranda (0:00 - 0:45)
* **Langkah Klik UI**:
  1. Tampilkan halaman utama (*Home*) Sahabat Bradpitt di browser.
  2. Arahkan kursor ke spanduk hero (*Home Hero*) dan slider trending film.
  3. Klik menu navigasi **"Festival & Awards"** pada navbar utama (sorot perubahan label visual yang baru kita selaraskan).
* **Narasi Suara**:
  > *"Halo semuanya, nama saya [Nama Anda]. Hari ini saya akan mendemonstrasikan aplikasi Sahabat Bradpitt, platform informasi film dan sistem rekomendasi berbasis SPK TOPSIS. Seperti yang dapat dilihat pada layar, ini adalah halaman Beranda yang menampilkan film unggulan dan slider film yang sedang tren. Di bar navigasi atas, kita dapat melihat label baru **'Festival & Awards'** yang menggabungkan informasi piala dan penghargaan film secara terpadu."*

#### Segmen 2: Pencarian Cerdas & Katalog (0:45 - 1:30)
* **Langkah Klik UI**:
  1. Klik kotak pencarian di bagian atas, ketik kata kunci **"Fight"**.
  2. Tunjukkan hasil pencarian di mana film dengan judul eksak **"Fight Club"** diletakkan paling atas, diikuti oleh film pencarian parsial.
  3. Klik pada card film **"Fight Club"** untuk membuka halaman detail film. Tunjukkan daftar pemeran (aktor) dan poster yang terender dengan mulus.
* **Narasi Suara**:
  > *"Sistem ini dilengkapi dengan **Pencarian Cerdas (Smart Search)** menggunakan substring matching dengan pemeringkatan relevansi. Saat mencari kata 'Fight', sistem secara cerdas menempatkan hasil pencocokan eksak di peringkat paling atas. Selanjutnya, kita masuk ke detail film yang menarik poster dan foto aktor secara efisien dari repositori lokal maupun TMDB."*

#### Segmen 3: Halaman Profil & Rekomendasi TOPSIS Mobile (1:30 - 2:45)
* **Langkah Klik UI**:
  1. Lakukan login menggunakan akun Member terdaftar.
  2. Buka halaman **Profil**.
  3. Ubah resolusi browser ke tampilan **Mobile** (tekan `F12` lalu pilih mode perangkat seluler).
  4. Tunjukkan preferensi bobot TOPSIS yang melipat menjadi **Accordion Collapsible** yang sangat rapi. Klik untuk membukanya.
  5. Geser bobot kriteria (misal: naikkan kriteria 'Rating' ke nilai maksimum). Klik **Simpan Preferensi**.
  6. Tunjukkan tab transition di bawah profil yang bergeser mulus (*active bar transition*).
  7. Klik tab **Daftar Ulasan** atau **Watchlist**, perlihatkan pagination lokal di mana hanya 4 film pertama yang muncul, lalu klik tombol **"Lihat Selengkapnya"** untuk menampilkan sisanya secara dinamis.
* **Narasi Suara**:
  > *"Sekarang mari kita lihat fitur unggulan kami: **Halaman Profil & Rekomendasi TOPSIS Mobile**. Pada tampilan ponsel, panel preferensi bobot rekomendasi secara otomatis melipat menjadi accordion hemat ruang. Pengguna dapat menyesuaikan bobot kriteria SPK TOPSIS mereka secara langsung. Di bawahnya, terdapat dynamic active tab bar yang bergeser mulus. Ulasan dan watchlist dioptimalkan untuk perangkat mobile dengan pagination lokal, menampilkan 4 item awal dan tombol **'Lihat Selengkapnya'** untuk menjaga kecepatan muat halaman."*

#### Segmen 4: Panel Admin, Sinkronisasi TMDB, & Impor Wikipedia (2:45 - 3:45)
* **Langkah Klik UI**:
  1. Masuk log sebagai Administrator, buka halaman **Dashboard Admin**.
  2. Perlihatkan antarmuka editor aktor dan film (telah diselaraskan dengan field `local_photo` & `tmdb_photo`).
  3. Buka halaman integrasi Wikipedia dan jalankan importir untuk penghargaan film. Tunjukkan log sukses penarikan penghargaan tanpa crash (bebas dari error `AttributeError`).
* **Narasi Suara**:
  > *"Terakhir, kita beralih ke Panel Administrator. Di sini, sistem otorisasi **RBAC (Role-Based Access Control)** bekerja melindungi data sensitif. Admin dapat mengelola database, menyetujui suntingan kontributor, serta memicu sinkronisasi TMDB. Kami juga telah memperbaiki **Wikipedia Accolades Importer** yang kini secara andal mengekstrak daftar nominasi penghargaan dari API Wikipedia menggunakan properti tahun rilis tanpa adanya crash database."*

#### Segmen 5: Penutup (3:45 - 4:00)
* **Langkah Klik UI**:
  1. Kembali ke halaman Beranda, tunjukkan logo Sahabat Bradpitt.
* **Narasi Suara**:
  > *"Demikian presentasi demonstrasi sistem Sahabat Bradpitt. Seluruh pengujian otomatis dan manual telah mencatatkan tingkat keberhasilan 100% tanpa error, membuktikan aplikasi ini sangat andal dan siap digunakan. Terima kasih atas perhatian Anda."*
