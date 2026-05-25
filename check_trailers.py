#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import sys
import django

# Set UTF-8 encoding for output
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.films.models import Film

print("=" * 80)
print("CHECKING TRAILER URLs")
print("=" * 80)

films = Film.objects.filter(trailer_url__contains='youtube.com')[:10]

if not films:
    print("No films with YouTube trailer URLs found")
else:
    for film in films:
        print(f"\nFilm: {film.title}")
        print(f"URL: {film.trailer_url}")
        print(f"Status: {film.get_status_display()}")
        
        # Extract video ID
        if 'v=' in film.trailer_url:
            video_id = film.trailer_url.split('v=')[1].split('&')[0]
            print(f"Video ID: {video_id}")
        else:
            print(f"Invalid URL format")

print("\n" + "=" * 80)
