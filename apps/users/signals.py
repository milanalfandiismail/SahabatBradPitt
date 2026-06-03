from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.contrib.auth.models import User, Group
from apps.users.models import UserProfile
import os


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


@receiver(post_delete, sender=UserProfile)
def auto_delete_avatar_on_delete(sender, instance, **kwargs):
    if instance.avatar:
        if os.path.isfile(instance.avatar.path):
            os.remove(instance.avatar.path)


@receiver(pre_save, sender=UserProfile)
def auto_delete_avatar_on_change(sender, instance, **kwargs):
    if not instance.pk:
        return False
    try:
        old_file = UserProfile.objects.get(pk=instance.pk).avatar
    except UserProfile.DoesNotExist:
        return False
    new_file = instance.avatar
    if not old_file == new_file and old_file:
        if os.path.isfile(old_file.path):
            os.remove(old_file.path)

