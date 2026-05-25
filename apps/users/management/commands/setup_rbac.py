from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from apps.films.models import Film
from apps.actors.models import Actor


class Command(BaseCommand):
    help = 'Setup RBAC groups and permissions for Admin and Superadmin roles'

    def handle(self, *args, **options):
        # Create groups
        admin_group, admin_created = Group.objects.get_or_create(name='Admin')
        superadmin_group, superadmin_created = Group.objects.get_or_create(name='Superadmin')
        
        # Get content types
        film_ct = ContentType.objects.get_for_model(Film)
        actor_ct = ContentType.objects.get_for_model(Actor)
        
        # Admin permissions: can add/change but not delete
        admin_permissions = [
            Permission.objects.get(codename='add_film', content_type=film_ct),
            Permission.objects.get(codename='change_film', content_type=film_ct),
            Permission.objects.get(codename='add_actor', content_type=actor_ct),
            Permission.objects.get(codename='change_actor', content_type=actor_ct),
        ]
        admin_group.permissions.set(admin_permissions)
        
        # Superadmin permissions: all permissions for Film and Actor
        superadmin_permissions = Permission.objects.filter(
            content_type__in=[film_ct, actor_ct]
        )
        superadmin_group.permissions.set(superadmin_permissions)
        
        # Output results
        if admin_created:
            self.stdout.write(self.style.SUCCESS('[+] Created group: Admin'))
        else:
            self.stdout.write(self.style.WARNING('[*] Group Admin already exists'))
        
        if superadmin_created:
            self.stdout.write(self.style.SUCCESS('[+] Created group: Superadmin'))
        else:
            self.stdout.write(self.style.WARNING('[*] Group Superadmin already exists'))
        
        self.stdout.write(self.style.SUCCESS('\n[+] RBAC setup completed successfully!'))
        self.stdout.write(self.style.WARNING('\nNext steps:'))
        self.stdout.write('1. Assign users to groups via Django admin or:')
        self.stdout.write('   user.groups.add(Group.objects.get(name="Admin"))')
        self.stdout.write('   user.groups.add(Group.objects.get(name="Superadmin"))')
