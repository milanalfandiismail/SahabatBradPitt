/**
 * RBAC Integration Helper
 * Usage guide and initialization for the admin_films.html template
 */

// Initialize managers when page loads
let rbacManager, posterUploadManager, approvalManager;

function initializeRBACManagers() {
    rbacManager = new RBACManager();
    posterUploadManager = new PosterUploadManager();
    approvalManager = new ApprovalManager();

    // Wait for role initialization
    setTimeout(() => {
        if (rbacManager.isSuperAdmin()) {
            showApprovalsSection();
        }
    }, 500);
}

/**
 * Show approvals section for Superadmin users
 */
function showApprovalsSection() {
    const approvalsNav = document.getElementById('sidebar-approvals-btn');
    if (approvalsNav) {
        approvalsNav.classList.remove('hidden');
    }
}

/**
 * Handle poster upload in film editor
 * Usage: Call this when user selects a poster file
 * 
 * Example HTML:
 * <input type="file" id="film-poster-input" accept="image/*" />
 * <button onclick="handlePosterUpload(filmId)">Upload Poster</button>
 */
async function handlePosterUpload(filmId) {
    const fileInput = document.getElementById('film-poster-input');
    if (!fileInput || !fileInput.files.length) {
        showToast('Pilih file poster terlebih dahulu', 'warning');
        return;
    }

    const file = fileInput.files[0];

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
        showToast('Ukuran file melebihi batas 5MB', 'error');
        return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        showToast('Format file harus JPG, PNG, atau WebP', 'error');
        return;
    }

    try {
        showToast('Mengunggah poster...', 'info');
        const result = await posterUploadManager.uploadPoster(filmId, file);
        showToast('Poster berhasil diunggah!', 'success');
        fileInput.value = ''; // Clear input
        
        // Refresh film data or update UI
        if (window.refreshFilmData) {
            window.refreshFilmData(filmId);
        }
    } catch (error) {
        showToast(error.message || 'Gagal mengunggah poster', 'error');
    }
}

/**
 * Handle backdrop upload in film editor
 * Similar to handlePosterUpload but for backdrops
 */
async function handleBackdropUpload(filmId) {
    const fileInput = document.getElementById('film-backdrop-input');
    if (!fileInput || !fileInput.files.length) {
        showToast('Pilih file backdrop terlebih dahulu', 'warning');
        return;
    }

    const file = fileInput.files[0];

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
        showToast('Ukuran file melebihi batas 5MB', 'error');
        return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        showToast('Format file harus JPG, PNG, atau WebP', 'error');
        return;
    }

    try {
        showToast('Mengunggah backdrop...', 'info');
        const result = await posterUploadManager.uploadBackdrop(filmId, file);
        showToast('Backdrop berhasil diunggah!', 'success');
        fileInput.value = ''; // Clear input
        
        // Refresh film data or update UI
        if (window.refreshFilmData) {
            window.refreshFilmData(filmId);
        }
    } catch (error) {
        showToast(error.message || 'Gagal mengunggah backdrop', 'error');
    }
}

/**
 * Load and display pending films for approval
 * Usage: Call this when Superadmin navigates to Approvals section
 */
async function loadPendingFilmsForApproval() {
    if (!rbacManager.isSuperAdmin()) {
        showToast('Anda tidak memiliki akses ke fitur ini', 'error');
        return;
    }

    const container = document.getElementById('pending-films-container');
    if (!container) return;

    try {
        container.innerHTML = '<p class="text-center text-stone-400">Memuat data...</p>';
        const films = await approvalManager.fetchPendingFilms();

        if (films.length === 0) {
            container.innerHTML = '<p class="text-center text-stone-400">Tidak ada film yang menunggu persetujuan</p>';
            return;
        }

        container.innerHTML = '';
        films.forEach(film => {
            const card = ApprovalUIComponents.createFilmCard(
                film,
                (film) => handleApproveFilm(film),
                (film) => handleRejectFilm(film),
                (film) => showFilmApprovalDetail(film)
            );
            container.appendChild(card);
        });
    } catch (error) {
        showToast(error.message || 'Gagal memuat data film', 'error');
        container.innerHTML = '<p class="text-center text-rose-400">Gagal memuat data</p>';
    }
}

/**
 * Load and display pending actors for approval
 */
async function loadPendingActorsForApproval() {
    if (!rbacManager.isSuperAdmin()) {
        showToast('Anda tidak memiliki akses ke fitur ini', 'error');
        return;
    }

    const container = document.getElementById('pending-actors-container');
    if (!container) return;

    try {
        container.innerHTML = '<p class="text-center text-stone-400">Memuat data...</p>';
        const actors = await approvalManager.fetchPendingActors();

        if (actors.length === 0) {
            container.innerHTML = '<p class="text-center text-stone-400">Tidak ada aktor yang menunggu persetujuan</p>';
            return;
        }

        container.innerHTML = '';
        actors.forEach(actor => {
            const card = ApprovalUIComponents.createActorCard(
                actor,
                (actor) => handleApproveActor(actor),
                (actor) => handleRejectActor(actor),
                (actor) => showActorApprovalDetail(actor)
            );
            container.appendChild(card);
        });
    } catch (error) {
        showToast(error.message || 'Gagal memuat data aktor', 'error');
        container.innerHTML = '<p class="text-center text-rose-400">Gagal memuat data</p>';
    }
}

/**
 * Handle film approval
 */
async function handleApproveFilm(film) {
    if (!confirm(`Setujui film "${film.title}"?`)) return;

    try {
        showToast('Menyetujui film...', 'info');
        await approvalManager.approveFilm(film.id);
        showToast(`Film "${film.title}" berhasil disetujui!`, 'success');
        loadPendingFilmsForApproval(); // Refresh list
    } catch (error) {
        showToast(error.message || 'Gagal menyetujui film', 'error');
    }
}

/**
 * Handle film rejection
 */
async function handleRejectFilm(film) {
    const modal = ApprovalUIComponents.createRejectionModal(
        `Tolak Film: ${film.title}`,
        async (reason) => {
            try {
                showToast('Menolak film...', 'info');
                await approvalManager.rejectFilm(film.id, reason);
                showToast(`Film "${film.title}" berhasil ditolak!`, 'success');
                loadPendingFilmsForApproval(); // Refresh list
            } catch (error) {
                showToast(error.message || 'Gagal menolak film', 'error');
            }
        }
    );
    document.body.appendChild(modal);
}

/**
 * Handle actor approval
 */
async function handleApproveActor(actor) {
    if (!confirm(`Setujui aktor "${actor.name}"?`)) return;

    try {
        showToast('Menyetujui aktor...', 'info');
        await approvalManager.approveActor(actor.id);
        showToast(`Aktor "${actor.name}" berhasil disetujui!`, 'success');
        loadPendingActorsForApproval(); // Refresh list
    } catch (error) {
        showToast(error.message || 'Gagal menyetujui aktor', 'error');
    }
}

/**
 * Handle actor rejection
 */
async function handleRejectActor(actor) {
    const modal = ApprovalUIComponents.createRejectionModal(
        `Tolak Aktor: ${actor.name}`,
        async (reason) => {
            try {
                showToast('Menolak aktor...', 'info');
                await approvalManager.rejectActor(actor.id, reason);
                showToast(`Aktor "${actor.name}" berhasil ditolak!`, 'success');
                loadPendingActorsForApproval(); // Refresh list
            } catch (error) {
                showToast(error.message || 'Gagal menolak aktor', 'error');
            }
        }
    );
    document.body.appendChild(modal);
}

/**
 * Switch between approval tabs
 */
function showApprovalTab(tab) {
    const filmsContent = document.getElementById('approval-films-tab');
    const actorsContent = document.getElementById('approval-actors-tab');
    const tabButtons = document.querySelectorAll('.tab-btn');

    // Hide all tabs
    filmsContent?.classList.add('hidden');
    actorsContent?.classList.add('hidden');

    // Remove active state from all buttons
    tabButtons.forEach(btn => btn.classList.remove('active'));

    // Show selected tab
    if (tab === 'films') {
        filmsContent?.classList.remove('hidden');
        tabButtons[0]?.classList.add('active');
        loadPendingFilmsForApproval();
    } else if (tab === 'actors') {
        actorsContent?.classList.remove('hidden');
        tabButtons[1]?.classList.add('active');
        loadPendingActorsForApproval();
    }
}

/**
 * Delete image from film
 */
async function deleteFilmImage(filmId, imageId) {
    if (!confirm('Hapus gambar ini?')) return;

    try {
        showToast('Menghapus gambar...', 'info');
        await posterUploadManager.deleteImage(filmId, imageId);
        showToast('Gambar berhasil dihapus!', 'success');
        
        // Refresh film data
        if (window.refreshFilmData) {
            window.refreshFilmData(filmId);
        }
    } catch (error) {
        showToast(error.message || 'Gagal menghapus gambar', 'error');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeRBACManagers);

/**
 * Show Film Detail Modal
 */
function showFilmApprovalDetail(film) {
    const modal = document.getElementById('film-approval-detail-modal');
    if (!modal) return;
    
    document.getElementById('detail-film-title').textContent = film.title;
    document.getElementById('detail-film-year').textContent = film.release_year || '-';
    document.getElementById('detail-film-duration').textContent = film.duration ? `${film.duration} min` : '-';
    document.getElementById('detail-film-rating').textContent = `★ ${film.avg_rating || '0.0'}`;
    
    // Poster
    const posterImg = document.getElementById('detail-film-poster');
    let posterUrl = "/static/images/placeholder-poster.jpg";
    if (film.images && film.images.length > 0) {
        const localPoster = film.images.find(img => img.image_type === 'poster');
        if (localPoster) posterUrl = localPoster.file_path;
        else if (film.poster_path) posterUrl = film.poster_path.startsWith('http') ? film.poster_path : `https://image.tmdb.org/t/p/w500${film.poster_path}`;
    } else if (film.poster_path) {
        posterUrl = film.poster_path.startsWith('http') ? film.poster_path : `https://image.tmdb.org/t/p/w500${film.poster_path}`;
    }
    posterImg.src = posterUrl;
    
    // Genres
    let genreText = '-';
    if (film.genre_display && film.genre_display.length > 0) {
        genreText = film.genre_display.map(g => g.name || g).join(', ');
    }
    document.getElementById('detail-film-genres').textContent = genreText;
    
    // Synopsis
    document.getElementById('detail-film-synopsis').textContent = film.synopsis || 'Tidak ada sinopsis.';
    
    // Trailer
    const trailer = document.getElementById('detail-film-trailer');
    if (film.trailer_url) {
        trailer.href = film.trailer_url;
        trailer.textContent = film.trailer_url;
    } else {
        trailer.removeAttribute('href');
        trailer.textContent = 'Tidak ada trailer';
    }
    
    // Gallery
    const galleryContainer = document.getElementById('detail-film-gallery');
    galleryContainer.innerHTML = '';
    if (film.images && film.images.length > 0) {
        const backdrops = film.images.filter(img => img.image_type === 'backdrop');
        if (backdrops.length > 0) {
            backdrops.forEach(img => {
                const imgEl = document.createElement('img');
                imgEl.src = img.file_path;
                imgEl.className = 'w-full aspect-[16/9] object-cover rounded border border-white/10';
                galleryContainer.appendChild(imgEl);
            });
        } else {
            galleryContainer.innerHTML = '<span class="text-xs text-stone-500 italic">Belum ada galeri backdrop.</span>';
        }
    } else {
        galleryContainer.innerHTML = '<span class="text-xs text-stone-500 italic">Belum ada galeri backdrop.</span>';
    }
    
    // Setup close buttons
    const closeBtns = modal.querySelectorAll('.modal-close-btn');
    closeBtns.forEach(btn => btn.onclick = () => modal.classList.add('hidden'));
    
    modal.classList.remove('hidden');
}

/**
 * Show Actor Detail Modal
 */
function showActorApprovalDetail(actor) {
    const modal = document.getElementById('actor-approval-detail-modal');
    if (!modal) return;
    
    document.getElementById('detail-actor-name').textContent = actor.name;
    document.getElementById('detail-actor-native').textContent = actor.native_name || '';
    document.getElementById('detail-actor-birth').textContent = actor.birth_year || 'Unknown Year';
    document.getElementById('detail-actor-tmdb').textContent = `TMDB: ${actor.tmdb_id || '-'}`;
    
    const photoImg = document.getElementById('detail-actor-photo');
    let photoUrl = "/static/images/placeholder-poster.jpg";
    if (actor.photo_path) {
        photoUrl = actor.photo_path.startsWith('http') ? actor.photo_path : `https://image.tmdb.org/t/p/w500${actor.photo_path}`;
    }
    photoImg.src = photoUrl;
    
    document.getElementById('detail-actor-bio').textContent = actor.bio || 'Tidak ada biografi.';
    
    // Setup close buttons
    const closeBtns = modal.querySelectorAll('.modal-close-btn');
    closeBtns.forEach(btn => btn.onclick = () => modal.classList.add('hidden'));
    
    modal.classList.remove('hidden');
}

// Export for use in HTML
window.handlePosterUpload = handlePosterUpload;
window.handleBackdropUpload = handleBackdropUpload;
window.loadPendingFilmsForApproval = loadPendingFilmsForApproval;
window.loadPendingActorsForApproval = loadPendingActorsForApproval;
window.handleApproveFilm = handleApproveFilm;
window.handleRejectFilm = handleRejectFilm;
window.handleApproveActor = handleApproveActor;
window.handleRejectActor = handleRejectActor;
window.showApprovalTab = showApprovalTab;
window.deleteFilmImage = deleteFilmImage;
window.showFilmApprovalDetail = showFilmApprovalDetail;
window.showActorApprovalDetail = showActorApprovalDetail;
