from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # REST API Endpoints
    path('api/films/', include('apps.films.urls')),
    path('api/actors/', include('apps.actors.urls')),
    path('api/auth/', include('apps.users.urls')),
    path('api/ratings/', include('apps.ratings.urls')),
    path('api/festivals/', include('apps.festivals.urls')),
    path('api/recommendations/', include('apps.recommendations.urls')),

    # Frontend Views (Single Page AJAX Shells)
    path('', TemplateView.as_view(template_name='home.html'), name='home'),
    path('movies/', TemplateView.as_view(template_name='film_list.html'), name='film_list'),
    path('movies/<int:id>/', TemplateView.as_view(template_name='film_detail.html'), name='film_detail'),
    path('actors/', TemplateView.as_view(template_name='actor_list.html'), name='actor_list'),
    path('actors/<int:id>/', TemplateView.as_view(template_name='actor_detail.html'), name='actor_detail'),
    path('trending/', TemplateView.as_view(template_name='trending.html'), name='trending'),
    path('recommendations/', TemplateView.as_view(template_name='recommendations.html'), name='recommendations'),
    path('login/', TemplateView.as_view(template_name='login.html'), name='login'),
    path('signup/', TemplateView.as_view(template_name='signup.html'), name='signup'),
    path('profile/', TemplateView.as_view(template_name='profile.html'), name='profile'),
]
