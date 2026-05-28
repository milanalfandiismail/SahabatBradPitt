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
        if self.action in ['list', 'retrieve', 'wikipedia_import']:
            return [permissions.AllowAny()] # Boleh diakses (tetapi kita bisa batasi di get_permissions atau biarkan IsAdminUser)
        return [permissions.IsAdminUser()]

    @action(detail=False, methods=['post'], url_path='wikipedia-import')
    def wikipedia_import(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Hanya admin yang dapat mengimpor data.'}, status=403)
            
        film_id = request.data.get('film_id')
        wikipedia_url = request.data.get('wikipedia_url')
        if not film_id:
            return Response({'error': 'Film ID wajib diisi.'}, status=400)
            
        from apps.festivals.wiki_service import WikipediaAccoladesImporter
        importer = WikipediaAccoladesImporter()
        result = importer.import_to_database(film_id, wikipedia_url)
        if not result.get('success'):
            return Response({'error': result.get('error')}, status=400)
            
        return Response(result)

class FestivalAwardViewSet(viewsets.ModelViewSet):
    queryset = FestivalAward.objects.all().order_by('-year', 'category')
    serializer_class = FestivalAwardSerializer

    def get_permissions(self):
        # RBAC: Read-only untuk tamu/regular, Admin untuk write
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]
