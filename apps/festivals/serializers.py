from rest_framework import serializers
from apps.festivals.models import Studio, Festival, FestivalAward
from apps.films.serializers import FilmSerializer
from apps.films.models import Film

class StudioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Studio
        fields = ['id', 'name', 'country']

class FestivalFilmSerializer(serializers.ModelSerializer):
    film_title = serializers.CharField(source='film.title', read_only=True)
    film_poster = serializers.CharField(source='film.poster_path', read_only=True)
    poster = serializers.ImageField(source='film.poster', read_only=True)
    release_year = serializers.IntegerField(source='film.release_year', read_only=True)

    class Meta:
        model = Film
        fields = ['id', 'film_title', 'film_poster', 'poster', 'release_year']

class FestivalAwardSerializer(serializers.ModelSerializer):
    film_title = serializers.CharField(source='film.title', read_only=True)
    film_poster = serializers.CharField(source='film.poster_path', read_only=True)
    actor_name = serializers.CharField(source='actor.name', read_only=True)
    actor_photo = serializers.CharField(source='actor.photo_path', read_only=True)

    class Meta:
        model = FestivalAward
        fields = [
            'id', 'festival', 'film', 'film_title', 'film_poster', 
            'actor', 'actor_name', 'actor_photo', 'category', 'year', 'award_type'
        ]

class FestivalSerializer(serializers.ModelSerializer):
    awards = FestivalAwardSerializer(many=True, read_only=True)

    class Meta:
        model = Festival
        fields = [
            'id', 'name', 'native_name', 'country', 'city', 
            'founded_year', 'description', 'logo_path', 'logo', 'website', 
            'tmdb_id', 'is_active', 'category', 'films', 'awards'
        ]
