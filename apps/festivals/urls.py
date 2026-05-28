from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.festivals.views import StudioViewSet, FestivalViewSet, FestivalAwardViewSet

router = DefaultRouter()
router.register('studios', StudioViewSet, basename='studio')
router.register('festivals', FestivalViewSet, basename='festival')
router.register('awards', FestivalAwardViewSet, basename='festival-award')

urlpatterns = [
    path('', include(router.urls)),
]
