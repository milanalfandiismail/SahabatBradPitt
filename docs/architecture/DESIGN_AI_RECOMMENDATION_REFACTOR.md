# 📑 Desain Perbaikan Rekomendasi AI & Refaktor Arsitektur Bersih

Dokumen desain ini memuat spesifikasi teknis untuk merestrukturisasi modul TOPSIS (Clean Code & SRP), merapikan tata letak responsif pada perangkat mobile, serta menyelaraskan dokumen tugas RPL dan pengembang.

---

## 📌 Ringkasan Pemahaman

*   **Tujuan:**
    *   Mengatasi masalah teks judul panjang (~45 karakter) yang meluap dari kartu rekomendasi di mobile.
    *   Menghilangkan redundansi (duplikasi kode) kalkulasi TOPSIS di backend.
    *   Membersihkan dokumen akademik (RPL) dan panduan pengembang dari fitur Wikipedia Importer yang telah dihapus, sambil mempertahankan alur persetujuan Admin/Superadmin.
*   **Ruang Lingkup:**
    *   Backend: Aplikasi Django `apps/recommendations/`.
    *   Frontend: File JavaScript dinamis `static/js/movies/recommendations.js`.
    *   Dokumentasi: Berkas di direktori `RPL/` dan `docs/`.

---

## 🔍 Asumsi Utama

1.  Dukungan Browser: Browser mobile modern yang mendukung properti CSS Flexbox (`min-w-0`, `line-clamp`, `break-words`).
2.  Performa: Batasan pagination default (5 item per halaman) dipertahankan demi efisiensi konsumsi memori browser mobile.

---

## 🪵 Log Keputusan (Decision Log)

| No | Keputusan | Alternatif Dipertimbangkan | Mengapa Dipilih |
|---|---|---|---|
| 1 | **UI Mobile:** Pendekatan 1.A (Modifikasi kelas flex dinamis langsung pada JavaScript). | Pendekatan 1.B (Menggunakan file stylesheet CSS global terpisah). | Modifikasi terpusat pada generator kartu rekomendasi di JS, menjaga modularitas, dan menghindari polusi stylesheet global. |
| 2 | **Backend:** Pendekatan 2.A (Ekstraksi kalkulasi TOPSIS matematis ke `utils.py`). | Pendekatan 2.B (Penyatuan seluruh logika di satu kelas fasad `spk.py`). | Mematuhi prinsip DRY & SRP sepenuhnya dengan memisahkan ekstraksi fitur domain dari perhitungan matematika murni. |
| 3 | **Dokumen RPL:** Opsi A (Penghapusan total Wikipedia, fokus ke TMDB & TOPSIS, pertahankan alur Superadmin). | Opsi B (Penjelasan Wikipedia didepresiasi) & Opsi C (Mengganti Wikipedia dengan API lain). | Menyelaraskan dokumen dengan codebase nyata untuk menghindari *documentation-code drift*, namun tetap menjaga bobot fungsionalitas superadmin untuk kriteria penilaian tugas. |

---

## 📐 Spesifikasi Desain Akhir

### 1. Refaktor Backend (Clean Code / SRP)

Kita akan memisahkan perhitungan matematis TOPSIS murni ke dalam fungsi utilitas `compute_topsis`.

*   **`apps/recommendations/utils.py` [NEW]:**
    ```python
    import numpy as np

    def compute_topsis(X: np.ndarray, weights: np.ndarray) -> np.ndarray:
        """
        Menghitung kedekatan relatif TOPSIS untuk matriks keputusan X dan bobot weights.
        X: array berukuran (m, n) di mana m = jumlah kandidat, n = jumlah kriteria.
        weights: array berukuran (n,) yang berisi bobot tiap kriteria.
        Mengembalikan array skor berukuran (m,).
        """
        m = len(X)
        if m == 0:
            return np.array([])

        # 1. Normalisasi Matriks Keputusan
        norm = np.sqrt(np.sum(X**2, axis=0))
        R = np.zeros_like(X)
        for j in range(X.shape[1]):
            if norm[j] > 0:
                R[:, j] = X[:, j] / norm[j]

        # 2. Pembobotan Matriks Ternormalisasi
        V = R * weights

        # 3. Identifikasi Solusi Ideal Positif (A+) & Negatif (A-)
        A_plus = np.max(V, axis=0)
        A_minus = np.min(V, axis=0)

        # 4. Hitung Jarak Euclidean ke Solusi Ideal Positif & Negatif
        D_plus = np.sqrt(np.sum((V - A_plus)**2, axis=1))
        D_minus = np.sqrt(np.sum((V - A_minus)**2, axis=1))

        # 5. Hitung Nilai Preferensi Kedekatan
        scores = np.zeros(m)
        for i in range(m):
            denominator = D_plus[i] + D_minus[i]
            scores[i] = D_minus[i] / denominator if denominator > 0 else 1.0

        return scores
    ```

*   **`topsis_user.py` & `topsis_similarity.py` [MODIFY]:**
    *   Hapus kode pengulangan normalisasi, pembobotan, dan kalkulasi jarak.
    *   Import dan panggil `compute_topsis(X, weights_to_use)` untuk mendapatkan skor numerik.

### 2. Penyelarasan Layout Mobile (Frontend)

Modifikasi elemen HTML di `static/js/movies/recommendations.js` saat membuat kartu film:

*   **Container Teks (`content`):**
    ```javascript
    const content = document.createElement("div");
    content.className = "flex-grow flex flex-col gap-2 justify-center min-w-0 w-full";
    ```
*   **Judul Film (`title`):**
    ```javascript
    const title = document.createElement("h3");
    title.className = "font-['Playfair_Display'] text-xl font-bold text-white line-clamp-2 break-words whitespace-normal";
    title.textContent = item.title;
    ```

### 3. Pembaruan Dokumen Tugas RPL & Docs

*   Diagram dan tabel C4 & UML akan dirender ulang tanpa entitas Wikipedia.
*   Tabel kasus uji dan panduan presentasi disesuaikan hanya berfokus pada sinkronisasi TMDB, TOPSIS AI, dan alur persetujuan superadmin.
