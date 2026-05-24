from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.films.models import Film, Genre
from apps.films.serializers import FilmSerializer, GenreSerializer
from apps.films.services import TMDBService

class GenreViewSet(viewsets.ModelViewSet):
    queryset = Genre.objects.all().order_by('name')
    serializer_class = GenreSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

class FilmViewSet(viewsets.ModelViewSet):
    queryset = Film.objects.all().order_by('-popularity')
    serializer_class = FilmSerializer

    def get_permissions(self):
        # Otorisasi RBAC: Tamu/Regular user hanya read-only, Admin bisa write
        if self.action in ['list', 'retrieve', 'search']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def get_queryset(self):
        queryset = self.queryset
        
        # Filter pencarian pencarian real-time
        q = self.request.query_params.get('search', self.request.query_params.get('q', None))
        if q:
            queryset = queryset.filter(title__icontains=q) | queryset.filter(synopsis__icontains=q)

        # Filter genre
        genre_id = self.request.query_params.get('genre', None)
        if genre_id:
            queryset = queryset.filter(genre__id=genre_id)
            
        # Filter rentang tahun
        year_from = self.request.query_params.get('year_from', None)
        if year_from:
            try:
                queryset = queryset.filter(release_year__gte=int(year_from))
            except ValueError:
                pass
                
        year_to = self.request.query_params.get('year_to', None)
        if year_to:
            try:
                queryset = queryset.filter(release_year__lte=int(year_to))
            except ValueError:
                pass
            
        studio_id = self.request.query_params.get('studio', None)
        if studio_id:
            queryset = queryset.filter(studio__id=studio_id)

        # Filter minimal rating
        min_rating = self.request.query_params.get('min_rating', None)
        if min_rating:
            try:
                queryset = queryset.filter(avg_rating__gte=float(min_rating))
            except ValueError:
                pass

        # Urutkan
        ordering = self.request.query_params.get('ordering', None)
        if ordering:
            queryset = queryset.order_by(ordering)

        return queryset.distinct()

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def sync(self, request):
        """
        POST /api/films/sync/
        Memicu aksi sinkronisasi manual dari TMDB API secara terproteksi (Hanya Admin).
        """
        limit = request.data.get('limit', 15)
        try:
            limit = int(limit)
        except ValueError:
            return Response({"error": "Parameter limit harus berupa angka."}, status=status.HTTP_400_BAD_REQUEST)

        service = TMDBService()
        synced_count = service.sync_brad_pitt_movies(limit=limit)
        
        return Response({
            "message": "Sinkronisasi berhasil diselesaikan.",
            "synced_count": synced_count,
            "mocked": not service.is_configured()
        }, status=status.HTTP_200_OK)
