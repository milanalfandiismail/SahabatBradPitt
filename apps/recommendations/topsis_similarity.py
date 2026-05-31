import numpy as np
from apps.recommendations.utils import compute_topsis

def _text_to_words(text):
    if not text:
        return set()
    stopwords = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'of', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'has', 'have', 'had', 'this', 'that', 'it', 'its', 'he', 'him', 'his', 'she', 'her', 'they', 'them', 'their', 'who', 'whom', 'which', 'to', 'with', 'about', 'after', 'before'}
    words = [w.strip('.,;:!?\"\'()[]{}*-_').lower() for w in text.split()]
    return {w for w in words if len(w) >= 3 and w not in stopwords}

def calculate_similarity_scores(base_film, candidates):
    """
    Kalkulasi TOPSIS khusus untuk mencari film yang paling mirip (Content-Based Similarity).
    """
    if not candidates:
        return []
        
    m = len(candidates)
    X = np.zeros((m, 6))
    films_list = list(candidates)
    
    base_genres = set(base_film.genre.all())
    base_words = _text_to_words(base_film.synopsis)
    base_title_words = _text_to_words(base_film.title)
    base_studio = base_film.studio
    base_directors = set(base_film.filmographies.filter(role__icontains='sutradara').values_list('actor_id', flat=True))
    base_cast = set(base_film.filmographies.exclude(role__icontains='sutradara').values_list('actor_id', flat=True))

    for i, film in enumerate(films_list):
        f_genres = set(film.genre.all())
        g_union = base_genres.union(f_genres)
        X[i, 0] = len(base_genres.intersection(f_genres)) / len(g_union) if g_union else 0.0
        
        f_words = _text_to_words(film.synopsis)
        s_union = base_words.union(f_words)
        X[i, 1] = len(base_words.intersection(f_words)) / len(s_union) if s_union else 0.0
        
        X[i, 2] = 1.0 if len(base_title_words.intersection(_text_to_words(film.title))) > 0 else 0.0
        X[i, 3] = 1.0 if (base_studio and film.studio and base_studio == film.studio) else 0.0
        
        f_directors = set(film.filmographies.filter(role__icontains='sutradara').values_list('actor_id', flat=True))
        X[i, 4] = 1.0 if base_directors.intersection(f_directors) else 0.0

        f_cast = set(film.filmographies.exclude(role__icontains='sutradara').values_list('actor_id', flat=True))
        c_union = base_cast.union(f_cast)
        X[i, 5] = len(base_cast.intersection(f_cast)) / len(c_union) if c_union else 0.0

    weights_to_use = np.array([0.25, 0.20, 0.10, 0.15, 0.15, 0.15])
    scores = compute_topsis(X, weights_to_use)

    return _format_similarity_results(films_list, scores, X, base_studio)

def _format_similarity_results(films_list, scores, X, base_studio):
    results = []
    for i, film in enumerate(films_list):
        score = round(float(scores[i]), 4)
        reasons = []
        if X[i, 4] == 1.0: reasons.append("disutradarai oleh sutradara yang sama")
        if X[i, 5] >= 0.2: reasons.append("memiliki banyak pemeran yang sama")
        if X[i, 3] == 1.0: reasons.append(f"diproduksi oleh studio yang sama ({base_studio.name})")
        if X[i, 2] == 1.0: reasons.append("merupakan bagian dari franchise yang sama")
        if X[i, 0] >= 0.5: reasons.append("berbagi genre utama yang mirip")
        if X[i, 1] >= 0.05: reasons.append("memiliki tema cerita yang serupa")
            
        reason_str = "Sangat mirip karena " + ", ".join(reasons) if reasons else "Memiliki sedikit kemiripan dengan film ini."

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
