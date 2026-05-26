import re
import requests
import logging

logger = logging.getLogger(__name__)

def build_search_queries(title, year):
    """
    Build list of queries to try in order, parsing alternative titles.
    """
    alt_title = None
    main_title = title
    match = re.search(r'\(([^)]+)\)', title)
    if match:
        alt_title = match.group(1).strip()
        main_title = re.sub(r'\([^)]+\)', '', title).strip()

    queries = []
    
    if alt_title:
        q1 = f"{alt_title} trailer"
        if year: q1 += f" {year}"
        queries.append(q1)

    q2 = f"{title} official trailer"
    if year: q2 += f" {year}"
    queries.append(q2)

    q3 = f"{main_title} official trailer"
    if year: q3 += f" {year}"
    queries.append(q3)

    unique_queries = []
    for q in queries:
        if q not in unique_queries:
            unique_queries.append(q)
            
    return unique_queries


def scrape_youtube_video_id(query):
    """
    Search trailer di YouTube melalui public scraping (fallback jika API gagal/tidak di-set).
    """
    try:
        url = f"https://www.youtube.com/results?search_query={requests.utils.quote(query)}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
        }
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            ids = re.findall(r'"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"', response.text)
            if ids:
                return ids[0]
            ids2 = re.findall(r'/watch\?v=([a-zA-Z0-9_-]{11})', response.text)
            if ids2:
                return ids2[0]
    except Exception as scrape_err:
        logger.error(f"YouTube scraping exception untuk '{query}': {str(scrape_err)}")
    return None
