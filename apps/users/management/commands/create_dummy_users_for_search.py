from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
import random


class Command(BaseCommand):
    help = 'Create 100 dummy users with searchable names for testing search functionality'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=100,
            help='Number of dummy users to create (default: 100)'
        )

    def handle(self, *args, **kwargs):
        count = kwargs['count']

        self.stdout.write(f'Membuat {count} user dummy untuk testing search...')

        search_keywords = [
            'cinema', 'film', 'movie', 'actor', 'director', 'producer',
            'review', 'critic', 'fan', 'buff', 'enthusiast', 'lover',
            'classic', 'indie', 'horror', 'action', 'drama', 'comedy',
            'sci-fi', 'anime', 'korea', 'japan', 'asia', 'western',
            'hollywood', 'bollywood', 'nollywood', 'blockbuster', 'independent'
        ]

        first_names = [
            'Cinema', 'Film', 'Movie', 'Actor', 'Director', 'Producer',
            'Review', 'Critic', 'Fan', 'Buff', 'Enthusiast', 'Lover',
            'Classic', 'Indie', 'Horror', 'Action', 'Drama', 'Comedy',
            'Sci-Fi', 'Anime', 'Korea', 'Japan', 'Asia', 'Western',
            'Hollywood', 'Bollywood', 'Nollywood', 'Blockbuster', 'Independent'
        ]

        last_names = [
            'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia',
            'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez',
            'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore',
            'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris'
        ]

        cities = [
            'Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Denpasar', 'Makassar',
            'Semarang', 'Yogyakarta', 'Palembang', 'Denpasar', 'Pekanbaru',
        ]

        created_count = 0

        for i in range(count):
            random_num = random.randint(1000, 9999)
            username = f'searchable_{random_num}'
            email = f'searchable_{random_num}@example.com'

            if User.objects.filter(username=username).exists():
                continue

            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            keyword = random.choice(search_keywords)
            city = random.choice(cities)

            # Signal akan otomatis buat UserProfile
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                password='password123',
                is_active=True
            )

            # Update profile yang sudah dibuat oleh signal
            profile = user.profile
            display_name = f"{first_name} {last_name}"
            if random.random() > 0.5:
                display_name = f"{first_name} {last_name} ({keyword})"
            profile.display_name = display_name
            profile.bio = f"Passionate {keyword} from {city}. Love watching and reviewing films."
            profile.save()

            created_count += 1

            if created_count % 10 == 0:
                self.stdout.write(f'Created {created_count}/{count} users...')

        self.stdout.write(self.style.SUCCESS(f'Sukses membuat {created_count} user dummy dengan nama yang searchable!'))
        self.stdout.write(f'Login: password123')
