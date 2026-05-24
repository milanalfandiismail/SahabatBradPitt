from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from apps.ratings.models import Rating, Watchlist
from apps.ratings.serializers import RatingSerializer, WatchlistSerializer

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Kustom permission untuk membatasi aksi edit/delete hanya pada pemilik ulasan (owner).
    Tamu/user lain diperbolehkan membaca data (SAFE_METHODS seperti GET).
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user == request.user

class RatingViewSet(viewsets.ModelViewSet):
    queryset = Rating.objects.all().order_by('-created_at')
    serializer_class = RatingSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        elif self.action == 'create':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsOwnerOrReadOnly()]

    def get_queryset(self):
        queryset = self.queryset
        # Filter rating berdasarkan film tertentu
        film_id = self.request.query_params.get('film', None)
        if film_id:
            queryset = queryset.filter(film__id=film_id)
            
        # Filter rating berdasarkan user tertentu
        user_id = self.request.query_params.get('user', None)
        if user_id:
            queryset = queryset.filter(user__id=user_id)
            
        return queryset

    def perform_create(self, serializer):
        # Otomatis mengikat rating baru ke user terautentikasi aktif
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        # Cek jika user sudah pernah memberi ulasan pada film yang sama
        film_id = request.data.get('film')
        if film_id:
            exists = Rating.objects.filter(user=request.user, film_id=film_id).exists()
            if exists:
                return Response(
                    {"error": "Anda sudah pernah memberikan ulasan pada film ini. Silakan edit ulasan yang sudah ada."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return super().create(request, *args, **kwargs)


class WatchlistViewSet(viewsets.ModelViewSet):
    queryset = Watchlist.objects.all()
    serializer_class = WatchlistSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        elif self.action == 'create':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsOwnerOrReadOnly()]

    def get_queryset(self):
        qs = self.queryset
        user_id = self.request.query_params.get('user', None)
        if user_id:
            qs = qs.filter(user__id=user_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        film_id = request.data.get('film')
        if film_id:
            exists = Watchlist.objects.filter(user=request.user, film_id=film_id).exists()
            if exists:
                return Response(
                    {"error": "Film ini sudah ada di watchlist Anda."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return super().create(request, *args, **kwargs)
