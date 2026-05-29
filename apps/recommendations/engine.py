import logging
from apps.films.models import Film, Genre

logger = logging.getLogger(__name__)

class ExpertSystemFilter:
    """
    Sistem Pakar: Menerapkan logika aturan IF-THEN untuk menyaring database Film
    menjadi ruang kandidat yang lebih terfokus berdasarkan kriteria user.
    """
    @staticmethod
    def get_candidates(preferences):
        """
        preferences = {
            "mood": "santai"/"tegang"/"sedih"/"semangat",
            "genres": [id_genre_1, id_genre_2], # opsional
            "era": "klasik"/"90s"/"2000s"/"2010s"/"terbaru",
            "duration": "pendek"/"sedang"/"panjang",
            "min_rating": 7
        }
        """
        films = Film.objects.all()
        
        # Tentukan kriteria yang dimasukkan
        era = preferences.get("era")
        duration = preferences.get("duration")
        selected_genres = preferences.get("genres", [])

        candidates = films
        
        # 1. Coba filter kaku dengan AND logic untuk semua genre yang dipilih
        if selected_genres:
            for genre_id in selected_genres:
                candidates = candidates.filter(genre__id=genre_id)
        
        # 3. Filter Era (IF-THEN Era)
        if era:
            if era == "klasik":
                candidates = candidates.filter(release_year__lt=1990)
            elif era == "90s":
                candidates = candidates.filter(release_year__gte=1990, release_year__lte=1999)
            elif era == "2000s":
                candidates = candidates.filter(release_year__gte=2000, release_year__lte=2009)
            elif era == "2010s":
                candidates = candidates.filter(release_year__gte=2010, release_year__lte=2019)
            elif era == "terbaru":
                candidates = candidates.filter(release_year__gte=2020)

        # 4. Filter Durasi (IF-THEN Durasi)
        if duration:
            if duration == "pendek":
                candidates = candidates.filter(duration__lt=100)
            elif duration == "sedang":
                candidates = candidates.filter(duration__gte=100, duration__lt=140)
            elif duration == "panjang":
                candidates = candidates.filter(duration__gte=140)

        return candidates.distinct()
