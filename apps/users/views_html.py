from django.shortcuts import render, redirect, get_object_or_404
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout as auth_logout, authenticate, login as auth_login
from django.contrib.auth.models import User
from functools import wraps


def admin_required(view_func):
    """
    Decorator yang memastikan pengguna telah login DAN memiliki role
    staff (admin) atau superuser. Jika tidak, langsung redirect ke login.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect(f'/login/?next={request.path}')
        if not (request.user.is_staff or request.user.is_superuser):
            return redirect('/')
        return view_func(request, *args, **kwargs)
    return wrapper


def login_html_view(request):
    """
    Render halaman login dan tangani form POST untuk autentikasi native SSR.
    """
    if request.user.is_authenticated:
        return redirect('/profile/')

    error_msg = None
    if request.method == 'POST':
        u = request.POST.get('username')
        p = request.POST.get('password')
        next_url = request.GET.get('next', '/profile/')
        
        if not u or not p:
            error_msg = "Mohon masukkan username dan password."
        else:
            # Cek apakah akun ini terhubung dengan Google
            user_check = User.objects.filter(username=u).first()
            if not user_check:
                user_check = User.objects.filter(email=u).first()
                
            if user_check and hasattr(user_check, 'profile') and user_check.profile.auth_provider == 'google':
                error_msg = "Akun ini didaftarkan menggunakan Google. Silakan masuk via tombol Login Google."
            else:
                user = authenticate(request, username=u, password=p)
                if user is not None:
                    if user.is_active:
                        auth_login(request, user)
                        return redirect(next_url)
                    else:
                        error_msg = "Akun ini telah dinonaktifkan."
                else:
                    error_msg = "Username atau password salah."

    return render(request, 'auth/login.html', {
        'error': error_msg,
        'google_client_id': settings.GOOGLE_CLIENT_ID
    })


def signup_html_view(request):
    """
    Render halaman registrasi dan tangani form POST secara native SSR.
    """
    if request.user.is_authenticated:
        return redirect('/profile/')

    error_msg = None
    if request.method == 'POST':
        u = request.POST.get('username')
        p = request.POST.get('password')
        cp = request.POST.get('confirmPassword')
        e = request.POST.get('email')
        dn = request.POST.get('displayName')

        import re
        if not u or not p or not cp or not e:
            error_msg = "Mohon lengkapi semua field yang diperlukan."
        elif not re.match(r'^[\w.@+-]+$', u):
            error_msg = "Username tidak boleh mengandung spasi dan hanya boleh terdiri dari huruf, angka, serta karakter @/./+/-/_."
        elif p != cp:
            error_msg = "Konfirmasi password tidak cocok dengan password."
        elif len(p) < 8:
            error_msg = "Password harus minimal 8 karakter."
        elif User.objects.filter(username=u).exists():
            error_msg = "Username sudah digunakan."
        elif User.objects.filter(email__iexact=e).exists():
            error_msg = "Email sudah terdaftar. Silakan gunakan email lain atau login menggunakan Google jika akun tersebut terhubung dengan Google."
        else:
            user = User.objects.create_user(username=u, password=p, email=e)
            if dn:
                user.profile.display_name = dn
                user.profile.save()
            auth_login(request, user)
            return redirect('/profile/')

    return render(request, 'auth/signup.html', {'error': error_msg})


@login_required(login_url='/login/')
def profile_html_view(request):
    """
    Render halaman profil pengguna.
    Diproteksi Django @login_required — akan redirect ke /login/ jika belum auth.
    """
    return render(request, 'auth/profile.html')


def public_profile_html_view(request, user_id):
    """
    Render halaman profil publik pengguna lain (read-only).
    """
    target_user = get_object_or_404(User, id=user_id, is_active=True)
    is_own_profile = False
    if request.user.is_authenticated and request.user.id == target_user.id:
        is_own_profile = True
        
    return render(request, 'auth/public_profile.html', {
        'target_user': target_user,
        'is_own_profile': is_own_profile
    })


def search_profile_html_view(request):
    """
    Mencari pengguna berdasarkan nama lengkap (display_name) atau username.
    Jika query kosong, menampilkan daftar Cinephile teraktif.
    """
    q = request.GET.get('q', '').strip()
    if q:
        from django.db.models import Q
        users = User.objects.filter(is_active=True).filter(
            Q(username__icontains=q) | Q(profile__display_name__icontains=q)
        ).distinct()
        is_search = True
    else:
        # Default: list top 12 most active users based on total ratings count
        from django.db.models import Count
        users = User.objects.filter(is_active=True).annotate(
            num_ratings=Count('ratings')
        ).order_by('-num_ratings')[:12]
        is_search = False
        
    return render(request, 'auth/user_search_results.html', {
        'query': q,
        'users': users,
        'is_search': is_search
    })


@login_required(login_url='/login/')
def recommendations_html_view(request):
    """
    Render halaman rekomendasi AI.
    Diproteksi Django @login_required — hanya untuk user yang sudah login.
    """
    return render(request, 'movies/recommendations.html')


@admin_required
def admin_films_html_view(request):
    """
    Render halaman Admin Portal (Sineas Portal).
    Diproteksi @admin_required — hanya untuk is_staff atau is_superuser.
    Server langsung menolak akses sebelum HTML apapun terkirim ke peramban.
    """
    return render(request, 'admin/admin_films.html')
