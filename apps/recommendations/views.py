from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.recommendations.engine import ExpertSystemFilter
from apps.recommendations.spk import TopsisSPK
from apps.recommendations.models import RecommendationLog

class RecommendationAPIView(APIView):
    """
    POST /api/recommendations/
    Menerima kuesioner preferensi pengguna dan mengembalikan Top 5 film terurut TOPSIS.
    Dapat digunakan baik oleh tamu (Anonymous) maupun pengguna terdaftar.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data
        
        # Validasi preferensi kuesioner
        mood = data.get("mood", "")
        genres = data.get("genres", [])
        era = data.get("era", "")
        duration = data.get("duration", "")
        min_rating = data.get("min_rating", 0.0)

        try:
            min_rating = float(min_rating)
        except (ValueError, TypeError):
            min_rating = 0.0

        preferences = {
            "mood": mood,
            "genres": genres,
            "era": era,
            "duration": duration,
            "min_rating": min_rating
        }

        # 1. Jalankan Sistem Pakar (Filter Kandidat)
        candidates = ExpertSystemFilter.get_candidates(preferences)
        
        if not candidates.exists():
            return Response({
                "message": "Tidak ditemukan film yang memenuhi kriteria dasar Anda. Silakan coba kriteria lain.",
                "results": []
            }, status=status.HTTP_200_OK)

        # 2. Jalankan SPK TOPSIS (Pemeringkatan)
        ranked_results = TopsisSPK.calculate_scores(candidates, preferences)
        
        # Ambil Top 5
        top_5_results = ranked_results[:5]

        # 3. Log transaksi ke RecommendationLog (Otomatis deteksi login)
        log_user = request.user if request.user.is_authenticated else None
        
        RecommendationLog.objects.create(
            user=log_user,
            input_data=preferences,
            results=top_5_results
        )

        return Response({
            "message": f"Berhasil menghitung rekomendasi hibrida dari {candidates.count()} kandidat film.",
            "results": top_5_results
        }, status=status.HTTP_200_OK)
