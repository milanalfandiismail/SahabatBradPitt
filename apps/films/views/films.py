from apps.films.views.films_base import FilmViewSetBase
from apps.films.views.films_actions import FilmActionsMixin
from apps.films.views.films_approval import FilmApprovalMixin
from apps.films.views.films_gallery import FilmGalleryMixin

class FilmViewSet(FilmApprovalMixin, FilmActionsMixin, FilmGalleryMixin, FilmViewSetBase):
    """
    ViewSet utama untuk entitas Film. (Fasad)
    Menggabungkan fungsionalitas dari:
    - FilmViewSetBase: CRUD dasar, filter, queryset, permissions
    - FilmApprovalMixin: Proses persetujuan (submit_approval, approve, reject)
    - FilmActionsMixin: Aksi kustom (sync, stats, similar)
    - FilmGalleryMixin: Manajemen galeri gambar (manage_images_post, manage_images_delete)
    """
    pass


