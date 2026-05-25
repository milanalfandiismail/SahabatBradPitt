from django.db import models
from django.utils import timezone
from apps.films.models import Film, Genre

class Actor(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending_approval', 'Pending Approval'),
        ('published', 'Published'),
        ('rejected', 'Rejected'),
    ]
    
    tmdb_id = models.IntegerField(unique=True, null=True, blank=True)
    name = models.CharField(max_length=255)
    bio = models.TextField(blank=True)
    birth_year = models.IntegerField(null=True, blank=True)
    
    # Path foto dari TMDB (misal: /vN6vR1810V46N38w1N1e4PzZ29t.jpg)
    # Dirender menggunakan TMDB CDN: https://image.tmdb.org/t/p/w500/<path>
    photo_path = models.CharField(max_length=255, blank=True)
    
    # Nama asli (native name) untuk aktor non-Latin, misal: 송강, 章子怡, etc.
    # Diambil dari TMDB also_known_as field
    native_name = models.CharField(max_length=255, blank=True, default='')

    # Spesialisasi genre aktor (opsional)
    genre_spec = models.ManyToManyField(Genre, related_name='actors', blank=True)
    
    # Approval Workflow Fields
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='published')
    rejection_reason = models.TextField(blank=True, help_text="Alasan penolakan aktor")
    is_local_edit = models.BooleanField(default=False, help_text="Apakah aktor ini punya edit lokal (bukan dari TMDB)")
    created_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='actors_created')
    updated_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='actors_updated')
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Filmography(models.Model):
    actor = models.ForeignKey(Actor, on_delete=models.CASCADE, related_name='filmographies')
    film = models.ForeignKey(Film, on_delete=models.CASCADE, related_name='filmographies')
    
    # Peran dalam film (misal: "Actor", "Director", "Producer")
    role = models.CharField(max_length=255, default='Actor')
    
    # Urutan penayangan/kepentingan cast
    order = models.IntegerField(default=0)

    class Meta:
        verbose_name_plural = "Filmographies"
        unique_together = ('actor', 'film', 'role')

    def __str__(self):
        return f"{self.actor.name} sebagai {self.role} di {self.film.title}"
