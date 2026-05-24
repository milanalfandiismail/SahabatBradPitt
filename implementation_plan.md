# Rencana Implementasi — Rombak Pagination, Hapus AI Recommendations, & Perbaikan Trending Card Layout

Rencana pengerjaan ini berfokus pada tiga pembaruan UX & Layout utama:
1. **Rombak Pagination:** Mengganti sistem lazy loading/infinite scroll dengan navigasi nomor halaman standard (Previous, Page Numbers, Next) yang elegan di katalog film dan katalog aktor.
2. **Pembersihan AI Recommendations:** Menghapus halaman AI Recommendations dari routing, navigasi navbar, dan tombol kuesioner di landing page, karena fitur kuesioner ini akan dialihkan ketika pengguna melakukan pendaftaran akun (signup/register) baru.
3. **Penyelarasan Layout Trending Carousel:** Memperbaiki masalah penyusutan layout pada card ke-3 di carousel "Trending This Week" pada Home page yang mengecil hingga 1/4 lebar aslinya.

---

## Proposed Changes

### 1. Rombak Pagination (Standard Page-Based Navigation)

Sistem *lazy loading* (infinite scroll) akan digantikan dengan tombol kontrol navigasi halaman yang terletak di bawah grid konten pada halaman katalog film dan katalog aktor.

#### [MODIFY] [film_list.html](file:///e:/GIT/SahabatBradPitt/templates/film_list.html)
*   Hapus sentinel `load-more-sentinel` dan system observer.
*   Tambahkan container baru untuk kontrol halaman:
    ```html
    <div id="pagination-controls" class="mt-8 flex justify-center items-center gap-2 font-['DM_Sans'] text-sm">
        <!-- Generasi tombol Previous, Angka Halaman, dan Next -->
    </div>
    ```
*   Perbarui logic JavaScript `fetchFilms(page)` agar:
    *   Mengosongkan grid film saat memuat halaman baru (tidak di-append).
    *   Menerima parameter `page` dan memperbarui `currentPage`.
    *   Mendapatkan total data dari `data.count` dan menghitung `totalPages = Math.ceil(totalCount / 12)`.
    *   Membuat tombol halaman dinamis dengan active state (contoh warna latar `#715A5A` untuk halaman aktif, borders transparan untuk halaman tidak aktif).
    *   Reset pencarian, filter genre, rilis, rating, atau pengurutan akan langsung mengarahkan ke halaman `page = 1`.

#### [MODIFY] [actor_list.html](file:///e:/GIT/SahabatBradPitt/templates/actor_list.html)
*   Terapkan struktur kontrol halaman `#pagination-controls` yang sama dengan katalog film di bagian bawah grid aktor.
*   Logika JavaScript diperbarui serupa dengan `film_list.html` untuk memuat data per halaman dan me-render kontrol nomor halaman dinamis.

---

### 2. Pembersihan Halaman & Link AI Recommendations

Fitur rekomendasi AI akan ditiadakan dari akses menu utama karena proses ini akan dialihkan di fase registrasi baru pengguna di masa mendatang.

#### [MODIFY] [base.html](file:///e:/GIT/SahabatBradPitt/templates/base.html)
*   Hapus tautan navbar `nav-recommendations` ("AI Recommendations") pada navbar menu utama di line 125.
*   Sesuaikan data routing deteksi aktif di script navbar highlight agar tidak mereferensikan `/recommendations/`.

#### [MODIFY] [home.html](file:///e:/GIT/SahabatBradPitt/templates/home.html)
*   Hapus tombol **"AI Kuesioner"** (dengan icon `psychology`) yang berada di samping tombol "Detail Film" di dalam Hero Banner.

#### [MODIFY] [urls.py](file:///e:/GIT/SahabatBradPitt/config/urls.py)
*   Nonaktifkan / hapus path route `'recommendations/'` dari list `urlpatterns`.

---

### 3. Penyelarasan Layout Trending Carousel di Home Page

Card ke-3 di Trending This Week terkadang menciut karena pembungkus gambar (`inner`) kehilangan lebar dasar eksplisit `w-full` di dalam layout horizontal flex.

#### [MODIFY] [home.html](file:///e:/GIT/SahabatBradPitt/templates/home.html)
*   Di dalam loop pembuatan card `trending-carousel` di script JavaScript `home.html`, tambahkan kelas `w-full` ke element `inner`.
    ```javascript
    const inner = document.createElement("div");
    inner.className = "w-full bg-[#37353E] rounded-lg overflow-hidden border border-white/5 group-hover:scale-[1.03] group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-300 aspect-[2/3] relative";
    ```
*   Ini memastikan element `inner` selalu melebar penuh mengikuti lebar pembungkus card (`min-w-[200px] md:min-w-[240px]`) dan mempertahankan rasio aspek 2:3 tanpa menciut di browser mana pun.

---

## Verification Plan

### Automated Tests
*   `python manage.py check` — Memastikan tidak ada error syntax.

### Manual Verification
1.  **Navigasi Halaman (Pagination):**
    *   Buka `/movies/` -> verifikasi grid hanya memuat maksimal 12 film dan menampilkan kontrol nomor halaman di bawah.
    *   Klik nomor `2` -> memuat 12 film berikutnya, grid terhapus dan diisi ulang dengan data baru. Halaman aktif ditandai dengan warna kontras.
    *   Lakukan filter atau pencarian -> tombol halaman direset kembali ke halaman `1`.
2.  **Pembersihan AI Recommendations:**
    *   Buka web -> cek navbar sudah tidak ada tautan "AI Recommendations".
    *   Buka landing page -> cek Hero banner sudah tidak menampilkan tombol "AI Kuesioner".
    *   Coba ketik alamat `/recommendations/` di browser -> harus mengarah ke error 404 (tidak ditemukan).
3.  **Perbaikan Layout Trending Card:**
    *   Buka halaman utama -> scroll ke bagian "Trending This Week". Cek apakah card ketiga sejajar, proporsional, dan memiliki lebar 100% yang sama seperti card ke-1, 2, 4, dan 5.
