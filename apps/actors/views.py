from rest_framework import viewsets, permissions
from rest_framework.pagination import PageNumberPagination
from django.db.models import Subquery, OuterRef, CharField, Q
from apps.actors.models import Actor, Filmography
from apps.actors.serializers import ActorSerializer

class ActorPagination(PageNumberPagination):
    page_size = 10

class ActorViewSet(viewsets.ModelViewSet):
    queryset = Actor.objects.all().prefetch_related('filmographies__film').order_by('name')
    serializer_class = ActorSerializer
    pagination_class = ActorPagination

    def get_permissions(self):
        # RBAC: Read-only untuk tamu/regular, Admin untuk write
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def get_queryset(self):
        queryset = self.queryset
        
        # Filter pencarian berdasarkan nama atau nama asli
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(native_name__icontains=search))
            
        # Filter berdasarkan genre khusus yang didukung aktor
        genre_id = self.request.query_params.get('genre', None)
        if genre_id:
            queryset = queryset.filter(genre_spec__id=genre_id)
        
        # Filter berdasarkan film (actors yang main di film tertentu)
        # + annotate film_role dari Filmography untuk tahu peran spesifik di film ini
        film_id = self.request.query_params.get('film', None)
        if film_id:
            queryset = queryset.filter(filmographies__film_id=film_id)
            # Annotate role aktor di film ini
            role_subquery = Filmography.objects.filter(
                actor=OuterRef('pk'),
                film_id=film_id
            ).values('role')[:1]
            queryset = queryset.annotate(
                film_role=Subquery(role_subquery, output_field=CharField())
            )
        
        return queryset.distinct()
