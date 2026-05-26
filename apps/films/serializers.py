from rest_framework import serializers
from apps.films.models import Film, Genre, FilmImage
from apps.actors.models import Filmography

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

class FilmographySerializer(serializers.ModelSerializer):
    actor_id = serializers.IntegerField(source='actor.id', read_only=True)
    actor_name = serializers.CharField(source='actor.name', read_only=True)
    actor_photo = serializers.CharField(source='actor.photo_path', read_only=True)
    role_name = serializers.CharField(source='role', read_only=True)
    role_type = serializers.CharField(read_only=True)
    role_type_display = serializers.CharField(source='get_role_type_display', read_only=True)

    class Meta:
        model = Filmography
        fields = ['id', 'actor_id', 'actor_name', 'actor_photo', 'role_name', 'role_type', 'role_type_display', 'order']


class FilmSerializer(serializers.ModelSerializer):
    genre = serializers.PrimaryKeyRelatedField(queryset=Genre.objects.all(), many=True)
    genre_display = GenreSerializer(source='genre', many=True, read_only=True)
    poster = serializers.ImageField(write_only=True, required=False)
    studio_name = serializers.CharField(source='studio.name', read_only=True)
    images = FilmImageSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.username', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    actors_data = serializers.JSONField(write_only=True, required=False)
    cast = FilmographySerializer(source='filmographies', many=True, read_only=True)

    class Meta:
        model = Film
        fields = [
            'id', 'tmdb_id', 'title', 'synopsis', 'release_year', 
            'genre', 'genre_display', 'trailer_url', 'poster_path', 'poster', 'duration', 
            'popularity', 'avg_rating', 'studio', 'studio_name', 'created_at',
            'images', 'status', 'status_display', 'rejection_reason', 
            'is_local_edit', 'created_by', 'created_by_name', 
            'updated_by', 'updated_by_name', 'updated_at', 'actors_data', 'cast',
            'is_tv_series', 'episodes_count'
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
        actors_data = validated_data.pop('actors_data', [])
        
        film = Film.objects.create(**validated_data)
        film.genre.set(genres)
        
        if isinstance(actors_data, list):
            for actor_item in actors_data:
                actor_id = actor_item.get('actor_id')
                if actor_id:
                    Filmography.objects.create(
                        film=film,
                        actor_id=actor_id,
                        role=actor_item.get('role_name', ''),
                        role_type=actor_item.get('role_type', 'supporting'),
                        order=actor_item.get('order', 0)
                    )
        
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

    def update(self, instance, validated_data):
        genres = validated_data.pop('genre', None)
        actors_data = validated_data.pop('actors_data', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if genres is not None:
            instance.genre.set(genres)
            
        if actors_data is not None and isinstance(actors_data, list):
            Filmography.objects.filter(film=instance).delete()
            for actor_item in actors_data:
                actor_id = actor_item.get('actor_id')
                if actor_id:
                    Filmography.objects.create(
                        film=instance,
                        actor_id=actor_id,
                        role=actor_item.get('role_name', ''),
                        role_type=actor_item.get('role_type', 'supporting'),
                        order=actor_item.get('order', 0)
                    )
                    
        return instance
