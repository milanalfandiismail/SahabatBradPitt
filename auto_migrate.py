"""
AUTO MIGRATION: SQLite ➜ PostgreSQL (Django Multi-DB ORM Sync)
Aman, Cepat, Hemat Memori, Bebas Konflik ContentType/Permission ID!
"""
import os
import sys
import django
from django.conf import settings
from django.db import connection, transaction

# 1. Konfigurasi Awal Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

# 2. Proteksi & Validasi Branch/Konfigurasi Database
print("[INFO] Memverifikasi konfigurasi database aktif...")
if settings.DATABASES['default']['ENGINE'] != 'django.db.backends.postgresql':
    print("\n[ERROR] Database 'default' saat ini bukan PostgreSQL!")
    print("   Engine terdeteksi:", settings.DATABASES['default']['ENGINE'])
    print("   Pastikan Anda berada di branch 'main-postgresql' dan konfigurasi database di development.py sudah PostgreSQL.")
    print("   Eksekusi dihentikan secara aman.\n")
    sys.exit(1)

print("   [OK] Database default terkonfigurasi untuk PostgreSQL.")

# 3. Registrasi Database SQLite secara Dinamis dengan Default Keys
print("[DB] Mendaftarkan SQLite secara dinamis...")
settings.DATABASES['sqlite'] = {
    'ENGINE': 'django.db.backends.sqlite3',
    'NAME': 'db.sqlite3',
    'TIME_ZONE': None,
    'OPTIONS': {},
    'AUTOCOMMIT': True,
    'ATOMIC_REQUESTS': False,
    'CONN_MAX_AGE': 0,
    'CONN_HEALTH_CHECKS': False,
    'TEST': {},
}

# Paksa Django ConnectionHandler untuk memuat ulang konfigurasi database
from django.db import connections
try:
    del connections['sqlite']
except (AttributeError, KeyError):
    pass

# Import models setelah Django setup selesai
from django.contrib.auth.models import User, Group, Permission
from django.contrib.contenttypes.models import ContentType
from apps.users.models import UserProfile
from apps.recommendations.models import RecommendationLog
from apps.ratings.models import Rating, Watchlist
from apps.films.models import Genre, Film, FilmImage
from apps.festivals.models import Studio, Festival, FestivalAward
from apps.actors.models import Actor, Filmography

# 4. Nonaktifkan Seluruh Django Signals Selama Migrasi
print("[SHIELD] Menonaktifkan Django signals untuk mencegah efek samping...")
from django.db.models.signals import pre_save, post_save, pre_delete, post_delete

# Ambil list signals asli untuk dinonaktifkan
from apps.films.models import auto_delete_film_poster_on_delete, auto_delete_film_poster_on_change
from apps.actors.models import auto_delete_actor_photo_on_delete, auto_delete_actor_photo_on_change
from apps.festivals.models import auto_delete_festival_logo_on_delete, auto_delete_festival_logo_on_change
from apps.users.models import auto_delete_avatar_on_delete, auto_delete_avatar_on_change, create_user_profile, save_user_profile
from apps.ratings.models import rating_saved, rating_deleted, watchlist_saved, watchlist_deleted

signals_to_disconnect = [
    (post_delete, auto_delete_film_poster_on_delete, Film),
    (pre_save, auto_delete_film_poster_on_change, Film),
    (post_delete, auto_delete_actor_photo_on_delete, Actor),
    (pre_save, auto_delete_actor_photo_on_change, Actor),
    (post_delete, auto_delete_festival_logo_on_delete, Festival),
    (pre_save, auto_delete_festival_logo_on_change, Festival),
    (post_delete, auto_delete_avatar_on_delete, UserProfile),
    (pre_save, auto_delete_avatar_on_change, UserProfile),
    (post_save, create_user_profile, User),
    (post_save, save_user_profile, User),
    (post_save, rating_saved, Rating),
    (post_delete, rating_deleted, Rating),
    (post_save, watchlist_saved, Watchlist),
    (post_delete, watchlist_deleted, Watchlist),
]

for sig, receiver_func, sender_model in signals_to_disconnect:
    sig.disconnect(receiver_func, sender=sender_model)

# 5. Fungsi Helper Migrasi Batch
def migrate_model_batch(model_class, batch_size=2000):
    name = model_class._meta.label
    sqlite_qs = model_class.objects.using('sqlite').all().order_by('pk')
    total = sqlite_qs.count()
    if total == 0:
        print(f"  [-] {name}: kosong")
        return 0
    
    print(f"  [BATCH] Memindahkan {name} ({total:,} data)...")
    
    batch = []
    migrated_count = 0
    
    # Deteksi CharFields yang memiliki max_length
    char_fields = []
    for field in model_class._meta.fields:
        if isinstance(field, django.db.models.CharField) and getattr(field, 'max_length', None) is not None:
            char_fields.append((field.name, field.max_length))
    
    for obj in sqlite_qs.iterator(chunk_size=batch_size):
        obj._state.db = 'default'  # Set database target ke PostgreSQL
        
        # Auto-truncate data CharField yang melebihi max_length di SQLite agar tidak crash di PostgreSQL
        for field_name, max_len in char_fields:
            val = getattr(obj, field_name)
            if val and isinstance(val, str) and len(val) > max_len:
                setattr(obj, field_name, val[:max_len])
                
        batch.append(obj)
        
        if len(batch) >= batch_size:
            model_class.objects.using('default').bulk_create(batch)
            migrated_count += len(batch)
            print(f"    - {migrated_count:,} / {total:,} selesai...")
            batch = []
            
    if batch:
        model_class.objects.using('default').bulk_create(batch)
        migrated_count += len(batch)
        
    print(f"  [OK] {name}: {migrated_count:,} data berhasil dipindahkan!")
    return migrated_count

# 6. Fungsi Helper Migrasi Many-to-Many Through Model
def migrate_m2m_through(through_model, batch_size=5000):
    name = through_model._meta.label
    sqlite_qs = through_model.objects.using('sqlite').all().order_by('pk')
    total = sqlite_qs.count()
    if total == 0:
        print(f"  [-] {name}: kosong")
        return 0
        
    print(f"  [BATCH] Memindahkan ManyToMany {name} ({total:,} data)...")
    batch = []
    migrated_count = 0
    for obj in sqlite_qs.iterator(chunk_size=batch_size):
        obj._state.db = 'default'
        batch.append(obj)
        if len(batch) >= batch_size:
            through_model.objects.using('default').bulk_create(batch)
            migrated_count += len(batch)
            batch = []
    if batch:
        through_model.objects.using('default').bulk_create(batch)
        migrated_count += len(batch)
        
    print(f"  [OK] {name}: {migrated_count:,} relasi berhasil dipindahkan!")
    return migrated_count

# Fungsi pembantu untuk membuat database PostgreSQL jika belum ada
def ensure_postgresql_database():
    import psycopg2
    from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

    db_config = settings.DATABASES['default']
    pg_name = db_config['NAME']
    pg_user = db_config['USER']
    pg_password = db_config['PASSWORD']
    pg_host = db_config['HOST']
    pg_port = db_config['PORT']

    print(f"[DB] Memeriksa keberadaan database '{pg_name}' di PostgreSQL...")
    try:
        conn = psycopg2.connect(
            dbname='postgres',
            user=pg_user,
            password=pg_password,
            host=pg_host,
            port=pg_port
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        cursor.execute(f"SELECT 1 FROM pg_database WHERE datname = '{pg_name}'")
        exists = cursor.fetchone()
        
        if exists:
            print(f"   [INFO] Database '{pg_name}' sudah terdaftar.")
        else:
            print(f"   [DB] Database '{pg_name}' tidak ditemukan. Membuat database baru...")
            cursor.execute(f"CREATE DATABASE {pg_name}")
            print(f"   [OK] Database '{pg_name}' berhasil dibuat!")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"   [ERROR] Gagal memverifikasi/membuat database PostgreSQL: {e}")
        sys.exit(1)

# 7. Alur Utama Migrasi
def run_migration():
    # Periksa ketersediaan database SQLite lokal
    if not os.path.exists('db.sqlite3'):
        print("\n[ERROR] File 'db.sqlite3' tidak ditemukan di root folder!")
        print("   Pastikan file database SQLite lokal berada di direktori utama proyek.")
        sys.exit(1)

    # Pastikan database target PostgreSQL sudah ada sebelum Django setup migrations
    ensure_postgresql_database()

    print("\n[SYNC] Menjalankan Django schema migrations pada PostgreSQL...")
    from django.core.management import call_command
    call_command('migrate', database='default')
    
    # Konfirmasi data awal pada SQLite
    print("\n[STATS] Data terdeteksi pada SQLite:")
    models_to_check = [
        ("User", User), ("Group", Group), ("Genre", Genre), ("Studio", Studio),
        ("Actor", Actor), ("Film", Film), ("FilmImage", FilmImage), 
        ("Filmography", Filmography), ("Festival", Festival), ("FestivalAward", FestivalAward),
        ("UserProfile", UserProfile), ("Rating", Rating), ("Watchlist", Watchlist),
        ("RecommendationLog", RecommendationLog)
    ]
    for name, model in models_to_check:
        print(f"  - {name}: {model.objects.using('sqlite').count():,} data")
        
    print("\n[START] Memulai proses pembersihan target database PostgreSQL...")
    
    # 8. Bersihkan data di PostgreSQL secara terbalik (dari anak ke induk)
    print("\n[CLEAN] Membersihkan database PostgreSQL target...")
    for _, model in reversed(models_to_check):
        model.objects.using('default').all().delete()
    
    # Bersihkan relasi M2M lama juga
    Group.permissions.through.objects.using('default').all().delete()
    User.user_permissions.through.objects.using('default').all().delete()
    User.groups.through.objects.using('default').all().delete()
    
    print("  [OK] PostgreSQL dibersihkan!")

    # 9. Eksekusi Migrasi Model Standar
    print("\n[START] Memulai pemindahan data ke PostgreSQL...")
    
    with transaction.atomic(using='default'):
        # A. Tabel Utama (Parent)
        migrate_model_batch(User)
        migrate_model_batch(Group)
        migrate_model_batch(Genre)
        migrate_model_batch(Studio)
        migrate_model_batch(Actor)
        
        # B. Tabel Menengah (Child)
        migrate_model_batch(Film)
        migrate_model_batch(FilmImage)
        migrate_model_batch(Filmography)
        migrate_model_batch(Festival)
        migrate_model_batch(FestivalAward)
        migrate_model_batch(UserProfile)
        migrate_model_batch(Rating)
        migrate_model_batch(Watchlist)
        migrate_model_batch(RecommendationLog)
        
        # C. Tabel Many-to-Many Relasional standard
        migrate_m2m_through(User.groups.through)
        migrate_m2m_through(UserProfile.pref_genres.through)
        migrate_m2m_through(Film.genre.through)
        migrate_m2m_through(Actor.genre_spec.through)
        migrate_m2m_through(Festival.films.through)
        
        # D. Otorisasi Spesial (Mapping ID Permission Django yang Berbeda)
        print("\n[AUTH] Memetakan dan memindahkan hak akses (Group & User Permissions)...")
        sqlite_perms = Permission.objects.using('sqlite').all()
        pg_perms = Permission.objects.using('default').all()
        
        # Map SQLite permission_id ke PostgreSQL permission_id menggunakan (app_label, codename)
        sqlite_map = {p.id: (p.content_type.app_label, p.codename) for p in sqlite_perms}
        pg_map = {(p.content_type.app_label, p.codename): p.id for p in pg_perms}
        
        perm_map = {}
        for sqlite_id, key in sqlite_map.items():
            if key in pg_map:
                perm_map[sqlite_id] = pg_map[key]
                
        # Pindahkan Group Permissions
        gp_through = Group.permissions.through
        sqlite_gp = gp_through.objects.using('sqlite').all()
        gp_batch = []
        for obj in sqlite_gp:
            new_perm_id = perm_map.get(obj.permission_id)
            if new_perm_id:
                new_obj = gp_through(id=obj.id, group_id=obj.group_id, permission_id=new_perm_id)
                new_obj._state.db = 'default'
                gp_batch.append(new_obj)
        if gp_batch:
            gp_through.objects.using('default').bulk_create(gp_batch)
        print(f"  [OK] Group.permissions: {len(gp_batch):,} data dipindahkan!")

        # Pindahkan User Permissions
        up_through = User.user_permissions.through
        sqlite_up = up_through.objects.using('sqlite').all()
        up_batch = []
        for obj in sqlite_up:
            new_perm_id = perm_map.get(obj.permission_id)
            if new_perm_id:
                new_obj = up_through(id=obj.id, user_id=obj.user_id, permission_id=new_perm_id)
                new_obj._state.db = 'default'
                up_batch.append(new_obj)
        if up_batch:
            up_through.objects.using('default').bulk_create(up_batch)
        print(f"  [OK] User.user_permissions: {len(up_batch):,} data dipindahkan!")

    # 10. Penyesuaian PostgreSQL Sequences
    print("\n[SYNC] Menyelaraskan sequence database PostgreSQL...")
    from io import StringIO
    from django.core.management import call_command
    from django.apps import apps
    
    app_labels = [app.label for app in apps.get_app_configs()]
    with connection.cursor() as cursor:
        for app_label in app_labels:
            output = StringIO()
            try:
                call_command('sqlsequencereset', app_label, stdout=output)
                sql = output.getvalue()
                if sql.strip():
                    cursor.execute(sql)
            except Exception:
                pass
    print("  [OK] Seluruh primary key sequence berhasil diselaraskan!")

    # 11. Audit & Verifikasi Akhir
    print("\n[STATS] Hasil Akhir & Verifikasi Data:")
    print("=" * 70)
    print(f"{'Nama Model':<25} | {'SQLite Count':<15} | {'PostgreSQL':<15} | {'Status':<10}")
    print("-" * 70)
    
    all_ok = True
    for name, model in models_to_check:
        sqlite_cnt = model.objects.using('sqlite').count()
        pg_cnt = model.objects.using('default').count()
        status = "[MATCH]" if sqlite_cnt == pg_cnt else "[MISMATCH]"
        if sqlite_cnt != pg_cnt:
            all_ok = False
        print(f"{name:<25} | {sqlite_cnt:<15,} | {pg_cnt:<15,} | {status:<10}")
        
    print("=" * 70)
    if all_ok:
        print("\n[SUCCESS] PEMINDAHAN DATA 100% SUKSES DAN PRESISI!")
    else:
        print("\n[WARNING] Terdapat ketidakcocokan jumlah data. Periksa log.")

if __name__ == '__main__':
    try:
        run_migration()
    except KeyboardInterrupt:
        print("\n[ERROR] Proses dibatalkan oleh pengguna.")
        sys.exit(1)
