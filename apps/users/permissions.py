from rest_framework import permissions


class IsSuperadmin(permissions.BasePermission):
    """
    Permission class untuk Superadmin.
    User harus member dari group 'Superadmin'.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_superuser or request.user.groups.filter(name='Superadmin').exists())
        )


class IsAdminOrSuperadmin(permissions.BasePermission):
    """
    Permission class untuk Admin atau Superadmin.
    User harus member dari group 'Admin' atau 'Superadmin'.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            (
                request.user.is_superuser or 
                request.user.is_staff or 
                request.user.groups.filter(name__in=['Admin', 'Superadmin']).exists()
            )
        )

