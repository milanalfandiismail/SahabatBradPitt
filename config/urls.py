from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from apps.users.views_html import (
    login_html_view,
    signup_html_view,
    profile_html_view,
    recommendations_html_view,
    admin_films_html_view,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # REST API Endpoints
    path('api/films/', include('apps.films.urls')),
    path('api/actors/', include('apps.actors.urls')),
    path('api/auth/', include('apps.users.urls')),
    path('api/ratings/', include('apps.ratings.urls')),
    path('api/festivals/', include('apps.festivals.urls')),
    path('api/recommendations/', include('apps.recommendations.urls')),

    # Frontend Views — Public (tetap TemplateView karena tidak membutuhkan guard)
    path('', TemplateView.as_view(template_name='home.html'), name='home'),
    path('movies/', TemplateView.as_view(template_name='movies/film_list.html'), name='film_list'),
    path('movies/<int:id>/', TemplateView.as_view(template_name='movies/film_detail.html'), name='film_detail'),
    path('actors/', TemplateView.as_view(template_name='actors/actor_list.html'), name='actor_list'),
    path('actors/<int:id>/', TemplateView.as_view(template_name='actors/actor_detail.html'), name='actor_detail'),
    path('festivals/', TemplateView.as_view(template_name='festivals/festival_list.html'), name='festival_list'),
    path('festivals/<int:id>/', TemplateView.as_view(template_name='festivals/festival_detail.html'), name='festival_detail'),
    path('trending/', TemplateView.as_view(template_name='trending.html'), name='trending'),

    # Frontend Views — SSR Protected (diproteksi server-side dengan decorator)
    path('login/', login_html_view, name='login'),
    path('signup/', signup_html_view, name='signup'),
    path('profile/', profile_html_view, name='profile'),
    path('recommendations/', recommendations_html_view, name='recommendations'),
    path('admin-films/', admin_films_html_view, name='admin_films'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
