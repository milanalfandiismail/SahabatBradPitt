from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from apps.users.serializers import RegisterSerializer, UserSerializer, UserProfileSerializer

class RegisterAPIView(APIView):
    permission_classes = [permissions.AllowAny]

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
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Profil berhasil diperbarui.",
                "user": UserSerializer(request.user).data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
