from django.db import models
from django.utils import timezone
from django.db.models import Subquery, OuterRef, CharField, Q, IntegerField
from apps.films.models import Film, Genre

class ActorQuerySet(models.QuerySet):
    def published_only(self):
        return self.filter(status='published')

    def filter_by_status(self, user, status_param=None):
        if not user.is_staff:
            return self.published_only()
        if status_param:
            return self.filter(status=status_param)
        return self

    def search(self, search_term):
        if not search_term:
            return self
        search_term = search_term.strip()
        from django.db.models import Case, When, Value, IntegerField

        # Cocokkan nama atau nama asli
        match_query = (
            Q(name__icontains=search_term) |
            Q(native_name__icontains=search_term)
        )

        # Ranking relevansi (makin kecil makin relevan):
        # 1 - eksak nama penuh
        # 2 - nama dimulai dengan kata pencarian
        # 3 - kata pencarian adalah kata penuh di dalam nama (word boundary)
        # 4 - substring umum (icontains)
        return self.filter(match_query).annotate(
            search_rank=Case(
                When(Q(name__iexact=search_term) | Q(native_name__iexact=search_term),
                     then=Value(1)),
                When(Q(name__istartswith=search_term) | Q(native_name__istartswith=search_term),
                     then=Value(2)),
                When(
                    Q(name__istartswith=f"{search_term} ") |
                    Q(name__iendswith=f" {search_term}") |
                    Q(name__icontains=f" {search_term} ") |
                    Q(native_name__istartswith=f"{search_term} ") |
                    Q(native_name__iendswith=f" {search_term}") |
                    Q(native_name__icontains=f" {search_term} "),
                    then=Value(3)
                ),
                default=Value(4),
                output_field=IntegerField()
            )
        ).order_by('search_rank', 'name')

    def filter_by_genre(self, genre_id):
        if not genre_id:
            return self
        return self.filter(genre_spec__id=genre_id)

    def filter_by_film(self, film_id):
        if not film_id:
            return self
            
        from apps.actors.models import Filmography
        
        # Annotate role aktor di film ini
        role_subquery = Filmography.objects.filter(
            actor=OuterRef('pk'),
            film_id=film_id
        ).values('role')[:1]
        
        # Annotate order aktor di film ini
        order_subquery = Filmography.objects.filter(
            actor=OuterRef('pk'),
            film_id=film_id
        ).values('order')[:1]

        # Annotate role_type aktor di film ini
        role_type_subquery = Filmography.objects.filter(
            actor=OuterRef('pk'),
            film_id=film_id
        ).values('role_type')[:1]
        
        return self.filter(filmographies__film_id=film_id).annotate(
            film_role=Subquery(role_subquery, output_field=CharField()),
            film_order=Subquery(order_subquery, output_field=IntegerField()),
            film_role_type=Subquery(role_type_subquery, output_field=CharField())
        ).order_by('film_order', 'name')
import os
import uuid
from django.db.models.signals import post_delete, pre_save
from django.dispatch import receiver

def actor_photo_upload_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4().hex}.{ext}"
    return os.path.join('actors/photos/', filename)

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
    
    # Personal details
    gender = models.IntegerField(null=True, blank=True, choices=[(0, 'Not specified'), (1, 'Female'), (2, 'Male'), (3, 'Non-binary')])
    birthday = models.DateField(null=True, blank=True)
    deathday = models.DateField(null=True, blank=True)
    place_of_birth = models.CharField(max_length=255, blank=True, null=True)
    known_for_department = models.CharField(max_length=255, blank=True, null=True)

    # Social Media Links
    instagram_id = models.CharField(max_length=255, blank=True, null=True)
    twitter_id = models.CharField(max_length=255, blank=True, null=True)
    facebook_id = models.CharField(max_length=255, blank=True, null=True)
    tiktok_id = models.CharField(max_length=255, blank=True, null=True)

    # Path foto dari TMDB (misal: /vN6vR1810V46N38w1N1e4PzZ29t.jpg)
    # Dirender menggunakan TMDB CDN: https://image.tmdb.org/t/p/w500/<path>
    tmdb_photo = models.CharField(max_length=255, blank=True)
    local_photo = models.ImageField(upload_to=actor_photo_upload_path, null=True, blank=True)
    
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

    objects = ActorQuerySet.as_manager()

    def __str__(self):
        return self.name

@receiver(post_delete, sender=Actor)
def auto_delete_actor_photo_on_delete(sender, instance, **kwargs):
    if instance.local_photo:
        if os.path.isfile(instance.local_photo.path):
            os.remove(instance.local_photo.path)

@receiver(pre_save, sender=Actor)
def auto_delete_actor_photo_on_change(sender, instance, **kwargs):
    if not instance.pk:
        return False
    try:
        old_file = Actor.objects.get(pk=instance.pk).local_photo
    except Actor.DoesNotExist:
        return False
    new_file = instance.local_photo
    if not old_file == new_file and old_file:
        if os.path.isfile(old_file.path):
            os.remove(old_file.path)

class Filmography(models.Model):
    ROLE_TYPE_CHOICES = [
        ('lead', 'Pemeran Utama'),
        ('supporting', 'Pemeran Pendukung'),
        ('cameo', 'Kameo'),
        ('director', 'Sutradara'),
        ('producer', 'Produser'),
        ('writer', 'Penulis Skenario'),
        ('other', 'Lainnya'),
    ]

    actor = models.ForeignKey(Actor, on_delete=models.CASCADE, related_name='filmographies')
    film = models.ForeignKey(Film, on_delete=models.CASCADE, related_name='filmographies')
    
    # Peran dalam film (misal: "Actor", "Director", "Producer")
    role = models.CharField(max_length=255, default='Actor')
    
    # Tipe peran dalam film
    role_type = models.CharField(max_length=20, choices=ROLE_TYPE_CHOICES, default='supporting')
    
    # Urutan penayangan/kepentingan cast
    order = models.IntegerField(default=0)

    class Meta:
        verbose_name_plural = "Filmographies"
        unique_together = ('actor', 'film', 'role')

    def __str__(self):
        return f"{self.actor.name} sebagai {self.role} di {self.film.title}"
