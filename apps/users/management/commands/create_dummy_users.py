from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from apps.users.models import UserProfile
import random
import string
from django.utils import timezone


class Command(BaseCommand):
    help = 'Create 100 dummy users for testing pagination'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=100,
            help='Number of dummy users to create (default: 100)'
        )

    def handle(self, *args, **kwargs):
        count = kwargs['count']
        
        self.stdout.write(f'Membuat {count} user dummy...')
        
        # Sample names for realistic data
        first_names = [
            'Andi', 'Budi', 'Citra', 'Dewi', 'Eko', 'Fajar', 'Gita', 'Hendra',
            'Indra', 'Joko', 'Kartika', 'Lina', 'Made', 'Nia', 'Oscar', 'Putri',
            'Rani', 'Sari', 'Tono', 'Umar', 'Vina', 'Wahyu', 'Yanti', 'Zainal',
            'Ahmad', 'Bunga', 'Chandra', 'Dedi', 'Eka', 'Feri', 'Gunawan', 'Hana',
            'Ilham', 'Jasmine', 'Kemal', 'Lestari', 'Makmur', 'Nurdin', 'Pertiwi',
            'Rizky', 'Siti', 'Taufik', 'Ulya', 'Viktor', 'Wulan', 'Yusuf', 'Zahra'
        ]
        
        last_names = [
            'Pratama', 'Santoso', 'Wijaya', 'Kusuma', 'Nugraha', 'Setiawan',
            'Hidayat', 'Rahman', 'Gunawan', 'Saputra', 'Permana', 'Kumar',
            'Singh', 'Patel', 'Wong', 'Kim', 'Lee', 'Chen', 'Wang', 'Zhang',
            'Nguyen', 'Patel', 'Kumar', 'Singh', 'Wong', 'Kim', 'Lee', 'Chen'
        ]
        
        cities = [
            'Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Denpasar', 'Makassar',
            'Semarang', 'Yogyakarta', 'Palembang', 'Denpasar', 'Pekanbaru',
            'Jambi', 'Pangkalpinang', 'Batam', 'Tangerang', 'Depok', 'Bogor'
        ]
        
        created_count = 0
        
        for i in range(count):
            # Generate unique username and email
            random_num = random.randint(1000, 9999)
            username = f'user_{random_num}'
            email = f'user_{random_num}@example.com'
            
            # Check if user already exists
            if User.objects.filter(username=username).exists():
                self.stdout.write(f'Skipping existing user: {username}')
                continue
            
            # Create user
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=random.choice(first_names),
                last_name=random.choice(last_names),
                password='password123',  # Default password
                is_active=True
            )
            
            # Create profile
            profile = UserProfile.objects.create(
                user=user,
                display_name=f"{user.first_name} {user.last_name}",
                bio=f"Film lover from {random.choice(cities)}. Passionate about cinema and independent films.",
                auth_provider='local'
            )
            
            # Randomize display name with some variations
            if random.random() > 0.7:
                profile.display_name = f"{user.first_name} {user.last_name} ({random.choice(['Fan', 'Reviewer', 'Critic', 'Collector', 'Enthusiast'])})"
            
            # Randomize stats
            reviews_count = random.randint(0, 50)
            avg_rating = round(random.uniform(3.0, 9.0), 1)
            
            profile.reviews_count = reviews_count
            profile.avg_rating = avg_rating
            profile.save()
            
            created_count += 1
            
            if created_count % 10 == 0:
                self.stdout.write(f'Created {created_count}/{count} users...')
        
        self.stdout.write(self.style.SUCCESS(f'Sukses membuat {created_count} user dummy!'))
        self.stdout.write(f'Username default: password123')