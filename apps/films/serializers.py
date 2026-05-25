from rest_framework import serializers
from apps.films.models import Film, Genre, FilmImage

class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ['id', 'name', 'tmdb_genre_id']

class FilmImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = FilmImage
        fields = ['id', 'file_path', 'image_type']

class FilmImageUploadSerializer(serializers.ModelSerializer):
    """Serializer untuk upload images dengan validation"""
    class Meta:
        model = FilmImage
        fields = ['id', 'file_path', 'image_type']
    
    def validate_file_path(self, value):
        """Validate file path (untuk local uploads)"""
        if not value:
            raise serializers.ValidationError("File path tidak boleh kosong")
        return value

class FilmSerializer(serializers.ModelSerializer):
    genre = serializers.PrimaryKeyRelatedField(queryset=Genre.objects.all(), many=True)
    genre_display = GenreSerializer(source='genre', many=True, read_only=True)
    poster = serializers.ImageField(write_only=True, required=False)
    studio_name = serializers.CharField(source='studio.name', read_only=True)
    images = FilmImageSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.username', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Film
        fields = [
            'id', 'tmdb_id', 'title', 'synopsis', 'release_year', 
            'genre', 'genre_display', 'trailer_url', 'poster_path', 'poster', 'duration', 
            'popularity', 'avg_rating', 'studio', 'studio_name', 'created_at',
            'images', 'status', 'status_display', 'rejection_reason', 
            'is_local_edit', 'created_by', 'created_by_name', 
            'updated_by', 'updated_by_name', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'avg_rating', 'popularity', 'status', 'rejection_reason', 'is_local_edit', 'created_by', 'updated_by']

    def create(self, validated_data):
        """Handle poster upload dan genre assignment saat create film baru"""
        import os
        import uuid
        from django.core.files.storage import default_storage
        from django.core.files.base import ContentFile
        
        poster_file = validated_data.pop('poster', None)
        genres = validated_data.pop('genre', [])
        
        film = Film.objects.create(**validated_data)
        film.genre.set(genres)
        
        # Jika ada poster file, simpan sebagai FilmImage dengan type 'poster'
        if poster_file:
            ext = os.path.splitext(poster_file.name)[1].lower()
            filename = f"{uuid.uuid4()}{ext}"
            relative_path = os.path.join('films', 'posters', filename)
            saved_path = default_storage.save(relative_path, ContentFile(poster_file.read()))
            file_path_value = f"/media/{saved_path.replace(os.sep, '/')}"
            
            FilmImage.objects.create(
                film=film,
                file_path=file_path_value,
                image_type='poster'
            )
        
        return film
