from django.db import migrations

def create_rbac_roles(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    Permission = apps.get_model('auth', 'Permission')
    ContentType = apps.get_model('contenttypes', 'ContentType')
    
    # Buat groups Admin & Superadmin jika belum ada
    admin_group, _ = Group.objects.get_or_create(name='Admin')
    superadmin_group, _ = Group.objects.get_or_create(name='Superadmin')
    
    try:
        # Ambil content types untuk Film & Actor
        film_ct = ContentType.objects.get(app_label='films', model='film')
        actor_ct = ContentType.objects.get(app_label='actors', model='actor')
        
        # Hak akses untuk Admin (add & change)
        admin_perms = Permission.objects.filter(
            content_type__in=[film_ct, actor_ct],
            codename__in=['add_film', 'change_film', 'add_actor', 'change_actor']
        )
        admin_group.permissions.set(admin_perms)
        
        # Hak akses untuk Superadmin (semua akses Film & Actor)
        superadmin_perms = Permission.objects.filter(
            content_type__in=[film_ct, actor_ct]
        )
        superadmin_group.permissions.set(superadmin_perms)
    except Exception:
        # Lewati jika terjadi error/content types belum termigrasi sempurna
        pass

def remove_rbac_roles(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    Group.objects.filter(name__in=['Admin', 'Superadmin']).delete()

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0007_userprofile_auth_provider'),
    ]

    operations = [
        migrations.RunPython(create_rbac_roles, remove_rbac_roles),
    ]
