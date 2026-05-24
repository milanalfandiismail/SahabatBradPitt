from django.db import models

class Genre(models.Model):
    name = models.CharField(max_length=100, unique=True)
    tmdb_genre_id = models.IntegerField(unique=True, null=True, blank=True)

    def __str__(self):
        return self.name

class Film(models.Model):
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
    
    # Menggunakan ManyToMany atau ForeignKey untuk Studio
    # Berdasarkan keputusan optimalisasi: Studio memiliki relasi dinamis dengan Film
    studio = models.ForeignKey('festivals.Studio', on_delete=models.SET_NULL, null=True, blank=True, related_name='films')
    
    # Durasi film dalam menit
    duration = models.IntegerField(null=True, blank=True)
    
    # Popularitas dari TMDB API
    popularity = models.FloatField(default=0.0)
    
    # Rata-rata rating ulasan dari pengguna (1-10)
    avg_rating = models.FloatField(default=0.0)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
