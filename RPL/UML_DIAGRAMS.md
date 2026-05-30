# 📊 UML Diagrams - Sahabat Bradpitt

## Bab III: Desain Sistem & Arsitektur Perangkat Lunak

Dokumen ini menyediakan diagram UML formal yang dimodelkan menggunakan kode **Mermaid HD**. Anda dapat langsung menyalin kode Mermaid di bawah ini ke editor visual seperti **Draw.io** atau **Mermaid Live Editor** untuk menghasilkan diagram berkualitas tinggi untuk laporan Tugas Akhir/Skripsi.

---

### 3.1 Use Case Diagram

Diagram ini menggambarkan interaksi antara aktor (Tamu, Pengguna Terdaftar, Kontributor, Administrator) dengan fungsionalitas inti sistem Sahabat Bradpitt berbasis **Role-Based Access Control (RBAC)**.

```mermaid
rect list
    state "Use Case Diagram - Sahabat Bradpitt"
end
graph TD
    %% Aktor
    Tamu[Tamu / Anonymous]
    User[Pengguna Terdaftar]
    Contrib[Kontributor]
    Admin[Administrator]

    %% Pewarisan Aktor
    User --> Tamu
    Contrib --> User
    Admin --> Contrib

    %% Use Cases
    subgraph "Sistem Sahabat Bradpitt"
        UC01(Melakukan Pencarian Film Cerdas)
        UC02(Melihat Katalog & Detail Film/Aktor)
        UC03(Mengelola Profil & Preferensi Kustom)
        UC04(Memberikan Rating & Ulasan Film)
        UC05(Mengelola Watchlist)
        UC06(Melihat Rekomendasi TOPSIS)
        UC07(Mengusulkan Data Film/Aktor Baru)
        UC08(Memicu Sinkronisasi TMDB Parsial)
        UC09(Menyetujui Suntingan Data / Approvals)
        UC10(Menjalankan Wikipedia Accolades Importer)
        UC11(Mengelola Pengguna & Peran RBAC)
    end

    %% Hubungan Aktor & Use Cases
    Tamu --> UC01
    Tamu --> UC02

    User --> UC03
    User --> UC04
    User --> UC05
    User --> UC06

    Contrib --> UC07
    Contrib --> UC08

    Admin --> UC09
    Admin --> UC10
    Admin --> UC11
```

---

### 3.2 Class Diagram (Database Schema & Relationships)

Diagram kelas ini menyajikan skema tabel database Django yang telah diselaraskan dengan nama kolom baru (`local_poster`/`tmdb_poster`, `local_photo`/`tmdb_photo`, `local_logo`/`tmdb_logo`) beserta relasi antar model.

```mermaid
classDiagram
    direction LR
    class Film {
        +BigInt id
        +String title
        +String overview
        +Integer release_year
        +String local_poster
        +String tmdb_poster
        +Float rating_average
        +Integer rating_count
        +Integer popularity
        +get_poster_url() String
        +search(query) QuerySet
    }

    class Actor {
        +BigInt id
        +String name
        +String biography
        +String local_photo
        +String tmdb_photo
        +get_photo_url() String
    }

    class Festival {
        +BigInt id
        +String name
        +String description
        +String local_logo
        +String tmdb_logo
        +get_logo_url() String
    }

    class Rating {
        +BigInt id
        +Integer score
        +String review_text
        +DateTime created_at
    }

    class Watchlist {
        +BigInt id
        +DateTime added_at
    }

    class User {
        +BigInt id
        +String username
        +String email
        +String password
        +String role
    }

    class Profile {
        +BigInt id
        +String avatar
        +Float weight_rating
        +Float weight_popularity
        +Float weight_year
        +Float weight_reviews
    }

    %% Relasi
    User "1" -- "1" Profile : has
    User "1" -- "*" Rating : creates
    User "1" -- "*" Watchlist : owns
    Film "1" -- "*" Rating : receives
    Film "1" -- "*" Watchlist : stored_in
    Film "*" -- "*" Actor : starred_by
    Film "*" -- "*" Festival : featured_in
```

---

### 3.3 Sequence Diagram: Kalkulasi Rekomendasi TOPSIS

Diagram urutan ini menunjukkan alur interaksi dinamis saat Pengguna Terdaftar membuka halaman profil/rekomendasi dan sistem menghitung rekomendasi hibrida TOPSIS secara *real-time*.

```mermaid
sequenceDiagram
    autonumber
    actor Pengguna as Pengguna Terdaftar
    participant FE as Frontend (JS/Profile)
    participant API as View (RecommendationAPIView)
    participant Engine as TOPSIS Engine (topsis_user.py)
    participant DB as Database (Django ORM)

    Pengguna->>FE: Klik Tab Rekomendasi / Muat Halaman
    FE->>API: GET /api/recommendations/topsis/ (Kirim Token JWT)
    
    activate API
    API->>DB: Ambil Profil & Bobot Preferensi Pengguna (w_1, w_2, w_3, w_4)
    activate DB
    DB-->>API: Kembalikan Bobot Preferensi
    deactivate DB

    API->>DB: Ambil Semua Data Film (Rating, Popularity, Year, Reviews)
    activate DB
    DB-->>API: Kembalikan List Data Film
    deactivate DB

    API->>Engine: Hitung TOPSIS (List Film, Bobot User)
    activate Engine
    Note over Engine: 1. Bentuk Matriks Keputusan X<br/>2. Normalisasi Matriks R<br/>3. Kalikan dengan Bobot V<br/>4. Tentukan Solusi Ideal A+ & A-<br/>5. Hitung Jarak Euclidean D+ & D-<br/>6. Cari Kedekatan Relatif Vi
    Engine-->>API: Kembalikan List Film Terurut Berdasarkan Nilai Vi Terbesar
    deactivate Engine

    API-->>FE: Response JSON (List Film dengan local_poster/tmdb_poster terurut)
    deactivate API

    activate FE
    FE->>FE: Render Card Film di Grid Rekomendasi (Prioritaskan local_poster)
    FE-->>Pengguna: Tampilkan Film Rekomendasi dengan Animasi Transisi Mulus
    deactivate FE
```
