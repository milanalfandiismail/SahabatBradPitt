// ---- Trailer Modal ----
function extractYouTubeVideoId(url) {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.*&v=)([a-zA-Z0-9_-]{11})/,
        /youtu\.be\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/
    ];
    for (let p of patterns) { const m = url.trim().match(p); if (m && m[1]) return m[1]; }
    return null;
}

window.openTrailerModal = function(trailerUrl) {
    const modal = document.getElementById('trailer-modal');
    const iframe = document.getElementById('trailer-iframe');
    const container = iframe ? iframe.parentElement : null;
    const videoId = extractYouTubeVideoId(trailerUrl);
    if (videoId && container) {
        const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&vq=hd1080&rel=0&fs=1&modestbranding=1&origin=${encodeURIComponent(window.location.origin)}&enablejsapi=1`;
        container.innerHTML = `<iframe id="trailer-iframe" class="absolute inset-0 w-full h-full" src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
        modal.classList.remove('hidden');
        modal.classList.add('animate-scale-in');
        document.body.style.overflow = 'hidden';
    } else if (trailerUrl && trailerUrl.startsWith('http')) {
        window.open(trailerUrl, '_blank');
    } else {
        if(window.showToast) window.showToast('Format URL trailer tidak valid.', 'error');
    }
}

window.closeTrailerModal = function() {
    const modal = document.getElementById('trailer-modal');
    const iframe = document.getElementById('trailer-iframe');
    if (modal) modal.classList.add('hidden'); 
    if (iframe && iframe.parentElement) {
        iframe.parentElement.innerHTML = `<iframe id="trailer-iframe" class="absolute inset-0 w-full h-full" src="" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
    }
    document.body.style.overflow = 'auto';
}

// ---- Gallery Lightbox ----
let currentGalleryIndex = 0;

window.openGalleryLightbox = function(index) {
    if (!window.galleryImages || !window.galleryImages.length) return;
    currentGalleryIndex = index;
    const modal = document.getElementById('gallery-modal');
    document.getElementById('gallery-modal-img').src = window.galleryImages[currentGalleryIndex];
    _updateGalleryCounter();
    if(modal) {
        modal.classList.remove('hidden');
        modal.classList.add('animate-scale-in');
    }
    document.body.style.overflow = 'hidden';
}

window.closeGalleryLightbox = function() {
    const modal = document.getElementById('gallery-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function _updateGalleryCounter() {
    const cur = document.getElementById('gallery-current');
    const tot = document.getElementById('gallery-total');
    if (cur) cur.textContent = currentGalleryIndex + 1;
    if (tot) tot.textContent = window.galleryImages.length;
}

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById('trailer-modal-close')?.addEventListener('click', window.closeTrailerModal);
    document.getElementById('trailer-modal')?.addEventListener('click', e => { if (e.target === e.currentTarget) window.closeTrailerModal(); });
    document.getElementById('gallery-modal-close')?.addEventListener('click', window.closeGalleryLightbox);
    document.getElementById('gallery-modal')?.addEventListener('click', e => { if (e.target === e.currentTarget) window.closeGalleryLightbox(); });
    document.getElementById('gallery-prev')?.addEventListener('click', () => {
        if (!window.galleryImages) return;
        currentGalleryIndex = (currentGalleryIndex - 1 + window.galleryImages.length) % window.galleryImages.length;
        document.getElementById('gallery-modal-img').src = window.galleryImages[currentGalleryIndex];
        _updateGalleryCounter();
    });
    document.getElementById('gallery-next')?.addEventListener('click', () => {
        if (!window.galleryImages) return;
        currentGalleryIndex = (currentGalleryIndex + 1) % window.galleryImages.length;
        document.getElementById('gallery-modal-img').src = window.galleryImages[currentGalleryIndex];
        _updateGalleryCounter();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            const tm = document.getElementById('trailer-modal');
            const gm = document.getElementById('gallery-modal');
            if (tm && !tm.classList.contains('hidden')) window.closeTrailerModal();
            if (gm && !gm.classList.contains('hidden')) window.closeGalleryLightbox();
        }
    });
});
