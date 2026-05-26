import os
import uuid
from rest_framework import permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from apps.films.models import FilmImage
from apps.films.serializers import FilmImageSerializer

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
