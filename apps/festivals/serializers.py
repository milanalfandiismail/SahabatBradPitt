from rest_framework import serializers
from apps.festivals.models import Studio, Festival, FestivalAward
from apps.films.serializers import FilmSerializer
from apps.films.models import Film

class StudioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Studio
        fields = ['id', 'name', 'country']

class FestivalFilmSerializer(serializers.ModelSerializer):
    film_title = serializers.CharField(source='title', read_only=True)
    film_poster = serializers.CharField(source='tmdb_poster', read_only=True)
    local_poster = serializers.ImageField(read_only=True)
    release_year = serializers.IntegerField(read_only=True)

    class Meta:
        model = Film
        fields = ['id', 'film_title', 'film_poster', 'local_poster', 'release_year']

class FestivalAwardSerializer(serializers.ModelSerializer):
    film_title = serializers.CharField(source='film.title', read_only=True)
    film_poster = serializers.CharField(source='film.tmdb_poster', read_only=True)
    actor_name = serializers.CharField(source='actor.name', read_only=True)
    actor_photo = serializers.CharField(source='actor.tmdb_photo', read_only=True)

    class Meta:
        model = FestivalAward
        fields = [
            'id', 'festival', 'film', 'film_title', 'film_poster', 
            'actor', 'actor_name', 'actor_photo', 'category', 'year', 'award_type'
        ]

class FestivalSerializer(serializers.ModelSerializer):
    films = FestivalFilmSerializer(many=True, read_only=True)
    awards = FestivalAwardSerializer(many=True, read_only=True)
    local_logo = serializers.ImageField(required=False, allow_null=True)
    films_data = serializers.JSONField(write_only=True, required=False)
    awards_data = serializers.JSONField(write_only=True, required=False)

    class Meta:
        model = Festival
        fields = [
            'id', 'name', 'native_name', 'country', 'city', 
            'founded_year', 'description', 'tmdb_logo', 'local_logo', 'website', 
            'tmdb_id', 'is_active', 'category', 'films', 'awards',
            'films_data', 'awards_data'
        ]

    def create(self, validated_data):
        import json
        films_data = validated_data.pop('films_data', [])
        awards_data = validated_data.pop('awards_data', [])
        
        # Parse if string
        if isinstance(films_data, str):
            try:
                films_data = json.loads(films_data)
            except Exception:
                films_data = []
        if isinstance(awards_data, str):
            try:
                awards_data = json.loads(awards_data)
            except Exception:
                awards_data = []

        festival = Festival.objects.create(**validated_data)
        
        # Sync films
        if isinstance(films_data, list):
            festival.films.set(films_data)
            
        # Create awards
        if isinstance(awards_data, list):
            for award_item in awards_data:
                film_id = award_item.get('film_id')
                actor_id = award_item.get('actor_id')
                FestivalAward.objects.create(
                    festival=festival,
                    film_id=film_id,
                    actor_id=actor_id,
                    category=award_item.get('category', ''),
                    year=int(award_item.get('year') or festival.founded_year or 2026),
                    award_type=award_item.get('award_type', 'winner')
                )
                
        return festival

    def update(self, instance, validated_data):
        import json
        films_data = validated_data.pop('films_data', None)
        awards_data = validated_data.pop('awards_data', None)
        
        # Standard fields update
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Sync films ManyToMany
        if films_data is not None:
            if isinstance(films_data, str):
                try:
                    films_data = json.loads(films_data)
                except Exception:
                    films_data = []
            if isinstance(films_data, list):
                instance.films.set(films_data)
                
        # Bulk update awards
        if awards_data is not None:
            if isinstance(awards_data, str):
                try:
                    awards_data = json.loads(awards_data)
                except Exception:
                    awards_data = []
            if isinstance(awards_data, list):
                instance.awards.all().delete()
                for award_item in awards_data:
                    film_id = award_item.get('film_id')
                    actor_id = award_item.get('actor_id')
                    FestivalAward.objects.create(
                        festival=instance,
                        film_id=film_id,
                        actor_id=actor_id,
                        category=award_item.get('category', ''),
                        year=int(award_item.get('year') or instance.founded_year or 2026),
                        award_type=award_item.get('award_type', 'winner')
                    )
                    
        return instance
