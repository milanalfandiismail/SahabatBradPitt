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
    Jika user login dan memiliki preferensi tersimpan, preferensi tersebut digunakan
    sebagai fallback untuk field yang tidak diisi di kuesioner.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data
        
        # Ambil preferensi tersimpan dari profil user (jika login)
        saved_prefs = {}
        if request.user.is_authenticated and hasattr(request.user, 'profile'):
            profile = request.user.profile
            saved_prefs = {
                "focus": profile.pref_focus or "",
                "genres": list(profile.pref_genres.values_list('id', flat=True)),
                "era": profile.pref_era or "",
                "duration": profile.pref_duration or ""
            }

        # Merge: input kuesioner eksplisit override preferensi tersimpan
        focus = data.get("focus") or saved_prefs.get("focus", "")
        genres = data.get("genres") if data.get("genres") else saved_prefs.get("genres", [])
        era = data.get("era") or saved_prefs.get("era", "")
        duration = data.get("duration") or saved_prefs.get("duration", "")

        preferences = {
            "focus": focus,
            "genres": genres,
            "era": era,
            "duration": duration,
            "user_id": request.user.id if request.user.is_authenticated else None
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

        # 3. Log transaksi ke RecommendationLog (Otomatis deteksi login)
        log_user = request.user if request.user.is_authenticated else None
        
        RecommendationLog.objects.create(
            user=log_user,
            input_data=preferences,
            results=ranked_results
        )

        return Response({
            "message": f"Berhasil menghitung rekomendasi hibrida dari {candidates.count()} kandidat film.",
            "results": ranked_results
        }, status=status.HTTP_200_OK)

