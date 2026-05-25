from rest_framework import serializers
from django.contrib.auth.models import User
from apps.users.models import UserProfile
from apps.films.models import Genre

class RegisterSerializer(serializers.ModelSerializer):
    """Serializer untuk registrasi user baru"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name']
    
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password": "Password tidak cocok."})
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class UserProfileEditSerializer(serializers.ModelSerializer):
    """Serializer untuk edit profile (display_name, bio, avatar) - tanpa ManyToMany fields"""
    class Meta:
        model = UserProfile
        fields = ['display_name', 'bio', 'avatar', 'avatar_uploaded_at']
        read_only_fields = ['avatar_uploaded_at']
    
    def validate_avatar(self, value):
        """Validasi ukuran dan format file avatar"""
        if value:
            # Max 5MB
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Ukuran file tidak boleh lebih dari 5MB")
            
            # Check file extension
            allowed_formats = ['image/jpeg', 'image/png', 'image/webp']
            if value.content_type not in allowed_formats:
                raise serializers.ValidationError("Format file harus JPG, PNG, atau WebP")
        
        return value
    
    def update(self, instance, validated_data):
        """Update profile dengan timestamp saat avatar diupload"""
        from django.utils import timezone
        
        if 'avatar' in validated_data and validated_data['avatar']:
            instance.avatar_uploaded_at = timezone.now()
        
        return super().update(instance, validated_data)


class UserPreferencesSerializer(serializers.ModelSerializer):
    """Serializer untuk preferensi film user"""
    pref_genres_data = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = ['pref_focus', 'pref_genres', 'pref_genres_data', 'pref_era', 'pref_duration']
    
    def get_pref_genres_data(self, obj):
        genres = obj.pref_genres.all()
        return [{'id': g.id, 'name': g.name} for g in genres]


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer untuk UserProfile dengan support upload foto"""
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    avatar_url = serializers.SerializerMethodField()
    pref_genres_data = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()
    ratings_count = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = [
            'user_id', 'username', 'email', 'display_name', 'bio',
            'avatar', 'avatar_url', 'avatar_uploaded_at',
            'pref_focus', 'pref_genres', 'pref_genres_data',
            'pref_era', 'pref_duration', 'created_at', 'updated_at',
            'reviews_count', 'ratings_count', 'avg_rating'
        ]
        read_only_fields = ['user_id', 'username', 'email', 'avatar_url', 'avatar_uploaded_at', 'created_at', 'updated_at', 'reviews_count', 'ratings_count', 'avg_rating']
    
    def get_avatar_url(self, obj):
        """Return full URL untuk avatar image"""
        if obj.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None
    
    def get_pref_genres_data(self, obj):
        """Return genre data dengan ID dan nama"""
        genres = obj.pref_genres.all()
        return [{'id': g.id, 'name': g.name} for g in genres]
    
    def get_reviews_count(self, obj):
        """Count reviews dengan text (bukan hanya rating)"""
        from django.db.models import Q
        return obj.user.ratings.exclude(review='').exclude(review__isnull=True).count()
    
    def get_ratings_count(self, obj):
        """Count total ratings"""
        return obj.user.ratings.count()
    
    def get_avg_rating(self, obj):
        """Calculate average rating"""
        from django.db.models import Avg
        avg = obj.user.ratings.aggregate(Avg('score'))['score__avg']
        return round(avg, 1) if avg else 0.0
    
    def validate_avatar(self, value):
        """Validasi ukuran dan format file avatar"""
        if value:
            # Max 5MB
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Ukuran file tidak boleh lebih dari 5MB")
            
            # Check file extension
            allowed_formats = ['image/jpeg', 'image/png', 'image/webp']
            if value.content_type not in allowed_formats:
                raise serializers.ValidationError("Format file harus JPG, PNG, atau WebP")
        
        return value
    
    def update(self, instance, validated_data):
        """Update profile dengan timestamp saat avatar diupload"""
        from django.utils import timezone
        
        if 'avatar' in validated_data and validated_data['avatar']:
            instance.avatar_uploaded_at = timezone.now()
        
        return super().update(instance, validated_data)


class UserSerializer(serializers.ModelSerializer):
    """Serializer untuk User dengan profile data"""
    profile = UserProfileSerializer(read_only=True)
    groups = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser', 'groups', 'profile']
        read_only_fields = ['id']
    
    def get_groups(self, obj):
        """Return list of group names for the user"""
        return list(obj.groups.values_list('name', flat=True))
