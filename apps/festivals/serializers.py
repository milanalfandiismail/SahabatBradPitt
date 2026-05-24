from rest_framework import serializers
from apps.festivals.models import Studio, Festival
from apps.films.serializers import FilmSerializer

class StudioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Studio
        fields = ['id', 'name', 'country']

class FestivalSerializer(serializers.ModelSerializer):
    films_details = FilmSerializer(source='films', many=True, read_only=True)

    class Meta:
        model = Festival
        fields = ['id', 'name', 'country', 'category', 'films', 'films_details']
