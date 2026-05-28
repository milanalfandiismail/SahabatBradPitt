from django.db import models
from apps.films.models import Film
from apps.actors.models import Actor

import os
import uuid
from django.db.models.signals import post_delete, pre_save
from django.dispatch import receiver

def festival_logo_upload_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4().hex}.{ext}"
    return os.path.join('festivals/logos/', filename)

class Studio(models.Model):
    name = models.CharField(max_length=255)
    country = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return self.name

class Festival(models.Model):
    name = models.CharField(max_length=255)
    native_name = models.CharField(max_length=255, blank=True, default='')
    country = models.CharField(max_length=100, blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='')
    founded_year = models.IntegerField(null=True, blank=True)
    description = models.TextField(blank=True, default='')
    logo_path = models.CharField(max_length=255, blank=True, default='')
    logo = models.ImageField(upload_to=festival_logo_upload_path, null=True, blank=True)
    website = models.URLField(blank=True, default='')
    tmdb_id = models.IntegerField(null=True, blank=True, unique=True)
    is_active = models.BooleanField(default=True)
    
    # Kept for backwards compatibility
    category = models.CharField(max_length=100, blank=True, default='')
    films = models.ManyToManyField(Film, related_name='festivals', blank=True)

    def __str__(self):
        return self.name

@receiver(post_delete, sender=Festival)
def auto_delete_festival_logo_on_delete(sender, instance, **kwargs):
    if instance.logo:
        if os.path.isfile(instance.logo.path):
            os.remove(instance.logo.path)

@receiver(pre_save, sender=Festival)
def auto_delete_festival_logo_on_change(sender, instance, **kwargs):
    if not instance.pk:
        return False
    try:
        old_file = Festival.objects.get(pk=instance.pk).logo
    except Festival.DoesNotExist:
        return False
    new_file = instance.logo
    if not old_file == new_file and old_file:
        if os.path.isfile(old_file.path):
            os.remove(old_file.path)

class FestivalAward(models.Model):
    AWARD_TYPE_CHOICES = [
        ('winner', 'Winner'),
        ('nominee', 'Nominee'),
    ]
    
    festival = models.ForeignKey(Festival, on_delete=models.CASCADE, related_name='awards')
    film = models.ForeignKey(Film, on_delete=models.SET_NULL, null=True, blank=True, related_name='festival_awards')
    actor = models.ForeignKey(Actor, on_delete=models.SET_NULL, null=True, blank=True, related_name='festival_awards')
    category = models.CharField(max_length=255)
    year = models.IntegerField()
    award_type = models.CharField(max_length=50, choices=AWARD_TYPE_CHOICES, default='winner')

    def __str__(self):
        subject = self.film.title if self.film else (self.actor.name if self.actor else "Unknown")
        return f"{self.festival.name} ({self.year}) - {self.category}: {subject} ({self.get_award_type_display()})"
