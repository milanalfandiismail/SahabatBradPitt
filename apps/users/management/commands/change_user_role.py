from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User, Group


class Command(BaseCommand):
    help = 'Change user role (Admin or Superadmin)'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username to change role')
        parser.add_argument('role', type=str, choices=['admin', 'superadmin', 'user'],
                          help='Role: admin, superadmin, or user')

    def handle(self, *args, **options):
        username = options['username']
        role = options['role'].lower()

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise CommandError(f'User "{username}" not found')

        # Get or create groups
        admin_group, _ = Group.objects.get_or_create(name='Admin')
        superadmin_group, _ = Group.objects.get_or_create(name='Superadmin')

        # Remove user from all groups first
        user.groups.clear()

        # Assign based on role
        if role == 'superadmin':
            user.is_staff = True
            user.is_superuser = True
            user.groups.add(superadmin_group)
            self.stdout.write(self.style.SUCCESS(f'[+] User "{username}" set to Superadmin'))
        elif role == 'admin':
            user.is_staff = True
            user.is_superuser = False
            user.groups.add(admin_group)
            self.stdout.write(self.style.SUCCESS(f'[+] User "{username}" set to Admin'))
        elif role == 'user':
            user.is_staff = False
            user.is_superuser = False
            self.stdout.write(self.style.SUCCESS(f'[+] User "{username}" set to regular User'))

        user.save()

        # Show updated info
        groups = list(user.groups.values_list('name', flat=True))
        self.stdout.write(self.style.WARNING(f'\nUpdated user info:'))
        self.stdout.write(f'  Username: {user.username}')
        self.stdout.write(f'  is_staff: {user.is_staff}')
        self.stdout.write(f'  is_superuser: {user.is_superuser}')
        self.stdout.write(f'  groups: {groups if groups else "None"}')
