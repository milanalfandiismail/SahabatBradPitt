from django.db import models
from django.db.models import Q

class Genre(models.Model):
    name = models.CharField(max_length=100, unique=True)
    tmdb_genre_id = models.IntegerField(unique=True, null=True, blank=True)

    def __str__(self):
        return self.name

class FilmQuerySet(models.QuerySet):
    def published_only(self):
        return self.filter(status='published')

    def filter_by_status(self, user, status_param=None):
        if not user.is_staff:
            return self.published_only()
        if status_param:
            return self.filter(status=status_param)
        return self

    def search(self, q):
        if not q:
            return self
        q = q.strip()
        strict_query = (
            Q(title__iexact=q) | 
            Q(title__istartswith=f"{q} ") | 
            Q(title__iendswith=f" {q}") | 
            Q(title__icontains=f" {q} ")
        )
        strict_qs = self.filter(strict_query)
        if strict_qs.exists():
            return strict_qs
        return self.filter(Q(title__icontains=q) | Q(synopsis__icontains=q))

    def filter_by_genres(self, genre_ids):
        if not genre_ids:
            return self
        return self.filter(genre__id__in=genre_ids)

    def filter_by_year_range(self, year_from=None, year_to=None):
        qs = self
        if year_from:
            try:
                qs = qs.filter(release_year__gte=int(year_from))
            except ValueError:
                pass
        if year_to:
            try:
                qs = qs.filter(release_year__lte=int(year_to))
            except ValueError:
                pass
        return qs

    def filter_by_studio(self, studio_id):
        if not studio_id:
            return self
        return self.filter(studio__id=studio_id)

    def filter_by_min_rating(self, min_rating):
        if not min_rating:
            return self
        try:
            return self.filter(avg_rating__gte=float(min_rating))
        except ValueError:
            return self

import os
import uuid
from django.db.models.signals import post_delete, pre_save
from django.dispatch import receiver

def film_poster_upload_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4().hex}.{ext}"
    return os.path.join('films/posters/', filename)

class Film(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending_approval', 'Pending Approval'),
        ('published', 'Published'),
        ('rejected', 'Rejected'),
    ]
    
    tmdb_id = models.IntegerField(unique=True, null=True, blank=True)
    title = models.CharField(max_length=255)
    synopsis = models.TextField(blank=True)
    release_year = models.IntegerField(null=True, blank=True)
    genre = models.ManyToManyField(Genre, related_name='films', blank=True)
    
    # URL trailer film (misal dari YouTube)
    trailer_url = models.URLField(blank=True, max_length=500)
    
    # Path poster film dari TMDB (misal: /p8Z42i4nu5z95xxiMK3ycsAd4hF.jpg)
    # Dirender menggunakan TMDB CDN: https://image.tmdb.org/t/p/w500/<path>
    poster_path = models.CharField(max_length=255, blank=True)
    poster = models.ImageField(upload_to=film_poster_upload_path, null=True, blank=True)
    
    # Menggunakan ManyToMany atau ForeignKey untuk Studio
    # Berdasarkan keputusan optimalisasi: Studio memiliki relasi dinamis dengan Film
    studio = models.ForeignKey('festivals.Studio', on_delete=models.SET_NULL, null=True, blank=True, related_name='films')
    
    # Durasi film dalam menit
    duration = models.IntegerField(null=True, blank=True)
    
    # Popularitas dari TMDB API
    tmdb_popularity = models.FloatField(default=0.0)
    
    # Popularitas lokal berdasarkan interaksi user (misal: tambah ke watchlist = +10)
    local_popularity = models.FloatField(default=0.0)
    
    # Rata-rata rating ulasan dari pengguna (1-10)
    avg_rating = models.FloatField(default=0.0)
    
    # TV Series Fields
    is_tv_series = models.BooleanField(default=False)
    episodes_count = models.IntegerField(null=True, blank=True)
    
    # Approval Workflow Fields
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='published')
    rejection_reason = models.TextField(blank=True, help_text="Alasan penolakan film")
    is_local_edit = models.BooleanField(default=False, help_text="Apakah film ini punya edit lokal (bukan dari TMDB)")
    created_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='films_created')
    updated_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='films_updated')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = FilmQuerySet.as_manager()

    def __str__(self):
        return self.title

@receiver(post_delete, sender=Film)
def auto_delete_film_poster_on_delete(sender, instance, **kwargs):
    if instance.poster:
        if os.path.isfile(instance.poster.path):
            os.remove(instance.poster.path)

@receiver(pre_save, sender=Film)
def auto_delete_film_poster_on_change(sender, instance, **kwargs):
    if not instance.pk:
        return False
    try:
        old_file = Film.objects.get(pk=instance.pk).poster
    except Film.DoesNotExist:
        return False
    new_file = instance.poster
    if not old_file == new_file and old_file:
        if os.path.isfile(old_file.path):
            os.remove(old_file.path)


class FilmImage(models.Model):
    """
    Menyimpan foto adegan (backdrops) lanskap widescreen dari TMDB.
    Digunakan untuk menampilkan Galeri di halaman detail film.
    File path dirender dengan CDN: https://image.tmdb.org/t/p/w1280/<file_path>
    """
    film = models.ForeignKey(Film, on_delete=models.CASCADE, related_name='images')
    # Path gambar dari TMDB (misal: /abc123.jpg)
    file_path = models.CharField(max_length=255)
    # Tipe gambar: 'backdrop' (lanskap) atau 'poster' (vertikal)
    image_type = models.CharField(max_length=50, default='backdrop')

    class Meta:
        ordering = ['id']
        unique_together = ('film', 'file_path')  # Prevent duplicate images for same film
        indexes = [
            models.Index(fields=['film', 'file_path']),
        ]

    def __str__(self):
        return f"Gambar {self.image_type} untuk {self.film.title}"

