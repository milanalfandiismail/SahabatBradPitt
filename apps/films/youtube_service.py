import requests
import logging
import hashlib
from django.conf import settings
from django.core.cache import cache
from datetime import timedelta

logger = logging.getLogger(__name__)


class YouTubeTrailerService:
    """
    Service untuk search trailer di YouTube menggunakan YouTube Data API.
    Implements fallback chain: TMDB videos → YouTube API → empty
    """
    
    def __init__(self):
        self.api_key = settings.YOUTUBE_API_KEY
        self.base_url = "https://www.googleapis.com/youtube/v3"
        self.cache_timeout = 30 * 24 * 60 * 60  # 30 days
    
    def is_configured(self):
        """Check if YouTube API key is configured"""
        return bool(self.api_key) and self.api_key != "your_youtube_api_key_here"
    
    def search_trailer(self, title, year=None, tmdb_videos=None):
        """
        Search trailer untuk film dengan fallback chain.
        
        Args:
            title (str): Judul film
            year (int, optional): Tahun rilis film
            tmdb_videos (list, optional): Videos dari TMDB API
        
        Returns:
            str: YouTube video URL (https://www.youtube.com/watch?v={video_id})
                 atau empty string jika tidak ditemukan
        """
        if not title:
            return ""
        
        # 1. Try TMDB videos first (free, no API call)
        if tmdb_videos:
            trailer_url = self._extract_from_tmdb_videos(tmdb_videos)
            if trailer_url:
                logger.info(f"Trailer found dari TMDB untuk '{title}'")
                return trailer_url
        
        # 2. Try YouTube API search
        if self.is_configured():
            trailer_url = self._search_youtube(title, year)
            if trailer_url:
                logger.info(f"Trailer found dari YouTube API untuk '{title}'")
                return trailer_url
        else:
            logger.warning("YouTube API key tidak dikonfigurasi, skip YouTube search")
        
        # 3. Fallback: empty (admin bisa input manual)
        logger.warning(f"Trailer tidak ditemukan untuk '{title}'")
        return ""
    
    def _extract_from_tmdb_videos(self, videos):
        """
        Extract YouTube trailer URL dari TMDB videos array dengan prioritas:
        1. Official & >= 1080p
        2. Official
        3. >= 1080p
        4. Sembarang trailer
        """
        if not videos:
            return ""
        
        yt_videos = [v for v in videos if v.get("site") == "YouTube" and v.get("key")]
        if not yt_videos:
            return ""

        trailers = [v for v in yt_videos if v.get("type") == "Trailer"]
        teasers = [v for v in yt_videos if v.get("type") == "Teaser"]
        clips = [v for v in yt_videos if v.get("type") in ["Clip", "Featurette"]]

        def get_best(video_list):
            if not video_list: return None
            # Prioritas 1: Official & 1080p/4K
            for v in video_list:
                if v.get("official") and v.get("size", 0) >= 1080:
                    return f"https://www.youtube.com/watch?v={v['key']}"
            # Prioritas 2: Official (resolusi apapun)
            for v in video_list:
                if v.get("official"):
                    return f"https://www.youtube.com/watch?v={v['key']}"
            # Prioritas 3: >= 1080p (unofficial)
            for v in video_list:
                if v.get("size", 0) >= 1080:
                    return f"https://www.youtube.com/watch?v={v['key']}"
            return f"https://www.youtube.com/watch?v={video_list[0]['key']}"

        for v_list in [trailers, teasers, clips]:
            best = get_best(v_list)
            if best:
                return best
            
        # Fallback ke video pertama yang ada jika tidak ada Trailer/Teaser/Clip
        return f"https://www.youtube.com/watch?v={yt_videos[0]['key']}"
    
    def _search_youtube(self, title, year=None):
        """
        Search trailer di YouTube menggunakan YouTube Data API dengan fallback scraping.
        """
        from apps.films.youtube_scraper import build_search_queries, scrape_youtube_video_id
        
        unique_queries = build_search_queries(title, year)

        cache_key_base = f"youtube_trailer_{title}_{year}"
        cache_key = f"yt_trailer_{hashlib.md5(cache_key_base.encode()).hexdigest()}"
        
        cached_url = cache.get(cache_key)
        if cached_url is not None:
            logger.debug(f"Trailer dari cache untuk '{title}'")
            return cached_url
        
        for query in unique_queries:
            video_id = None
            
            if self.is_configured():
                try:
                    params = {
                        "part": "snippet",
                        "q": query,
                        "type": "video",
                        "maxResults": 1,
                        "order": "relevance",
                        "key": self.api_key,
                        "relevanceLanguage": "en"
                    }
                    response = requests.get(f"{self.base_url}/search", params=params, timeout=10)
                    if response.status_code == 200:
                        data = response.json()
                        items = data.get("items", [])
                        if items: video_id = items[0].get("id", {}).get("videoId")
                    else:
                        logger.warning(f"YouTube Data API returned status {response.status_code}. Falling back to scraping...")
                except Exception as api_err:
                    logger.error(f"YouTube Data API exception untuk '{query}': {str(api_err)}")
            
            if not video_id:
                video_id = scrape_youtube_video_id(query)
            
            if video_id:
                trailer_url = f"https://www.youtube.com/watch?v={video_id}"
                cache.set(cache_key, trailer_url, self.cache_timeout)
                logger.info(f"Trailer found untuk '{title}': {trailer_url}")
                return trailer_url
        
        import urllib.parse
        search_query = f"{title} {year or ''} trailer".strip()
        search_url = f"https://www.youtube.com/results?search_query={urllib.parse.quote(search_query)}"
        cache.set(cache_key, search_url, self.cache_timeout)
        logger.warning(f"Trailer tidak ditemukan untuk '{title}' setelah mencoba semua query. Menggunakan link pencarian.")
        return search_url

