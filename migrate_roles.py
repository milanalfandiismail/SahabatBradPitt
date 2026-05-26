import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.actors.models import Filmography
from django.db.models import F

def migrate_roles():
    # Set Sutradara
    director_count = Filmography.objects.filter(role__icontains='sutradara').update(role_type='director')
    print(f"Updated {director_count} directors.")

    # Set Lead Cast (order <= 4) which are not directors
    lead_count = Filmography.objects.filter(order__lte=4).exclude(role_type='director').update(role_type='lead')
    print(f"Updated {lead_count} lead casts.")

    # Set Supporting Cast (order >= 5) which are not directors
    supporting_count = Filmography.objects.filter(order__gte=5).exclude(role_type='director').update(role_type='supporting')
    print(f"Updated {supporting_count} supporting casts.")

if __name__ == '__main__':
    migrate_roles()
