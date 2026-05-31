from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.festivals.models import Studio, Festival, FestivalAward
from apps.festivals.serializers import StudioSerializer, FestivalSerializer, FestivalAwardSerializer

class StudioViewSet(viewsets.ModelViewSet):
    queryset = Studio.objects.all().order_by('name')
    serializer_class = StudioSerializer

    def get_permissions(self):
        # RBAC: Read-only untuk tamu/regular, Admin untuk write
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

class FestivalViewSet(viewsets.ModelViewSet):
    queryset = Festival.objects.all().order_by('name')
    serializer_class = FestivalSerializer

    def get_permissions(self):
        # RBAC: Read-only untuk tamu/regular, Admin untuk write
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]


class FestivalAwardViewSet(viewsets.ModelViewSet):
    queryset = FestivalAward.objects.all().order_by('-year', 'category')
    serializer_class = FestivalAwardSerializer

    def get_permissions(self):
        # RBAC: Read-only untuk tamu/regular, Admin untuk write
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]
