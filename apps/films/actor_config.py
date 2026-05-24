"""
Konfigurasi daftar aktor terkenal untuk sinkronisasi TMDB.

File ini berisi daftar aktor Hollywood terkenal yang akan disinkronkan
dari TMDB API ke database lokal. Setiap aktor memiliki TMDB ID unik
dan bio singkat untuk dokumentasi.
"""

# Daftar aktor terkenal dengan TMDB ID dan bio singkat
FEATURED_ACTORS = [
    # Aktor Pria
    {
        "tmdb_id": 287,
        "name": "Brad Pitt",
        "bio": "Aktor dan produser film Amerika pemenang Academy Award untuk Once Upon a Time in Hollywood"
    },
    {
        "tmdb_id": 6193,
        "name": "Leonardo DiCaprio",
        "bio": "Aktor Amerika pemenang Academy Award untuk The Revenant, dikenal dari Titanic dan Inception"
    },
    {
        "tmdb_id": 500,
        "name": "Tom Cruise",
        "bio": "Aktor dan produser Amerika, ikon film aksi dari Top Gun dan Mission: Impossible"
    },
    {
        "tmdb_id": 3223,
        "name": "Robert Downey Jr.",
        "bio": "Aktor Amerika terkenal sebagai Iron Man di Marvel Cinematic Universe"
    },
    {
        "tmdb_id": 3894,
        "name": "Christian Bale",
        "bio": "Aktor Inggris pemenang Academy Award untuk The Fighter, dikenal sebagai Batman"
    },
    {
        "tmdb_id": 1892,
        "name": "Matt Damon",
        "bio": "Aktor dan penulis skenario Amerika, terkenal dari Good Will Hunting dan Bourne series"
    },
    {
        "tmdb_id": 5292,
        "name": "Denzel Washington",
        "bio": "Aktor dan sutradara Amerika pemenang dua Academy Awards"
    },
    {
        "tmdb_id": 192,
        "name": "Morgan Freeman",
        "bio": "Aktor Amerika pemenang Academy Award, dikenal dari The Shawshank Redemption"
    },
    
    # Aktor Wanita
    {
        "tmdb_id": 1245,
        "name": "Scarlett Johansson",
        "bio": "Aktris Amerika terkenal sebagai Black Widow di Marvel Cinematic Universe"
    },
    {
        "tmdb_id": 524,
        "name": "Natalie Portman",
        "bio": "Aktris Amerika pemenang Academy Award untuk Black Swan"
    },
    {
        "tmdb_id": 112,
        "name": "Cate Blanchett",
        "bio": "Aktris Australia pemenang dua Academy Awards"
    },
    {
        "tmdb_id": 5064,
        "name": "Meryl Streep",
        "bio": "Aktris Amerika dengan nominasi Academy Award terbanyak dalam sejarah"
    },
    {
        "tmdb_id": 72129,
        "name": "Jennifer Lawrence",
        "bio": "Aktris Amerika pemenang Academy Award untuk Silver Linings Playbook"
    },
    {
        "tmdb_id": 30614,
        "name": "Ryan Gosling",
        "bio": "Aktor Kanada pemenang Golden Globe, dikenal dari La La Land, Blade Runner 2049, Drive, dan Barbie."
    },
]

# Default minimum rating untuk film berkualitas tinggi
# Film dengan rating di bawah threshold ini akan di-skip saat sinkronisasi
DEFAULT_MIN_RATING = 7.0

# Delay antar request ke TMDB API (dalam detik) untuk menghindari rate limiting
API_REQUEST_DELAY = 0.5
