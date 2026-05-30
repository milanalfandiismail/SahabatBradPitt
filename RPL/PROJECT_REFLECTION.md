# 💭 Refleksi Proyek (Project Reflection) - Sahabat Bradpitt

## Bab V: Refleksi, Analisis Kelemahan, & Rekomendasi Masa Depan

Dokumen ini memuat analisis mendalam pasca-pengembangan sistem Sahabat Bradpitt, mencakup pembelajaran berharga (*lessons learned*), identifikasi limitasi sistem, serta pertimbangan etika dalam tata kelola keamanan berbasis peran (**Role-Based Access Control / RBAC**).

---

### 5.1 Pembelajaran Berharga (Lessons Learned)

Selama siklus pengembangan tangkas (*agile development*) proyek ini, beberapa poin krusial berhasil dirumuskan:
1. **Keamanan Migrasi Database**: Kami membuktikan bahwa restrukturisasi nama kolom database (seperti `poster` $\rightarrow$ `local_poster`) dapat dilakukan dengan aman pada database berisi 1000+ catatan menggunakan perintah `RenameField` Django secara murni tanpa merusak data lama. Ini mengajarkan pentingnya pemahaman SQL dibalik ORM abstraction.
2. **Keterbacaan Kode Modular (Clean Code)**: Refaktorisasi file raksasa seperti `profile.js` (449 baris) menjadi 3 modul di bawah 200 baris (`profile_core.js`, `profile_lists.js`, `profile_preferences.js`) menurunkan kompleksitas kognitif secara drastis, menyederhanakan *debugging*, dan memudahkan kolaborasi antar pengembang.
3. **Penyelarasan Desain UI/UX Mobile**: Pembuatan fitur responsif seperti preferensi accordion dan dynamic tab transition membuktikan bahwa pengalaman mobile tidak boleh dipandang sebelah mata dalam arsitektur modern.

---

### 5.2 Limitasi & Keterbatasan Aplikasi (Bugs & Limitations)

Meskipun sistem telah lolos pengujian 100%, terdapat beberapa keterbatasan operasional:
- **Ketergantungan SQLite pada Beban Simultan**: Penggunaan SQLite bawaan sangat bagus untuk pengembangan lokal dan pengujian cepat. Namun, SQLite rentan terhadap masalah konkurensi (seperti kemunculan error *database is locked*) apabila beberapa admin mencoba memicu sinkronisasi TMDB massal secara bersamaan.
- **Variabilitas Format Wikipedia**: Importir penghargaan berbasis Wikipedia API sangat bergantung pada konsistensi penulisan tabel di halaman Wikipedia. Perubahan ekstrem pada tata letak halaman Wikipedia dapat menyebabkan ekstraksi gagal atau kurang akurat untuk film indie.

---

### 5.3 Etika Sistem Otorisasi & Akses Data (RBAC Ethics)

Penerapan Role-Based Access Control (RBAC) pada Sahabat Bradpitt bukan sekadar fitur teknis, melainkan perwujudan prinsip etika teknologi informasi:
1. **Prinsip Hak Akses Minimum (Principle of Least Privilege)**: Pengguna biasa (*Member*) tidak diberi akses ke panel editor atau persetujuan untuk menjaga integritas data katalog. Hal ini mencegah manipulasi data film secara tidak sah baik sengaja maupun tidak sengaja.
2. **Akuntabilitas & Audit Trail**: Setiap suntingan data oleh Kontributor wajib melalui proses persetujuan oleh Administrator. Alur kerja ini menjamin bahwa setiap perubahan data memiliki penanggung jawab yang jelas, meminimalisir penyebaran informasi palsu (*hoax*) mengenai penghargaan film.
3. **Pencegahan Eksploitasi Hak Akses (Privilege Escalation)**: Keamanan API dilindungi di sisi backend menggunakan autentikasi Django REST Framework kustom, memastikan pengguna jahat tidak dapat melakukan *bypass* hak akses hanya dengan memanipulasi elemen visual DOM di browser.

---

### 5.4 Rencana Iterasi & Pengembangan Selanjutnya (Future Work)

1. **Migrasi ke PostgreSQL**: Untuk lingkungan produksi komersial, database SQLite lokal harus segera dimigrasikan ke PostgreSQL untuk mendukung skalabilitas tinggi dan pembagian beban transaksi baca-tulis.
2. **Integrasi Celery & Redis (Asynchronous Processing)**: Proses sinkronisasi TMDB global dan importir Wikipedia penghargaan sebaiknya dipindahkan ke antrean latar belakang (*background workers*) menggunakan Celery untuk mencegah pemblokiran HTTP request-response thread utama.
3. **Penyempurnaan NLP Parser Wikipedia**: Meningkatkan kecerdasan ekstraksi parser penghargaan Wikipedia dengan memanfaatkan pustaka NLP (Natural Language Processing) agar lebih tahan terhadap aneka ragam format tabel Wikipedia.
