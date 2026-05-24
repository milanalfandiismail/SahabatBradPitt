from rest_framework import serializers
from apps.ratings.models import Rating, Watchlist


class RatingSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    display_name = serializers.CharField(source='user.profile.display_name', read_only=True)
    avatar_path = serializers.CharField(source='user.profile.avatar_path', read_only=True)
    film_title = serializers.CharField(source='film.title', read_only=True)
    poster_path = serializers.CharField(source='film.poster_path', read_only=True)
    release_year = serializers.IntegerField(source='film.release_year', read_only=True)

    class Meta:
        model = Rating
        fields = [
            'id', 'user', 'username', 'display_name', 'avatar_path', 
            'film', 'film_title', 'poster_path', 'release_year', 'score', 'review', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user']

    def validate_score(self, value):
        if value < 1 or value > 10:
            raise serializers.ValidationError("Skor harus berada di antara rentang 1 hingga 10.")
        return value


class WatchlistSerializer(serializers.ModelSerializer):
    film_title = serializers.CharField(source='film.title', read_only=True)
    poster_path = serializers.CharField(source='film.poster_path', read_only=True)
    release_year = serializers.IntegerField(source='film.release_year', read_only=True)
    avg_rating = serializers.FloatField(source='film.avg_rating', read_only=True)

    class Meta:
        model = Watchlist
        fields = ['id', 'user', 'film', 'film_title', 'poster_path', 'release_year', 'avg_rating', 'added_at']
        read_only_fields = ['user']
