# Panduan Konfigurasi Google Login (Google Sign-In)

Dokumen ini menjelaskan langkah-demi-langkah cara mendapatkan **Google Client ID** dari Google Cloud Console dan memasukkannya ke dalam proyek Sahabat Bradpitt.

---

## 1. Masuk ke Google Cloud Console
1. Buka browser dan akses [Google Cloud Console](https://console.cloud.google.com/).
2. Login menggunakan akun Google Anda (disarankan menggunakan akun email pengembang utama).

## 2. Buat Project Baru
1. Pada menu navigasi atas (sebelah kiri logo Google Cloud), klik **Select a project** (atau nama project yang sedang aktif).
2. Klik tombol **New Project** di sudut kanan atas jendela *modal*.
3. Masukkan **Project name** (contoh: `sahabat-bradpitt-web`).
4. Klik **Create**. Tunggu beberapa saat hingga project selesai dibuat.
5. Setelah selesai, pastikan Anda telah memilih project tersebut.

## 3. Konfigurasi OAuth Consent Screen
*Ini wajib dilakukan sebelum Anda bisa membuat Client ID.*
1. Pada sidebar sebelah kiri, buka menu **APIs & Services** > **OAuth consent screen**.
2. Pilih **User Type**:
   - Jika Anda bukan pengguna Google Workspace (G Suite), Anda hanya bisa memilih **External**. Pilih **External**.
3. Klik **Create**.
4. Isi detail aplikasi:
   - **App name**: `Sahabat Bradpitt`
   - **User support email**: (Pilih email Anda)
   - **App logo**: (Opsional, abaikan untuk pengembangan lokal)
   - **Developer contact information**: (Masukkan alamat email Anda)
5. Klik **Save and Continue**.
6. Pada tab **Scopes**, Anda bisa membiarkannya *default* (karena kita hanya butuh otorisasi login dasar: `email`, `profile`, dan `openid`). Klik **Save and Continue**.
7. Pada tab **Test users** (karena aplikasi berstatus *Testing*), tambahkan alamat email Google yang akan Anda gunakan untuk menguji coba login. Jika tidak ditambahkan, login akan memunculkan pesan error "Access blocked".
8. Klik **Save and Continue**, lalu kembali ke *Dashboard*.

## 4. Buat Credentials (Client ID)
1. Pada sidebar sebelah kiri, klik **APIs & Services** > **Credentials**.
2. Klik tombol **+ CREATE CREDENTIALS** di bagian atas, lalu pilih **OAuth client ID**.
3. Pada pilihan **Application type**, pilih **Web application**.
4. Isi **Name** (contoh: `Sahabat Bradpitt Web Client`).
5. Pada bagian **Authorized JavaScript origins**, klik **+ ADD URI**. Masukkan URL berikut:
   - `http://localhost:8000`
   - `http://127.0.0.1:8000`
   *(Catatan: Nanti saat deploy ke production, tambahkan juga URL domain asli Anda, misal: `https://sahabatbradpitt.com`)*
6. Pada bagian **Authorized redirect URIs**, Anda **TIDAK PERLU** menambahkan apapun karena kita menggunakan metode *JavaScript callback/popup mode*, bukan *redirect mode*. Biarkan kosong.
7. Klik **Create**.
8. Sebuah *modal* akan muncul menampilkan **Client ID** dan **Client Secret**.
9. **Copy Client ID** Anda (string panjang yang diakhiri dengan `.apps.googleusercontent.com`). Anda tidak membutuhkan Client Secret untuk implementasi frontend-ke-backend ini.

## 5. Integrasi ke Proyek Lokal
1. Buka file `.env` di folder root proyek Sahabat Bradpitt Anda. (Jika belum ada, copy dari `.env.example`).
2. Tambahkan variabel berikut ke dalam file `.env`:
   ```env
   GOOGLE_CLIENT_ID=masukkan-client-id-anda-di-sini.apps.googleusercontent.com
   ```
3. Restart server Django Anda:
   ```bash
   python manage.py runserver
   ```
4. Selesai! Buka halaman `/login/` dan tombol Google Sign-In akan muncul serta berfungsi dengan baik.

---

> **Penting untuk Production:** Saat aplikasi sudah online (Production), jangan lupa untuk mengubah status OAuth Consent Screen dari **Testing** menjadi **In production** dan menambahkan domain produksi Anda ke bagian **Authorized JavaScript origins** di menu Credentials.
