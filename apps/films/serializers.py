from rest_framework import serializers
from apps.films.models import Film, Genre

class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ['id', 'name', 'tmdb_genre_id']

class FilmSerializer(serializers.ModelSerializer):
    genre = GenreSerializer(many=True, read_only=True)
    studio_name = serializers.CharField(source='studio.name', read_only=True)

    class Meta:
        model = Film
        fields = [
            'id', 'tmdb_id', 'title', 'synopsis', 'release_year', 
            'genre', 'trailer_url', 'poster_path', 'duration', 
            'popularity', 'avg_rating', 'studio', 'studio_name', 'created_at'
        ]
