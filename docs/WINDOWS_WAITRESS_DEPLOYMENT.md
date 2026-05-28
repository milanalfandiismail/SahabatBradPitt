# Panduan Deployment di Windows Menggunakan Waitress

Panduan ini ditujukan jika Anda ingin menjalankan aplikasi Django SahabatBradPitt secara *production* secara langsung di sistem operasi Windows (misalnya di Windows Server, atau komputer lokal Windows Anda).

Gunicorn **tidak mendukung** OS Windows. Sebagai gantinya, standar industri untuk WSGI server di Windows adalah menggunakan **Waitress**.

---

## Tahap 1: Instalasi Library
Pastikan Anda sudah berada di dalam folder project dan telah mengaktifkan *virtual environment* Anda (di CMD atau PowerShell).

```powershell
# Aktifkan virtual environment (contoh jika folder bernama venv)
.\venv\Scripts\activate

# Install requirements bawaan
pip install -r requirements.txt

# Install waitress
pip install waitress
```

## Tahap 2: Konfigurasi `.env` & Persiapan Aplikasi
Buat file `.env` (bisa meng-copy dari `.env.example`) dan pastikan `DEBUG` diset ke `False`.

```ini
DEBUG=False
SECRET_KEY=masukkan_kunci_rahasia_yang_panjang_disini
# Masukkan IP Windows Anda, atau localhost jika hanya diakses lokal
ALLOWED_HOSTS=127.0.0.1,localhost,ip_windows_anda
TMDB_API_KEY=key_tmdb_anda
```

Siapkan database dan gabungkan (*collect*) file statis:
```powershell
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

## Tahap 3: Menjalankan Server dengan Waitress
Jalankan aplikasi Anda menggunakan Waitress melalui port 8000 (atau port berapapun yang Anda inginkan):

```powershell
waitress-serve --port=8000 config.wsgi:application
```

Jika tidak ada pesan error di terminal, artinya server Anda sudah berjalan dengan baik. Buka browser dan akses `http://localhost:8000` (atau IP Windows Anda).

---

## Tahap Lanjutan: Membuat Waitress Jalan Otomatis (Background Service)

Di Windows, Anda tidak memiliki *Systemd*. Jika Anda ingin Waitress berjalan otomatis di *background* setiap kali server dinyalakan tanpa harus membuka terminal hitam terus-menerus, Anda bisa menggunakan bantuan *Task Scheduler* atau *NSSM (Non-Sucking Service Manager)*.

### Menggunakan NSSM (Sangat Direkomendasikan)
1. Download NSSM dari [nssm.cc](http://nssm.cc/).
2. Ekstrak dan buka CMD sebagai Administrator.
3. Jalankan perintah instalasi service:
   ```cmd
   nssm install SahabatBradPitt
   ```
4. Jendela GUI NSSM akan terbuka. Isi konfigurasinya:
   - **Path:** `C:\path\ke\project\Anda\venv\Scripts\waitress-serve.exe`
   - **Arguments:** `--port=8000 config.wsgi:application`
   - **Directory:** `C:\path\ke\project\Anda`
5. Klik **Install service**.
6. Sekarang Anda bisa menyalakan/mematikan web server Anda melalui **Windows Services** (`services.msc`) layaknya service Windows biasa!

## Selesai!
Aplikasi Anda kini sudah siap menerima *traffic production* di ekosistem Windows. File statis (CSS/JS) akan di-handle secara otomatis oleh `WhiteNoise` yang sebelumnya sudah dikonfigurasi di `base.py`.
