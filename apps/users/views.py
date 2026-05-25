from rest_framework import status, permissions, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from apps.users.serializers import RegisterSerializer, UserSerializer, UserProfileSerializer, UserProfileEditSerializer, UserPreferencesSerializer

class RegisterAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                "message": "Pendaftaran akun berhasil.",
                "token": token.key,
                "user": UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response({"error": "Mohon masukkan username dan password."}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=username, password=password)
        if user is not None:
            if not user.is_active:
                return Response({"error": "Akun ini telah dinonaktifkan."}, status=status.HTTP_403_FORBIDDEN)
                
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                "message": "Login sukses.",
                "token": token.key,
                "user": UserSerializer(user).data
            }, status=status.HTTP_200_OK)
            
        return Response({"error": "Username atau password salah."}, status=status.HTTP_401_UNAUTHORIZED)

class LogoutAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            # Hapus token di database untuk invalidasi
            request.user.auth_token.delete()
            return Response({"message": "Logout sukses. Token berhasil diinvalidasi."}, status=status.HTTP_200_OK)
        except Exception:
            return Response({"error": "Terjadi kesalahan saat logout."}, status=status.HTTP_400_BAD_REQUEST)

class UserMeAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Mengambil data profil pengguna aktif beserta statistik personal."""
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        """Memperbarui nama tampilan, bio, atau avatar pengguna aktif."""
        profile = request.user.profile
        serializer = UserProfileEditSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Profil berhasil diperbarui.",
                "user": UserSerializer(request.user).data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserPreferencesAPIView(APIView):
    """
    GET  /api/auth/me/preferences/ — Ambil preferensi film user
    PUT  /api/auth/me/preferences/ — Simpan/update preferensi film user
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        serializer = UserPreferencesSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        profile = request.user.profile
        serializer = UserPreferencesSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Preferensi film berhasil disimpan.",
                "preferences": UserPreferencesSerializer(profile).data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet untuk mengelola data user dan admin (hanya Superuser).
    """
    queryset = User.objects.all().order_by('username')
    serializer_class = UserSerializer

    def get_permissions(self):
        # Hanya Superuser yang boleh mengakses CRUD User ini
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        # Proteksi double agar data tidak bocor jika diakses non-superuser
        if not self.request.user.is_superuser:
            return User.objects.none()
        return super().get_queryset()

    def create(self, request, *args, **kwargs):
        if not request.user.is_superuser:
            return Response({"error": "Hanya superuser yang dapat membuat pengguna baru."}, status=status.HTTP_403_FORBIDDEN)
        
        # Validasi username unik
        username = request.data.get('username')
        if User.objects.filter(username=username).exists():
            return Response({"error": f"Username '{username}' sudah digunakan."}, status=status.HTTP_400_BAD_REQUEST)
            
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not request.user.is_superuser:
            return Response({"error": "Hanya superuser yang dapat menyunting pengguna."}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not request.user.is_superuser:
            return Response({"error": "Hanya superuser yang dapat menghapus pengguna."}, status=status.HTTP_403_FORBIDDEN)
            
        user_to_delete = self.get_object()
        if user_to_delete == request.user:
            return Response({"error": "Anda tidak bisa menghapus akun superuser aktif Anda sendiri."}, status=status.HTTP_400_BAD_REQUEST)
            
        return super().destroy(request, *args, **kwargs)

    def perform_create(self, serializer):
        password = self.request.data.get('password')
        user = serializer.save()
        if password:
            user.set_password(password)
            user.save()
        else:
            # Set default password jika kosong
            user.set_password("Admin123!")
            user.save()

    def perform_update(self, serializer):
        password = self.request.data.get('password')
        user = serializer.save()
        if password:
            user.set_password(password)
            user.save()

