from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from apps.films.models import Film, Genre
from apps.recommendations.engine import ExpertSystemFilter
from apps.recommendations.spk import TopsisSPK
from apps.recommendations.models import RecommendationLog

class RecommendationSystemTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Inisialisasi Genre
        self.action = Genre.objects.create(name="Aksi", tmdb_genre_id=28)
        self.comedy = Genre.objects.create(name="Komedi", tmdb_genre_id=35)
        self.drama = Genre.objects.create(name="Drama", tmdb_genre_id=18)

        # Inisialisasi Film
        self.film1 = Film.objects.create(
            title="Fight Club",
            synopsis="Klub pertarungan bawah tanah.",
            release_year=1999,
            duration=139,
            popularity=92.5,
            avg_rating=8.8
        )
        self.film1.genre.add(self.drama)

        self.film2 = Film.objects.create(
            title="Inglourious Basterds",
            synopsis="Pasukan Yahudi memburu Nazi.",
            release_year=2009,
            duration=153,
            popularity=78.4,
            avg_rating=8.3
        )
        self.film2.genre.add(self.action, self.drama)

        self.film3 = Film.objects.create(
            title="Mock Santai Film",
            synopsis="Film komedi yang menyenangkan.",
            release_year=2015,
            duration=95,
            popularity=50.0,
            avg_rating=7.2
        )
        self.film3.genre.add(self.comedy)

        # User untuk pengujian terautentikasi
        self.user = User.objects.create_user(username="johndoe", password="SecurePassword123!")

    def test_expert_system_filtering(self):
        """Menguji aturan logika filter IF-THEN dari Sistem Pakar."""
        # Uji filter mood 'santai' (mengambil genre Komedi)
        preferences = {
            "mood": "santai",
            "era": "2010s",
            "duration": "pendek",
            "min_rating": 7.0
        }
        candidates = ExpertSystemFilter.get_candidates(preferences)
        self.assertIn(self.film3, candidates)
        self.assertNotIn(self.film1, candidates)

    def test_topsis_calculation_bounds(self):
        """Menguji bahwa skor preferensi TOPSIS bernilai logis di rentang [0, 1]."""
        candidates = Film.objects.all()
        preferences = {
            "mood": "sedih",  # Mengambil Drama
            "genres": [],
            "era": "90s",
            "duration": "sedang",
            "min_rating": 5.0
        }
        results = TopsisSPK.calculate_scores(candidates, preferences)
        
        self.assertTrue(len(results) > 0)
        for res in results:
            score = res["score"]
            self.assertGreaterEqual(score, 0.0)
            self.assertLessEqual(score, 1.0)
            # Pastikan teks reasoning berhasil dibuat
            self.assertTrue(len(res["reason"]) > 0)

    def test_recommendation_api_anonymous(self):
        """Menguji endpoint API rekomendasi untuk pengguna tanpa autentikasi (tamu)."""
        payload = {
            "mood": "santai",
            "era": "2010s",
            "duration": "pendek",
            "min_rating": 6.0
        }
        response = self.client.post("/api/recommendations/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["title"], "Mock Santai Film")

        # Pastikan tercatat ke log rekomendasi sebagai anonymous
        log_count = RecommendationLog.objects.filter(user=None).count()
        self.assertEqual(log_count, 1)

    def test_recommendation_api_authenticated(self):
        """Menguji endpoint API rekomendasi untuk pengguna terdaftar."""
        self.client.force_authenticate(user=self.user)
        payload = {
            "mood": "sedih",
            "era": "90s",
            "duration": "sedang",
            "min_rating": 8.0
        }
        response = self.client.post("/api/recommendations/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Pastikan tercatat ke log rekomendasi milik user
        log_count = RecommendationLog.objects.filter(user=self.user).count()
        self.assertEqual(log_count, 1)
