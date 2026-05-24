from django.core.management.base import BaseCommand
from apps.films.services import TMDBService


class Command(BaseCommand):
    help = "Sync cast members untuk all films yang sudah ada di database"
    
    def handle(self, *args, **options):
        """
        Execute sync cast members untuk all films.
        """
        self.stdout.write(self.style.WARNING("Memulai sync cast members untuk all films..."))
        
        service = TMDBService()
        result = service.sync_films_cast_members()
        
        self.stdout.write(self.style.SUCCESS(
            f"\n✅ Sync complete!\n"
            f"   - Films processed: {result['total_films']}\n"
            f"   - Actors synced: {result['total_actors']}\n"
        ))
