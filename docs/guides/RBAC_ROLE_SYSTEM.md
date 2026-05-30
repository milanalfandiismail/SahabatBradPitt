# RBAC Role System Documentation

## Overview

The SahabatBradPitt platform uses a Role-Based Access Control (RBAC) system with three user roles:
- **Superadmin**: Full access, auto-publishes content
- **Admin**: Limited access, content requires approval
- **User**: Regular user, no admin access

## Role System Explained

### User Flags vs Groups

The system uses **both** Django's built-in user flags and custom groups:

| Flag | Superadmin | Admin | Regular User |
|------|-----------|-------|--------------|
| `is_staff` | ✅ True | ✅ True | ❌ False |
| `is_superuser` | ✅ True | ❌ False | ❌ False |
| Group | Superadmin | Admin | None |

### Why Both?

1. **`is_staff`**: Controls access to Django admin panel
   - Superadmin and Admin users can access `/admin/`
   - Regular users cannot

2. **`is_superuser`**: Django's built-in superuser flag
   - Superadmin has full Django permissions
   - Used for backward compatibility

3. **Groups**: Controls API access and content approval
   - Permissions are assigned to groups
   - API endpoints check group membership
   - More flexible than is_staff/is_superuser

### Permission Flow

```
User Request
    ↓
Check Group Membership (via custom permissions)
    ├─ Superadmin group? → Full access
    ├─ Admin group? → Limited access
    └─ No group? → Denied (403 Forbidden)
```

## Role Definitions

### Superadmin Role

**Flags:**
- `is_staff = True`
- `is_superuser = True`
- Group: `Superadmin`

**Permissions:**
- Create films/actors → auto-published
- Edit films/actors → auto-published
- Delete films/actors
- View all content
- Approve/reject pending content
- Access Django admin

**API Endpoints:**
- `POST /api/films/` → status='published'
- `POST /api/actors/` → status='published'
- `POST /api/films/{id}/approve/` ✅
- `POST /api/films/{id}/reject/` ✅
- `POST /api/actors/{id}/approve/` ✅
- `POST /api/actors/{id}/reject/` ✅

### Admin Role

**Flags:**
- `is_staff = True`
- `is_superuser = False`
- Group: `Admin`

**Permissions:**
- Create films/actors → status='pending_approval'
- Edit films/actors → status='pending_approval'
- Cannot delete
- Cannot view pending content from others
- Cannot approve/reject
- Access Django admin

**API Endpoints:**
- `POST /api/films/` → status='pending_approval'
- `POST /api/actors/` → status='pending_approval'
- `POST /api/films/{id}/approve/` ❌ (403 Forbidden)
- `POST /api/films/{id}/reject/` ❌ (403 Forbidden)

### Regular User Role

**Flags:**
- `is_staff = False`
- `is_superuser = False`
- Group: None

**Permissions:**
- View published content only
- Cannot create/edit/delete
- Cannot access Django admin
- Cannot access API admin endpoints

## Managing User Roles

### Method 1: Management Command (Recommended)

```bash
# Create a new Superadmin
python manage.py change_user_role username superadmin

# Create a new Admin
python manage.py change_user_role username admin

# Demote to regular user
python manage.py change_user_role username user
```

### Method 2: Django Admin

1. Go to `/admin/auth/user/`
2. Select user
3. Check/uncheck `Staff status` and `Superuser status`
4. Save (groups will auto-update via signal)

### Method 3: Django Shell

```python
from django.contrib.auth.models import User, Group

user = User.objects.get(username='username')

# Make Superadmin
user.is_staff = True
user.is_superuser = True
user.save()  # Signal will auto-assign Superadmin group

# Make Admin
user.is_staff = True
user.is_superuser = False
user.save()  # Signal will auto-assign Admin group

# Make regular user
user.is_staff = False
user.is_superuser = False
user.save()  # Signal will remove all groups
```

## Auto-Group Assignment

When a user is created or modified, a signal automatically assigns them to the correct group:

```python
# Signal in apps/users/signals.py
@receiver(post_save, sender=User)
def assign_user_to_group(sender, instance, created, **kwargs):
    if created:
        if instance.is_superuser:
            superadmin_group.add(instance)
        elif instance.is_staff:
            admin_group.add(instance)
```

**How it works:**
1. User is created with `is_staff=True, is_superuser=False`
2. Signal fires automatically
3. User is added to `Admin` group
4. No manual group assignment needed!

## Permission Checking

### API Permission Classes

```python
# In apps/users/permissions.py

class IsSuperadmin(permissions.BasePermission):
    """Only Superadmin group members"""
    def has_permission(self, request, view):
        return request.user.groups.filter(name='Superadmin').exists()

class IsAdminOrSuperadmin(permissions.BasePermission):
    """Admin or Superadmin group members"""
    def has_permission(self, request, view):
        return request.user.groups.filter(
            name__in=['Admin', 'Superadmin']
        ).exists()
```

### Usage in Views

```python
from apps.users.permissions import IsSuperadmin, IsAdminOrSuperadmin

class FilmViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrSuperadmin]  # Only Admin/Superadmin
    
    @action(detail=True, methods=['post'], 
            permission_classes=[IsSuperadmin])
    def approve(self, request, pk=None):
        # Only Superadmin can approve
        pass
```

## Content Status Flow

### When Superadmin Creates Content

```
Superadmin creates film
    ↓
is_superuser=True detected
    ↓
Status set to 'published'
    ↓
Content visible to public immediately
```

### When Admin Creates Content

```
Admin creates film
    ↓
is_superuser=False detected
    ↓
Status set to 'pending_approval'
    ↓
Content NOT visible to public
    ↓
Superadmin reviews
    ↓
Approve → status='published' (visible)
Reject → status='rejected' (hidden)
```

## Troubleshooting

### User gets 403 Forbidden

**Cause:** User not in any group

**Solution:**
```bash
python manage.py change_user_role username admin
```

### User can't access Django admin

**Cause:** `is_staff=False`

**Solution:**
```bash
python manage.py change_user_role username admin
```

### Groups not auto-assigned

**Cause:** Signal not registered

**Solution:** Check `apps/users/apps.py` has `ready()` method:
```python
def ready(self):
    import apps.users.signals
```

### Content not publishing

**Cause:** User is Admin (not Superadmin)

**Solution:** Make user Superadmin:
```bash
python manage.py change_user_role username superadmin
```

## Summary

| Scenario | is_staff | is_superuser | Group | Result |
|----------|----------|--------------|-------|--------|
| New Superadmin | True | True | Superadmin | Auto-published |
| New Admin | True | False | Admin | Pending approval |
| New User | False | False | None | No API access |
| Demote to User | False | False | None | Removed from groups |

**Key Point:** Groups are auto-assigned based on `is_staff` and `is_superuser` flags. Just set the flags, and the signal handles the rest!
