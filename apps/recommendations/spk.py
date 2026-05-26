import numpy as np
from apps.recommendations.topsis_user import calculate_user_scores
from apps.recommendations.topsis_similarity import calculate_similarity_scores

class TopsisSPK:
    """
    Sistem Pendukung Keputusan (SPK) menggunakan metode TOPSIS 
    (Technique for Order of Preference by Similarity to Ideal Solution) 
    untuk mengurutkan film terbaik. (Fasad)
    """
    
    # Bobot untuk masing-masing kriteria (total = 1.0)
    WEIGHTS = np.array([0.25, 0.2, 0.2, 0.1, 0.1, 0.15])
    
    @classmethod
    def calculate_scores(cls, candidates, preferences, weights=None):
        """
        Kalkulasi TOPSIS untuk kandidat film.
        """
        return calculate_user_scores(candidates, preferences, weights)

    @classmethod
    def calculate_similarity_scores(cls, base_film, candidates):
        """
        Kalkulasi TOPSIS khusus untuk mencari film yang paling mirip (Content-Based Similarity).
        """
        return calculate_similarity_scores(base_film, candidates)

