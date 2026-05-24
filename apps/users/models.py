from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Path foto avatar (bisa diunggah atau menggunakan default SVG/placeholder)
    avatar_path = models.CharField(max_length=255, blank=True, default='')
    display_name = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True, default='')

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
