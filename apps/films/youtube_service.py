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
        Extract YouTube trailer URL dari TMDB videos array.
        
        Args:
            videos (list): Videos array dari TMDB API
        
        Returns:
            str: YouTube video URL atau empty string
        """
        if not videos:
            return ""
        
        for video in videos:
            if video.get("type") == "Trailer" and video.get("site") == "YouTube":
                video_id = video.get("key")
                if video_id:
                    return f"https://www.youtube.com/watch?v={video_id}"
        
        return ""
    
    def _search_youtube(self, title, year=None):
        """
        Search trailer di YouTube menggunakan YouTube Data API dengan fallback scraping dan parsing judul alternatif (e.g. Korea).
        
        Args:
            title (str): Judul film
            year (int, optional): Tahun rilis film
        
        Returns:
            str: YouTube video URL atau empty string
        """
        import re
        
        # 1. Parse main title and alternative title in parentheses (e.g. Korean)
        alt_title = None
        main_title = title
        match = re.search(r'\(([^)]+)\)', title)
        if match:
            alt_title = match.group(1).strip()
            main_title = re.sub(r'\([^)]+\)', '', title).strip()

        # Build list of queries to try in order
        queries = []
        
        # Query 1: Full title including parentheses
        q1 = f"{title} official trailer"
        if year:
            q1 += f" {year}"
        queries.append(q1)

        # Query 2: Alternative title only (highly effective for Korean films)
        if alt_title:
            q2 = f"{alt_title} trailer"
            if year:
                q2 += f" {year}"
            queries.append(q2)

        # Query 3: Main title only
        q3 = f"{main_title} official trailer"
        if year:
            q3 += f" {year}"
        queries.append(q3)

        # Remove duplicates while preserving order
        unique_queries = []
        for q in queries:
            if q not in unique_queries:
                unique_queries.append(q)

        # Create hashed cache key to avoid memcached compatibility issues
        cache_key_base = f"youtube_trailer_{title}_{year}"
        cache_key = f"yt_trailer_{hashlib.md5(cache_key_base.encode()).hexdigest()}"
        
        # Check cache first
        cached_url = cache.get(cache_key)
        if cached_url is not None:
            logger.debug(f"Trailer dari cache untuk '{title}'")
            return cached_url
        
        # Try queries one by one
        for query in unique_queries:
            video_id = None
            
            # First, try official YouTube Data API if configured
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
                    response = requests.get(
                        f"{self.base_url}/search",
                        params=params,
                        timeout=10
                    )
                    if response.status_code == 200:
                        data = response.json()
                        items = data.get("items", [])
                        if items:
                            video_id = items[0].get("id", {}).get("videoId")
                    else:
                        logger.warning(f"YouTube Data API returned status {response.status_code} untuk '{query}'. Falling back to scraping...")
                except Exception as api_err:
                    logger.error(f"YouTube Data API exception untuk '{query}': {str(api_err)}")
            
            # Second, fall back to public YouTube scraping if API is not configured, failed, or returned no results
            if not video_id:
                try:
                    url = f"https://www.youtube.com/results?search_query={requests.utils.quote(query)}"
                    headers = {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
                    }
                    response = requests.get(url, headers=headers, timeout=10)
                    if response.status_code == 200:
                        # Extract video ID using regex patterns
                        ids = re.findall(r'"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"', response.text)
                        if ids:
                            video_id = ids[0]
                        else:
                            ids2 = re.findall(r'/watch\?v=([a-zA-Z0-9_-]{11})', response.text)
                            if ids2:
                                video_id = ids2[0]
                except Exception as scrape_err:
                    logger.error(f"YouTube scraping exception untuk '{query}': {str(scrape_err)}")
            
            # If a video was found, cache it and return it
            if video_id:
                trailer_url = f"https://www.youtube.com/watch?v={video_id}"
                cache.set(cache_key, trailer_url, self.cache_timeout)
                logger.info(f"Trailer found untuk '{title}' dengan query '{query}': {trailer_url}")
                return trailer_url
        
        # Cache empty result if all queries failed
        cache.set(cache_key, "", self.cache_timeout)
        logger.warning(f"Trailer tidak ditemukan untuk '{title}' setelah mencoba semua query.")
        return ""
