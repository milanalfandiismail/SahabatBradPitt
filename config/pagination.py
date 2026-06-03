from rest_framework.pagination import PageNumberPagination

class FlexiblePagination(PageNumberPagination):
    """
    Kelas pagination kustom yang mendukung parameter query 'page_size'
    dengan batas maksimum (max_page_size) sebesar 100 untuk menghindari
    overload database.
    """
    page_size_query_param = 'page_size'
    max_page_size = 100
