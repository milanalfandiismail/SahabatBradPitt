from django.db import models
from apps.films.models import Film

class Studio(models.Model):
    name = models.CharField(max_length=255)
    country = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return self.name

class Festival(models.Model):
    name = models.CharField(max_length=255)
    country = models.CharField(max_length=100, blank=True)
    category = models.CharField(max_length=100, blank=True)
    films = models.ManyToManyField(Film, related_name='festivals', blank=True)

    def __str__(self):
        return self.name
