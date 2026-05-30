# 🧠 Laporan Sistem Pendukung Keputusan (SPK) - Metode TOPSIS

## Aplikasi Sistem Cerdas Personalisasi Rekomendasi Film pada Sahabat Bradpitt

Laporan ini disusun secara akademis dan matematis untuk mendokumentasikan penerapan metode **TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution)** sebagai mesin rekomendasi film kustom pada platform Sahabat Bradpitt.

---

### 1. Latar Belakang & Masalah
Dalam era ledakan informasi digital, pengguna sering kali mengalami kesulitan dalam memilih film yang sesuai dengan selera mereka dari ribuan katalog yang tersedia (*information overload*). Rekomendasi global konvensional (seperti film terpopuler atau rating tertinggi) bersifat statis dan tidak merepresentasikan keunikan preferensi individu.

Untuk memecahkan masalah ini, Sahabat Bradpitt mengimplementasikan **Sistem Pendukung Keputusan (SPK)** multikriteria. Rekomendasi film diposisikan sebagai masalah **Multi-Criteria Decision Making (MCDM)**, di mana alternatif pilihan adalah kumpulan film, dan kriterianya ditentukan secara dinamis berdasarkan preferensi kustom pengguna. Metode **TOPSIS** dipilih karena memiliki konsep logis yang kuat, komputasi yang efisien untuk ribuan film lokal, serta mampu menghasilkan rekomendasi terdekat dengan preferensi ideal pengguna sekaligus terjauh dari film yang tidak disukainya.

---

### 2. Kriteria & Pembobotan Keputusan

Sistem menetapkan **4 Kriteria Utama ($C_j$)** yang bertindak sebagai dasar penilaian alternatif film. Seluruh kriteria dikategorikan sebagai **Benefit (Keuntungan)**, artinya semakin besar nilainya, semakin baik film tersebut:

| Kode | Nama Kriteria | Tipe Kriteria | Deskripsi Kriteria | Rentang Nilai Kriteria |
|:---|:---|:---|:---|:---|
| **$C_1$** | **Rating Rata-rata** | Benefit | Kualitas film berdasarkan rata-rata rating dari ulasan pengguna lokal. | $1.0 - 10.0$ |
| **$C_2$** | **Popularitas** | Benefit | Tingkat popularitas global film yang diambil dari data TMDB API. | $0.0 - 1000.0+$ |
| **$C_3$** | **Tahun Rilis** | Benefit | Kebaruan film (mengutamakan film modern atau tahun rilis terbaru). | Angka Tahun (e.g. $1900 - 2026$) |
| **$C_4$** | **Jumlah Ulasan** | Benefit | Akumulasi total ulasan/rating yang masuk untuk menguji validitas rating. | $0 - \infty$ |

Setiap pengguna memiliki kendali penuh melalui halaman profil untuk mengatur bobot preferensi kustom mereka ($w_j$) menggunakan skala Likert $1$ s.d. $5$, yang kemudian dinormalisasi oleh sistem agar total bobot $\sum w_j = 1$.

---

### 3. Tahapan Matematis Algoritma TOPSIS

Misalkan terdapat $m$ alternatif film ($A_i, i = 1, 2, ..., m$) dan $n$ kriteria ($C_j, j = 1, 2, ..., n$). Tahapan perhitungan matematis TOPSIS yang berjalan pada backend Django (`apps/recommendations/spk.py`) adalah sebagai berikut:

#### Langkah 3.1: Membentuk Matriks Keputusan ($X$)
Matriks keputusan $X$ berukuran $m \times n$ di mana baris mewakili alternatif film dan kolom mewakili kriteria:

$$X = \begin{pmatrix} 
x_{11} & x_{12} & \cdots & x_{1n} \\
x_{21} & x_{22} & \cdots & x_{2n} \\
\vdots & \vdots & \ddots & \vdots \\
x_{m1} & x_{m2} & \cdots & x_{mn}
\end{pmatrix}$$

Di mana $x_{ij}$ adalah nilai aktual kriteria ke-$j$ pada film ke-$i$.

#### Langkah 3.2: Normalisasi Matriks Keputusan ($R$)
Untuk menyamakan satuan skala kriteria yang berbeda (misalnya membandingkan tahun rilis ribuan dengan rating puluhan), matriks $X$ ditransformasikan ke matriks ternormalisasi $R$ menggunakan rumus Euclidean:

$$r_{ij} = \frac{x_{ij}}{\sqrt{\sum_{k=1}^{m} x_{kj}^2}}$$

Sehingga didapatkan matriks $R = [r_{ij}]_{m \times n}$.

#### Langkah 3.3: Pembobotan Matriks Ternormalisasi ($V$)
Mengalikan setiap kolom matriks $R$ dengan bobot preferensi ($w_j$) yang dikonfigurasi oleh pengguna:

$$v_{ij} = w_j \times r_{ij}$$

Membentuk matriks keputusan tertimbang $V = [v_{ij}]_{m \times n}$.

#### Langkah 3.4: Menentukan Solusi Ideal Positif ($A^+$) & Negatif ($A^-$)
Karena seluruh kriteria $C_1, C_2, C_3, C_4$ didefinisikan sebagai kriteria **Benefit**, maka:
- **Solusi Ideal Positif ($A^+$)** (nilai terbaik untuk setiap kriteria):
  $$A^+ = (y_1^+, y_2^+, ..., y_n^+)$$
  Di mana $y_j^+ = \max_i(v_{ij})$
- **Solusi Ideal Negatif ($A^-$)** (nilai terburuk untuk setiap kriteria):
  $$A^- = (y_1^-, y_2^-, ..., y_n^-)$$
  Di mana $y_j^- = \min_i(v_{ij})$

#### Langkah 3.5: Menghitung Jarak Euclidean Alternatif ($D^+$ & $D^-$)
Menghitung seberapa dekat suatu film dengan solusi ideal positif ($D_i^+$) dan seberapa jauh dari solusi ideal negatif ($D_i^-$):

- **Jarak ke Solusi Ideal Positif ($D_i^+$)**:
  $$D_i^+ = \sqrt{\sum_{j=1}^{n} (v_{ij} - y_j^+)^2}$$
- **Jarak ke Solusi Ideal Negatif ($D_i^-$)**:
  $$D_i^- = \sqrt{\sum_{j=1}^{n} (v_{ij} - y_j^-)^2}$$

#### Langkah 3.6: Menghitung Nilai Preferensi Kedekatan Relatif ($V_i$)
Nilai preferensi $V_i$ dihitung untuk setiap alternatif film:

$$V_i = \frac{D_i^-}{D_i^+ + D_i^-}$$

Nilai $V_i$ mutlak berada pada rentang ketat $[0.0, 1.0]$. Nilai $V_i$ mendekati $1.0$ menunjukkan film tersebut sangat mendekati preferensi ideal pengguna.

#### Langkah 3.7: Perangkatan (Ranking)
Alternatif film diurutkan secara menurun (*descending*) berdasarkan nilai $V_i$. Film dengan nilai $V_i$ tertinggi disajikan sebagai rekomendasi utama.

---

### 4. Studi Kasus Perhitungan Riil (Demonstrasi)

Misalkan kita memiliki 3 alternatif film dengan data sebagai berikut:
1. **$A_1$ (Fight Club)**: Rating = $8.8$, Popularitas = $92.5$, Tahun = $1999$, Ulasan = $120$
2. **$A_2$ (Inglourious Basterds)**: Rating = $8.3$, Popularitas = $78.4$, Tahun = $2009$, Ulasan = $90$
3. **$A_3$ (Mock Film)**: Rating = $7.2$, Popularitas = $50.0$, Tahun = $2015$, Ulasan = $40$

Dan pengguna mengonfigurasi bobot kustom ternormalisasi:
- $w_{rating} = 0.40$
- $w_{pop} = 0.30$
- $w_{year} = 0.20$
- $w_{reviews} = 0.10$

#### Tahap 1: Matriks Keputusan $X$
$$X = \begin{pmatrix}
8.8 & 92.5 & 1999 & 120 \\
8.3 & 78.4 & 2009 & 90 \\
7.2 & 50.0 & 2015 & 40
\end{pmatrix}$$

#### Tahap 2: Pembagi Normalisasi (Euclidean Sum)
- Untuk $C_1$: $\sqrt{8.8^2 + 8.3^2 + 7.2^2} = \sqrt{77.44 + 68.89 + 51.84} = \sqrt{198.17} \approx 14.077$
- Untuk $C_2$: $\sqrt{92.5^2 + 78.4^2 + 50.0^2} = \sqrt{8556.25 + 6146.56 + 2500.0} = \sqrt{17202.81} \approx 131.159$
- Untuk $C_3$: $\sqrt{1999^2 + 2009^2 + 2015^2} = \sqrt{3996001 + 4036081 + 4060225} = \sqrt{12092307} \approx 3477.40$
- Untuk $C_4$: $\sqrt{120^2 + 90^2 + 40^2} = \sqrt{14400 + 8100 + 1600} = \sqrt{24100} \approx 155.24$

#### Tahap 3: Matriks Ternormalisasi $R$
$$R = \begin{pmatrix}
0.625 & 0.705 & 0.575 & 0.773 \\
0.590 & 0.598 & 0.578 & 0.580 \\
0.511 & 0.381 & 0.579 & 0.258
\end{pmatrix}$$

#### Tahap 4: Matriks Tertimbang $V$ ($v_{ij} = w_j \times r_{ij}$)
$$V = \begin{pmatrix}
0.250 & 0.212 & 0.115 & 0.077 \\
0.236 & 0.179 & 0.116 & 0.058 \\
0.204 & 0.114 & 0.116 & 0.026
\end{pmatrix}$$

#### Tahap 5: Menentukan Solusi Ideal Positif ($A^+$) & Negatif ($A^-$)
- **$A^+$ (Max)** = $(0.250,  0.212,  0.116,  0.077)$
- **$A^-$ (Min)** = $(0.204,  0.114,  0.115,  0.026)$

#### Tahap 6: Jarak Ideal Positif ($D^+$) & Negatif ($D^-$)

##### Film $A_1$ (Fight Club):
- $D_1^+ = \sqrt{(0.250 - 0.250)^2 + (0.212 - 0.212)^2 + (0.115 - 0.116)^2 + (0.077 - 0.077)^2} \approx 0.001$
- $D_1^- = \sqrt{(0.250 - 0.204)^2 + (0.212 - 0.114)^2 + (0.115 - 0.115)^2 + (0.077 - 0.026)^2} \approx \sqrt{0.0021 + 0.0096 + 0 + 0.0026} \approx 0.120$
- **Preferensi $V_1$**: $\frac{0.120}{0.001 + 0.120} \approx \mathbf{0.992}$ (Sangat Direkomendasikan!)

##### Film $A_3$ (Mock Film):
- $D_3^+ = \sqrt{(0.204 - 0.250)^2 + (0.114 - 0.212)^2 + (0.116 - 0.116)^2 + (0.026 - 0.077)^2} \approx 0.119$
- $D_3^- = \sqrt{(0.204 - 0.204)^2 + (0.114 - 0.114)^2 + (0.116 - 0.115)^2 + (0.026 - 0.026)^2} \approx 0.001$
- **Preferensi $V_3$**: $\frac{0.001}{0.119 + 0.001} \approx \mathbf{0.008}$ (Kurang Direkomendasikan)

Peringkat Akhir Rekomendasi: **$A_1$ (Fight Club)** $\rightarrow$ **$A_2$ (Inglourious Basterds)** $\rightarrow$ **$A_3$ (Mock Film)**.

---

### 5. Hasil Visual & Integrasi Sistem

Hasil kalkulasi di sisi backend dikirimkan dalam format API JSON terstruktur yang mengekspos properti baru database:
```json
{
  "id": 1,
  "title": "Fight Club",
  "local_poster": "/media/films/posters/fight_club.jpg",
  "tmdb_poster": "/a234jhgasd.jpg",
  "topsis_score": 0.992,
  "reasoning": "Film ini direkomendasikan karena memiliki rating rata-rata yang sangat tinggi (8.8) dan tingkat popularitas global yang luar biasa (92.5), sangat sesuai dengan preferensi kriteria kualitas utama Anda."
}
```

Javascript pada frontend (`static/js/movies/recommendations.js` & `profile_lists.js`) menangkap data ini dan merender kartu film secara dinamis. Kode frontend secara cerdas memprioritaskan penampilan poster lokal (`local_poster`) sebelum poster TMDB (`tmdb_poster`) demi estetika dan optimasi *bandwidth*.
