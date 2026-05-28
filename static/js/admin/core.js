/**
 * admin/core.js
 * Handles: Auth check, view toggle system, shared state.
 */
// Shared state
let currentUser = null;
let genresList = [];
let manageCurrentPage = 1;
let actorsCurrentPage = 1;
let selectedFilmId = null;
let selectedActorId = null;
let selectedUserId = null;
let currentFilmData = null;
let rejectModalFilmId = null;
let rejectModalType = 'film';
let activeGalleryImages = [];
let stagedImageDeletions = [];
let actorsSearchQuery = "";
let allActorsList = [];
let selectedCastData = [];
let selectedActorForCast = null;

document.addEventListener("DOMContentLoaded", function () {
    const loadingShield = document.getElementById('admin-loading-shield');
    const accessDenied = document.getElementById('admin-access-denied');



    fetch('/api/auth/me/', {
        credentials: 'same-origin'
    })
    .then(res => {
        if (!res.ok) throw new Error("Otorisasi gagal");
        return res.json();
    })
    .then(data => {
        currentUser = data;
        if (data.is_staff || data.is_superuser) {
            loadingShield.classList.add('hidden');

            if (data.is_superuser) {
                document.getElementById('sidebar-approvals-btn').classList.remove('hidden');
                document.getElementById('sidebar-users-btn').classList.remove('hidden');
            }
            
            const usernameEl = document.getElementById('active-username');
            if (usernameEl) {
                usernameEl.textContent = `Welcome, @${data.username}`;
                usernameEl.classList.remove('hidden');
            }

            // Initialize modules
            const genresPromise = fetchGenres();
            fetchStats();
            fetchFilms(1);
            fetchActors(1);
            if (typeof initFestivals === 'function') initFestivals();
            fetchAllActorsForCast();
            if (data.is_superuser) fetchUsers();

            // Check for ?edit= URL parameter
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('edit')) {
                const editFilmId = parseInt(urlParams.get('edit'));
                if (editFilmId) {
                    showPrimarySection('movies');
                    genresPromise.then(() => openEditor(editFilmId));
                }
            }
        } else {
            loadingShield.classList.add('hidden');
            document.getElementById('admin-access-denied')?.classList.remove('hidden');
        }
    })
    .catch(err => {
        console.error('Auth check failed:', err);
        loadingShield.classList.add('hidden');
        // Session might be expired — show access denied message
        const deniedEl = document.getElementById('admin-access-denied');
        if (deniedEl) {
            deniedEl.classList.remove('hidden');
            const msg = deniedEl.querySelector('p');
            if (msg) msg.textContent = 'Autentikasi gagal. Sesi mungkin expired. Silakan login ulang.';
        }
    });

    // Sidebar event listeners
    document.getElementById('sidebar-dashboard-btn').addEventListener('click', () => showPrimarySection('dashboard'));
    document.getElementById('sidebar-movies-btn').addEventListener('click', () => showPrimarySection('movies'));
    document.getElementById('sidebar-festivals-btn').addEventListener('click', () => showPrimarySection('festivals'));
    document.getElementById('sidebar-actors-btn').addEventListener('click', () => showPrimarySection('actors'));
    document.getElementById('sidebar-genres-btn').addEventListener('click', () => showPrimarySection('genres'));
    document.getElementById('sidebar-approvals-btn').addEventListener('click', () => showPrimarySection('approvals'));
    document.getElementById('sidebar-users-btn').addEventListener('click', () => showPrimarySection('users'));

    // Close modals on overlay click
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => btn.closest('[id$="-modal"]').classList.add('hidden'));
    });
});

function showPrimarySection(sectionId) {
    const sections = ['dashboard', 'movies', 'festivals', 'actors', 'genres', 'approvals', 'users'];
    const btns = ['dashboard', 'movies', 'festivals', 'actors', 'genres', 'approvals', 'users'];

    // Hide all sections using both methods for compatibility
    sections.forEach(id => {
        const sect = document.getElementById(`section-${id}`);
        if (sect) sect.style.display = 'none';
        const adminSect = document.getElementById(`admin-${id}`);
        if (adminSect) adminSect.style.display = 'none';
    });

    // Failsafe: Pastikan semua editor disembunyikan saat pindah tab agar kembali ke mode 'manage'
    document.getElementById('view-editor')?.classList.add('hidden');
    document.getElementById('view-manage')?.classList.remove('hidden');
    
    document.getElementById('view-actor-editor')?.classList.add('hidden');
    document.getElementById('view-actors-manage')?.classList.remove('hidden');
    
    document.getElementById('view-festival-editor')?.classList.add('hidden');
    document.getElementById('view-festivals-manage')?.classList.remove('hidden');
    
    document.getElementById('view-genre-editor')?.classList.add('hidden');
    document.getElementById('view-genres-manage')?.classList.remove('hidden');

    btns.forEach(id => {
        const btn = document.getElementById(`sidebar-${id}-btn`);
        if (btn) {
            btn.classList.remove('bg-[#715A5A]', 'text-white');
            btn.classList.add('text-stone-400');
        }
    });

    // Show the active section using style.display
    const targetSection = document.getElementById(`section-${sectionId}`) || document.getElementById(`admin-${sectionId}`);
    if (targetSection) targetSection.style.display = 'flex';

    const activeBtn = document.getElementById(`sidebar-${sectionId}-btn`);
    if (activeBtn) {
        activeBtn.classList.add('bg-[#715A5A]', 'text-white');
        activeBtn.classList.remove('text-stone-400');
    }

    if (sectionId === 'dashboard') fetchStats();
    else if (sectionId === 'movies') showMoviesSubView('manage');
    else if (sectionId === 'actors') fetchActors(actorsCurrentPage);
    else if (sectionId === 'festivals' && typeof fetchFestivals === 'function') fetchFestivals(1);
    else if (sectionId === 'genres') fetchGenres();
    else if (sectionId === 'approvals') {
        loadPendingFilmsForApproval();
        loadPendingActorsForApproval();
    }
    else if (sectionId === 'users') fetchUsers();
}

function showMoviesSubView(subview) {
    const viewManage = document.getElementById('view-manage');
    const viewEditor = document.getElementById('view-editor');
    viewManage.classList.add('hidden');
    viewEditor.classList.add('hidden');

    if (subview === 'manage') {
        viewManage.classList.remove('hidden');
        fetchFilms(manageCurrentPage);
    } else if (subview === 'editor') {
        viewEditor.classList.remove('hidden');
    }
}
