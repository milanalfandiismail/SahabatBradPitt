import requests
import logging
import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from django.conf import settings
from apps.films.models import Film, Genre, FilmImage
from apps.actors.models import Actor, Filmography
from apps.festivals.models import Studio
from apps.films.actor_config import FEATURED_ACTORS, DEFAULT_MIN_RATING, API_REQUEST_DELAY


logger = logging.getLogger(__name__)


class TMDBRateLimiter:
    """
    Rate limiter untuk TMDB API compliance.
    TMDB API limit: 40 requests per 10 seconds.
    """
    def __init__(self, max_requests=40, time_window=10):
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests = []
        self.lock = threading.Lock()
    
    def wait_if_needed(self):
        """Wait if rate limit would be exceeded"""
        with self.lock:
            now = time.time()
            # Remove requests older than time_window
            self.requests = [req_time for req_time in self.requests if now - req_time < self.time_window]
            
            if len(self.requests) >= self.max_requests:
                # Wait until oldest request expires
                sleep_time = self.time_window - (now - self.requests[0]) + 0.1
                time.sleep(sleep_time)
                self.requests = []
            
            self.requests.append(now)


class TMDBService:
    def __init__(self):
        self.api_key = settings.TMDB_API_KEY
        self.base_url = settings.TMDB_BASE_URL
        self.headers = {
            "accept": "application/json",
        }

    def _is_asian_or_non_latin(self, person_data, name, original_name=None):
        """
        Menentukan apakah seorang aktor/sutradara berasal dari daerah non-Latin
        (seperti Korea, China, Jepang, dll) agar terhindar dari memberikan
        nama native non-Latin untuk aktor Barat (seperti Wes Bentley).
        """
        # 1. Jika nama utama atau original_name mengandung non-ASCII, maka pasti non-Latin
        if name and not name.isascii():
            return True
        if original_name and not original_name.isascii():
            return True
            
        # 2. Cek tempat lahir (place_of_birth)
        place_of_birth = person_data.get("place_of_birth") or ""
        pob_lower = place_of_birth.lower()
        non_latin_keywords = [
            "korea", "china", "japan", "taiwan", "hong kong", "macau", 
            "singapore", "thailand", "vietnam", "tokyo", "seoul", "beijing",
            "shanghai", "taipei", "bangkok", "viet nam"
        ]
        if any(kw in pob_lower for kw in non_latin_keywords):
            return True
            
        # 3. Jika lahir di barat, kemungkinan besar bukan native Asia Timur (kecuali nama non-ASCII)
        western_countries = [
            "usa", "united states", "uk", "united kingdom", "england", "canada", 
            "australia", "france", "germany", "italy", "spain", "sweden", 
            "norway", "denmark", "ireland", "new zealand"
        ]
        if any(country in pob_lower for country in western_countries):
            return False
            
        # 4. Fallback jika also_known_as mengandung karakter non-ASCII
        also_known_as = person_data.get("also_known_as", [])
        if any(alt and not alt.isascii() for alt in also_known_as):
            return True
            
        return False

    def is_configured(self):
        return bool(self.api_key) and self.api_key != "your_tmdb_api_key_here"

    def fetch_genres(self):
        """Menarik daftar genre resmi dari TMDB dan mempopulerkannya ke database lokal."""
        if not self.is_configured():
            logger.warning("TMDB API Key tidak dikonfigurasi. Menggunakan mock data untuk Genre.")
            # Mock genres
            mock_genres = ["Aksi", "Petualangan", "Animasi", "Komedi", "Kejahatan", "Dokumenter", "Drama", "Keluarga", "Fantasi", "Sejarah", "Horor", "Musik", "Misteri", "Romantis", "Sci-Fi", "Misteri", "Thriller", "Perang", "Barat"]
            genres_created = []
            for name in mock_genres:
                g, _ = Genre.objects.get_or_create(name=name)
                genres_created.append(g)
            return genres_created

        url = f"{self.base_url}/genre/movie/list"
        params = {"api_key": self.api_key, "language": "id-ID"}
        try:
            response = requests.get(url, headers=self.headers, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                genres_created = []
                for item in data.get("genres", []):
                    # Retry logic untuk handle database locking
                    max_retries = 3
                    retry_delay = 0.1
                    for attempt in range(max_retries):
                        try:
                            genre, _ = Genre.objects.update_or_create(
                                name=item["name"],
                                defaults={"tmdb_genre_id": item["id"]}
                            )
                            genres_created.append(genre)
                            break  # Success, exit retry loop
                        except Exception as db_error:
                            if "database is locked" in str(db_error) and attempt < max_retries - 1:
                                time.sleep(retry_delay)
                                retry_delay *= 2  # Exponential backoff
                            else:
                                logger.warning(f"Gagal create genre {item['name']}: {str(db_error)}")
                                break
                return genres_created
            else:
                logger.error(f"Gagal menarik genre TMDB: status_code {response.status_code}")
        except Exception as e:
            logger.exception(f"Error saat memproses genre TMDB: {str(e)}")
        return []

    def sync_actor_movies(self, actor_id, actor_name=None, min_rating=DEFAULT_MIN_RATING, rate_limiter=None, limit=None):
        """
        Menarik daftar filmografi aktor dari TMDB berdasarkan actor_id.
        Mempopulerkan data Film, Actor, Filmography, dan Studio secara otomatis.
        Hanya menyimpan film dengan rating >= min_rating untuk menjaga kualitas katalog.
        
        Args:
            actor_id (int): TMDB Person ID dari aktor
            actor_name (str, optional): Nama aktor untuk logging. Jika None, akan diambil dari TMDB.
            min_rating (float): Minimum rating film yang akan disimpan (default: 7.0)
            rate_limiter (TMDBRateLimiter, optional): Rate limiter untuk multithread sync
            limit (int, optional): Batasan jumlah film yang disinkronisasi
        
        Returns:
            int: Jumlah film yang berhasil disinkronkan
        """
        self.fetch_genres()

        if not self.is_configured():
            logger.warning(f"TMDB API Key tidak dikonfigurasi. Membuat mock data film {actor_name or 'aktor'}.")
            return self._create_mock_data()

        # Gunakan combined_credits untuk menarik Film dan Serial TV (K-Drama) sekaligus
        url = f"{self.base_url}/person/{actor_id}/combined_credits"
        params = {"api_key": self.api_key, "language": "id-ID"}
        try:
            if rate_limiter:
                rate_limiter.wait_if_needed()
            response = requests.get(url, headers=self.headers, params=params, timeout=15)
            if response.status_code != 200:
                logger.error(f"Gagal menarik gabungan karya {actor_name or f'actor ID {actor_id}'}: status {response.status_code}")
                return 0

            credits_data = response.json()
            cast_list = credits_data.get("cast", [])
            
            # Urutkan berdasarkan popularitas film agar memprioritaskan film-film terkenal
            cast_list = sorted(cast_list, key=lambda x: x.get("popularity", 0), reverse=True)
            if limit is not None:
                cast_list = cast_list[:limit]

            # Ambil detail aktor secara dinamis dari TMDB
            bio = f"Aktor/aktris terkenal Hollywood"
            birth_year = None
            photo_path = ""
            fetched_actor_name = actor_name
            
            native_name = ""
            try:
                person_url = f"{self.base_url}/person/{actor_id}"
                if rate_limiter:
                    rate_limiter.wait_if_needed()
                person_res = requests.get(person_url, headers=self.headers, params={"api_key": self.api_key}, timeout=10)
                if person_res.status_code == 200:
                    person_data = person_res.json()
                    fetched_actor_name = person_data.get("name") or actor_name or f"Actor {actor_id}"
                    bio = person_data.get("biography") or bio
                    photo_path = person_data.get("profile_path") or photo_path
                    if person_data.get("birthday"):
                        try:
                            birth_year = int(person_data.get("birthday").split("-")[0])
                        except ValueError:
                            pass
                    
                    # Deteksi nama native (non-Latin) atau nama latin secara timbal-balik dari also_known_as
                    if self._is_asian_or_non_latin(person_data, fetched_actor_name):
                        also_known_as = person_data.get("also_known_as", [])
                        if fetched_actor_name.isascii():
                            # Nama utama berbentuk latin (ASCII), cari nama asli non-latin
                            for alt_name in also_known_as:
                                if alt_name and not alt_name.isascii():
                                    native_name = alt_name
                                    break
                        else:
                            # Nama utama non-latin (Hanzi/Hangul/dll), cari nama latin (ASCII)
                            for alt_name in also_known_as:
                                if alt_name and alt_name.isascii():
                                    native_name = alt_name
                                    break
                    
                    if native_name:
                        logger.info(f"Nama native ditemukan untuk {fetched_actor_name}: {native_name}")
            except Exception as ex:
                logger.warning(f"Gagal mengambil detail person {fetched_actor_name or actor_id} dari TMDB: {str(ex)}")
                fetched_actor_name = actor_name or f"Actor {actor_id}"

            # Inisialisasi aktor di database
            current_actor, _ = Actor.objects.update_or_create(
                tmdb_id=actor_id,
                defaults={
                    "name": fetched_actor_name,
                    "native_name": native_name,
                    "bio": bio,
                    "birth_year": birth_year,
                    "photo_path": photo_path
                }
            )
            synced_count = 0
            skipped_count = 0
            for cast in cast_list:
                media_type = cast.get("media_type", "movie")
                movie_id = cast.get("id")
                
                # Filter / Skip serial TV/acara TV yang beraliran non-fiksi/non-drama (reality, news, talk, soap, dokumenter TV)
                # 99: Documentary, 10763: News, 10764: Reality, 10766: Soap, 10767: Talk
                if media_type == "tv":
                    genre_ids = cast.get("genre_ids", [])
                    skipped_tv_genres = {99, 10763, 10764, 10766, 10767}
                    if any(g_id in skipped_tv_genres for g_id in genre_ids):
                        logger.info(f"Skip non-fiction TV Show '{cast.get('name') or cast.get('original_name')}' (News/Reality/Talk/Soap/Documentary TV)")
                        continue
                
                # Sesuaikan field judul dan rilis berdasarkan tipe media (Film vs Serial TV)
                if media_type == "tv":
                    title = cast.get("name")
                    original_title = cast.get("original_name")
                    release_date = cast.get("first_air_date", "")
                    movie_detail_url = f"{self.base_url}/tv/{movie_id}"
                else:
                    title = cast.get("title")
                    original_title = cast.get("original_title")
                    release_date = cast.get("release_date", "")
                    movie_detail_url = f"{self.base_url}/movie/{movie_id}"
                    
                # Format judul agar menyertakan nama lokal jika aslinya non-Latin
                if title and original_title and title != original_title:
                    if not title.isascii() or not original_title.isascii():
                        if title.isascii():
                            title = f"{title} ({original_title})"
                        elif original_title.isascii():
                            title = f"{original_title} ({title})"
                        else:
                            title = f"{title} ({original_title})"
                    
                character = cast.get("character") or "Aktor"
                
                # Filter berdasarkan rating - skip film dengan rating rendah,
                # namun jangan skip film yang belum dirilis/belum dinilai (vote_count == 0 atau vote_average == 0.0)
                vote_average = cast.get("vote_average", 0.0)
                vote_count = cast.get("vote_count", 0)
                if vote_average < min_rating and vote_count > 0:
                    skipped_count += 1
                    logger.debug(f"Skip {media_type} '{title}' (rating {vote_average:.1f} < {min_rating})")
                    continue

                # Ambil detail lengkap film/serial tv (termasuk runtime, studio produksi, dan videos)
                detail_params = {"api_key": self.api_key, "language": "id-ID", "append_to_response": "credits,images,videos", "include_image_language": "id,en,null"}
                
                runtime = 120
                if media_type == "tv":
                    runtime = 45 # Default episode runtime untuk serial tv
                synopsis = cast.get("overview", "")
                studios = []
                director_name = "Sutradara"
                director_tmdb_id = None
                director_photo = ""

                try:
                    if rate_limiter:
                        rate_limiter.wait_if_needed()
                    detail_res = requests.get(movie_detail_url, headers=self.headers, params=detail_params, timeout=10)
                    if detail_res.status_code == 200:
                        detail_data = detail_res.json()
                        if media_type == "tv":
                            # Untuk TV Show, durasi diambil dari episode_run_time list, default 45 menit
                            run_times = detail_data.get("episode_run_time", [])
                            runtime = run_times[0] if run_times else 45
                            
                            # Cek ulang genre dari detail respon TV untuk memastikan dokumenter/talkshow TV dll tidak lolos
                            genres_data = detail_data.get("genres", [])
                            genre_ids_detail = [g.get("id") for g in genres_data if g.get("id")]
                            skipped_tv_genres = {99, 10763, 10764, 10766, 10767}
                            if any(g_id in skipped_tv_genres for g_id in genre_ids_detail):
                                logger.info(f"Skip non-fiction TV Show '{title}' (News/Reality/Talk/Soap/Documentary TV)")
                                continue
                        else:
                            runtime = detail_data.get("runtime") or runtime
                        synopsis = detail_data.get("overview") or synopsis

                        # Fallback judul Bahasa Inggris (Latin) jika judul utama non-ASCII (Hangul/Hanzi/dll)
                        if title and not title.isascii():
                            try:
                                en_params = {"api_key": self.api_key, "language": "en-US"}
                                if rate_limiter:
                                    rate_limiter.wait_if_needed()
                                en_res = requests.get(movie_detail_url, headers=self.headers, params=en_params, timeout=10)
                                if en_res.status_code == 200:
                                    en_data = en_res.json()
                                    en_title = en_data.get("name") if media_type == "tv" else en_data.get("title")
                                    if en_title and en_title.isascii() and en_title != title and en_title not in title:
                                        # Jika didapatkan judul latin, format menjadi Latin (Lokal)
                                        title = f"{en_title} ({title})"
                            except Exception as en_title_ex:
                                logger.warning(f"Gagal mengambil judul EN fallback: {str(en_title_ex)}")

                        # Fallback sinopsis Bahasa Inggris kalau overview ID kosong
                        if not synopsis:
                            try:
                                en_params = {"api_key": self.api_key, "language": "en-US"}
                                if rate_limiter:
                                    rate_limiter.wait_if_needed()
                                en_res = requests.get(movie_detail_url, headers=self.headers, params=en_params, timeout=10)
                                if en_res.status_code == 200:
                                    en_data = en_res.json()
                                    synopsis = en_data.get("overview") or synopsis
                            except Exception as en_ex:
                                logger.warning(f"Gagal mengambil sinopsis EN TMDB ID {movie_id}: {str(en_ex)}")
                        
                        # Ambil studio produksi utama
                        prod_companies = detail_data.get("production_companies", [])
                        if prod_companies:
                            company = prod_companies[0]
                            studio, _ = Studio.objects.get_or_create(
                                name=company["name"],
                                defaults={"country": company.get("origin_country", "")}
                            )
                            studios.append(studio)

                        # Ambil sutradara film dari credits
                        crew_list = detail_data.get("credits", {}).get("crew", [])
                        director_name = None
                        director_original_name = None
                        director_tmdb_id = None
                        director_photo = ""
                        for crew in crew_list:
                            if crew.get("job") == "Director":
                                director_name = crew.get("name")
                                director_original_name = crew.get("original_name")
                                director_tmdb_id = crew.get("id")
                                director_photo = crew.get("profile_path") or ""
                                break
                        
                        # Fallback untuk Serial TV (Created By / Creator)
                        if not director_name and media_type == "tv":
                            created_by = detail_data.get("created_by", [])
                            if created_by:
                                creator = created_by[0]
                                director_name = creator.get("name")
                                director_original_name = creator.get("original_name") or director_name
                                director_tmdb_id = creator.get("id")
                                director_photo = creator.get("profile_path") or ""
                except Exception as ex:
                    logger.warning(f"Gagal mengambil detail film TMDB ID {movie_id}: {str(ex)}")

                # Simpan/update model Film
                release_year = None
                if release_date:
                    try:
                        release_year = int(release_date.split("-")[0])
                    except ValueError:
                        pass
                
                # Generate trailer URL menggunakan YouTube service
                from apps.films.youtube_service import YouTubeTrailerService
                youtube_service = YouTubeTrailerService()
                tmdb_videos = detail_data.get("videos", {}).get("results", [])
                trailer_url = youtube_service.search_trailer(title, release_year, tmdb_videos)
                
                film, _ = Film.objects.update_or_create(
                    tmdb_id=movie_id,
                    defaults={
                        "title": title,
                        "synopsis": synopsis,
                        "release_year": release_year,
                        "trailer_url": trailer_url,
                        "poster_path": cast.get("poster_path") or "",
                        "duration": runtime,
                        "popularity": cast.get("popularity", 0.0),
                        "avg_rating": cast.get("vote_average", 0.0),
                        "studio": studios[0] if studios else None
                    }
                )
                # Petakan Genre film
                genre_ids = cast.get("genre_ids", [])
                for g_id in genre_ids:
                    try:
                        genre = Genre.objects.get(tmdb_genre_id=g_id)
                        film.genre.add(genre)
                    except Genre.DoesNotExist:
                        pass
                
                # Sync Backdrops (Gallery)
                # Clear old images untuk film ini terlebih dahulu
                FilmImage.objects.filter(film=film).delete()
                
                images_data = detail_data.get("images", {})
                backdrops = images_data.get("backdrops", [])
                
                # Simpan maksimal 8 backdrop terbaik
                for backdrop in backdrops[:8]:
                    file_path = backdrop.get("file_path")
                    if file_path:
                        FilmImage.objects.update_or_create(
                            film=film,
                            file_path=file_path,
                            defaults={"image_type": "backdrop"}
                        )

                # Hubungkan aktor ke filmografi film ini
                cast_list_from_credits = detail_data.get("credits", {}).get("cast", [])
                actor_order = 99
                for c in cast_list_from_credits:
                    if c.get("id") == current_actor.tmdb_id:
                        actor_order = c.get("order", 0)
                        break
                Filmography.objects.update_or_create(
                    actor=current_actor,
                    film=film,
                    defaults={"role": f"Pemeran ({character})", "order": actor_order}
                )

                # Sync all cast members dari film (limit top 100)
                cast_list_from_credits = detail_data.get("credits", {}).get("cast", [])
                for idx, cast_member in enumerate(cast_list_from_credits[:100]):  # Limit 100 cast members
                    cast_tmdb_id = cast_member.get("id")
                    cast_name = cast_member.get("name")
                    cast_original_name = cast_member.get("original_name")
                    cast_character = cast_member.get("character") or "Pemeran"
                    cast_photo = cast_member.get("profile_path") or ""
                    
                    cast_native_name = ""
                    if cast_original_name and cast_original_name != cast_name:
                        if not cast_original_name.isascii() or not cast_name.isascii():
                            cast_native_name = cast_original_name
                            
                    # Jika nama utama non-latin dan belum punya padanan latin, cari di TMDB person detail
                    if not cast_native_name and not cast_name.isascii():
                        try:
                            if rate_limiter:
                                rate_limiter.wait_if_needed()
                            person_res = requests.get(f"{self.base_url}/person/{cast_tmdb_id}", headers=self.headers, params={"api_key": self.api_key}, timeout=5)
                            if person_res.status_code == 200:
                                p_data = person_res.json()
                                if self._is_asian_or_non_latin(p_data, cast_name):
                                    also_known_as = p_data.get("also_known_as", [])
                                    for alt_name in also_known_as:
                                        if alt_name and alt_name.isascii():
                                            cast_native_name = alt_name
                                            break
                        except Exception as ex:
                            logger.warning(f"Gagal fetch Latin name untuk {cast_name}: {str(ex)}")
                    
                    if cast_tmdb_id and cast_name:
                        # Cek apakah aktor sudah ada dengan bio asli
                        cast_actor = Actor.objects.filter(tmdb_id=cast_tmdb_id).first()
                        cast_bio = ""
                        cast_birth_year = None
                        
                        if cast_actor and cast_actor.bio and not cast_actor.bio.startswith("Aktor/aktris"):
                            cast_bio = cast_actor.bio
                            cast_birth_year = cast_actor.birth_year
                        elif idx < 5:  # Hanya tarik bio asli dari API untuk top 5 cast utama
                            # Fetch real bio dari API
                            try:
                                if rate_limiter:
                                    rate_limiter.wait_if_needed()
                                person_res = requests.get(f"{self.base_url}/person/{cast_tmdb_id}", headers=self.headers, params={"api_key": self.api_key}, timeout=5)
                                if person_res.status_code == 200:
                                    p_data = person_res.json()
                                    cast_bio = p_data.get("biography") or ""
                                    if p_data.get("birthday"):
                                        try:
                                            cast_birth_year = int(p_data.get("birthday").split("-")[0])
                                        except ValueError:
                                            pass
                                    
                                    # Deteksi also_known_as jika non-Latin origin
                                    if self._is_asian_or_non_latin(p_data, cast_name, cast_original_name):
                                        also_known_as = p_data.get("also_known_as", [])
                                        if not cast_native_name:
                                            if cast_name.isascii():
                                                for alt_name in also_known_as:
                                                    if alt_name and not alt_name.isascii():
                                                        cast_native_name = alt_name
                                                        break
                                            else:
                                                for alt_name in also_known_as:
                                                    if alt_name and alt_name.isascii():
                                                        cast_native_name = alt_name
                                                        break
                            except Exception as ex:
                                logger.warning(f"Gagal fetch bio untuk cast {cast_name}: {str(ex)}")
                        
                        if not cast_bio:
                            cast_bio = f"Aktor/aktris yang bermain di {title}."

                        # Create/update actor
                        cast_actor, _ = Actor.objects.update_or_create(
                            tmdb_id=cast_tmdb_id,
                            defaults={
                                "name": cast_name,
                                "native_name": cast_native_name,
                                "photo_path": cast_photo,
                                "bio": cast_bio,
                                "birth_year": cast_birth_year
                            }
                        )
                        
                        # Create filmography relation dengan order
                        cast_order = cast_member.get("order", idx)
                        Filmography.objects.update_or_create(
                            actor=cast_actor,
                            film=film,
                            defaults={"role": f"Pemeran ({cast_character})", "order": cast_order}
                        )

                # Tambahkan sutradara ke Aktor dan hubungkan filmografi
                if director_tmdb_id:
                    director_native_name = ""
                    if director_original_name and director_original_name != director_name and not director_original_name.isascii():
                        director_native_name = director_original_name
                    
                    director_actor = Actor.objects.filter(tmdb_id=director_tmdb_id).first()
                    
                    # Cek apakah butuh detail dari API (jika belum ada native_name untuk Asia Timur, atau belum ada bio)
                    need_api_call = False
                    if not director_native_name and not director_name.isascii():
                        need_api_call = True
                    elif not director_actor or not director_actor.bio or director_actor.bio.startswith("Sutradara ternama"):
                        need_api_call = True
                        
                    dir_bio = director_actor.bio if director_actor else ""
                    dir_birth_year = director_actor.birth_year if director_actor else None
                    if director_actor and director_actor.native_name:
                        director_native_name = director_actor.native_name
                    
                    if need_api_call:
                        # Fetch real bio/details dari API
                        try:
                            if rate_limiter:
                                rate_limiter.wait_if_needed()
                            person_res = requests.get(f"{self.base_url}/person/{director_tmdb_id}", headers=self.headers, params={"api_key": self.api_key}, timeout=5)
                            if person_res.status_code == 200:
                                p_data = person_res.json()
                                dir_bio = p_data.get("biography") or dir_bio
                                if p_data.get("birthday"):
                                    try:
                                        dir_birth_year = int(p_data.get("birthday").split("-")[0])
                                    except ValueError:
                                        pass
                                
                                # Deteksi also_known_as jika non-Latin origin
                                if self._is_asian_or_non_latin(p_data, director_name, director_original_name):
                                    also_known_as = p_data.get("also_known_as", [])
                                    if not director_native_name:
                                        if director_name.isascii():
                                            for alt_name in also_known_as:
                                                if alt_name and not alt_name.isascii():
                                                    director_native_name = alt_name
                                                    break
                                        else:
                                            for alt_name in also_known_as:
                                                if alt_name and alt_name.isascii():
                                                    director_native_name = alt_name
                                                    break
                        except Exception:
                            pass
                    
                    if not dir_bio:
                        dir_bio = f"Sutradara ternama yang menyutradarai {title}."

                    director_actor, _ = Actor.objects.update_or_create(
                        tmdb_id=director_tmdb_id,
                        defaults={
                            "name": director_name,
                            "native_name": director_native_name,
                            "photo_path": director_photo,
                            "bio": dir_bio,
                            "birth_year": dir_birth_year
                        }
                    )
                    Filmography.objects.update_or_create(
                        actor=director_actor,
                        film=film,
                        defaults={"role": "Sutradara", "order": -1}
                    )

                synced_count += 1
                
                # Delay untuk menghindari rate limiting TMDB API (hanya jika tidak ada rate_limiter)
                if not rate_limiter:
                    time.sleep(API_REQUEST_DELAY)

            # Logging summary
            logger.info(f"Sinkronisasi {fetched_actor_name} selesai: {synced_count} film disimpan, {skipped_count} film di-skip (rating < {min_rating})")
            return synced_count

        except Exception as e:
            logger.exception(f"Error saat sinkronisasi TMDB {actor_name or f'actor ID {actor_id}'}: {str(e)}")
        return 0

    def _create_mock_data(self):
        """Membuat data palsu berkualitas tinggi (mock data) untuk pengetesan tanpa internet/API Key."""
        # Setup Genre jika belum ada
        self.fetch_genres()
        genres = list(Genre.objects.all())
        action_genre = next((g for g in genres if g.name in ["Aksi", "Action"]), None)
        drama_genre = next((g for g in genres if g.name in ["Drama"]), None)
        thriller_genre = next((g for g in genres if g.name in ["Thriller", "Misteri"]), None)
        adventure_genre = next((g for g in genres if g.name in ["Petualangan", "Adventure"]), None)

        # Buat Aktor Brad Pitt
        brad_pitt, _ = Actor.objects.get_or_create(
            name="Brad Pitt",
            defaults={
                "tmdb_id": 287,
                "bio": "William Bradley Pitt adalah seorang aktor dan produser film terkenal asal Amerika Serikat.",
                "birth_year": 1963,
                "photo_path": "/m09Y1YfPPeNYYUSHnnVqahkrC1o.jpg"
            }
        )

        # Buat Aktor Tambahan (Sutradara/Rekan)
        david_fincher, _ = Actor.objects.get_or_create(
            name="David Fincher",
            defaults={
                "tmdb_id": 7467,
                "bio": "Sutradara thriller psikologis Amerika terkenal.",
                "birth_year": 1962,
                "photo_path": "/tpEczFclQZeKAiCeKZZ0adRvtfz.jpg"
            }
        )
        quentin_tarantino, _ = Actor.objects.get_or_create(
            name="Quentin Tarantino",
            defaults={
                "tmdb_id": 138,
                "bio": "Sutradara, penulis skenario, dan aktor berkebangsaan Amerika Serikat.",
                "birth_year": 1963,
                "photo_path": "/9Bb8Q0n0hE2i9J6t7S9eD4.jpg"
            }
        )

        # Buat Studio
        studio_warner, _ = Studio.objects.get_or_create(name="Warner Bros. Pictures", defaults={"country": "US"})
        studio_columbia, _ = Studio.objects.get_or_create(name="Columbia Pictures", defaults={"country": "US"})

        # Daftar film mock
        mock_films = [
            {
                "tmdb_id": 550,
                "title": "Fight Club",
                "synopsis": "Seorang pekerja kantoran yang menderita insomnia dan seorang pembuat sabun yang karismatik mendirikan klub petarung bawah tanah.",
                "release_year": 1999,
                "trailer_url": "https://www.youtube.com/watch?v=qtRKdVHc-cE",
                "poster_path": "/pB8BM7pdSp6B6Ih7QZ429c2O5Pn.jpg",
                "duration": 139,
                "popularity": 92.5,
                "avg_rating": 8.8,
                "studio": studio_warner,
                "director": david_fincher,
                "genres": [drama_genre, thriller_genre],
                "role": "Pemeran (Tyler Durden)"
            },
            {
                "tmdb_id": 466272,
                "title": "Once Upon a Time in Hollywood",
                "synopsis": "Seorang aktor televisi yang meredup perilakunya bersama pemeran penggantinya berjuang untuk meraih ketenaran di industri film Los Angeles tahun 1969.",
                "release_year": 2019,
                "trailer_url": "https://www.youtube.com/watch?v=ELeMaP8EPAA",
                "poster_path": "/8j58iEBw95f617qaMPG6837vGO5.jpg",
                "duration": 161,
                "popularity": 64.3,
                "avg_rating": 7.6,
                "studio": studio_columbia,
                "director": quentin_tarantino,
                "genres": [drama_genre, adventure_genre],
                "role": "Pemeran (Cliff Booth)"
            },
            {
                "tmdb_id": 16869,
                "title": "Inglourious Basterds",
                "synopsis": "Di Prancis yang diduduki Nazi selama Perang Dunia II, sekelompok tentara Yahudi-Amerika merencanakan plot pembunuhan para pemimpin Nazi.",
                "release_year": 2009,
                "trailer_url": "https://www.youtube.com/watch?v=KnrRy6kSFF0",
                "poster_path": "/7jfqz7t85Ond44d93mO2a8dG.jpg",
                "duration": 153,
                "popularity": 78.4,
                "avg_rating": 8.3,
                "studio": studio_columbia,
                "director": quentin_tarantino,
                "genres": [action_genre, drama_genre, thriller_genre],
                "role": "Pemeran (Lt. Aldo Raine)"
            },
            {
                "tmdb_id": 298112,
                "title": "Seven",
                "synopsis": "Dua detektif pembunuhan memburu seorang pembunuh berantai berdarah dingin yang memilih korbannya berdasarkan tujuh dosa mematikan.",
                "release_year": 1995,
                "trailer_url": "https://www.youtube.com/watch?v=znmZoVkCjI0",
                "poster_path": "/692t4B3spSP4SPH95O94.jpg",
                "duration": 127,
                "popularity": 88.2,
                "avg_rating": 8.6,
                "studio": studio_warner,
                "director": david_fincher,
                "genres": [thriller_genre, drama_genre],
                "role": "Pemeran (David Mills)"
            }
        ]

        synced = 0
        for item in mock_films:
            film, _ = Film.objects.update_or_create(
                tmdb_id=item["tmdb_id"],
                defaults={
                    "title": item["title"],
                    "synopsis": item["synopsis"],
                    "release_year": item["release_year"],
                    "trailer_url": item["trailer_url"],
                    "poster_path": item["poster_path"],
                    "duration": item["duration"],
                    "popularity": item["popularity"],
                    "avg_rating": item["avg_rating"],
                    "studio": item["studio"]
                }
            )
            # Genre
            for g in item["genres"]:
                if g:
                    film.genre.add(g)

            # Filmography Brad Pitt
            Filmography.objects.update_or_create(
                actor=brad_pitt,
                film=film,
                defaults={"role": item["role"], "order": 0}
            )

            # Filmography Sutradara
            if item["director"]:
                Filmography.objects.update_or_create(
                    actor=item["director"],
                    film=film,
                    defaults={"role": "Sutradara", "order": -1}
                )

            synced += 1

        return synced

    def sync_multiple_actors(self, actor_list=None, min_rating=DEFAULT_MIN_RATING, max_workers=4):
        """
        Sinkronisasi filmografi untuk multiple actors dengan multithread.
        
        Args:
            actor_list (list, optional): List of actor dicts dengan format:
                [{"tmdb_id": 287, "name": "Brad Pitt"}, ...]
                Jika None, akan menggunakan FEATURED_ACTORS dari config.
            min_rating (float): Minimum rating film yang akan disimpan (default: 7.0)
            max_workers (int): Jumlah concurrent workers (default: 4 untuk stay under rate limit)
        
        Returns:
            dict: Summary dengan total_actors, total_films
        """
        if actor_list is None:
            actor_list = FEATURED_ACTORS
        
        rate_limiter = TMDBRateLimiter(max_requests=40, time_window=10)
        total_synced = 0
        actors_processed = 0
        
        logger.info(f"Memulai multithread sync {len(actor_list)} aktor (max_workers={max_workers}, min_rating={min_rating})")
        
        def sync_single_actor(actor_info):
            """Worker function untuk sync satu aktor"""
            actor_id = actor_info.get("tmdb_id")
            actor_name = actor_info.get("name")
            
            if not actor_id:
                logger.warning(f"Skip aktor tanpa tmdb_id: {actor_info}")
                return (actor_name, 0, "Missing tmdb_id")
            
            try:
                synced = self.sync_actor_movies(actor_id, actor_name, min_rating, rate_limiter)
                return (actor_name, synced, None)
            except Exception as e:
                logger.error(f"Gagal sync {actor_name}: {str(e)}")
                return (actor_name, 0, str(e))
        
        # Mematikan multithreading dan menggunakan perulangan serial
        # demi menghindari error "database is locked" dari SQLite
        for actor in actor_list:
            actor_name, synced, error = sync_single_actor(actor)
            if error is None:
                total_synced += synced
                actors_processed += 1
                logger.info(f"✓ {actor_name}: {synced} film")
            else:
                logger.error(f"✗ {actor_name}: {error}")
        
        logger.info(f"Multithread sync selesai: {actors_processed}/{len(actor_list)} aktor, {total_synced} film total")
        
        return {
            "total_actors": actors_processed,
            "total_films": total_synced,
            "min_rating": min_rating
        }
    
    
    def sync_brad_pitt_movies(self, limit=None):
        """
        Backward compatibility wrapper untuk sync_actor_movies.
        Method ini deprecated, gunakan sync_actor_movies() atau sync_multiple_actors().
        
        Args:
            limit: Parameter ini diabaikan (deprecated)
        
        Returns:
            int: Jumlah film yang berhasil disinkronkan
        """
        if limit is not None:
            logger.warning("Parameter 'limit' deprecated dan diabaikan. Gunakan min_rating untuk filter kualitas film.")
        
        return self.sync_actor_movies(287, "Brad Pitt", DEFAULT_MIN_RATING)
    
    def sync_films_cast_members(self, rate_limiter=None):
        """
        Sync cast members untuk all films yang sudah ada di database.
        Method ini fetch credits dari TMDB untuk setiap film dan sync all cast members.
        
        Args:
            rate_limiter (TMDBRateLimiter, optional): Rate limiter untuk multithread sync
        
        Returns:
            dict: Summary dengan total_films, total_actors_synced
        """
        films = Film.objects.all()
        total_actors_synced = 0
        films_processed = 0
        
        logger.info(f"Memulai sync cast members untuk {films.count()} film")
        
        for film in films:
            try:
                # Fetch credits dari TMDB
                if rate_limiter:
                    rate_limiter.wait_if_needed()
                
                url = f"{self.base_url}/movie/{film.tmdb_id}"
                params = {"api_key": self.api_key, "append_to_response": "credits"}
                response = requests.get(url, headers=self.headers, params=params, timeout=15)
                
                if response.status_code != 200:
                    logger.warning(f"Gagal fetch credits untuk {film.title}: status {response.status_code}")
                    continue
                
                data = response.json()
                credits = data.get("credits", {})
                cast_list = credits.get("cast", [])
                crew_list = credits.get("crew", [])
                
                # Sync cast members (top 100)
                actors_synced = 0
                for idx, cast_member in enumerate(cast_list[:100]):
                    cast_tmdb_id = cast_member.get("id")
                    cast_name = cast_member.get("name")
                    cast_original_name = cast_member.get("original_name")
                    cast_character = cast_member.get("character") or "Pemeran"
                    cast_photo = cast_member.get("profile_path") or ""
                    
                    cast_native_name = ""
                    if cast_original_name and cast_original_name != cast_name:
                        if not cast_original_name.isascii() or not cast_name.isascii():
                            cast_native_name = cast_original_name
                            
                    # Jika nama utama non-latin dan belum punya padanan latin, cari di TMDB person detail
                    if not cast_native_name and not cast_name.isascii():
                        try:
                            if rate_limiter:
                                rate_limiter.wait_if_needed()
                            person_res = requests.get(f"{self.base_url}/person/{cast_tmdb_id}", headers=self.headers, params={"api_key": self.api_key}, timeout=5)
                            if person_res.status_code == 200:
                                p_data = person_res.json()
                                if self._is_asian_or_non_latin(p_data, cast_name):
                                    also_known_as = p_data.get("also_known_as", [])
                                    for alt_name in also_known_as:
                                        if alt_name and alt_name.isascii():
                                            cast_native_name = alt_name
                                            break
                        except Exception:
                            pass
                    
                    if cast_tmdb_id and cast_name:
                        cast_actor, _ = Actor.objects.update_or_create(
                            tmdb_id=cast_tmdb_id,
                            defaults={
                                "name": cast_name,
                                "native_name": cast_native_name,
                                "photo_path": cast_photo,
                                "bio": f"Aktor/aktris yang bermain di {film.title}."
                            }
                        )
                        
                        cast_order = cast_member.get("order", idx)
                        Filmography.objects.update_or_create(
                            actor=cast_actor,
                            film=film,
                            defaults={"role": f"Pemeran ({cast_character})", "order": cast_order}
                        )
                        actors_synced += 1
                
                # Sync director
                for crew in crew_list:
                    if crew.get("job") == "Director":
                        director_tmdb_id = crew.get("id")
                        director_name = crew.get("name")
                        director_original_name = crew.get("original_name")
                        director_photo = crew.get("profile_path") or ""
                        
                        director_native_name = ""
                        if director_original_name and director_original_name != director_name and not director_original_name.isascii():
                            director_native_name = director_original_name
                        
                        # Jika nama non-ASCII dan belum ada native_name (padanan latin), hubungi API person detail
                        if not director_native_name and not director_name.isascii():
                            try:
                                if rate_limiter:
                                    rate_limiter.wait_if_needed()
                                person_res = requests.get(f"{self.base_url}/person/{director_tmdb_id}", headers=self.headers, params={"api_key": self.api_key}, timeout=5)
                                if person_res.status_code == 200:
                                    p_data = person_res.json()
                                    if self._is_asian_or_non_latin(p_data, director_name):
                                        also_known_as = p_data.get("also_known_as", [])
                                        for alt_name in also_known_as:
                                            if alt_name and alt_name.isascii():
                                                director_native_name = alt_name
                                                break
                            except Exception:
                                pass
                        
                        if director_tmdb_id and director_name:
                            director_actor, _ = Actor.objects.update_or_create(
                                tmdb_id=director_tmdb_id,
                                defaults={
                                    "name": director_name,
                                    "native_name": director_native_name,
                                    "photo_path": director_photo,
                                    "bio": f"Sutradara ternama yang menyutradarai {film.title}."
                                }
                            )
                            
                            Filmography.objects.update_or_create(
                                actor=director_actor,
                                film=film,
                                defaults={"role": "Sutradara", "order": -1}
                            )
                            actors_synced += 1
                        break
                
                total_actors_synced += actors_synced
                films_processed += 1
                logger.info(f"✓ {film.title}: {actors_synced} actors synced")
                
                # Delay untuk menghindari rate limiting (hanya jika tidak ada rate_limiter)
                if not rate_limiter:
                    time.sleep(API_REQUEST_DELAY)
                
            except Exception as e:
                logger.error(f"✗ {film.title}: {str(e)}")
                continue
        
        logger.info(f"Sync selesai: {films_processed} film, {total_actors_synced} actors total")
        
        return {
            "total_films": films_processed,
            "total_actors": total_actors_synced
        }
