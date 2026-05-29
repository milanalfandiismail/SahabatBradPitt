import time
import threading

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
            self.requests = [req_time for req_time in self.requests if now - req_time < self.time_window]
            
            if len(self.requests) >= self.max_requests:
                sleep_time = self.time_window - (now - self.requests[0]) + 0.1
                time.sleep(sleep_time)
                self.requests = []
            
            self.requests.append(now)
