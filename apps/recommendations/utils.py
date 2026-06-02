import numpy as np

def compute_topsis(X, weights):
    """
    Menghitung kedekatan relatif TOPSIS untuk matriks keputusan X dan bobot weights.
    X: numpy array berukuran (m, n) di mana m = jumlah kandidat, n = jumlah kriteria.
    weights: numpy array berukuran (n,) yang berisi bobot tiap kriteria.
    Mengembalikan: numpy array skor berukuran (m,).
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
