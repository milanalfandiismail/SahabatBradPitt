from rest_framework import serializers
from apps.actors.models import Actor, Filmography

class FilmographySerializer(serializers.ModelSerializer):
    film_title = serializers.CharField(source='film.title', read_only=True)
    poster_path = serializers.CharField(source='film.poster_path', read_only=True)
    release_year = serializers.IntegerField(source='film.release_year', read_only=True)

    class Meta:
        model = Filmography
        fields = ['id', 'film', 'film_title', 'poster_path', 'release_year', 'role']

class ActorSerializer(serializers.ModelSerializer):
    filmographies = FilmographySerializer(many=True, read_only=True)
    # film_role: role aktor di film tertentu, di-annotate oleh ViewSet saat ada filter ?film=
    film_role = serializers.CharField(read_only=True, default=None, allow_null=True)

    class Meta:
        model = Actor
        fields = [
            'id', 'tmdb_id', 'name', 'native_name',
            'bio', 'birth_year', 'photo_path',
            'genre_spec', 'filmographies', 'film_role'
        ]
