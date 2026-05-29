from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.films.models import Film, FilmImage
import os
import tempfile
from django.conf import settings

class FilmImageTests(APITestCase):
    def setUp(self):
        # Create users
        self.admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='password123'
        )
        self.regular_user = User.objects.create_user(
            username='user',
            email='user@example.com',
            password='password123'
        )
        
        # Create a film
        self.film = Film.objects.create(
            title="Test Movie",
            synopsis="A test film synopsis.",
            release_year=2026,
            duration=120,
            tmdb_popularity=8.5,
            avg_rating=7.5,
            status='published'
        )
        
        # Paths for tests
        self.post_url = reverse('film-manage-images-post', kwargs={'pk': self.film.pk})

    def test_anonymous_and_regular_user_cannot_upload(self):
        # Anonymous user
        response = self.client.post(self.post_url, {})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Regular user
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(self.post_url, {})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_upload_valid_image(self):
        self.client.force_authenticate(user=self.admin_user)
        
        # Construct a simple small image file
        image_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82'
        uploaded_image = SimpleUploadedFile("backdrop.png", image_content, content_type="image/png")
        
        response = self.client.post(self.post_url, {'image': uploaded_image}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('file_path', response.data)
        self.assertTrue(response.data['file_path'].startswith('/media/films/backdrops/'))
        
        # Verify db record
        self.assertEqual(FilmImage.objects.filter(film=self.film).count(), 1)
        img_record = FilmImage.objects.first()
        self.assertEqual(img_record.image_type, 'backdrop')
        self.assertEqual(img_record.file_path, response.data['file_path'])
        
        # Cleanup file after test
        storage_path = img_record.file_path.replace('/media/', '', 1)
        full_path = os.path.join(settings.MEDIA_ROOT, storage_path)
        if os.path.exists(full_path):
            os.remove(full_path)

    def test_upload_invalid_file_type(self):
        self.client.force_authenticate(user=self.admin_user)
        
        # Try uploading a .txt file disguised as png/text
        uploaded_file = SimpleUploadedFile("test.txt", b"some text", content_type="text/plain")
        response = self.client.post(self.post_url, {'image': uploaded_file}, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_upload_oversized_file(self):
        self.client.force_authenticate(user=self.admin_user)
        
        # Oversized file > 5MB (e.g. 5.1 MB)
        large_content = b'\x00' * (5 * 1024 * 1024 + 100)
        uploaded_file = SimpleUploadedFile("huge.jpg", large_content, content_type="image/jpeg")
        response = self.client.post(self.post_url, {'image': uploaded_file}, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_admin_can_delete_image(self):
        # First, pre-populate a FilmImage
        film_image = FilmImage.objects.create(
            film=self.film,
            file_path="/media/films/backdrops/mock-uuid.jpg",
            image_type="backdrop"
        )
        
        # Ensure file exists for deletion cleanup
        full_dir = os.path.join(settings.MEDIA_ROOT, 'films', 'backdrops')
        os.makedirs(full_dir, exist_ok=True)
        full_file_path = os.path.join(full_dir, 'mock-uuid.jpg')
        with open(full_file_path, 'wb') as f:
            f.write(b'dummy content')

        delete_url = reverse('film-manage-images-delete', kwargs={'pk': self.film.pk, 'image_id': film_image.pk})

        # Regular user cannot delete
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.delete(delete_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Admin can delete
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(delete_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify db record is deleted
        self.assertFalse(FilmImage.objects.filter(id=film_image.pk).exists())
        # Verify physical file is deleted
        self.assertFalse(os.path.exists(full_file_path))
