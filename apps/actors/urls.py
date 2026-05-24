from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.actors.views import ActorViewSet

router = DefaultRouter()
router.register('', ActorViewSet, basename='actor')

urlpatterns = [
    path('', include(router.urls)),
]
