import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from apps.festivals.models import FestivalAward

print("List of all Festival Awards:")
for aw in FestivalAward.objects.all():
    print(f"ID: {aw.id}")
    print(f"  Category: {aw.category}")
    print(f"  Film: {aw.film.title if aw.film else 'None'}")
    print(f"  Actor: {aw.actor.name if aw.actor else 'None'} (ID: {aw.actor.id if aw.actor else 'None'})")
    print(f"  Year: {aw.year}")
    print(f"  Type: {aw.award_type}")
    print("-" * 40)
