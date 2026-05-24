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
        
        # 1. Filter Minimal Rating (Wajib)
        min_rating = preferences.get("min_rating")
        if min_rating is not None:
            try:
                films = films.filter(avg_rating__gte=float(min_rating))
            except (ValueError, TypeError):
                pass

        # Jalankan filter dengan penanganan fallback pelonggaran jika kandidat kosong
        candidates = films
        
        # 2. Filter Era (IF-THEN Era)
        era = preferences.get("era")
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

        # 3. Filter Durasi (IF-THEN Durasi)
        duration = preferences.get("duration")
        if duration:
            if duration == "pendek":
                candidates = candidates.filter(duration__lt=100)
            elif duration == "sedang":
                candidates = candidates.filter(duration__gte=100, duration__lt=140)
            elif duration == "panjang":
                candidates = candidates.filter(duration__gte=140)

        # 4. Filter Mood & Genre Terpadu
        mood = preferences.get("mood")
        selected_genres = preferences.get("genres", [])
        
        # Tentukan genre berdasarkan mood
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

        if mood_genres or selected_genres:
            # Cari genre di database
            genre_query = Genre.objects.none()
            if selected_genres:
                genre_query = Genre.objects.filter(id__in=selected_genres)
            
            # Jika user tidak memilih genre tapi ada mood, atau ingin gabungan
            if mood_genres:
                mood_genre_query = Genre.objects.filter(name__icontains=mood_genres[0])
                for name in mood_genres[1:]:
                    mood_genre_query |= Genre.objects.filter(name__icontains=name)
                
                if selected_genres:
                    # Irisan / Gabungan: utamakan gabungan agar kandidat melimpah
                    genre_query = genre_query | mood_genre_query
                else:
                    genre_query = mood_genre_query
            
            if genre_query.exists():
                candidates = candidates.filter(genre__in=genre_query)

        # Jika hasil filter terlalu ketat sehingga menghasilkan 0 kandidat,
        # kita kembalikan filter secara bertahap agar TOPSIS SPK selalu punya bahan pemeringkatan.
        if candidates.distinct().count() == 0:
            logger.info("Kandidat kosong. Melonggarkan filter sistem pakar (mengabaikan durasi)...")
            # Coba tanpa filter durasi
            candidates_relaxed = films
            if era:
                if era == "klasik":
                    candidates_relaxed = candidates_relaxed.filter(release_year__lt=1990)
                elif era == "90s":
                    candidates_relaxed = candidates_relaxed.filter(release_year__gte=1990, release_year__lte=1999)
                elif era == "2000s":
                    candidates_relaxed = candidates_relaxed.filter(release_year__gte=2000, release_year__lte=2009)
                elif era == "2010s":
                    candidates_relaxed = candidates_relaxed.filter(release_year__gte=2010, release_year__lte=2019)
                elif era == "terbaru":
                    candidates_relaxed = candidates_relaxed.filter(release_year__gte=2020)
            
            if mood_genres or selected_genres:
                genre_query = Genre.objects.none()
                if selected_genres:
                    genre_query = Genre.objects.filter(id__in=selected_genres)
                if mood_genres:
                    mood_genre_query = Genre.objects.filter(name__icontains=mood_genres[0])
                    for name in mood_genres[1:]:
                        mood_genre_query |= Genre.objects.filter(name__icontains=name)
                    genre_query = genre_query | mood_genre_query
                
                if genre_query.exists():
                    candidates_relaxed = candidates_relaxed.filter(genre__in=genre_query)
            
            if candidates_relaxed.distinct().count() > 0:
                return candidates_relaxed.distinct()
                
            # Pelonggaran tingkat 2: Ambil semua film dengan minimal rating saja
            logger.info("Kandidat masih kosong. Pelonggarkan tingkat 2 (hanya filter rating)...")
            return films.distinct()

        return candidates.distinct()
