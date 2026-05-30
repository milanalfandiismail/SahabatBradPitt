# 📄 Software Requirements Specification (SRS) - Sahabat Bradpitt

## Bab II: Kebutuhan Sistem (System Requirements)

### 2.1 Pendahuluan & Deskripsi Umum
**Sahabat Bradpitt** adalah platform digital berbasis web yang dirancang khusus sebagai pusat informasi film, pelacakan penghargaan (*accolades*), dan sistem rekomendasi personalisasi berbasis **Sistem Pendukung Keputusan (SPK)** menggunakan metode **TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution)**. Platform ini menghubungkan pustaka film lokal yang kaya dengan data global dari **The Movie Database (TMDB)** dan **Wikipedia** untuk melacak piala serta nominasi festival film terkemuka di dunia.

Tujuan utama dari sistem ini adalah memberikan rekomendasi film yang sangat relevan secara dinamis berdasarkan preferensi personal pengguna terhadap kriteria-kriteria spesifik seperti rating rata-rata, popularitas, tahun rilis, dan jumlah ulasan.

---

### 2.2 Aktor Sistem (User Personas)
Sistem memiliki 4 aktor utama yang didefinisikan dengan hak akses berbasis peran (**Role-Based Access Control / RBAC**):

1. **Tamu (Guest / Anonymous User)**:
   - Dapat menjelajahi katalog film, aktor, dan festival penghargaan.
   - Dapat melakukan pencarian film cerdas.
   - Tidak dapat memberikan rating, ulasan, atau menyimpan film ke *watchlist*.
   
2. **Pengguna Terdaftar (Registered User / Member)**:
   - Memiliki semua hak akses Tamu.
   - Dapat mengelola profil kustom (mengunggah foto profil, mengubah preferensi rekomendasi).
   - Dapat memberikan rating dan ulasan pada film.
   - Dapat mengelola daftar tontonan (*watchlist*).
   - Dapat menerima rekomendasi personal berbasis TOPSIS.

3. **Kontributor (Contributor)**:
   - Memiliki semua hak akses Pengguna Terdaftar.
   - Dapat menambahkan atau menyunting data film, aktor lokal, dan festival di panel manajemen terbatas.
   - Dapat memicu sinkronisasi data parsial dari TMDB API.

4. **Administrator (Admin / Superuser)**:
   - Memiliki kendali penuh atas sistem.
   - Dapat mengelola data pengguna dan alokasi peran RBAC.
   - Dapat menyetujui atau menolak suntingan data dari Kontributor melalui modul persetujuan (*approval system*).
   - Dapat menjalankan sinkronisasi data global TMDB dan importir penghargaan Wikipedia.

---

### 2.3 Kebutuhan Fungsional (Functional Requirements)

| ID | Fitur Utama | Deskripsi Detail | Aktor |
|:---|:---|:---|:---|
| **FR-01** | **Pendaftaran & Otentikasi** | Mengizinkan pengguna untuk mendaftar akun baru, masuk log (*login*), keluar log (*logout*), serta mengelola profil pengguna secara aman. | Tamu, Pengguna |
| **FR-02** | **Pencarian Cerdas (Smart Search)** | Melakukan pencarian film dengan algoritma *substring matching* (`icontains`) cerdas yang mengurutkan hasil berdasarkan relevansi (*search_rank*): kecocokan eksak $\rightarrow$ kecocokan awalan $\rightarrow$ kecocokan parsial. | Semua Aktor |
| **FR-03** | **Sistem Rekomendasi TOPSIS** | Menghitung rekomendasi film kustom untuk pengguna menggunakan bobot kriteria dinamis (Rating, Popularitas, Tahun Rilis, Jumlah Ulasan) berdasarkan nilai kedekatan relatif TOPSIS. | Pengguna |
| **FR-04** | **Pengelolaan Profil & Watchlist** | Menyediakan antarmuka kustomisasi profil, penyimpanan film favorit ke *watchlist*, serta daftar ulasan pribadi dengan pagination cerdas untuk perangkat mobile. | Pengguna |
| **FR-05** | **Manajemen Data Film & Aktor** | Fitur CRUD (Create, Read, Update, Delete) data film, aktor (foto lokal/TMDB), dan data festival untuk menyelaraskan aset internal. | Kontributor, Admin |
| **FR-06** | **Sinkronisasi TMDB API** | Melakukan sinkronisasi metadata film, poster, dan pemeran secara otomatis atau manual dari TMDB API ke database lokal tanpa mengunci SQLite database (*database lock prevention*). | Kontributor, Admin |
| **FR-07** | **Wikipedia Accolades Importer** | Melakukan *scraping* dan ekstraksi data penghargaan/festival film secara otomatis dari Wikipedia API menggunakan tahun rilis film (`release_year`). | Admin |
| **FR-08** | **Sistem Otorisasi & Persetujuan** | Modul verifikasi suntingan data kontributor oleh Administrator sebelum data resmi dipublikasikan ke katalog publik. | Admin, Kontributor |

---

### 2.4 Kebutuhan Non-Fungsional (Non-Functional Requirements)

#### 1. Keamanan & Proteksi Data (Security)
- **NFR-SEC-01**: Seluruh otentikasi kata sandi harus dienkripsi menggunakan algoritma pengacakan satu arah standar industri (PBKDF2 dengan SHA256).
- **NFR-SEC-02**: Hak akses API dan antarmuka dibatasi ketat menggunakan dekorator otorisasi berbasis peran (RBAC) untuk mencegah *Broken Access Control*.
- **NFR-SEC-03**: Perlindungan terhadap *SQL Injection* dengan menggunakan Django ORM parameterized queries dan mitigasi *Cross-Site Scripting (XSS)* lewat auto-escaping template.

#### 2. Kinerja & Responsivitas (Performance)
- **NFR-PER-01**: Waktu pemuatan halaman utama (*load time*) tidak boleh melebihi 2.0 detik pada jaringan pita lebar standar.
- **NFR-PER-02**: Penghitungan rekomendasi TOPSIS untuk 1000+ data film harus diselesaikan dalam waktu kurang dari 150 milidetik.
- **NFR-PER-03**: Antarmuka web harus 100% responsif (*mobile-friendly*) menggunakan CSS Grid dan Flexbox fleksibel, khususnya pada halaman Profil dan navigasi utama.

#### 3. Keandalan & Integritas (Reliability)
- **NFR-REL-01**: Sistem harus menangani pembatasan koneksi SQLite (*database is locked*) secara anggun melalui sinkronisasi sekuensial yang tertata (*serialized task queue*).
- **NFR-REL-02**: Perubahan skema nama kolom database tidak boleh menghapus atau merusak data yang telah ada di database produksi.

#### 4. Ketersediaan & Pemeliharaan (Maintainability)
- **NFR-MNT-01**: Struktur kode program wajib mengikuti standar **3-Layer Architecture** (Presentation, Business Logic, Data Access Layer) secara ketat.
- **NFR-MNT-02**: Ukuran file script atau kode program modular baru diupayakan di bawah 200 baris per file untuk mempermudah audit dan *maintenance*.
