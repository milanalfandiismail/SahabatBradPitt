from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.films.views import FilmViewSet, GenreViewSet

router = DefaultRouter()
router.register('genres', GenreViewSet, basename='genre')
router.register('', FilmViewSet, basename='film')

urlpatterns = [
    path('', include(router.urls)),
]
