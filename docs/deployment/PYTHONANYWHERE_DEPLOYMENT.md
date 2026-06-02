# Panduan Deployment di PythonAnywhere

Panduan ini berisi langkah-langkah untuk melakukan deployment aplikasi SahabatBradPitt menggunakan layanan cloud hosting gratis/berbayar [PythonAnywhere](https://www.pythonanywhere.com/).

Berbeda dengan deployment di VPS (menggunakan Nginx & Gunicorn manual), PythonAnywhere sudah mengatur web server (Nginx/uWSGI) secara internal, sehingga Anda hanya perlu mengatur kode WSGI melalui dashboard Web mereka.

## Tahap 1: Clone & Install via Bash Console
Buka menu **Consoles** di PythonAnywhere, lalu klik **Bash**.

```bash
# 1. Clone repository
git clone -b fix/bug-fixes-and-improvements https://github.com/milanalfandiismail/SahabatBradPitt.git

# 2. Masuk ke folder project
cd SahabatBradPitt

# 3. Buat virtual environment (sesuaikan versi Python dengan yang Anda pilih di Web App)
mkvirtualenv --python=/usr/bin/python3.10 venv

# 4. Install dependencies
pip install -r requirements.txt
```

## Tahap 2: Konfigurasi `.env` & Migrasi
Masih di Bash Console yang sama:

```bash
# 1. Copy template .env
cp .env.example .env

# 2. Edit file .env menggunakan nano
nano .env
```
Isi konfigurasi penting:
```ini
DEBUG=False
SECRET_KEY=isi_dengan_kunci_rahasia_yang_sangat_panjang
# Ganti dengan username PythonAnywhere Anda atau custom domain Anda
ALLOWED_HOSTS=milanalfandiismail.pythonanywhere.com,127.0.0.1,localhost
TMDB_API_KEY=key_tmdb_anda
```
*(Tekan `Ctrl+O`, `Enter`, lalu `Ctrl+X` untuk menyimpan).*

Kemudian lakukan persiapan database dan file static:
```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

## Tahap 3: Konfigurasi Web App di Dashboard
1. Keluar dari Bash Console, buka menu **Web** di PythonAnywhere.
2. Klik tombol **Add a new web app** (Pilih "Manual Configuration", bukan Django otomatis).
3. Di bagian **Virtualenv**, masukkan path: `/home/username_anda/.virtualenvs/venv`
4. Di bagian **Code -> Source code**, masukkan path: `/home/username_anda/SahabatBradPitt`

## Tahap 4: Konfigurasi WSGI File (PENTING!)
Pada halaman Web app tersebut, cari tulisan **WSGI configuration file** dan klik link file biru di sebelahnya.
Hapus semua kodenya, dan ganti dengan script berikut:

```python
import os
import sys

# 1. Tambahkan path project ke system path
path = '/home/username_anda/SahabatBradPitt'
if path not in sys.path:
    sys.path.append(path)

# 2. Set environment settings ke PRODUCTION
# PERHATIAN: Wajib menggunakan config.settings.production agar ALLOWED_HOSTS terbaca!
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings.production'

# 3. Inisialisasi Django WSGI Application
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```
*(Jangan lupa ganti `username_anda` dengan username PythonAnywhere milik Anda). Klik tombol **Save**.*

> [!WARNING]
> **KESALAHAN SETTINGS DI PYTHONANYWHERE:**
> Pastikan variabel `DJANGO_SETTINGS_MODULE` diset ke `'config.settings.production'`. Jika Anda membiarkan default ke `.local` atau menghapusnya, PythonAnywhere akan mendownload setelan local development yang tidak cocok untuk production dan dapat menyebabkan kebocoran rahasia atau database SQLite kosong/error.


## Tahap 5: Konfigurasi Static & Media Files
Kembali ke halaman **Web**, scroll ke bagian **Static files**:

Tambahkan dua entri ini:
1. URL: `/static/` -> Directory: `/home/username_anda/SahabatBradPitt/staticfiles`
2. URL: `/media/`  -> Directory: `/home/username_anda/SahabatBradPitt/media`

## Selesai
Klik tombol hijau besar **"Reload username_anda.pythonanywhere.com"** di bagian paling atas halaman. Website SahabatBradPitt kini sudah online dan siap digunakan!
