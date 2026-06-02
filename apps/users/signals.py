from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User, Group


@receiver(post_save, sender=User)
def assign_user_to_group(sender, instance, created, **kwargs):
    """
    Signal untuk auto-assign user ke group berdasarkan is_staff dan is_superuser.
    
    Rules:
    - is_superuser=True -> Superadmin group
    - is_staff=True (tapi bukan superuser) -> Admin group
    - Lainnya -> Tidak ada group (regular user)
    """
    admin_group, _ = Group.objects.get_or_create(name='Admin')
    superadmin_group, _ = Group.objects.get_or_create(name='Superadmin')
    
    # Bersihkan grup lama jika ada
    instance.groups.remove(admin_group, superadmin_group)
    
    # Masukkan ke grup yang sesuai dengan status terbaru
    if instance.is_superuser:
        instance.groups.add(superadmin_group)
    elif instance.is_staff:
        instance.groups.add(admin_group)

