import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from apps.films.models import Film
from apps.films.serializers import FilmSerializer
import json

film = Film.objects.filter(id=9634).first() # Let's find by ID if we know it. Wait, 9634 is the Actor ID!
# Let's just find The Boys by string matching ascii
films = Film.objects.filter(title__icontains="boys")
for f in films:
    serializer = FilmSerializer(f)
    print("Film ID:", f.id)
    print("Awards:")
    print(json.dumps(serializer.data.get('awards', []), indent=2, ensure_ascii=True))
