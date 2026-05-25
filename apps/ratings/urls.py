from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.ratings.views import RatingViewSet, WatchlistViewSet

router = DefaultRouter()
router.register('watchlist', WatchlistViewSet, basename='watchlist')
router.register('', RatingViewSet, basename='rating')

urlpatterns = [
    path('', include(router.urls)),
]
