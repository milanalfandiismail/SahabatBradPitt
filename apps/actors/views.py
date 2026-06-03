from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Subquery, OuterRef, CharField, Q, IntegerField
from apps.actors.models import Actor, Filmography
from apps.actors.serializers import ActorSerializer
from apps.users.permissions import IsAdminOrSuperadmin, IsSuperadmin

class ActorViewSet(viewsets.ModelViewSet):
    queryset = Actor.objects.all().prefetch_related('filmographies__film').order_by('name')
    serializer_class = ActorSerializer

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
        
        # 1. Filter by status
        status_param = self.request.query_params.get('status', None)
        queryset = queryset.filter_by_status(self.request.user, status_param)
        
        # 2. Search
        search = self.request.query_params.get('search', None)
        queryset = queryset.search(search)
            
        # 3. Filter by genre
        genre_id = self.request.query_params.get('genre', None)
        queryset = queryset.filter_by_genre(genre_id)
        
        # 4. Filter by film & annotate roles
        film_id = self.request.query_params.get('film', None)
        queryset = queryset.filter_by_film(film_id)
        
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

