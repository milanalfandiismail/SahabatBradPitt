# Panduan Deployment di VPS (Ubuntu/Debian) menggunakan Nginx & Gunicorn

Panduan ini ditujukan bagi Anda yang ingin meng-*host* aplikasi Django SahabatBradPitt secara penuh di server *Virtual Private Server* (VPS) seperti DigitalOcean, AWS EC2, Linode, atau server lokal Anda sendiri.

Berbeda dengan layanan *managed* seperti PythonAnywhere, di VPS kita memiliki kontrol penuh 100% dan harus mengonfigurasi Web Server (Nginx) dan Application Server (Gunicorn) secara mandiri.

---

## Tahap 1: Persiapan Server

Setelah Anda *login* ke server menggunakan SSH (`ssh root@ip_server_anda`), langkah pertama adalah memperbarui *package* sistem dan menginstal *software* yang dibutuhkan.

```bash
# 1. Update sistem
sudo apt update && sudo apt upgrade -y

# 2. Install Python, Nginx, dan Git
sudo apt install python3-pip python3-venv python3-dev nginx git curl -y
```

> **Tips:** Sangat disarankan untuk membuat *user* non-root (misalnya `milan`) untuk menjalankan aplikasi demi alasan keamanan. Panduan ini berasumsi Anda meletakkan project di `/home/milan/`.

---

## Tahap 2: Clone & Virtual Environment

```bash
# 1. Pindah ke direktori home
cd /home/milan/

# 2. Clone repository Anda (Gunakan branch yang sesuai)
git clone -b fix/bug-fixes-and-improvements https://github.com/milanalfandiismail/SahabatBradPitt.git

# 3. Masuk ke folder project
cd SahabatBradPitt

# 4. Buat dan aktifkan virtual environment
python3 -m venv venv
source venv/bin/activate

# 5. Install seluruh library
pip install -r requirements.txt
```

---

## Tahap 3: Konfigurasi File .env & Database

```bash
# 1. Copy template .env
cp .env.example .env

# 2. Buka file .env menggunakan text editor 'nano'
nano .env
```

Ubah menjadi konfigurasi *production*:
```ini
DEBUG=False
SECRET_KEY=masukkan_kombinasi_acak_yang_sangat_panjang_disini
# Masukkan nama domain atau IP server VPS Anda
ALLOWED_HOSTS=sahabatbradpitt.milannn.my.id,ip_server_anda,127.0.0.1,localhost
TMDB_API_KEY=key_tmdb_anda_disini
YOUTUBE_API_KEY=key_youtube_anda_disini
```

Siapkan database dan file CSS/JS:
```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

---

## Tahap 4: Setup Gunicorn Service (Systemd)

Agar Gunicorn otomatis berjalan di *background* layaknya *service* Windows (dan *auto-restart* jika server mati):

```bash
sudo nano /etc/systemd/system/sahabatbradpitt.service
```

Isi dengan konfigurasi ini:
```ini
[Unit]
Description=Gunicorn daemon for SahabatBradPitt
After=network.target

[Service]
User=milan
Group=www-data
WorkingDirectory=/home/milan/SahabatBradPitt
# Pastikan menggunakan config.wsgi agar terhubung dengan project
ExecStart=/home/milan/SahabatBradPitt/venv/bin/gunicorn --access-logfile - --workers 3 --bind unix:/home/milan/SahabatBradPitt/sahabatbradpitt.sock config.wsgi:application

[Install]
WantedBy=multi-user.target
```

Nyalakan *service*-nya:
```bash
sudo systemctl daemon-reload
sudo systemctl start sahabatbradpitt
sudo systemctl enable sahabatbradpitt
```

---

## Tahap 5: Setup Nginx

Nginx bertugas sebagai "satpam depan" yang melayani port 80 (HTTP), memberikan file statis/media dengan sangat cepat, dan meneruskan sisa request dinamis ke Gunicorn.

```bash
sudo nano /etc/nginx/sites-available/sahabatbradpitt
```

Isi dengan blok *server* berikut:
```nginx
server {
    listen 80;
    # Ganti dengan IP server atau Domain Anda
    server_name sahabatbradpitt.milannn.my.id ip_server_anda;

    location = /favicon.ico { access_log off; log_not_found off; }

    # Nginx melayani file static dan media langsung
    location /static/ {
        root /home/milan/SahabatBradPitt;
    }
    
    location /media/ {
        root /home/milan/SahabatBradPitt;
    }

    # Teruskan sisa request ke Gunicorn melalui file .sock
    location / {
        include proxy_params;
        proxy_pass http://unix:/home/milan/SahabatBradPitt/sahabatbradpitt.sock;
    }
}
```

Aktifkan konfigurasi Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/sahabatbradpitt /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Hapus default Nginx
sudo nginx -t  # Test jika ada typo
sudo systemctl restart nginx
```

> **Jangan lupa atur Firewall!**
> `sudo ufw allow 'Nginx Full'`

---

## Selesai!
Website Anda kini sudah *live* dan beroperasi penuh menggunakan arsitektur standar industri (*Nginx -> Gunicorn -> Django*).

### Cara Update Kode di Masa Depan
Jika Anda baru saja melakukan `git push` dari komputer Anda dan ingin menerapkannya di server VPS:

```bash
cd /home/milan/SahabatBradPitt
git pull origin fix/bug-fixes-and-improvements

source venv/bin/activate
python manage.py migrate
python manage.py collectstatic --noinput

# Wajib restart Gunicorn agar memori Python diperbarui
sudo systemctl restart sahabatbradpitt
```
