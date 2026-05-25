import numpy as np
from apps.films.models import Genre

class TopsisSPK:
    """
    Sistem Pendukung Keputusan (SPK) menggunakan metode TOPSIS (Technique for Order 
    of Preference by Similarity to Ideal Solution) untuk mengurutkan film terbaik.
    """
    
    # Bobot untuk masing-masing kriteria (total = 1.0)
    # C1: avg_rating, C2: popularity, C3: kesesuaian genre, C4: kesesuaian era, C5: kesesuaian durasi, C6: history match
    WEIGHTS = np.array([0.25, 0.2, 0.2, 0.1, 0.1, 0.15])
    
    @classmethod
    def calculate_scores(cls, candidates, preferences, weights=None):
        """
        Kalkulasi TOPSIS untuk kandidat film.
        Mengembalikan list dari dict berisi: film, score, dan reasoning.
        """
        if not candidates:
            return []

        # Tentukan weights berdasarkan focus jika weights eksplisit tidak diberikan
        weights_to_use = weights
        if weights_to_use is None:
            focus = preferences.get("focus", "balanced")
            if focus == "rating":
                weights_to_use = np.array([0.5, 0.1, 0.1, 0.1, 0.1, 0.1])
            elif focus == "popular":
                weights_to_use = np.array([0.1, 0.5, 0.1, 0.1, 0.1, 0.1])
            elif focus == "genre":
                weights_to_use = np.array([0.1, 0.1, 0.5, 0.1, 0.1, 0.1])
            else: # balanced
                weights_to_use = cls.WEIGHTS

        # Ambil preferensi genre
        selected_genre_ids = preferences.get("genres", [])

        user_id = preferences.get("user_id")
        history_genre_ids = set()
        history_actor_ids = set()
        
        if user_id:
            from apps.ratings.models import Rating
            from apps.films.models import Film
            high_rated_films = Rating.objects.filter(user_id=user_id, score__gte=7).values_list('film_id', flat=True)
            if high_rated_films:
                films = Film.objects.filter(id__in=high_rated_films).prefetch_related('genre', 'filmographies')
                for f in films:
                    history_genre_ids.update(f.genre.values_list('id', flat=True))
                    history_actor_ids.update(f.filmographies.values_list('actor_id', flat=True))

        # Siapkan Matriks Keputusan (X) ukuran: m x 6
        m = len(candidates)
        X = np.zeros((m, 6))
        
        films_list = list(candidates)
        era_pref = preferences.get("era", "")
        duration_pref = preferences.get("duration", "")

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
            
            total_matches = len(matched_selected)
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

            # C5: kesesuaian durasi (Benefit)
            duration_score = 0.0
            dur = film.duration
            if dur:
                if duration_pref == "pendek":
                    if dur < 100: duration_score = 1.0
                    elif dur <= 120: duration_score = 0.5
                elif duration_pref == "sedang":
                    if 100 <= dur <= 140: duration_score = 1.0
                    else: duration_score = 0.5
                elif duration_pref == "panjang":
                    if dur > 140: duration_score = 1.0
                    elif dur >= 120: duration_score = 0.5
            X[i, 4] = duration_score

            # C6: History Match (Benefit)
            history_score = 0.0
            if user_id and history_genre_ids:
                cand_actors = set(film.filmographies.values_list('actor_id', flat=True))
                match_g = len(set(film_genre_ids).intersection(history_genre_ids)) / max(1, len(film_genre_ids))
                match_a = len(cand_actors.intersection(history_actor_ids)) / max(1, len(cand_actors))
                history_score = (match_g * 0.4) + (match_a * 0.6)
            X[i, 5] = history_score

        # --- LANGKAH-LANGKAH MATEMATIS TOPSIS ---

        # 1. Normalisasi Matriks Keputusan (R)
        # Norm = akar dari kuadrat sum kolom
        norm = np.sqrt(np.sum(X**2, axis=0))
        R = np.zeros_like(X)
        for j in range(6):
            if norm[j] > 0:
                R[:, j] = X[:, j] / norm[j]
            else:
                R[:, j] = 0.0

        # 2. Perkalian Matriks Normalisasi dengan Bobot (V)
        V = R * weights_to_use

        # 3. Tentukan Solusi Ideal Positif (A+) dan Solusi Ideal Negatif (A-)
        # Karena semua kriteria (C1-C5) bertipe Benefit (makin besar makin baik):
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
            if X[i, 4] == 1.0:
                reasons.append(f"memiliki durasi {duration_pref or 'yang pas'}")
            if X[i, 5] >= 0.5:
                reasons.append("mirip dengan preferensi historis Anda")
                
            reason_str = "Cocok karena " + ", ".join(reasons) if reasons else "Sesuai dengan kriteria preferensi Anda."

            results.append({
                "id": film.id,
                "title": film.title,
                "poster_path": film.poster_path,
                "avg_rating": film.avg_rating,
                "release_year": film.release_year,
                "duration": film.duration,
                "topsis_score": score,
                "reasoning": reason_str
            })

        # Urutkan berdasarkan skor TOPSIS tertinggi ke terendah
        results = sorted(results, key=lambda x: x["topsis_score"], reverse=True)
        return results

    @staticmethod
    def _text_to_words(text):
        if not text:
            return set()
        stopwords = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'of', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'has', 'have', 'had', 'this', 'that', 'it', 'its', 'he', 'him', 'his', 'she', 'her', 'they', 'them', 'their', 'who', 'whom', 'which', 'to', 'with', 'about', 'after', 'before'}
        words = [w.strip('.,;:!?\"\'()[]{}*-_').lower() for w in text.split()]
        return {w for w in words if len(w) >= 3 and w not in stopwords}

    @classmethod
    def calculate_similarity_scores(cls, base_film, candidates):
        """
        Kalkulasi TOPSIS khusus untuk mencari film yang paling mirip (Content-Based Similarity).
        Menggunakan 6 kriteria: C1 (Genre Jaccard), C2 (Synopsis Jaccard), C3 (Title Overlap), C4 (Studio Match), C5 (Director Match), C6 (Cast Match).
        Semuanya adalah atribut bertipe Benefit.
        Bobot Kustom: C1: 25%, C2: 20%, C3: 10%, C4: 15%, C5: 15%, C6: 15%.
        """
        if not candidates:
            return []
            
        m = len(candidates)
        X = np.zeros((m, 6))
        films_list = list(candidates)
        
        # Ekstrak fitur dari film dasar (base_film)
        base_genres = set(base_film.genre.all())
        base_words = cls._text_to_words(base_film.synopsis)
        base_title_words = cls._text_to_words(base_film.title)
        base_studio = base_film.studio
        base_directors = set(base_film.filmographies.filter(role__icontains='sutradara').values_list('actor_id', flat=True))
        base_cast = set(base_film.filmographies.exclude(role__icontains='sutradara').values_list('actor_id', flat=True))

        for i, film in enumerate(films_list):
            # C1: Genre Jaccard Similarity
            f_genres = set(film.genre.all())
            g_intersection = base_genres.intersection(f_genres)
            g_union = base_genres.union(f_genres)
            g_sim = len(g_intersection) / len(g_union) if g_union else 0.0
            X[i, 0] = g_sim
            
            # C2: Synopsis Keyword Jaccard
            f_words = cls._text_to_words(film.synopsis)
            s_intersection = base_words.intersection(f_words)
            s_union = base_words.union(f_words)
            s_sim = len(s_intersection) / len(s_union) if s_union else 0.0
            X[i, 1] = s_sim
            
            # C3: Title Word Overlap
            t_intersection = base_title_words.intersection(cls._text_to_words(film.title))
            t_sim = 1.0 if len(t_intersection) > 0 else 0.0
            X[i, 2] = t_sim
            
            # C4: Studio Match
            st_sim = 1.0 if (base_studio and film.studio and base_studio == film.studio) else 0.0
            X[i, 3] = st_sim
            
            # C5: Director Match
            f_directors = set(film.filmographies.filter(role__icontains='sutradara').values_list('actor_id', flat=True))
            X[i, 4] = 1.0 if base_directors.intersection(f_directors) else 0.0

            # C6: Cast Jaccard
            f_cast = set(film.filmographies.exclude(role__icontains='sutradara').values_list('actor_id', flat=True))
            c_intersection = base_cast.intersection(f_cast)
            c_union = base_cast.union(f_cast)
            X[i, 5] = len(c_intersection) / len(c_union) if c_union else 0.0

        # --- LANGKAH MATEMATIS TOPSIS ---
        norm = np.sqrt(np.sum(X**2, axis=0))
        R = np.zeros_like(X)
        for j in range(6):
            if norm[j] > 0:
                R[:, j] = X[:, j] / norm[j]
            else:
                R[:, j] = 0.0

        weights_to_use = np.array([0.25, 0.20, 0.10, 0.15, 0.15, 0.15])
        V = R * weights_to_use

        A_plus = np.max(V, axis=0)
        A_minus = np.min(V, axis=0)

        D_plus = np.sqrt(np.sum((V - A_plus)**2, axis=1))
        D_minus = np.sqrt(np.sum((V - A_minus)**2, axis=1))

        scores = np.zeros(m)
        for i in range(m):
            denominator = D_plus[i] + D_minus[i]
            if denominator > 0:
                scores[i] = D_minus[i] / denominator
            else:
                scores[i] = 1.0

        results = []
        for i, film in enumerate(films_list):
            score = round(float(scores[i]), 4)
            
            reasons = []
            if X[i, 4] == 1.0:
                reasons.append("disutradarai oleh sutradara yang sama")
            if X[i, 5] >= 0.2:
                reasons.append("memiliki banyak pemeran yang sama")
            if X[i, 3] == 1.0:
                reasons.append(f"diproduksi oleh studio yang sama ({base_studio.name})")
            if X[i, 2] == 1.0:
                reasons.append("merupakan bagian dari franchise yang sama")
            if X[i, 0] >= 0.5:
                reasons.append("berbagi genre utama yang mirip")
            if X[i, 1] >= 0.05:
                reasons.append("memiliki tema cerita yang serupa")
                
            reason_str = "Sangat mirip karena " + ", ".join(reasons) if reasons else "Memiliki sedikit kemiripan dengan film ini."

            results.append({
                "id": film.id,
                "title": film.title,
                "poster_path": film.poster_path,
                "avg_rating": film.avg_rating,
                "release_year": film.release_year,
                "duration": film.duration,
                "topsis_score": score,
                "reasoning": reason_str
            })

        results = sorted(results, key=lambda x: x["topsis_score"], reverse=True)
        return results
