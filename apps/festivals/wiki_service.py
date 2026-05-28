import re
import requests
import logging
from bs4 import BeautifulSoup
from django.utils.text import slugify
from apps.films.models import Film
from apps.actors.models import Actor
from apps.festivals.models import Festival, FestivalAward

logger = logging.getLogger(__name__)

class WikipediaAccoladesImporter:
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
        }

    def search_wikipedia_page(self, film_title):
        """
        Mencari halaman Wikipedia yang paling relevan untuk penghargaan film tersebut.
        """
        try:
            # 1. Coba cari spesifik daftar penghargaan
            search_query = f"List of accolades received by {film_title}"
            url = "https://en.wikipedia.org/w/api.php"
            params = {
                "action": "query",
                "list": "search",
                "srsearch": search_query,
                "format": "json"
            }
            res = requests.get(url, params=params, headers=self.headers, timeout=10).json()
            search_results = res.get("query", {}).get("search", [])
            
            if search_results:
                best_match = search_results[0]["title"]
                if "accolades" in best_match.lower() and slugify(film_title) in slugify(best_match):
                    return best_match

            # 2. Coba cari halaman film utama sebagai fallback
            fallback_query = f"{film_title} (film)"
            params["srsearch"] = fallback_query
            res = requests.get(url, params=params, headers=self.headers, timeout=10).json()
            search_results = res.get("query", {}).get("search", [])
            if search_results:
                return search_results[0]["title"]

            # 3. Fallback terakhir: judul film saja
            return film_title
        except Exception as e:
            logger.error(f"Gagal mencari halaman Wikipedia untuk {film_title}: {str(e)}")
            return film_title

    def fetch_wikipedia_parsed_html(self, page_title):
        """
        Mengambil parsed HTML dari Wikipedia API untuk halaman tertentu.
        """
        try:
            url = "https://en.wikipedia.org/w/api.php"
            params = {
                "action": "parse",
                "page": page_title,
                "prop": "text",
                "format": "json",
                "redirects": "true"
            }
            res = requests.get(url, params=params, headers=self.headers, timeout=10).json()
            if "error" in res:
                logger.warning(f"MediaWiki API error untuk halaman '{page_title}': {res['error'].get('info')}")
                return None
            return res.get("parse", {}).get("text", {}).get("*")
        except Exception as e:
            logger.error(f"Gagal mengambil HTML Wikipedia untuk '{page_title}': {str(e)}")
            return None

    def parse_accolades_tables(self, html_content, film_year=None):
        """
        Memproses HTML Wikipedia, mengekstrak semua tabel penghargaan dengan toleransi rowspan/colspan.
        """
        if not html_content:
            return []

        soup = BeautifulSoup(html_content, "html.parser")
        tables = soup.find_all("table", class_=[ "wikitable", "sortable" ])
        
        extracted_awards = []

        for table in tables:
            table_rows = table.find_all("tr")
            if not table_rows:
                continue

            # 1. Bangun Grid Seluler (Menyelesaikan masalah rowspan dan colspan secara elegan)
            grid = {}
            for r_idx, row in enumerate(table_rows):
                c_idx = 0
                cells = row.find_all(["td", "th"])
                for cell in cells:
                    # Lewati sel yang sudah terisi oleh rowspan baris sebelumnya
                    while (r_idx, c_idx) in grid:
                        c_idx += 1
                    
                    rowspan = int(cell.get("rowspan", 1))
                    colspan = int(cell.get("colspan", 1))
                    val = cell.get_text(strip=True)
                    
                    # Isi sel di grid untuk rentang span terkait
                    for dr in range(rowspan):
                        for dc in range(colspan):
                            grid[(r_idx + dr, c_idx + dc)] = val
                    c_idx += colspan

            # Jika grid kosong, lewati
            if not grid:
                continue

            # Hitung total baris dan kolom yang terdeteksi di grid
            all_coords = grid.keys()
            num_rows = max(r for r, c in all_coords) + 1
            num_cols = max(c for r, c in all_coords) + 1

            if num_rows < 2:
                continue

            # 2. Identifikasi Baris Header dan Petakan Kolom
            # Cari baris pertama yang berisi tag th
            header_row_idx = 0
            for r in range(num_rows):
                # Check if row has th elements in original table
                row_element = table_rows[r] if r < len(table_rows) else None
                if row_element and row_element.find_all("th"):
                    header_row_idx = r
                    break

            headers = {}
            for c in range(num_cols):
                headers[c] = grid.get((header_row_idx, c), "").lower()

            # Mapping Kolom Berdasarkan Kata Kunci Header
            col_mapping = {
                "festival": -1,
                "category": -1,
                "recipient": -1,
                "result": -1,
                "year": -1
            }

            for c, h in headers.items():
                # Festival/Award
                if any(kw in h for kw in ["festival", "association", "ceremony", "organization", "sponsor", "accolade", "award"]):
                    if col_mapping["festival"] == -1 or "festival" in h or "award" in h:
                        col_mapping["festival"] = c
                # Category
                if any(kw in h for kw in ["category", "award category"]):
                    col_mapping["category"] = c
                # Recipient
                if any(kw in h for kw in ["recipient", "nominee", "nominated", "winner"]):
                    col_mapping["recipient"] = c
                # Result
                if any(kw in h for kw in ["result", "outcome"]):
                    col_mapping["result"] = c
                # Year
                if any(kw in h for kw in ["year", "date"]):
                    col_mapping["year"] = c

            # Fallback mapping jika tidak terdeteksi
            if col_mapping["festival"] == -1 and num_cols > 0:
                col_mapping["festival"] = 0
            if col_mapping["category"] == -1 and num_cols > 1:
                col_mapping["category"] = 1
            if col_mapping["result"] == -1 and num_cols > 2:
                col_mapping["result"] = num_cols - 1

            # 3. Ekstrak Data dari Setiap Baris Data (setelah header)
            start_data_idx = header_row_idx + 1
            # Cek jika header baris ganda (multi-row header)
            if start_data_idx < num_rows:
                second_row_th = False
                row_element = table_rows[start_data_idx] if start_data_idx < len(table_rows) else None
                if row_element and row_element.find_all("th"):
                    second_row_th = True
                if second_row_th:
                    start_data_idx += 1

            for r in range(start_data_idx, num_rows):
                festival_val = grid.get((r, col_mapping["festival"]), "") if col_mapping["festival"] != -1 else ""
                category_val = grid.get((r, col_mapping["category"]), "") if col_mapping["category"] != -1 else ""
                recipient_val = grid.get((r, col_mapping["recipient"]), "") if col_mapping["recipient"] != -1 else ""
                result_val = grid.get((r, col_mapping["result"]), "") if col_mapping["result"] != -1 else ""
                year_val = grid.get((r, col_mapping["year"]), "") if col_mapping["year"] != -1 else ""

                # Bersihkan referensi Wikipedia [1], [2], dll dari nilai teks
                clean_ref = lambda x: re.sub(r'\[\d+\]', '', x).strip()
                festival_val = clean_ref(festival_val)
                category_val = clean_ref(category_val)
                recipient_val = clean_ref(recipient_val)
                result_val = clean_ref(result_val)
                year_val = clean_ref(year_val)

                # Validasi minimal: harus ada festival dan kategori
                if not festival_val or festival_val == headers.get(col_mapping["festival"], ""):
                    continue
                if not category_val or category_val == headers.get(col_mapping["category"], ""):
                    continue

                # Parse Tahun
                year = None
                if year_val:
                    # Ambil 4 digit angka pertama
                    match_year = re.search(r'\b(19\d\d|20\d\d)\b', year_val)
                    if match_year:
                        year = int(match_year.group(1))
                if not year and film_year:
                    year = film_year
                if not year:
                    year = 2026 # Default fallback

                # Parse Tipe Award
                award_type = "winner"
                res_lower = result_val.lower()
                if any(w in res_lower for w in ["won", "winner", "win"]):
                    award_type = "winner"
                elif any(n in res_lower for n in ["nom", "nominated", "nominee"]):
                    award_type = "nominee"

                extracted_awards.append({
                    "festival_name": festival_val,
                    "category": category_val,
                    "recipient": recipient_val,
                    "award_type": award_type,
                    "year": year
                })

        return extracted_awards

    def import_to_database(self, film_id, wikipedia_url=None):
        """
        Mengambil data dari Wikipedia dan menyimpannya ke model lokal.
        """
        try:
            film = Film.objects.get(id=film_id)
        except Film.DoesNotExist:
            return {"success": False, "error": "Film tidak ditemukan."}

        # Cari halaman jika tidak disediakan URL spesifik
        page_title = None
        if wikipedia_url:
            # Ambil page title dari URL (contoh: https://en.wikipedia.org/wiki/Page_Title)
            match = re.search(r'/wiki/([^#?]+)', wikipedia_url)
            if match:
                page_title = requests.utils.unquote(match.group(1)).replace("_", " ")
        
        if not page_title:
            page_title = self.search_wikipedia_page(film.title)

        logger.info(f"Mengimpor penghargaan untuk film '{film.title}' dari halaman Wikipedia '{page_title}'")
        
        html_content = self.fetch_wikipedia_parsed_html(page_title)
        if not html_content:
            # Coba fallback jika judul berakhiran "List of accolades..." gagal, cari langsung di halaman film utama
            if "accolades" in page_title.lower():
                fallback_title = f"{film.title} (film)"
                logger.info(f"Gagal mengambil daftar accolades, mencoba fallback ke halaman utama: {fallback_title}")
                html_content = self.fetch_wikipedia_parsed_html(fallback_title)
            
            if not html_content:
                return {"success": False, "error": f"Halaman Wikipedia '{page_title}' tidak ditemukan atau tidak memiliki data."}

        film_year = film.release_date.year if film.release_date else None
        extracted_awards = self.parse_accolades_tables(html_content, film_year=film_year)

        if not extracted_awards:
            return {"success": False, "error": "Tidak ada tabel penghargaan terstruktur yang ditemukan di halaman tersebut."}

        # Dapatkan daftar aktor yang bermain di film ini untuk pencocokan relasi aktor
        cast_actors = list(Actor.objects.filter(filmography__film=film))

        imported_count = 0
        skipped_count = 0

        for item in extracted_awards:
            # 1. Cari atau buat Festival
            fest_name = item["festival_name"]
            # Gunakan slug untuk pencarian yang toleran huruf besar-kecil dan spasi
            festival, created = Festival.objects.get_or_create(
                name__iexact=fest_name,
                defaults={
                    "name": fest_name,
                    "native_name": "",
                    "country": "",
                    "is_active": True
                }
            )

            # 2. Cek apakah ada aktor dari film ini yang disebut di kolom recipient
            matched_actor = None
            rec = item["recipient"].lower()
            if rec:
                for actor in cast_actors:
                    if actor.name.lower() in rec:
                        matched_actor = actor
                        break

            # 3. Cari atau buat FestivalAward (untuk mencegah duplikasi)
            award_exists = FestivalAward.objects.filter(
                festival=festival,
                film=film,
                category__iexact=item["category"],
                year=item["year"],
                award_type=item["award_type"]
            ).exists()

            if not award_exists:
                FestivalAward.objects.create(
                    festival=festival,
                    film=film,
                    actor=matched_actor,
                    category=item["category"],
                    year=item["year"],
                    award_type=item["award_type"]
                )
                imported_count += 1
            else:
                skipped_count += 1

        return {
            "success": True,
            "page_title": page_title,
            "total_extracted": len(extracted_awards),
            "imported": imported_count,
            "skipped": skipped_count
        }
