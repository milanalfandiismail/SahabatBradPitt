from rest_framework import serializers
from django.contrib.auth.models import User
from apps.users.models import UserProfile
from apps.ratings.models import Rating
from apps.recommendations.models import RecommendationLog

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['display_name', 'bio', 'avatar_path']

class UserSerializer(serializers.ModelSerializer):
    display_name = serializers.CharField(source='profile.display_name', read_only=True)
    bio = serializers.CharField(source='profile.bio', read_only=True)
    avatar_path = serializers.CharField(source='profile.avatar_path', read_only=True)
    stats = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'display_name', 'avatar_path', 'bio', 'stats']

    def get_stats(self, obj):
        # Hitung statistik personal pengguna secara dinamis
        ratings = Rating.objects.filter(user=obj)
        total_ratings = ratings.count()
        total_reviews = ratings.exclude(review='').count()
        
        avg_score = 0.0
        if total_ratings > 0:
            avg_score = round(sum(r.score for r in ratings) / total_ratings, 1)

        last_rec = RecommendationLog.objects.filter(user=obj).order_by('-created_at').first()
        last_rec_date = last_rec.created_at.strftime('%Y-%m-%d') if last_rec else None

        return {
            "total_ratings": total_ratings,
            "total_reviews": total_reviews,
            "avg_score_given": avg_score,
            "last_recommendation": last_rec_date
        }

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    display_name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'email', 'display_name']

    def validate_password(self, value):
        # Validasi keamanan sandi
        if len(value) < 8:
            raise serializers.ValidationError("Kata sandi harus minimal 8 karakter.")
        return value

    def create(self, validated_data):
        display_name = validated_data.pop('display_name', '')
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        
        # Update profile display_name
        if display_name:
            user.profile.display_name = display_name
            user.profile.save()
            
        return user
