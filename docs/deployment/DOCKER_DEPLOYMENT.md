# Panduan Deployment Menggunakan Docker

Panduan ini membahas cara men-*deploy* aplikasi Django SahabatBradPitt menggunakan **Docker** dan **Docker Compose**. Menggunakan Docker membuat aplikasi menjadi sangat portabel, ringan, dan tidak akan mengotori instalasi sistem operasi VPS Anda.

---

## Prasyarat
Pastikan server Anda sudah terinstal `docker` dan `docker-compose`.
```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install Docker dan Docker Compose
sudo apt install docker.io docker-compose -y

# (Opsional) Tambahkan user Anda ke grup docker agar tidak perlu sudo terus menerus
sudo usermod -aG docker $USER
```

---

## Langkah Deployment

### 1. Clone Repository
```bash
git clone -b fix/bug-fixes-and-improvements https://github.com/milanalfandiismail/SahabatBradPitt.git
cd SahabatBradPitt
```

### 2. Siapkan File `.env`
Salin template konfigurasi dan ubah isinya. Docker akan membaca environment variables ini.
```bash
cp .env.example .env
nano .env
```
Pastikan mengubah menjadi konfigurasi *production*:
```ini
DEBUG=False
SECRET_KEY=isi_kunci_rahasia_yang_panjang
ALLOWED_HOSTS=sahabatbradpitt.milannn.my.id,ip_server_anda,127.0.0.1,localhost
TMDB_API_KEY=key_tmdb_anda
```

> [!WARNING]
> **PERIKSA WSGI & ASGI SETTINGS:**
> Sebelum melanjutkan ke proses *build*, pastikan berkas `config/wsgi.py` dan `config/asgi.py` mengarah ke settings production:
> ```python
> os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
> ```
> Jika tidak sengaja terubah ke `.local` atau konfigurasi development lainnya saat pengerjaan lokal, Docker container Anda akan berjalan dalam mode development (`DEBUG=True` dsb.) yang tidak aman untuk production!


### 3. Build & Jalankan Container
Kita menggunakan perintah `docker-compose up` untuk membangun image dan langsung menjalankannya di *background* (`-d`).

```bash
docker-compose up --build -d
```
*(Perintah ini akan membaca file `Dockerfile` dan `docker-compose.yml`, men-*download* base image Python, menginstal `requirements.txt`, lalu menjalankan Gunicorn).*

### 4. Setup Database & Akun Admin (Superuser)
Karena ini adalah *container* baru (atau pertama kali jalan), Anda harus melakukan migrasi struktur tabel database dan membuat akun superuser di dalam *container* tersebut:

```bash
# Jalankan migrasi di dalam container
docker-compose exec web python manage.py migrate

# Buat akun admin baru
docker-compose exec web python manage.py createsuperuser
```

> **Selesai!** 
> Aplikasi Anda sekarang sudah berjalan di dalam Docker dan terbuka melalui port `8000` di VPS Anda.

---

## Menambahkan Nginx (Reverse Proxy) di Luar Docker
Meskipun aplikasi jalan di port `8000`, standar yang baik adalah menggunakan Nginx (di level Host OS/VPS) sebagai jembatan yang merutekan port 80 ke port 8000 milik Docker.

1. Buat file Nginx:
   ```bash
   sudo nano /etc/nginx/sites-available/sahabatbradpitt
   ```
2. Isi konfigurasinya:
   ```nginx
   server {
       listen 80;
       server_name sahabatbradpitt.milannn.my.id ip_server_anda;

       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   }
   ```
3. Aktifkan dan restart:
   ```bash
   sudo ln -s /etc/nginx/sites-available/sahabatbradpitt /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
   ```

---

## Perintah Manajemen Sehari-hari

- **Melihat Log (Error/Akses):**
  ```bash
  docker-compose logs -f
  ```
- **Mematikan Container:**
  ```bash
  docker-compose down
  ```
- **Menerapkan Update Kodingan Baru (Git Pull):**
  ```bash
  git pull origin fix/bug-fixes-and-improvements
  docker-compose up --build -d
  docker-compose exec web python manage.py migrate
  ```
