from django.urls import path
from apps.users.views import RegisterAPIView, LoginAPIView, LogoutAPIView, UserMeAPIView, UserPreferencesAPIView

urlpatterns = [
    path('register/', RegisterAPIView.as_view(), name='auth_register'),
    path('login/', LoginAPIView.as_view(), name='auth_login'),
    path('logout/', LogoutAPIView.as_view(), name='auth_logout'),
    path('me/', UserMeAPIView.as_view(), name='user_me'),
    path('me/preferences/', UserPreferencesAPIView.as_view(), name='user_preferences'),
]
