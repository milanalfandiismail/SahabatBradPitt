from django.db import models
from django.contrib.auth.models import User
from django.db.models import Avg
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from apps.films.models import Film

class Rating(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ratings')
    film = models.ForeignKey(Film, on_delete=models.CASCADE, related_name='ratings')
    
    # Skor rating (1 sampai 10)
    score = models.IntegerField()
    review = models.TextField(blank=True, default='')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'film')

    def __str__(self):
        return f"Rating {self.score}/10 untuk {self.film.title} oleh {self.user.username}"


# Signal helper untuk memperbarui avg_rating pada model Film
def update_film_avg_rating(film):
    ratings = Rating.objects.filter(film=film)
    if ratings.exists():
        avg = ratings.aggregate(Avg('score'))['score__avg']
        film.avg_rating = round(avg, 2)
    else:
        film.avg_rating = 0.0
    film.save(update_fields=['avg_rating'])

@receiver(post_save, sender=Rating)
def rating_saved(sender, instance, **kwargs):
    update_film_avg_rating(instance.film)

@receiver(post_delete, sender=Rating)
def rating_deleted(sender, instance, **kwargs):
    update_film_avg_rating(instance.film)


class Watchlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='watchlist')
    film = models.ForeignKey(Film, on_delete=models.CASCADE, related_name='watchlisted_by')
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'film')
        ordering = ['-added_at']

    def __str__(self):
        return f"{self.user.username} - {self.film.title}"

# Signal helper untuk memperbarui local_popularity pada model Film
@receiver(post_save, sender=Watchlist)
def watchlist_saved(sender, instance, created, **kwargs):
    if created:
        # Tambah +10 popularity setiap kali dimasukkan ke watchlist
        instance.film.local_popularity += 10.0
        instance.film.save(update_fields=['local_popularity'])

@receiver(post_delete, sender=Watchlist)
def watchlist_deleted(sender, instance, **kwargs):
    # Kurangi -10 popularity saat dihapus, minimum 0.0
    instance.film.local_popularity = max(0.0, instance.film.local_popularity - 10.0)
    instance.film.save(update_fields=['local_popularity'])
