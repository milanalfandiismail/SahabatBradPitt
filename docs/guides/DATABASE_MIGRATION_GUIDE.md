# 📖 PANDUAN MIGRASI DATABASE: SQLite ➜ PostgreSQL (Direct Multi-DB Sync)

Dokumen ini menjelaskan arsitektur, sistem pertahanan, teknik optimasi memori, serta langkah eksekusi migrasi database lokal dari SQLite (`db.sqlite3`) langsung ke PostgreSQL (`sahabat_brad_pitt`) menggunakan naskah otomatis `auto_migrate.py`.

---

## 🏗️ 1. Arsitektur Pemindahan Data (Multi-DB Direct ORM Sync)

Alih-alih mengekspor seluruh data SQLite menjadi berkas JSON perantara yang memakan memori tinggi dan lambat (seperti `dumpdata` bawaan Django), `auto_migrate.py` menggunakan **Django Multi-DB Connection Routing** untuk melakukan pembacaan langsung dari koneksi SQLite dan penulisan langsung ke koneksi PostgreSQL secara paralel.

```
┌─────────────────┐             ORM (Pembacaan)             ┌─────────────────┐
│  SQLite3 Local  │ ──────────────────────────────────────> │  auto_migrate   │
│  (db.sqlite3)   │                                         │   Python Run    │
└─────────────────┘                                         └─────────────────┘
                                                                     │
                                                                     │ ORM bulk_create (Batch)
                                                                     ▼
                                                            ┌─────────────────┐
                                                            │   PostgreSQL    │
                                                            │  Target Server  │
                                                            └─────────────────┘
```

---

## 🛡️ 2. Sistem Proteksi & Penanganan Signal (Signal Suppression)

### A. Proteksi Branch & Konfigurasi Engine
Sebelum eksekusi dimulai, script secara proaktif membaca konfigurasi database `default` yang aktif. Jika engine bukan `django.db.backends.postgresql` (misalnya, jika developer tidak sengaja menjalankan script ini pada branch `main` dengan SQLite aktif), proses langsung dihentikan secara aman (`sys.exit(1)`) untuk mencegah kerusakan skema lokal.

### B. Pemutusan Django Signals (Django Signals Disconnection)
Django models di proyek ini memiliki berbagai sinyal `pre_save`, `post_save`, `pre_delete`, dan `post_delete` untuk keperluan:
* Pembuatan profil user otomatis (`create_user_profile`, `save_user_profile`).
* Penghapusan foto fisik dari disk saat record dihapus (`auto_delete_film_poster_on_delete`, dll).
* Kalkulasi rating agregat secara real-time.

Selama proses migrasi massal (bulk import), sinyal-sinyal ini **wajib dinonaktifkan** untuk mencegah efek samping destruktif (seperti file poster fisik dihapus secara tidak sengaja atau duplikasi record profil). `auto_migrate.py` secara aman memutus seluruh sinyal ini sebelum data ditransfer.

---

## ⚡ 3. Optimasi Kinerja & Penanganan Masalah PostgreSQL

### A. Truncation Data CharField Otomatis
SQLite mengizinkan nilai `CharField` melebihi panjang maksimum (`max_length`) yang ditentukan pada skema model tanpa adanya pembatasan ketat. Sebaliknya, PostgreSQL akan langsung menolak record tersebut dengan error `StringDataRightTruncation` jika data melebihi batas.

Script ini mendeteksi batasan `max_length` pada seluruh field bertipe `CharField` untuk model target secara dinamis pada runtime, dan memotong string secara otomatis jika melebihi batas agar proses import berjalan sukses tanpa crash.

### B. Penggunaan Query Iterator & Batched Bulk Create
Untuk menghindari konsumsi memori tinggi (*Out Of Memory*), script menggunakan `.iterator(chunk_size=batch_size)` untuk mengambil data secara bertahap dari SQLite, lalu menulisnya ke PostgreSQL menggunakan `.bulk_create(batch)` dengan ukuran batch 2.000 data per kloter.

### C. Pemetaan Ulang Permission ID (Special Authorization Mapping)
Primary key tabel `django_content_type` di PostgreSQL sering kali berbeda dengan SQLite karena urutan migrasi aplikasi bawaan Django yang berbeda.
Jika ID Permission langsung diimpor mentah-mentah dari SQLite, maka relasi hak akses user dan grup akan rusak dan menunjuk ke model yang salah.

Script ini memecahkan masalah tersebut dengan memetakan ID Permission secara cerdas di memori menggunakan pencocokan unik tuple `(app_label, codename)` dari SQLite ke PostgreSQL pada saat runtime sebelum menulis tabel relasional Many-to-Many Group/User Permissions.

### D. Sinkronisasi PostgreSQL Primary Key Sequence (Sequence Reset)
Setelah pemindahan data massal selesai dengan primary key (ID) eksplisit dari SQLite, nilai urutan serial (*sequence*) primary key di PostgreSQL akan tertinggal di angka awal. Jika dibiarkan, pembuatan data baru di aplikasi di masa depan akan crash dengan error `UniqueConstraintError (ID sudah ada)`.

Script ini memicu perintah `sqlsequencereset` secara otomatis untuk seluruh aplikasi Django terdaftar di PostgreSQL guna memajukan nilai serial sequence primary key ke ID maksimum saat ini secara otomatis.

---

## 🚀 4. Langkah Eksekusi Migrasi Database lokal

Ikuti langkah-langkah berikut secara terurut untuk melakukan migrasi lokal:

### Langkah 1: Pindah ke Branch PostgreSQL
Pastikan Anda berada di branch PostgreSQL aktif:
```bash
git checkout main-postgresql
```

### Langkah 2: Aktifkan Virtual Environment & Instal Ketergantungan
Aktifkan virtual environment Anda dan instal dependencies pendukung PostgreSQL:
```bash
.venv\Scripts\activate
pip install -r requirements.txt
```

### Langkah 3: Jalankan Migrasi Otomatis
Eksekusi script migrasi direct sync di root folder proyek:
```bash
.venv\Scripts\python.exe auto_migrate.py
```

### Langkah 4: Jalankan Pemeriksaan & Verifikasi Unit Test
Pastikan skema database dan integritas fungsional berjalan 100% tanpa celah dengan menjalankan tes otomatis Django:
```bash
.venv\Scripts\python.exe manage.py test apps
```

Seluruh 9/9 unit test sistem harus lulus sukses dengan hasil `OK` untuk memastikan database PostgreSQL siap digunakan sepenuhnya untuk produksi.
