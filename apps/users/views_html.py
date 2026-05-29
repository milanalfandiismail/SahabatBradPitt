from django.shortcuts import render, redirect
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
            user = authenticate(request, username=u, password=p)
            if user is not None:
                if user.is_active:
                    auth_login(request, user)
                    return redirect(next_url)
                else:
                    error_msg = "Akun ini telah dinonaktifkan."
            else:
                error_msg = "Username atau password salah."

    return render(request, 'auth/login.html', {'error': error_msg})


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

        if not u or not p or not cp or not e:
            error_msg = "Mohon lengkapi semua field yang diperlukan."
        elif p != cp:
            error_msg = "Konfirmasi password tidak cocok dengan password."
        elif len(p) < 8:
            error_msg = "Password harus minimal 8 karakter."
        elif User.objects.filter(username=u).exists():
            error_msg = "Username sudah digunakan."
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
