import os
import uuid
import threading
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Avg, Sum, Q, F
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.core.cache import cache

from apps.films.models import Film, Genre, FilmImage
from apps.films.serializers import FilmSerializer, GenreSerializer, FilmImageSerializer
from apps.users.permissions import IsAdminOrSuperadmin, IsSuperadmin
from apps.films.services import TMDBService
from apps.recommendations.spk import TopsisSPK

class GenreViewSet(viewsets.ModelViewSet):
    queryset = Genre.objects.all().order_by('name')
    serializer_class = GenreSerializer
    pagination_class = None
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

class FilmViewSetBase(viewsets.ModelViewSet):
    queryset = Film.objects.select_related(
        'studio', 'created_by', 'updated_by'
    ).prefetch_related(
        'genre', 'images', 'filmographies__actor'
    ).annotate(
        popularity=F('tmdb_popularity') + F('local_popularity')
    ).order_by('-popularity')
    serializer_class = FilmSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'search', 'similar', 'stats']:
            return [permissions.AllowAny()]
        elif self.action in ['approve', 'reject']:
            return [IsSuperadmin()]
        else:
            return [IsAdminOrSuperadmin()]

    def get_queryset(self):
        queryset = self.queryset
        
        status_param = self.request.query_params.get('status', None)
        queryset = queryset.filter_by_status(self.request.user, status_param)
        
        q = self.request.query_params.get('search', self.request.query_params.get('q', None))
        queryset = queryset.search(q)

        genre_ids = self.request.query_params.getlist('genre')
        if not genre_ids or (len(genre_ids) == 1 and ',' in genre_ids[0]):
            genre_param = self.request.query_params.get('genre', None)
            if genre_param:
                genre_ids = [g.strip() for g in genre_param.split(',') if g.strip()]
        queryset = queryset.filter_by_genres(genre_ids)
            
        year_from = self.request.query_params.get('year_from', None)
        year_to = self.request.query_params.get('year_to', None)
        queryset = queryset.filter_by_year_range(year_from, year_to)
            
        studio_id = self.request.query_params.get('studio', None)
        queryset = queryset.filter_by_studio(studio_id)

        min_rating = self.request.query_params.get('min_rating', None)
        queryset = queryset.filter_by_min_rating(min_rating)

        ordering = self.request.query_params.get('ordering', None)
        if ordering:
            if q:
                if ordering == '-popularity':
                    queryset = queryset.order_by('search_rank', '-popularity', '-release_year', 'title')
                elif ordering == '-avg_rating':
                    queryset = queryset.order_by('search_rank', '-avg_rating', '-release_year', 'title')
                elif ordering == '-release_year':
                    queryset = queryset.order_by('search_rank', '-release_year', 'title')
                else:
                    queryset = queryset.order_by('search_rank', ordering)
            else:
                queryset = queryset.order_by(ordering)

        return queryset.distinct()

    def perform_create(self, serializer):
        user = self.request.user
        is_superadmin = user.is_superuser or user.groups.filter(name='Superadmin').exists()
        serializer.save(
            created_by=user,
            updated_by=user,
            is_local_edit=True,
            status='published' if is_superadmin else 'pending_approval'
        )
    
    def perform_update(self, serializer):
        user = self.request.user
        is_superadmin = user.is_superuser or user.groups.filter(name='Superadmin').exists()
        if not is_superadmin:
            serializer.save(updated_by=user, is_local_edit=True, status='pending_approval')
        else:
            serializer.save(updated_by=user)
    
    def perform_destroy(self, instance):
        film_images = FilmImage.objects.filter(film=instance)
        for film_image in film_images:
            file_path_val = film_image.file_path
            if file_path_val.startswith('/media/'):
                storage_path = file_path_val.replace('/media/', '', 1)
                if default_storage.exists(storage_path):
                    default_storage.delete(storage_path)
            film_image.delete()
        
        instance.delete()

def run_sync_task(actor_id, min_rating):
    cache.set('sync_task_status', {'status': 'running', 'actor_id': actor_id}, timeout=3600)
    try:
        from apps.films.services.main_service import TMDBService
        service = TMDBService()
        synced_count = service.sync_actor_movies(actor_id=actor_id, min_rating=min_rating)
        cache.set('sync_task_status', {'status': 'completed', 'synced_count': synced_count, 'actor_id': actor_id}, timeout=300)
    except Exception as e:
        cache.set('sync_task_status', {'status': 'error', 'error': str(e), 'actor_id': actor_id}, timeout=300)

class FilmActionsMixin:
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def sync(self, request):
        actor_id = request.data.get('actor_id')
        min_rating = request.data.get('min_rating', 7.0)

        if not actor_id:
            return Response({"error": "Parameter actor_id harus diisi."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            actor_id = int(actor_id)
        except ValueError:
            return Response({"error": "Parameter actor_id harus berupa angka."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            min_rating = float(min_rating)
        except ValueError:
            return Response({"error": "Parameter min_rating harus berupa angka/desimal."}, status=status.HTTP_400_BAD_REQUEST)

        current_status = cache.get('sync_task_status')
        if current_status and current_status.get('status') == 'running':
            return Response({"error": "Sinkronisasi lain sedang berjalan."}, status=status.HTTP_400_BAD_REQUEST)

        thread = threading.Thread(target=run_sync_task, args=(actor_id, min_rating))
        thread.daemon = True
        thread.start()
        
        return Response({
            "message": "Sinkronisasi berjalan di background.",
            "status": "running"
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAdminUser])
    def sync_status(self, request):
        status_data = cache.get('sync_task_status')
        if not status_data:
            return Response({"status": "idle"}, status=status.HTTP_200_OK)
        
        # Auto-clear status if completed or error so we don't keep showing it
        if status_data.get('status') in ['completed', 'error']:
            cache.delete('sync_task_status')
            
        return Response(status_data, status=status.HTTP_200_OK)

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
        candidates = self.get_queryset().exclude(id=film.id)
        ranked_results = TopsisSPK.calculate_similarity_scores(film, candidates)
        top_similar = ranked_results[:6]
        
        return Response(top_similar, status=status.HTTP_200_OK)

class FilmGalleryMixin:
    @action(detail=True, methods=['post'], url_path='images', permission_classes=[permissions.IsAdminUser])
    def manage_images_post(self, request, pk=None):
        film = self.get_object()
        file_obj = request.FILES.get('image')
        image_type = request.data.get('image_type', 'backdrop')
        
        if not file_obj:
            return Response({"error": "File gambar tidak ditemukan dalam request."}, status=status.HTTP_400_BAD_REQUEST)
        
        if image_type not in ['backdrop', 'poster']:
            return Response({"error": "image_type harus 'backdrop' atau 'poster'."}, status=status.HTTP_400_BAD_REQUEST)
        
        if file_obj.size > 5 * 1024 * 1024:
            return Response({"error": "Ukuran file melebihi batas 5MB."}, status=status.HTTP_400_BAD_REQUEST)
        
        ext = os.path.splitext(file_obj.name)[1].lower()
        if ext not in ['.jpg', '.jpeg', '.png', '.webp']:
            return Response({"error": "Format file tidak didukung. Hanya JPG, PNG, dan WebP yang diizinkan."}, status=status.HTTP_400_BAD_REQUEST)
        
        filename = f"{uuid.uuid4()}{ext}"
        
        if image_type == 'poster':
            relative_path = os.path.join('films', 'posters', filename)
        else:
            relative_path = os.path.join('films', 'backdrops', filename)
        
        saved_path = default_storage.save(relative_path, ContentFile(file_obj.read()))
        file_path_value = f"/media/{saved_path.replace(os.sep, '/')}"
        
        film_image = FilmImage.objects.create(
            film=film,
            file_path=file_path_value,
            image_type=image_type
        )
        
        serializer = FilmImageSerializer(film_image)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path=r'images/(?P<image_id>\d+)', permission_classes=[permissions.IsAdminUser])
    def manage_images_delete(self, request, pk=None, image_id=None):
        film = self.get_object()
        try:
            film_image = FilmImage.objects.get(film=film, id=image_id)
        except FilmImage.DoesNotExist:
            return Response({"error": "Gambar galeri tidak ditemukan."}, status=status.HTTP_404_NOT_FOUND)
        
        file_path_val = film_image.file_path
        if file_path_val.startswith('/media/'):
            storage_path = file_path_val.replace('/media/', '', 1)
            if default_storage.exists(storage_path):
                default_storage.delete(storage_path)
                
        film_image.delete()
        return Response({"message": "Gambar galeri berhasil dihapus."}, status=status.HTTP_200_OK)


class FilmApprovalMixin:
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def submit_approval(self, request, pk=None):
        film = self.get_object()
        if film.status == 'published':
            return Response({"error": "Film sudah published, tidak perlu approval"}, status=status.HTTP_400_BAD_REQUEST)
        
        film.status = 'pending_approval'
        film.save()
        return Response({
            "message": "Film berhasil disubmit untuk approval",
            "status": film.get_status_display()
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsSuperadmin])
    def approve(self, request, pk=None):
        film = self.get_object()
        
        if film.status != 'pending_approval':
            return Response({"error": "Film ini tidak dalam status pending approval."}, status=status.HTTP_400_BAD_REQUEST)
        
        film.status = 'published'
        film.rejection_reason = ''
        film.updated_by = request.user
        film.save()
        
        serializer = self.get_serializer(film)
        return Response({
            "message": "Film berhasil di-approve dan dipublish",
            "status": film.get_status_display(),
            "data": serializer.data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsSuperadmin])
    def reject(self, request, pk=None):
        film = self.get_object()
        rejection_reason = request.data.get('reason', request.data.get('rejection_reason', ''))
        
        if film.status != 'pending_approval':
            return Response({"error": "Film ini tidak dalam status pending approval."}, status=status.HTTP_400_BAD_REQUEST)
        
        if not rejection_reason:
            return Response({"error": "Alasan penolakan harus diisi."}, status=status.HTTP_400_BAD_REQUEST)
        
        film.status = 'rejected'
        film.rejection_reason = rejection_reason
        film.updated_by = request.user
        film.save()
        
        serializer = self.get_serializer(film)
        return Response({
            "message": "Film berhasil di-reject",
            "status": film.get_status_display(),
            "reason": film.rejection_reason,
            "data": serializer.data
        }, status=status.HTTP_200_OK)

class FilmViewSet(FilmApprovalMixin, FilmActionsMixin, FilmGalleryMixin, FilmViewSetBase):
    """
    ViewSet utama untuk entitas Film. (Fasad)
    Menggabungkan fungsionalitas dari:
    - FilmViewSetBase: CRUD dasar, filter, queryset, permissions
    - FilmApprovalMixin: Proses persetujuan (submit_approval, approve, reject)
    - FilmActionsMixin: Aksi kustom (sync, stats, similar)
    - FilmGalleryMixin: Manajemen galeri gambar (manage_images_post, manage_images_delete)
    """
    pass
