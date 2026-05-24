from django.db import models
from django.contrib.auth.models import User

class RecommendationLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='recommendation_logs')
    
    # Kuesioner pilihan user (mood, genres, era, duration, min_rating)
    input_data = models.JSONField()
    
    # Hasil kalkulasi TOPSIS (5 film rekomendasi + alasan + skor)
    results = models.JSONField()
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        username = self.user.username if self.user else "Anonymous"
        return f"Log Rekomendasi oleh {username} pada {self.created_at.strftime('%Y-%m-%d %H:%M')}"
