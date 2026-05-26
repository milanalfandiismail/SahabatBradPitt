from rest_framework import viewsets, permissions
from apps.films.models import Film
from apps.films.serializers import FilmSerializer
from apps.users.permissions import IsAdminOrSuperadmin, IsSuperadmin

class FilmViewSetBase(viewsets.ModelViewSet):
    queryset = Film.objects.all().order_by('-popularity')
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
        import os
        from django.core.files.storage import default_storage
        from apps.films.models import FilmImage
        
        film_images = FilmImage.objects.filter(film=instance)
        for film_image in film_images:
            file_path_val = film_image.file_path
            if file_path_val.startswith('/media/'):
                storage_path = file_path_val.replace('/media/', '', 1)
                if default_storage.exists(storage_path):
                    default_storage.delete(storage_path)
            film_image.delete()
        
        instance.delete()
