from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.festivals.views import StudioViewSet, FestivalViewSet

router = DefaultRouter()
router.register('studios', StudioViewSet, basename='studio')
router.register('festivals', FestivalViewSet, basename='festival')

urlpatterns = [
    path('', include(router.urls)),
]
