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

function initCore() {
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
                if (loadingShield) {
                    loadingShield.classList.add('hidden');
                }

                if (data.is_superuser) {
                    document.getElementById('sidebar-approvals-btn')?.classList.remove('hidden');
                    document.getElementById('sidebar-users-btn')?.classList.remove('hidden');
                    document.getElementById('drawer-approvals-btn')?.classList.remove('hidden');
                    document.getElementById('drawer-users-btn')?.classList.remove('hidden');
                }

                const usernameEl = document.getElementById('active-username');
                if (usernameEl) {
                    usernameEl.textContent = `Welcome, @${data.username}`;
                    usernameEl.classList.remove('hidden');
                }

                // Initialize modules with try/catch to prevent cascading failures
                let genresPromise = null;
                try {
                    if (typeof fetchGenres === 'function') {
                        genresPromise = fetchGenres();
                    }
                } catch (e) {/* ignore */}

                try {
                    if (typeof fetchStats === 'function') {
                        fetchStats();
                    }
                } catch (e) {/* ignore */}

                try {
                    if (typeof fetchFilms === 'function') {
                        fetchFilms(1);
                    }
                } catch (e) {/* ignore */}

                try {
                    if (typeof fetchActors === 'function') {
                        fetchActors(1);
                    }
                } catch (e) {/* ignore */}

                try {
                    if (typeof initFestivals === 'function') {
                        initFestivals();
                    }
                } catch (e) {/* ignore */}

                try {
                    if (typeof fetchAllActorsForCast === 'function') {
                        fetchAllActorsForCast();
                    }
                } catch (e) {/* ignore */}

                try {
                    if (data.is_superuser) {
                        if (typeof fetchUsers === 'function') {
                            fetchUsers();
                        }
                    }
                } catch (e) {/* ignore */}

                // Check for ?edit= URL parameter
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.has('edit')) {
                    const editFilmId = parseInt(urlParams.get('edit'));
                    if (editFilmId) {
                        showPrimarySection('movies');
                        if (genresPromise) {
                            genresPromise.then(() => {
                                if (typeof openEditor === 'function') {
                                    openEditor(editFilmId);
                                }
                            });
                        }
                    }
                }
            } else {
                if (loadingShield) loadingShield.classList.add('hidden');
                const deniedEl = document.getElementById('admin-access-denied');
                if (deniedEl) deniedEl.classList.remove('hidden');
            }
        })
        .catch(err => {
            if (loadingShield) loadingShield.classList.add('hidden');
            const deniedEl = document.getElementById('admin-access-denied');
            if (deniedEl) {
                deniedEl.classList.remove('hidden');
                const msg = deniedEl.querySelector('p');
                if (msg) msg.textContent = 'Autentikasi gagal. Sesi mungkin expired. Silakan login ulang.';
            }
        });

    // Sidebar event listeners
    document.getElementById('sidebar-dashboard-btn')?.addEventListener('click', () => {
        showPrimarySection('dashboard');
    });
    document.getElementById('sidebar-movies-btn')?.addEventListener('click', () => {
        showPrimarySection('movies');
    });
    document.getElementById('sidebar-festivals-btn')?.addEventListener('click', () => {
        showPrimarySection('festivals');
    });
    document.getElementById('sidebar-actors-btn')?.addEventListener('click', () => {
        showPrimarySection('actors');
    });
    document.getElementById('sidebar-genres-btn')?.addEventListener('click', () => {
        showPrimarySection('genres');
    });
    document.getElementById('sidebar-approvals-btn')?.addEventListener('click', () => {
        showPrimarySection('approvals');
    });
    document.getElementById('sidebar-users-btn')?.addEventListener('click', () => {
        showPrimarySection('users');
    });

    // Mobile Drawer Logic & Event Listeners
    const drawer = document.getElementById("mobile-admin-drawer");
    const drawerContent = document.getElementById("mobile-admin-drawer-content");
    const openBtn = document.getElementById("mobile-admin-menu-btn");
    const closeBtn = document.getElementById("close-admin-drawer-btn");

    function openDrawer() {
        if (drawer && drawerContent) {
            drawer.classList.remove("hidden");
            requestAnimationFrame(() => {
                drawer.classList.remove("opacity-0");
                drawer.classList.add("opacity-100");
                drawerContent.classList.remove("-translate-x-full");
                drawerContent.classList.add("translate-x-0");
            });
        }
    }

    function closeDrawer() {
        if (drawer && drawerContent) {
            drawer.classList.add("opacity-0");
            drawer.classList.remove("opacity-100");
            drawerContent.classList.add("-translate-x-full");
            drawerContent.classList.remove("translate-x-0");

            setTimeout(() => {
                drawer.classList.add("hidden");
            }, 300);
        }
    }

    if (openBtn) {
        openBtn.addEventListener("click", (e) => {
            e.preventDefault();
            openDrawer();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener("click", (e) => {
            e.preventDefault();
            closeDrawer();
        });
    }

    if (drawer) {
        drawer.addEventListener("click", function (e) {
            if (e.target === drawer) {
                closeDrawer();
            }
        });
    }

    document.getElementById('drawer-dashboard-btn')?.addEventListener('click', () => {
        showPrimarySection('dashboard');
        closeDrawer();
    });
    document.getElementById('drawer-movies-btn')?.addEventListener('click', () => {
        showPrimarySection('movies');
        closeDrawer();
    });
    document.getElementById('drawer-festivals-btn')?.addEventListener('click', () => {
        showPrimarySection('festivals');
        closeDrawer();
    });
    document.getElementById('drawer-actors-btn')?.addEventListener('click', () => {
        showPrimarySection('actors');
        closeDrawer();
    });
    document.getElementById('drawer-genres-btn')?.addEventListener('click', () => {
        showPrimarySection('genres');
        closeDrawer();
    });
    document.getElementById('drawer-approvals-btn')?.addEventListener('click', () => {
        showPrimarySection('approvals');
        closeDrawer();
    });
    document.getElementById('drawer-users-btn')?.addEventListener('click', () => {
        showPrimarySection('users');
        closeDrawer();
    });

    // Close modals on overlay click
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => btn.closest('[id$="-modal"]').classList.add('hidden'));
    });
}

// BULLETPROOF INITIALIZATION: Run on DOMContentLoaded or immediately if DOM already parsed
if (document.readyState !== "loading") {
    initCore();
} else {
    document.addEventListener("DOMContentLoaded", () => {
        initCore();
    });
}

function showPrimarySection(sectionId) {
    const sections = ['dashboard', 'movies', 'festivals', 'actors', 'genres', 'approvals', 'users'];
    const btns = ['dashboard', 'movies', 'festivals', 'actors', 'genres', 'approvals', 'users'];

    // Hide all sections
    sections.forEach(id => {
        const sect = document.getElementById(`section-${id}`);
        if (sect) {
            sect.style.display = 'none';
            sect.classList.add('hidden');
        }
        const adminSect = document.getElementById(`admin-${id}`);
        if (adminSect) {
            adminSect.style.display = 'none';
            adminSect.classList.add('hidden');
        }
    });

    // Failsafe: hide all editors
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
        const drawerBtn = document.getElementById(`drawer-${id}-btn`);
        if (drawerBtn) {
            drawerBtn.classList.remove('bg-[#715A5A]', 'text-white');
            drawerBtn.classList.add('text-stone-400');
        }
    });

    // Show the active section
    const targetSection = document.getElementById(`section-${sectionId}`) || document.getElementById(`admin-${sectionId}`);
    if (targetSection) {
        targetSection.style.display = 'flex';
        targetSection.classList.remove('hidden');
    }

    const activeBtn = document.getElementById(`sidebar-${sectionId}-btn`);
    if (activeBtn) {
        activeBtn.classList.add('bg-[#715A5A]', 'text-white');
        activeBtn.classList.remove('text-stone-400');
    }

    const activeDrawerBtn = document.getElementById(`drawer-${sectionId}-btn`);
    if (activeDrawerBtn) {
        activeDrawerBtn.classList.add('bg-[#715A5A]', 'text-white');
        activeDrawerBtn.classList.remove('text-stone-400');
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
