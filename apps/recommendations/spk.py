import numpy as np
from apps.films.models import Genre

class TopsisSPK:
    """
    Sistem Pendukung Keputusan (SPK) menggunakan metode TOPSIS (Technique for Order 
    of Preference by Similarity to Ideal Solution) untuk mengurutkan film terbaik.
    """
    
    # Bobot untuk masing-masing kriteria (total = 1.0)
    # C1: avg_rating (40%), C2: popularity (30%), C3: kesesuaian genre (20%), C4: kesesuaian era (10%)
    WEIGHTS = np.array([0.4, 0.3, 0.2, 0.1])
    
    @classmethod
    def calculate_scores(cls, candidates, preferences):
        """
        Kalkulasi TOPSIS untuk kandidat film.
        Mengembalikan list dari dict berisi: film, score, dan reasoning.
        """
        if not candidates:
            return []

        # Ambil preferensi genre dan mood untuk hitung kesesuaian genre (C3)
        selected_genre_ids = preferences.get("genres", [])
        mood = preferences.get("mood", "")
        mood_genres = []
        if mood:
            if mood == "santai":
                mood_genres = ["Komedi", "Animasi", "Keluarga", "Comedy", "Animation", "Family"]
            elif mood == "tegang":
                mood_genres = ["Thriller", "Horor", "Aksi", "Action", "Horror", "Misteri", "Mystery"]
            elif mood == "sedih":
                mood_genres = ["Drama", "Romantis", "Romance"]
            elif mood == "semangat":
                mood_genres = ["Aksi", "Action", "Petualangan", "Adventure", "Sci-Fi", "Science Fiction"]

        # Siapkan Matriks Keputusan (X) ukuran: m x 4
        m = len(candidates)
        X = np.zeros((m, 4))
        
        films_list = list(candidates)
        era_pref = preferences.get("era", "")

        for i, film in enumerate(films_list):
            # C1: avg_rating (Benefit)
            X[i, 0] = film.avg_rating if film.avg_rating > 0 else 5.0 # default jika belum ada rating

            # C2: popularity (Benefit)
            X[i, 1] = film.popularity

            # C3: kesesuaian genre (Benefit)
            film_genre_names = [g.name for g in film.genre.all()]
            film_genre_ids = [g.id for g in film.genre.all()]
            
            genre_score = 0.0
            # Hitung kecocokan genre pilihan user
            matched_selected = set(film_genre_ids).intersection(set(selected_genre_ids))
            # Hitung kecocokan genre mood
            matched_mood = 0
            for name in mood_genres:
                for fg_name in film_genre_names:
                    if name.lower() in fg_name.lower():
                        matched_mood += 1
                        break
            
            total_matches = len(matched_selected) + matched_mood
            if total_matches > 0:
                # Normalisasi skor genre ke rentang 0-1
                genre_score = min(1.0, total_matches / max(1, len(film_genre_names)))
            X[i, 2] = genre_score

            # C4: kesesuaian era (Benefit)
            era_score = 0.0
            year = film.release_year
            if year:
                if era_pref == "klasik" and year < 1990:
                    era_score = 1.0
                elif era_pref == "90s" and 1990 <= year <= 1999:
                    era_score = 1.0
                elif era_pref == "2000s" and 2000 <= year <= 2009:
                    era_score = 1.0
                elif era_pref == "2010s" and 2010 <= year <= 2019:
                    era_score = 1.0
                elif era_pref == "terbaru" and year >= 2020:
                    era_score = 1.0
                else:
                    # Selisih dekat mendapat skor parsial 0.5
                    era_score = 0.5
            X[i, 3] = era_score

        # --- LANGKAH-LANGKAH MATEMATIS TOPSIS ---

        # 1. Normalisasi Matriks Keputusan (R)
        # Norm = akar dari kuadrat sum kolom
        norm = np.sqrt(np.sum(X**2, axis=0))
        R = np.zeros_like(X)
        for j in range(4):
            if norm[j] > 0:
                R[:, j] = X[:, j] / norm[j]
            else:
                R[:, j] = 0.0

        # 2. Perkalian Matriks Normalisasi dengan Bobot (V)
        V = R * cls.WEIGHTS

        # 3. Tentukan Solusi Ideal Positif (A+) dan Solusi Ideal Negatif (A-)
        # Karena semua kriteria (C1-C4) bertipe Benefit (makin besar makin baik):
        A_plus = np.max(V, axis=0)
        A_minus = np.min(V, axis=0)

        # 4. Hitung Jarak Solusi Ideal Positif (D+) dan Negatif (D-)
        D_plus = np.sqrt(np.sum((V - A_plus)**2, axis=1))
        D_minus = np.sqrt(np.sum((V - A_minus)**2, axis=1))

        # 5. Hitung Skor Preferensi Kedekatan Relatif (Score)
        # Score = D- / (D+ + D-)
        scores = np.zeros(m)
        for i in range(m):
            denominator = D_plus[i] + D_minus[i]
            if denominator > 0:
                scores[i] = D_minus[i] / denominator
            else:
                # Jika jaraknya identik (misal hanya 1 kandidat), berikan skor 1.0
                scores[i] = 1.0

        # Siapkan Hasil Rekomendasi Terurut
        results = []
        for i, film in enumerate(films_list):
            score = round(float(scores[i]), 4)
            
            # Buat teks penjelasan dinamis (Reasoning)
            reasons = []
            if film.avg_rating >= 8.0:
                reasons.append("ratingnya yang sangat tinggi")
            if film.popularity >= 80.0:
                reasons.append("sangat populer di kalangan penonton")
            if X[i, 2] >= 0.7:
                reasons.append("sangat sesuai dengan genre pilihan")
            elif X[i, 2] >= 0.4:
                reasons.append("memiliki genre yang cocok")
            if X[i, 3] == 1.0:
                reasons.append(f"dirilis tepat di era {era_pref or 'yang sesuai'}")
                
            reason_str = "Cocok karena " + ", ".join(reasons) if reasons else "Sesuai dengan kriteria preferensi Anda."

            results.append({
                "film_id": film.id,
                "title": film.title,
                "score": score,
                "reason": reason_str
            })

        # Urutkan berdasarkan skor TOPSIS tertinggi ke terendah
        results = sorted(results, key=lambda x: x["score"], reverse=True)
        return results
