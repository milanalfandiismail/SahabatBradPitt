from django.core.management.base import BaseCommand
from apps.films.services import TMDBService
from apps.films.actor_config import FEATURED_ACTORS, DEFAULT_MIN_RATING

class Command(BaseCommand):
    help = 'Sinkronisasi data filmografi aktor dari TMDB API ke database lokal dengan filter rating.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--min-rating',
            type=float,
            default=DEFAULT_MIN_RATING,
            help=f'Minimum rating film yang akan disimpan (default: {DEFAULT_MIN_RATING})'
        )
        parser.add_argument(
            '--actors',
            type=str,
            help='TMDB Actor IDs yang akan disinkronkan (comma-separated). Contoh: 287,6193,500'
        )
        parser.add_argument(
            '--all-actors',
            action='store_true',
            help='Sinkronisasi semua aktor dari FEATURED_ACTORS config'
        )
        parser.add_argument(
            '--limit',
            type=int,
            help='[DEPRECATED] Parameter ini diabaikan. Gunakan --min-rating untuk filter kualitas.'
        )

    def handle(self, *args, **options):
        min_rating = options['min_rating']
        actors_arg = options.get('actors')
        all_actors = options.get('all_actors')
        limit = options.get('limit')
        
        if limit is not None:
            self.stdout.write(
                self.style.WARNING("Parameter --limit deprecated. Gunakan --min-rating untuk filter kualitas film.")
            )
        
        service = TMDBService()
        
        if not service.is_configured():
            self.stdout.write(
                self.style.WARNING("Pemberitahuan: TMDB_API_KEY tidak dikonfigurasi di .env. Menggunakan data mock berkualitas tinggi.")
            )
        
        try:
            # Mode 1: Sync semua aktor dari config
            if all_actors:
                self.stdout.write(
                    self.style.WARNING(f"Memulai sinkronisasi {len(FEATURED_ACTORS)} aktor dengan min_rating={min_rating}...")
                )
                result = service.sync_multiple_actors(min_rating=min_rating)
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Sukses! {result['total_actors']} aktor diproses, "
                        f"{result['total_films']} film berkualitas disimpan (rating >= {min_rating})"
                    )
                )
            
            # Mode 2: Sync specific actors by IDs
            elif actors_arg:
                actor_ids = [int(id.strip()) for id in actors_arg.split(',')]
                self.stdout.write(
                    self.style.WARNING(f"Memulai sinkronisasi {len(actor_ids)} aktor dengan min_rating={min_rating}...")
                )
                
                # Build actor list from IDs
                actor_list = []
                for actor_id in actor_ids:
                    # Try to find actor name from FEATURED_ACTORS
                    actor_name = None
                    for featured in FEATURED_ACTORS:
                        if featured['tmdb_id'] == actor_id:
                            actor_name = featured['name']
                            break
                    actor_list.append({"tmdb_id": actor_id, "name": actor_name})
                
                result = service.sync_multiple_actors(actor_list=actor_list, min_rating=min_rating)
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Sukses! {result['total_actors']} aktor diproses, "
                        f"{result['total_films']} film berkualitas disimpan (rating >= {min_rating})"
                    )
                )
            
            # Mode 3: Backward compatibility - sync Brad Pitt only
            else:
                self.stdout.write(
                    self.style.WARNING(f"Memulai sinkronisasi Brad Pitt dengan min_rating={min_rating}...")
                )
                synced_count = service.sync_actor_movies(287, "Brad Pitt", min_rating)
                if synced_count > 0:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Sukses! Berhasil menyelaraskan {synced_count} film Brad Pitt "
                            f"(rating >= {min_rating}) beserta data aktor, filmografi, dan studio terkait."
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.ERROR("Gagal melakukan sinkronisasi data dari TMDB API.")
                    )
                    
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Terjadi kesalahan tak terduga selama sinkronisasi: {str(e)}")
            )
