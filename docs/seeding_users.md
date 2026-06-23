# Seeder User untuk Testing Pagination

Dokumentasi untuk membuat user dummy untuk menguji pagination dan search functionality.

## 📋 **Seeder yang Tersedia**

### 1. **create_dummy_users.py**
Membuat 100 user dummy dengan nama random.

**Fitur:**
- Username format: `user_1234`
- Email: `user_1234@example.com`
- Password: `password123`
- Display name: `First Name Last Name`
- Stats random: 0-50 reviews, rating 3.0-9.0

**Cara Menjalankan:**
```bash
# Default: 100 user
python manage.py create_dummy_users

# Custom jumlah user
python manage.py create_dummy_users --count 50
```

**Hasil:**
```
Membuat 100 user dummy...
Created 10/100 users...
Created 20/100 users...
...
Sukses membuat 100 user dummy!
Username default: password123
```

### 2. **create_dummy_users_for_search.py**
Membuat 100 user dummy dengan nama yang **searchable** untuk testing search functionality.

**Fitur:**
- Username format: `searchable_1234`
- Email: `searchable_1234@example.com`
- Password: `password123`
- Display name: `First Name Last Name (keyword)`
- Nama yang relevan untuk search: Cinema, Film, Movie, Actor, Director, dll.

**Cara Menjalankan:**
```bash
# Default: 100 user
python manage.py create_dummy_users_for_search

# Custom jumlah user
python manage.py create_dummy_users_for_search --count 50
```

**Hasil:**
```
Membuat 100 user dummy untuk testing search...
Created 10/100 users...
Created 20/100 users...
...
Sukses membuat 100 user dummy dengan nama yang searchable!
Username default: password123
Anda bisa mencari user dengan nama seperti: Cinema Smith, Film Johnson, Movie Williams, dll.
```

## 🚀 **Cara Menggunakan**

### Langkah 1: Jalankan Seeder
```bash
# Buka terminal di root project
cd C:\Milan\GIT\SahabatBradPitt

# Jalankan seeder
python manage.py create_dummy_users_for_search
```

### Langkah 2: Buka Website
Buka browser dan kunjungi:
```
http://localhost:8000/profile/search/
```

### Langkah 3: Coba Pagination
1. Anda akan melihat 16 user pertama
2. Klik **Next** untuk melihat halaman berikutnya
3. Anda akan melihat pagination controls dengan:
   - Previous/Next buttons
   - Page numbers
   - Info halaman (e.g., "Page 1 of 5 (1-16 of 80 users)")

### Langkah 4: Coba Search
1. Ketik nama di search box (contoh: "Cinema", "Film", "Actor", "Review")
2. Klik tombol **Cari**
3. Pagination akan berfungsi untuk hasil search

### Langkah 5: Reset Data (Opsional)
Jika ingin menghapus semua user dan membuat ulang:

```bash
# Hapus semua user
python manage.py shell
>>> from django.contrib.auth.models import User
>>> User.objects.all().delete()
>>> exit()
```

## 📊 **Contoh Output Pagination**

### Halaman 1:
```
[Previous]  [1] [2] [3] ... [5] [6] [Next]
Page 1 of 5 (1-16 of 80 users)
```

### Halaman 2:
```
[Previous]  [1] [2] [3] ... [5] [6] [Next]
Page 2 of 5 (17-32 of 80 users)
```

### Halaman 5 (Terakhir):
```
[Previous]  [1] [2] [3] [4] [5] [Next]
Page 5 of 5 (65-80 of 80 users)
```

## 🔍 **Test Case untuk Pagination**

Setelah membuat user, coba test case berikut:

### Test Case 1: Pagination Default
1. Buka `/profile/search/`
2. Verifikasi: 16 user ditampilkan
3. Verifikasi: Pagination controls muncul
4. Verifikasi: Next button aktif
5. Klik Next
6. Verifikasi: Halaman 2 ditampilkan

### Test Case 2: Search dengan Pagination
1. Ketik "Cinema" di search box
2. Verifikasi: Hasil search muncul
3. Verifikasi: Pagination berfungsi
4. Klik Next
5. Verifikasi: Halaman berikutnya muncul dengan query tetap

### Test Case 3: Last Page
1. Klik Next sampai halaman terakhir
2. Verifikasi: Next button disabled
3. Verifikasi: Previous button aktif

### Test Case 4: Invalid Page
1. Arahkan ke `?page=999`
2. Verifikasi: Redirect ke page 1
3. Verifikasi: Tidak ada error

## 📈 **Metrics yang Diuji**

- ✅ Pagination dengan 16 user per page
- ✅ Previous/Next navigation
- ✅ Page number display
- ✅ Ellipsis untuk halaman jauh
- ✅ Active page highlighting
- ✅ Total users count
- ✅ Range display (e.g., 1-16 of 80)
- ✅ Disabled state untuk tombol pertama/terakhir

## ⚠️ **Catatan**

- User yang sudah ada akan di-skip
- Password default: `password123`
- Semua user aktif (`is_active=True`)
- Random stats untuk realistic data
- Data bisa di-reset dengan menghapus user via shell

## 🛠️ **Troubleshooting**

### Masalah: Seeder tidak berjalan
```bash
# Pastikan virtual environment aktif
python -m venv venv
venv\Scripts\activate
python manage.py create_dummy_users_for_search
```

### Masalah: User sudah ada
Seeder akan otomatis skip user yang sudah ada. Jika ingin reset:
```bash
python manage.py shell
>>> from django.contrib.auth.models import User
>>> User.objects.all().delete()
>>> exit()
```

### Masalah: Pagination tidak muncul
1. Pastikan sudah membuat minimal 17 user
2. Pastikan view_html.py sudah diupdate dengan pagination
3. Clear browser cache dan refresh halaman