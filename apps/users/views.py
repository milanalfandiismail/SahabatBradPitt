from rest_framework import status, permissions, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.models import User
from apps.users.serializers import RegisterSerializer, UserSerializer, UserProfileSerializer, UserProfileEditSerializer, UserPreferencesSerializer
import requests
import uuid

class RegisterAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Langsung login user setelah registrasi, sesi cookie diterbitkan otomatis
            auth_login(request, user)
            return Response({
                "message": "Pendaftaran akun berhasil.",
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

        # Cek apakah akun ini terhubung dengan Google
        user_check = User.objects.filter(username=username).first()
        if not user_check:
            user_check = User.objects.filter(email=username).first()
            
        if user_check and hasattr(user_check, 'profile') and user_check.profile.auth_provider == 'google':
            return Response({"error": "Akun ini didaftarkan menggunakan Google. Silakan masuk via tombol Login Google."}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=username, password=password)
        if user is not None:
            if not user.is_active:
                return Response({"error": "Akun ini telah dinonaktifkan."}, status=status.HTTP_403_FORBIDDEN)

            # Terbitkan session cookie HttpOnly via Django session framework
            auth_login(request, user)
            return Response({
                "message": "Login sukses.",
                "user": UserSerializer(user).data
            }, status=status.HTTP_200_OK)
            
        return Response({"error": "Username atau password salah."}, status=status.HTTP_401_UNAUTHORIZED)

class GoogleLoginAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        id_token_jwt = request.data.get('id_token')
        if not id_token_jwt:
            return Response({"error": "Token ID Google tidak ditemukan."}, status=status.HTTP_400_BAD_REQUEST)

        # Verifikasi token melalui endpoint publik Google
        import socket
        from urllib3.util import connection
        
        # Paksa urllib3/requests menggunakan IPv4 untuk menghindari delay jabat tangan IPv6 di server Ubuntu
        original_gai = connection.allowed_gai_family
        connection.allowed_gai_family = lambda: socket.AF_INET
        
        try:
            try:
                google_response = requests.get(
                    f'https://oauth2.googleapis.com/tokeninfo?id_token={id_token_jwt}',
                    timeout=10
                )
            finally:
                # Kembalikan konfigurasi DNS asli
                connection.allowed_gai_family = original_gai
            
            if not google_response.ok:
                return Response({"error": "Token ID Google tidak valid."}, status=status.HTTP_400_BAD_REQUEST)
            
            user_info = google_response.json()
            email = user_info.get('email')
            if not email:
                return Response({"error": "Email tidak ditemukan dari akun Google."}, status=status.HTTP_400_BAD_REQUEST)
                
            first_name = user_info.get('given_name', '')
            last_name = user_info.get('family_name', '')
            
            # Cek apakah user dengan email tersebut sudah ada
            user = User.objects.filter(email=email).first()
            
            if user:
                # Periksa metode autentikasi asal (GitHub-style guard)
                if hasattr(user, 'profile'):
                    if user.profile.auth_provider == 'local':
                        return Response({
                            "error": "Email Anda sudah terdaftar menggunakan metode login lokal (password). Silakan masuk menggunakan form login biasa dengan memasukkan username dan password Anda."
                        }, status=status.HTTP_400_BAD_REQUEST)
                    
                    # Jika profil belum 'google' (misal profil baru atau belum diset)
                    if user.profile.auth_provider != 'google':
                        user.profile.auth_provider = 'google'
                        user.profile.save()
            else:
                # Buat user baru
                base_username = email.split('@')[0]
                username = base_username
                # Pastikan username unik
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}_{uuid.uuid4().hex[:4]}"
                
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    password=uuid.uuid4().hex
                )
                if hasattr(user, 'profile'):
                    user.profile.auth_provider = 'google'
                    user.profile.display_name = f"{first_name} {last_name}".strip() or username
                    user.profile.save()

            if not user.is_active:
                return Response({"error": "Akun ini telah dinonaktifkan."}, status=status.HTTP_403_FORBIDDEN)

            # Terbitkan session cookie
            auth_login(request, user)
            return Response({
                "message": "Login Google sukses.",
                "user": UserSerializer(user).data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": f"Kesalahan saat memverifikasi token Google: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LogoutAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Invalidasi session server-side dan hapus cookie session dari browser
        auth_logout(request)
        return Response({"message": "Logout sukses. Sesi berhasil diakhiri."}, status=status.HTTP_200_OK)

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

