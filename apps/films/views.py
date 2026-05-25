from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.films.models import Film, Genre
from apps.films.serializers import FilmSerializer, GenreSerializer
from django.db.models import Q, Count, Avg, Sum
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
        if self.action in ['list', 'retrieve', 'search', 'similar']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def get_queryset(self):
        queryset = self.queryset
        
        # Filter by status: public users hanya lihat published films
        if not self.request.user.is_staff:
            queryset = queryset.filter(status='published')
        
        # Filter pencarian
        q = self.request.query_params.get('search', self.request.query_params.get('q', None))
        if q:
            q = q.strip()
            # 1. Try strict matching (exact or whole-word on title)
            strict_query = (
                Q(title__iexact=q) | 
                Q(title__istartswith=f"{q} ") | 
                Q(title__iendswith=f" {q}") | 
                Q(title__icontains=f" {q} ")
            )
            strict_qs = queryset.filter(strict_query)
            if strict_qs.exists():
                queryset = strict_qs
            else:
                # 2. Fallback to broad contains search on title or synopsis
                queryset = queryset.filter(Q(title__icontains=q) | Q(synopsis__icontains=q))

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
        Menerima input actor_id dan limit untuk penarikan data secara kustom.
        """
        actor_id = request.data.get('actor_id', 287)  # Default: Brad Pitt (287)
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
        """
        GET /api/films/stats/
        Mengembalikan statistik film (total, rating rata-rata, durasi, dll).
        """
        queryset = self.get_queryset()
        
        # Hitung statistik dasar
        total_films = queryset.count()
        avg_rating = queryset.aggregate(Avg('avg_rating'))['avg_rating__avg'] or 0.0
        total_duration = queryset.aggregate(Sum('duration'))['duration__sum'] or 0
        
        # Statistik per genre
        genres_stats = queryset.values('genre__name').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Statistik per tahun
        years_stats = queryset.values('release_year').annotate(
            count=Count('id')
        ).order_by('-release_year')
        
        stats_data = {
            "total_films": total_films,
            "avg_rating": round(float(avg_rating), 2),
            "total_duration_minutes": total_duration,
            "avg_duration_minutes": round(total_duration / total_films, 2) if total_films > 0 else 0,
            "by_genre": list(genres_stats),
            "by_year": list(years_stats),
        }
        
        # Tambahkan status stats hanya untuk admin
        if request.user.is_staff:
            status_stats = Film.objects.values('status').annotate(
                count=Count('id')
            ).order_by('status')
            stats_data["by_status"] = list(status_stats)
        
        return Response(stats_data, status=status.HTTP_200_OK)


    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def submit_approval(self, request, pk=None):
        """
        POST /api/films/<id>/submit-approval/
        Admin submit film untuk approval sebelum publish.
        """
        film = self.get_object()
        if film.status == 'published':
            return Response({"error": "Film sudah published, tidak perlu approval"}, status=status.HTTP_400_BAD_REQUEST)
        
        film.status = 'pending_approval'
        film.save()
        return Response({
            "message": "Film berhasil disubmit untuk approval",
            "status": film.get_status_display()
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def approve(self, request, pk=None):
        """
        POST /api/films/<id>/approve/
        Super admin approve film untuk publish (hanya untuk super admin).
        """
        if not request.user.is_superuser:
            return Response({"error": "Hanya super admin yang bisa approve"}, status=status.HTTP_403_FORBIDDEN)
        
        film = self.get_object()
        if film.status != 'pending_approval':
            return Response({"error": "Film harus dalam status pending_approval"}, status=status.HTTP_400_BAD_REQUEST)
        
        film.status = 'published'
        film.updated_by = request.user
        film.save()
        return Response({
            "message": "Film berhasil di-approve dan dipublish",
            "status": film.get_status_display()
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def reject(self, request, pk=None):
        """
        POST /api/films/<id>/reject/
        Super admin reject film dengan reason (hanya untuk super admin).
        """
        if not request.user.is_superuser:
            return Response({"error": "Hanya super admin yang bisa reject"}, status=status.HTTP_403_FORBIDDEN)
        
        film = self.get_object()
        if film.status != 'pending_approval':
            return Response({"error": "Film harus dalam status pending_approval"}, status=status.HTTP_400_BAD_REQUEST)
        
        reason = request.data.get('reason', '')
        if not reason:
            return Response({"error": "Reason tidak boleh kosong"}, status=status.HTTP_400_BAD_REQUEST)
        
        film.status = 'rejected'
        film.rejection_reason = reason
        film.updated_by = request.user
        film.save()
        return Response({
            "message": "Film berhasil di-reject",
            "status": film.get_status_display(),
            "reason": film.rejection_reason
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def similar(self, request, pk=None):
        """
        GET /api/films/<id>/similar/
        Mengembalikan daftar rekomendasi film serupa menggunakan Sistem Pakar & SPK TOPSIS.
        """
        film = self.get_object()
        
        # 1. Tentukan era film ini
        year = film.release_year
        era = ""
        if year:
            if year < 1990: era = "klasik"
            elif 1990 <= year <= 1999: era = "90s"
            elif 2000 <= year <= 2009: era = "2000s"
            elif 2010 <= year <= 2019: era = "2010s"
            else: era = "terbaru"

        # 2. Tentukan kategori durasi film ini
        duration_category = ""
        if film.duration:
            if film.duration < 100: duration_category = "pendek"
            elif 100 <= film.duration < 140: duration_category = "sedang"
            else: duration_category = "panjang"

        # 3. Kumpulkan parameter preferensi berdasarkan film saat ini
        preferences = {
            "genres": list(film.genre.values_list('id', flat=True)),
            "era": era,
            "duration": duration_category,
            "min_rating": 0.0,
            "focus": "genre"
        }

        from apps.recommendations.spk import TopsisSPK

        # 4. Ambil semua film sebagai kandidat kecuali film ini
        from apps.films.models import Film
        candidates = Film.objects.exclude(id=film.id)
        
        # 5. Jalankan TOPSIS Kemiripan Relatif
        ranked_results = TopsisSPK.calculate_similarity_scores(film, candidates)
        
        # 6. Batasi hingga top 6
        top_similar = ranked_results[:6]
        
        return Response(top_similar, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='images', permission_classes=[permissions.IsAdminUser])
    def manage_images_post(self, request, pk=None):
        """
        POST /api/films/<id>/images/
        Unggah foto galeri (backdrop) secara terproteksi (Hanya Admin).
        """
        film = self.get_object()
        file_obj = request.FILES.get('image')
        if not file_obj:
            return Response({"error": "File gambar tidak ditemukan dalam request."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validasi ukuran file (5MB limit)
        if file_obj.size > 5 * 1024 * 1024:
            return Response({"error": "Ukuran file melebihi batas 5MB."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validasi format file
        import os
        ext = os.path.splitext(file_obj.name)[1].lower()
        if ext not in ['.jpg', '.jpeg', '.png', '.webp']:
            return Response({"error": "Format file tidak didukung. Hanya JPG, PNG, dan WebP yang diizinkan."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate safe, unique filename
        import uuid
        from django.core.files.storage import default_storage
        from django.core.files.base import ContentFile
        from apps.films.models import FilmImage
        
        filename = f"{uuid.uuid4()}{ext}"
        # Simpan ke media/films/backdrops/
        relative_path = os.path.join('films', 'backdrops', filename)
        saved_path = default_storage.save(relative_path, ContentFile(file_obj.read()))
        
        # Simpan record FilmImage
        # file_path diawali dengan '/media/' agar template frontend bisa mengenali sebagai path lokal
        file_path_value = f"/media/{saved_path.replace(os.sep, '/')}"
        
        film_image = FilmImage.objects.create(
            film=film,
            file_path=file_path_value,
            image_type='backdrop'
        )
        
        from apps.films.serializers import FilmImageSerializer
        serializer = FilmImageSerializer(film_image)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path=r'images/(?P<image_id>\d+)', permission_classes=[permissions.IsAdminUser])
    def manage_images_delete(self, request, pk=None, image_id=None):
        """
        DELETE /api/films/<id>/images/<image_id>/
        Hapus foto galeri (backdrop) dari film (Hanya Admin).
        """
        film = self.get_object()
        from apps.films.models import FilmImage
        try:
            film_image = FilmImage.objects.get(film=film, id=image_id)
        except FilmImage.DoesNotExist:
            return Response({"error": "Gambar galeri tidak ditemukan."}, status=status.HTTP_404_NOT_FOUND)
        
        # Hapus file fisik dari storage jika merupakan path lokal (/media/...)
        import os
        from django.core.files.storage import default_storage
        file_path_val = film_image.file_path
        if file_path_val.startswith('/media/'):
            # Ambil path relatif storage (buang prefix '/media/')
            storage_path = file_path_val.replace('/media/', '', 1)
            if default_storage.exists(storage_path):
                default_storage.delete(storage_path)
                
        film_image.delete()
        return Response({"message": "Gambar galeri berhasil dihapus."}, status=status.HTTP_200_OK)

