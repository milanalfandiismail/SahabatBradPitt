from rest_framework import permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.users.permissions import IsSuperadmin

class FilmApprovalMixin:
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def submit_approval(self, request, pk=None):
        film = self.get_object()
        if film.status == 'published':
            return Response({"error": "Film sudah published, tidak perlu approval"}, status=status.HTTP_400_BAD_REQUEST)
        
        film.status = 'pending_approval'
        film.save()
        return Response({
            "message": "Film berhasil disubmit untuk approval",
            "status": film.get_status_display()
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsSuperadmin])
    def approve(self, request, pk=None):
        film = self.get_object()
        
        if film.status != 'pending_approval':
            return Response({"error": "Film ini tidak dalam status pending approval."}, status=status.HTTP_400_BAD_REQUEST)
        
        film.status = 'published'
        film.rejection_reason = ''
        film.updated_by = request.user
        film.save()
        
        serializer = self.get_serializer(film)
        return Response({
            "message": "Film berhasil di-approve dan dipublish",
            "status": film.get_status_display(),
            "data": serializer.data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsSuperadmin])
    def reject(self, request, pk=None):
        film = self.get_object()
        rejection_reason = request.data.get('reason', request.data.get('rejection_reason', ''))
        
        if film.status != 'pending_approval':
            return Response({"error": "Film ini tidak dalam status pending approval."}, status=status.HTTP_400_BAD_REQUEST)
        
        if not rejection_reason:
            return Response({"error": "Alasan penolakan harus diisi."}, status=status.HTTP_400_BAD_REQUEST)
        
        film.status = 'rejected'
        film.rejection_reason = rejection_reason
        film.updated_by = request.user
        film.save()
        
        serializer = self.get_serializer(film)
        return Response({
            "message": "Film berhasil di-reject",
            "status": film.get_status_display(),
            "reason": film.rejection_reason,
            "data": serializer.data
        }, status=status.HTTP_200_OK)
