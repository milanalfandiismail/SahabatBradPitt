from rest_framework import serializers
from apps.actors.models import Actor, Filmography

class FilmographySerializer(serializers.ModelSerializer):
    film_title = serializers.CharField(source='film.title', read_only=True)
    tmdb_poster = serializers.CharField(source='film.tmdb_poster', read_only=True)
    local_poster = serializers.ImageField(source='film.local_poster', read_only=True)
    release_year = serializers.IntegerField(source='film.release_year', read_only=True)

    class Meta:
        model = Filmography
        fields = ['id', 'film', 'film_title', 'tmdb_poster', 'local_poster', 'release_year', 'role']

class ActorSerializer(serializers.ModelSerializer):
    filmographies = FilmographySerializer(many=True, read_only=True)
    # film_role: role aktor di film tertentu, di-annotate oleh ViewSet saat ada filter ?film=
    film_role = serializers.CharField(read_only=True, default=None, allow_null=True)
    film_order = serializers.IntegerField(read_only=True, default=0, allow_null=True)
    
    film_role_type = serializers.CharField(read_only=True, default=None, allow_null=True)
    
    # Approval workflow fields
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.username', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    awards = serializers.SerializerMethodField()

    class Meta:
        model = Actor
        fields = [
            'id', 'tmdb_id', 'name', 'native_name',
            'bio', 'birth_year', 'tmdb_photo', 'local_photo',
            'gender', 'birthday', 'deathday', 'place_of_birth', 'known_for_department',
            'instagram_id', 'twitter_id', 'facebook_id', 'tiktok_id',
            'genre_spec', 'filmographies', 'film_role', 'film_order', 'film_role_type',
            'status', 'status_display', 'rejection_reason',
            'is_local_edit', 'created_by', 'created_by_name',
            'updated_by', 'updated_by_name', 'created_at', 'updated_at', 'awards'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_awards(self, obj):
        from apps.festivals.models import FestivalAward
        awards = FestivalAward.objects.filter(actor=obj).select_related('festival', 'film')
        data = []
        for aw in awards:
            logo_url = ''
            if aw.festival.local_logo:
                try:
                    logo_url = aw.festival.local_logo.url
                except Exception:
                    pass
            if not logo_url:
                logo_url = aw.festival.tmdb_logo or ''

            film_poster_url = ''
            if aw.film.local_poster:
                try:
                    film_poster_url = aw.film.local_poster.url
                except Exception:
                    pass
            if not film_poster_url:
                film_poster_url = aw.film.tmdb_poster or ''

            data.append({
                'id': aw.id,
                'festival_id': aw.festival.id,
                'festival_name': aw.festival.name,
                'festival_logo': logo_url,
                'film_id': aw.film.id,
                'film_title': aw.film.title,
                'film_poster': film_poster_url,
                'category': aw.category,
                'year': aw.year,
                'award_type': aw.award_type
            })
        return data

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Sembunyikan formatting native_name jika sedang dalam proses write/deserialisasi
        # Namun untuk representasi output (GET), format namanya secara dinamis demi kompatibilitas frontend
        name = instance.name
        native_name = instance.native_name
        if native_name:
            # Jika name adalah non-ASCII (Hanzi/Hangul/dll) dan native_name adalah ASCII (Latin)
            if not name.isascii() and native_name.isascii():
                if native_name not in name:
                    ret['name'] = f"{native_name} ({name})"
            else:
                # Jika name adalah ASCII (Latin) dan native_name adalah non-ASCII
                if native_name not in name:
                    ret['name'] = f"{name} ({native_name})"
        return ret
