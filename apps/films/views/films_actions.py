from rest_framework import permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Avg, Sum
from apps.films.models import Film
from apps.films.services import TMDBService

class FilmActionsMixin:
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def sync(self, request):
        actor_id = request.data.get('actor_id', 287)
        limit = request.data.get('limit', None)

        try:
            actor_id = int(actor_id)
        except ValueError:
            return Response({"error": "Parameter actor_id harus berupa angka."}, status=status.HTTP_400_BAD_REQUEST)

        if limit is not None:
            try:
                limit = int(limit)
            except ValueError:
                return Response({"error": "Parameter limit harus berupa angka."}, status=status.HTTP_400_BAD_REQUEST)

        service = TMDBService()
        synced_count = service.sync_actor_movies(actor_id=actor_id, limit=limit)
        
        return Response({
            "message": "Sinkronisasi berhasil diselesaikan.",
            "synced_count": synced_count,
            "mocked": not service.is_configured()
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def stats(self, request):
        queryset = self.get_queryset()
        
        total_films = queryset.count()
        avg_rating = queryset.aggregate(Avg('avg_rating'))['avg_rating__avg'] or 0.0
        total_duration = queryset.aggregate(Sum('duration'))['duration__sum'] or 0
        
        genres_stats = queryset.values('genre__name').annotate(count=Count('id')).order_by('-count')
        years_stats = queryset.values('release_year').annotate(count=Count('id')).order_by('-release_year')
        
        stats_data = {
            "total_films": total_films,
            "avg_rating": round(float(avg_rating), 2),
            "total_duration_minutes": total_duration,
            "avg_duration_minutes": round(total_duration / total_films, 2) if total_films > 0 else 0,
            "by_genre": list(genres_stats),
            "by_year": list(years_stats),
        }
        
        if request.user.is_staff:
            status_stats = Film.objects.values('status').annotate(count=Count('id')).order_by('status')
            stats_data["by_status"] = list(status_stats)
        
        return Response(stats_data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def similar(self, request, pk=None):
        film = self.get_object()
        
        year = film.release_year
        era = ""
        if year:
            if year < 1990: era = "klasik"
            elif 1990 <= year <= 1999: era = "90s"
            elif 2000 <= year <= 2009: era = "2000s"
            elif 2010 <= year <= 2019: era = "2010s"
            else: era = "terbaru"

        duration_category = ""
        if film.duration:
            if film.duration < 100: duration_category = "pendek"
            elif 100 <= film.duration < 140: duration_category = "sedang"
            else: duration_category = "panjang"

        from apps.recommendations.spk import TopsisSPK
        candidates = Film.objects.exclude(id=film.id)
        ranked_results = TopsisSPK.calculate_similarity_scores(film, candidates)
        top_similar = ranked_results[:6]
        
        return Response(top_similar, status=status.HTTP_200_OK)
