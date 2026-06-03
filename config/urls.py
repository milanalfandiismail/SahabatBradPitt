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
    public_profile_html_view,
    search_profile_html_view,
)

urlpatterns = [
    path('dapur-bradpitt/', admin.site.urls),  # Obfuscated admin URL untuk keamanan
    
    # REST API Endpoints
    path('api/films/', include('apps.films.urls')),
    path('api/actors/', include('apps.actors.urls')),
    path('api/auth/', include('apps.users.urls')),
    path('api/ratings/', include('apps.ratings.urls')),
    path('api/festivals/', include('apps.festivals.urls')),
    path('api/recommendations/', include('apps.recommendations.urls')),

    # Frontend Views — Public (tetap TemplateView karena tidak membutuhkan guard)
    path('', TemplateView.as_view(template_name='home.html'), name='home'),
    path('about/', TemplateView.as_view(template_name='about.html'), name='about'),
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
    path('profile/search/', search_profile_html_view, name='search_profile'),
    path('profile/<int:user_id>/', public_profile_html_view, name='public_profile'),
    path('recommendations/', recommendations_html_view, name='recommendations'),
    path('admin-films/', admin_films_html_view, name='admin_films'),
]

from django.urls import re_path
from django.views.static import serve
from django.conf import settings
from django.shortcuts import render

# Custom error handlers
def custom_404(request, exception):
    return render(request, '404.html', status=404)

handler404 = custom_404

# Serve media and static files
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
else:
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
        re_path(r'^static/(?P<path>.*)$', serve, {'document_root': settings.STATIC_ROOT}),
    ]
