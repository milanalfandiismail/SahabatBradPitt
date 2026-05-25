from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Subquery, OuterRef, CharField, Q, IntegerField
from apps.actors.models import Actor, Filmography
from apps.actors.serializers import ActorSerializer
from apps.users.permissions import IsAdminOrSuperadmin, IsSuperadmin

class ActorPagination(PageNumberPagination):
    page_size = 10

class ActorViewSet(viewsets.ModelViewSet):
    queryset = Actor.objects.all().prefetch_related('filmographies__film').order_by('name')
    serializer_class = ActorSerializer
    pagination_class = ActorPagination

    @property
    def paginator(self):
        # Nonaktifkan pagination jika memfilter berdasarkan film agar bisa menarik semua cast sekaligus
        if self.request.query_params.get('film'):
            return None
        return super().paginator

    def get_permissions(self):
        """Override permissions based on action"""
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        elif self.action in ['approve', 'reject']:
            return [IsSuperadmin()]
        else:
            return [IsAdminOrSuperadmin()]

    def get_queryset(self):
        queryset = self.queryset
        
        # Filter berdasarkan status untuk public users
        # Public users hanya melihat published actors
        if not self.request.user.is_staff:
            queryset = queryset.filter(status='published')
        
        # Filter pencarian berdasarkan nama atau nama asli
        search = self.request.query_params.get('search', None)
        if search:
            search = search.strip()
            # 1. Try strict matching (exact or whole-word)
            strict_query = (
                Q(name__iexact=search) | 
                Q(native_name__iexact=search) |
                Q(name__istartswith=f"{search} ") | 
                Q(name__iendswith=f" {search}") | 
                Q(name__icontains=f" {search} ") |
                Q(native_name__istartswith=f"{search} ") | 
                Q(native_name__iendswith=f" {search}") | 
                Q(native_name__icontains=f" {search} ")
            )
            strict_qs = queryset.filter(strict_query)
            if strict_qs.exists():
                queryset = strict_qs
            else:
                # 2. Fallback to broad contains search
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
            # Annotate order aktor di film ini
            order_subquery = Filmography.objects.filter(
                actor=OuterRef('pk'),
                film_id=film_id
            ).values('order')[:1]
            
            queryset = queryset.annotate(
                film_role=Subquery(role_subquery, output_field=CharField()),
                film_order=Subquery(order_subquery, output_field=IntegerField())
            ).order_by('film_order', 'name')
        
        return queryset
    
    def perform_create(self, serializer):
        """Set created_by and status based on user role"""
        user = self.request.user
        is_superadmin = user.groups.filter(name='Superadmin').exists()
        
        serializer.save(
            created_by=user,
            updated_by=user,
            is_local_edit=True,
            status='published' if is_superadmin else 'pending_approval'
        )
    
    def perform_update(self, serializer):
        """Set updated_by and status based on user role"""
        user = self.request.user
        is_superadmin = user.groups.filter(name='Superadmin').exists()
        
        # If Admin is editing, set to pending_approval
        if not is_superadmin:
            serializer.save(
                updated_by=user,
                is_local_edit=True,
                status='pending_approval'
            )
        else:
            serializer.save(updated_by=user)
    
    @action(detail=True, methods=['post'], url_path='approve', permission_classes=[IsSuperadmin])
    def approve(self, request, pk=None):
        """
        POST /api/actors/<id>/approve/
        Approve a pending actor (Superadmin only).
        """
        actor = self.get_object()
        
        if actor.status != 'pending_approval':
            return Response(
                {"error": "Aktor ini tidak dalam status pending approval."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        actor.status = 'published'
        actor.rejection_reason = ''
        actor.save()
        
        serializer = self.get_serializer(actor)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], url_path='reject', permission_classes=[IsSuperadmin])
    def reject(self, request, pk=None):
        """
        POST /api/actors/<id>/reject/
        Reject a pending actor (Superadmin only).
        Body: {"rejection_reason": "..."}
        """
        actor = self.get_object()
        rejection_reason = request.data.get('rejection_reason', '')
        
        if actor.status != 'pending_approval':
            return Response(
                {"error": "Aktor ini tidak dalam status pending approval."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not rejection_reason:
            return Response(
                {"error": "Alasan penolakan harus diisi."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        actor.status = 'rejected'
        actor.rejection_reason = rejection_reason
        actor.save()
        
        serializer = self.get_serializer(actor)
        return Response(serializer.data, status=status.HTTP_200_OK)

