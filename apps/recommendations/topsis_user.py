import numpy as np

def calculate_user_scores(candidates, preferences, weights=None):
    """
    Kalkulasi TOPSIS untuk kandidat film berdasarkan preferensi user.
    """
    if not candidates:
        return []

    # Default weights: C1: avg_rating, C2: popularity, C3: genre, C4: era, C5: durasi, C6: history
    default_weights = np.array([0.25, 0.2, 0.2, 0.1, 0.1, 0.15])
    
    weights_to_use = weights
    if weights_to_use is None:
        focus = preferences.get("focus", "balanced")
        if focus == "rating":
            weights_to_use = np.array([0.65, 0.05, 0.1, 0.1, 0.05, 0.05])
        elif focus == "popular":
            weights_to_use = np.array([0.05, 0.65, 0.1, 0.1, 0.05, 0.05])
        elif focus == "genre":
            weights_to_use = np.array([0.1, 0.1, 0.5, 0.1, 0.1, 0.1])
        else:
            weights_to_use = default_weights

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

    m = len(candidates)
    X = np.zeros((m, 6))
    films_list = list(candidates)
    era_pref = preferences.get("era", "")
    duration_pref = preferences.get("duration", "")

    for i, film in enumerate(films_list):
        X[i, 0] = film.avg_rating if film.avg_rating > 0 else 5.0
        X[i, 1] = getattr(film, 'popularity', film.tmdb_popularity + film.local_popularity)

        film_genre_names = [g.name for g in film.genre.all()]
        film_genre_ids = [g.id for g in film.genre.all()]
        
        genre_score = 0.0
        matched_selected = set(film_genre_ids).intersection(set(selected_genre_ids))
        if len(matched_selected) > 0:
            genre_score = min(1.0, len(matched_selected) / max(1, len(film_genre_names)))
        X[i, 2] = genre_score

        era_score = 0.0
        year = film.release_year
        if year:
            if era_pref == "klasik" and year < 1990: era_score = 1.0
            elif era_pref == "90s" and 1990 <= year <= 1999: era_score = 1.0
            elif era_pref == "2000s" and 2000 <= year <= 2009: era_score = 1.0
            elif era_pref == "2010s" and 2010 <= year <= 2019: era_score = 1.0
            elif era_pref == "terbaru" and year >= 2020: era_score = 1.0
            else: era_score = 0.5
        X[i, 3] = era_score

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

        history_score = 0.0
        if user_id and history_genre_ids:
            cand_actors = set(film.filmographies.values_list('actor_id', flat=True))
            match_g = len(set(film_genre_ids).intersection(history_genre_ids)) / max(1, len(film_genre_ids))
            match_a = len(cand_actors.intersection(history_actor_ids)) / max(1, len(cand_actors))
            history_score = (match_g * 0.4) + (match_a * 0.6)
        X[i, 5] = history_score

    norm = np.sqrt(np.sum(X**2, axis=0))
    R = np.zeros_like(X)
    for j in range(6):
        if norm[j] > 0: R[:, j] = X[:, j] / norm[j]

    V = R * weights_to_use
    A_plus = np.max(V, axis=0)
    A_minus = np.min(V, axis=0)
    D_plus = np.sqrt(np.sum((V - A_plus)**2, axis=1))
    D_minus = np.sqrt(np.sum((V - A_minus)**2, axis=1))

    scores = np.zeros(m)
    for i in range(m):
        denominator = D_plus[i] + D_minus[i]
        scores[i] = D_minus[i] / denominator if denominator > 0 else 1.0

    return _format_user_results(films_list, scores, X, era_pref, duration_pref)

def _format_user_results(films_list, scores, X, era_pref, duration_pref):
    results = []
    for i, film in enumerate(films_list):
        score = round(float(scores[i]), 4)
        reasons = []
        if film.avg_rating >= 8.0: reasons.append("ratingnya yang sangat tinggi")
        if getattr(film, 'popularity', film.tmdb_popularity + film.local_popularity) >= 80.0: reasons.append("sangat populer di kalangan penonton")
        if X[i, 2] >= 0.7: reasons.append("sangat sesuai dengan genre pilihan")
        elif X[i, 2] >= 0.4: reasons.append("memiliki genre yang cocok")
        if X[i, 3] == 1.0: reasons.append(f"dirilis tepat di era {era_pref or 'yang sesuai'}")
        if X[i, 4] == 1.0: reasons.append(f"memiliki durasi {duration_pref or 'yang pas'}")
        if X[i, 5] >= 0.5: reasons.append("mirip dengan preferensi historis Anda")
            
        reason_str = "Cocok karena " + ", ".join(reasons) if reasons else "Sesuai dengan kriteria preferensi Anda."

        results.append({
            "id": film.id,
            "title": film.title,
            "poster_path": film.tmdb_poster,
            "local_poster": film.local_poster.url if film.local_poster else None,
            "avg_rating": film.avg_rating,
            "release_year": film.release_year,
            "duration": film.duration,
            "topsis_score": score,
            "reasoning": reason_str
        })

    return sorted(results, key=lambda x: x["topsis_score"], reverse=True)
