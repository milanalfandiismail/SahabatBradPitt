from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

import os
import uuid

def user_avatar_upload_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4().hex}.{ext}"
    return os.path.join('avatars/', filename)

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Foto avatar - upload ke folder media/avatars/
    avatar = models.ImageField(upload_to=user_avatar_upload_path, blank=True, null=True)
    avatar_uploaded_at = models.DateTimeField(blank=True, null=True)
    
    display_name = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True, default='')

    # === Preferensi Film untuk AI Recommendation ===
    FOCUS_CHOICES = [
        ('rating', 'Rating Tertinggi'),
        ('popular', 'Paling Populer'),
        ('genre', 'Sesuai Genre'),
        ('balanced', 'Seimbang'),
    ]
    pref_focus = models.CharField(max_length=20, choices=FOCUS_CHOICES, blank=True, default='balanced')

    pref_genres = models.ManyToManyField('films.Genre', blank=True, related_name='preferred_by')
    # Genre favorit user (multi-select)

    pref_era = models.CharField(max_length=20, blank=True, default='')
    # Pilihan: "klasik", "90s", "2000s", "2010s", "terbaru"

    pref_duration = models.CharField(max_length=20, blank=True, default='')
    # Pilihan: "pendek", "sedang", "panjang"

    AUTH_PROVIDER_CHOICES = [
        ('local', 'Local'),
        ('google', 'Google'),
    ]
    auth_provider = models.CharField(max_length=20, choices=AUTH_PROVIDER_CHOICES, default='local')

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def reviews_count(self):
        return self.user.ratings.exclude(review='').exclude(review__isnull=True).count()

    @property
    def ratings_count(self):
        return self.user.ratings.count()

    @property
    def avg_rating(self):
        from django.db.models import Avg
        val = self.user.ratings.aggregate(Avg('score'))['score__avg']
        return val if val is not None else 0.0

    def __str__(self):
        return self.user.username

# Signals untuk otomatis membuat/menyimpan UserProfile saat User dibuat
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(
            user=instance,
            display_name=instance.first_name + " " + instance.last_name if (instance.first_name or instance.last_name) else instance.username
        )

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()
    else:
        UserProfile.objects.create(user=instance)


