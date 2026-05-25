/**
 * RBAC Integration Helper
 * Usage guide and initialization for the admin_films.html template
 */

// Initialize managers when page loads
let rbacManager, posterUploadManager, approvalManager;

function initializeRBACManagers() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        console.error('No auth token found');
        return;
    }

    rbacManager = new RBACManager(token);
    posterUploadManager = new PosterUploadManager(token);
    approvalManager = new ApprovalManager(token);

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
                (film) => handleRejectFilm(film)
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

    const container = document.getElementById('pending-actors-list');
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
                (actor) => handleRejectActor(actor)
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
    const filmsContent = document.getElementById('approval-films');
    const actorsContent = document.getElementById('approval-actors');
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
