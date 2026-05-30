# 🧪 Laporan Pengujian (Test Report) - Sahabat Bradpitt

## Bab IV: Hasil Implementasi & Pengujian Sistem

Laporan ini menyajikan hasil pengujian formal terhadap sistem Sahabat Bradpitt untuk menjamin kualitas perangkat lunak (*software quality assurance*). Pengujian dilakukan menggunakan metode **Automated Unit Testing** via Django Test Runner dan **Manual Black-Box Testing** untuk elemen fungsionalitas dan antarmuka.

---

### 4.1 Hasil Automated Unit Testing

Sistem memanfaatkan modul pengujian bawaan Django (`django.test`) dan Django REST Framework (`APITestCase`) untuk menguji aspek keamanan, logika bisnis SPK TOPSIS, aturan sistem pakar, dan integritas API.

#### Log Hasil Eksekusi Unit Test:
```bash
> python manage.py test apps/films/ apps/recommendations/
Creating test database for alias 'default'...
Found 9 test(s).
System check identified no issues (0 silenced).
.........
----------------------------------------------------------------------
Ran 9 tests in 4.645s

OK
Destroying test database for alias 'default'...
```

#### Ringkasan Cakupan Unit Test:
1. **`FilmImageTests`** (5 Skenario - `apps.films`):
   - `test_anonymous_and_regular_user_cannot_upload`: Memverifikasi Tamu/Pengguna biasa ditolak saat mencoba mengunggah poster/foto film.
   - `test_admin_can_upload_valid_image`: Menguji Administrator dapat sukses mengunggah gambar latar belakang lokal.
   - `test_upload_invalid_file_type`: Memastikan tipe berkas non-gambar (seperti .txt) ditolak sistem secara otomatis.
   - `test_upload_oversized_file`: Memvalidasi pembatasan ukuran berkas maksimal 5MB.
   - `test_admin_can_delete_image`: Menguji penghapusan fisik berkas dari server media saat data dihapus oleh admin.
2. **`RecommendationSystemTestCase`** (4 Skenario - `apps.recommendations`):
   - `test_expert_system_filtering`: Menguji keakuratan filter aturan IF-THEN (Era, Durasi, Genre) dalam memangkas kandidat film.
   - `test_topsis_calculation_bounds`: Memastikan nilai skor akhir preferensi TOPSIS berada di rentang ketat $[0.0, 1.0]$.
   - `test_recommendation_api_anonymous`: Memverifikasi tamu tanpa login dapat menerima rekomendasi cerdas dan tercatat di log anonim.
   - `test_recommendation_api_authenticated`: Memverifikasi kalkulasi rekomendasi personal untuk pengguna terdaftar terintegrasi dan tercatat dalam riwayat log user.

---

### 4.2 Skenario Pengujian Manual (Black-Box Testing)

Tabel berikut menunjukkan skenario pengujian fungsionalitas manual yang dijalankan pada modul-modul penting:

| ID | Komponen / Fitur | Skenario Pengujian | Hasil yang Diharapkan | Status |
|:---|:---|:---|:---|:---|
| **BBT-01** | **Role-Based Access Control** | Mencoba mengakses halaman admin (`/admin/` atau `/editor/`) menggunakan akun ber-peran *Member* biasa. | Sistem menampilkan halaman 403 Forbidden atau mengalihkan ke login dengan pesan kesalahan akses. | **PASS** |
| **BBT-02** | **Pencarian Cerdas (Smart Search)** | Memasukkan kata kunci parsial "Fight" di bilah pencarian film. | Menampilkan film dengan judul mengandung kata kunci. "Fight Club" (eksak) diletakkan paling atas, disusul judul parsial lainnya. | **PASS** |
| **BBT-03** | **TOPSIS Recommendation** | Mengubah preferensi bobot di profil (misal: memaksimumkan bobot "Tahun Rilis" dan meminimumkan bobot "Popularitas"). | Nilai prioritas film tahun rilis terbaru melesat ke peringkat teratas dalam list rekomendasi visual. | **PASS** |
| **BBT-04** | **Mobile Responsive Profile** | Mengubah lebar browser menjadi $\le 768px$ pada halaman profil. | Panel preferensi TOPSIS melipat menjadi Accordion yang hemat ruang dan tombol "Lihat Selengkapnya" muncul pada watchlist mobile. | **PASS** |
| **BBT-05** | **Accordion Klik Interaction** | Melakukan klik pada header preferensi accordion di ponsel. | Panel kriteria TOPSIS terbuka dengan animasi transisi CSS yang sangat halus. | **PASS** |
| **BBT-06** | **Active Tab Smooth Slide** | Berpindah tab profil dari "Ulasan" ke "Daftar Tontonan" di perangkat mobile. | Garis penanda aktif (*active bar*) bergeser secara mulus di bawah judul tab menggunakan manipulasi CSS dynamic translation. | **PASS** |
| **BBT-07** | **Wikipedia Importer** | Menjalankan importir penghargaan Wikipedia untuk film rilisan tahun 2008. | Prosesor mendeteksi `release_year` film dengan tepat dan menarik daftar nominasi/kemenangan dari Wikipedia API tanpa crash. | **PASS** |
| **BBT-08** | **SQLite Lock Mitigation** | Memicu sinkronisasi massal 50+ poster film TMDB dari panel admin. | Sinkronisasi berjalan sekuensial satu-per-satu. Tidak ada kemunculan error *database is locked* pada database SQLite lokalan. | **PASS** |

---

### 4.3 Kesimpulan Kelayakan Sistem
Berdasarkan hasil pengujian otomatis dan manual yang mencatatkan tingkat keberhasilan **100% (Zero Errors)**, sistem Sahabat Bradpitt dinyatakan **Sangat Layak** untuk dideploy ke lingkungan produksi dan siap dipresentasikan di hadapan dewan penguji Tugas Akhir/Skripsi.
