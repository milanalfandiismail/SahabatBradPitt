# Menggunakan Python:3.10-slim agar ukurannya ringan
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Buat direktori kerja di dalam container
WORKDIR /app

# Install system dependencies yang mungkin dibutuhkan
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy file requirements.txt
COPY requirements.txt /app/

# Install library Python
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy seluruh source code ke dalam container
COPY . /app/

# Kumpulkan file statis
RUN python manage.py collectstatic --noinput

# Buka port 8000
EXPOSE 8000

# Jalankan Gunicorn saat container dijalankan
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
