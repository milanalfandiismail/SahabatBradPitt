import requests
import json
import os
import django
import sys

# Setup Django environment
sys.path.append(r"c:\Milan\GIT\SahabatBradPitt")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from django.conf import settings

api_key = settings.TMDB_API_KEY
movie_id = 1339713

# Test 1: language=id-ID (Current code behavior)
url1 = f"https://api.themoviedb.org/3/movie/{movie_id}?api_key={api_key}&language=id-ID&append_to_response=videos"
res1 = requests.get(url1)
print("TEST 1 (id-ID):")
print(len(res1.json().get('videos', {}).get('results', [])))

# Test 2: include_video_language=id,en,null
url2 = f"https://api.themoviedb.org/3/movie/{movie_id}?api_key={api_key}&language=id-ID&append_to_response=videos&include_video_language=id,en,null"
res2 = requests.get(url2)
print("TEST 2 (include_video_language):")
print(len(res2.json().get('videos', {}).get('results', [])))
