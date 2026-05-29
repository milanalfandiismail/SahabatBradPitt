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

console.log("[Core] Script core.js parsed. Current readyState:", document.readyState);

function initCore() {
    console.log("[Core] initCore starting execution...");
    const loadingShield = document.getElementById('admin-loading-shield');
    const accessDenied = document.getElementById('admin-access-denied');

    console.log("[Core] Initiating auth check fetch to /api/auth/me/...");
    fetch('/api/auth/me/', {
        credentials: 'same-origin'
    })
    .then(res => {
        console.log("[Core] Auth check response status received:", res.status);
        if (!res.ok) throw new Error("Otorisasi gagal");
        return res.json();
    })
    .then(data => {
        console.log("[Core] Auth check success. User data:", data);
        currentUser = data;
        if (data.is_staff || data.is_superuser) {
            console.log("[Core] User is staff or superuser. Granting access and hiding loading shield.");
            if (loadingShield) {
                loadingShield.classList.add('hidden');
            } else {
                console.warn("[Core] admin-loading-shield element not found!");
            }

            if (data.is_superuser) {
                console.log("[Core] User is superuser. Enabling superuser-only sidebar and drawer menu items.");
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
            console.log("[Core] Initializing application modules...");
            
            let genresPromise = null;
            try {
                if (typeof fetchGenres === 'function') {
                    console.log("[Core] Calling fetchGenres()...");
                    genresPromise = fetchGenres();
                } else {
                    console.error("[Core] fetchGenres function is not defined!");
                }
            } catch (e) {
                console.error("[Core] Error calling fetchGenres:", e);
            }

            try {
                if (typeof fetchStats === 'function') {
                    console.log("[Core] Calling fetchStats()...");
                    fetchStats();
                } else {
                    console.error("[Core] fetchStats function is not defined!");
                }
            } catch (e) {
                console.error("[Core] Error calling fetchStats:", e);
            }

            try {
                if (typeof fetchFilms === 'function') {
                    console.log("[Core] Calling fetchFilms(1)...");
                    fetchFilms(1);
                } else {
                    console.error("[Core] fetchFilms function is not defined!");
                }
            } catch (e) {
                console.error("[Core] Error calling fetchFilms:", e);
            }

            try {
                if (typeof fetchActors === 'function') {
                    console.log("[Core] Calling fetchActors(1)...");
                    fetchActors(1);
                } else {
                    console.error("[Core] fetchActors function is not defined!");
                }
            } catch (e) {
                console.error("[Core] Error calling fetchActors:", e);
            }

            try {
                if (typeof initFestivals === 'function') {
                    console.log("[Core] Calling initFestivals()...");
                    initFestivals();
                } else {
                    console.log("[Core] initFestivals is not defined (optional).");
                }
            } catch (e) {
                console.error("[Core] Error calling initFestivals:", e);
            }

            try {
                if (typeof fetchAllActorsForCast === 'function') {
                    console.log("[Core] Calling fetchAllActorsForCast()...");
                    fetchAllActorsForCast();
                } else {
                    console.error("[Core] fetchAllActorsForCast function is not defined!");
                }
            } catch (e) {
                console.error("[Core] Error calling fetchAllActorsForCast:", e);
            }

            try {
                if (data.is_superuser) {
                    if (typeof fetchUsers === 'function') {
                        console.log("[Core] Calling fetchUsers()...");
                        fetchUsers();
                    } else {
                        console.error("[Core] fetchUsers function is not defined!");
                    }
                }
            } catch (e) {
                console.error("[Core] Error calling fetchUsers:", e);
            }

            // Check for ?edit= URL parameter
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('edit')) {
                const editFilmId = parseInt(urlParams.get('edit'));
                if (editFilmId) {
                    console.log("[Core] Detected ?edit parameter for film ID:", editFilmId);
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
            console.warn("[Core] User is authenticated but lacks staff/superuser privileges!");
            if (loadingShield) loadingShield.classList.add('hidden');
            const deniedEl = document.getElementById('admin-access-denied');
            if (deniedEl) deniedEl.classList.remove('hidden');
        }
    })
    .catch(err => {
        console.error('[Core] Auth check / init flow failed:', err);
        if (loadingShield) loadingShield.classList.add('hidden');
        // Session might be expired — show access denied message
        const deniedEl = document.getElementById('admin-access-denied');
        if (deniedEl) {
            deniedEl.classList.remove('hidden');
            const msg = deniedEl.querySelector('p');
            if (msg) msg.textContent = 'Autentikasi gagal. Sesi mungkin expired. Silakan login ulang.';
        }
    });

    console.log("[Core] Registering sidebar event listeners...");
    // Sidebar event listeners
    document.getElementById('sidebar-dashboard-btn')?.addEventListener('click', () => {
        console.log("[Core] Sidebar dashboard button clicked");
        showPrimarySection('dashboard');
    });
    document.getElementById('sidebar-movies-btn')?.addEventListener('click', () => {
        console.log("[Core] Sidebar movies button clicked");
        showPrimarySection('movies');
    });
    document.getElementById('sidebar-festivals-btn')?.addEventListener('click', () => {
        console.log("[Core] Sidebar festivals button clicked");
        showPrimarySection('festivals');
    });
    document.getElementById('sidebar-actors-btn')?.addEventListener('click', () => {
        console.log("[Core] Sidebar actors button clicked");
        showPrimarySection('actors');
    });
    document.getElementById('sidebar-genres-btn')?.addEventListener('click', () => {
        console.log("[Core] Sidebar genres button clicked");
        showPrimarySection('genres');
    });
    document.getElementById('sidebar-approvals-btn')?.addEventListener('click', () => {
        console.log("[Core] Sidebar approvals button clicked");
        showPrimarySection('approvals');
    });
    document.getElementById('sidebar-users-btn')?.addEventListener('click', () => {
        console.log("[Core] Sidebar users button clicked");
        showPrimarySection('users');
    });

    // Mobile Drawer Logic & Event Listeners
    console.log("[Core] Setting up mobile drawer layout variables...");
    const drawer = document.getElementById("mobile-admin-drawer");
    const drawerContent = document.getElementById("mobile-admin-drawer-content");
    const openBtn = document.getElementById("mobile-admin-menu-btn");
    const closeBtn = document.getElementById("close-admin-drawer-btn");

    console.log("[Core] Mobile elements query results:", {
        drawerExists: !!drawer,
        drawerContentExists: !!drawerContent,
        openBtnExists: !!openBtn,
        closeBtnExists: !!closeBtn
    });

    function openDrawer() {
        console.log("[Core] openDrawer() called!");
        if (drawer && drawerContent) {
            console.log("[Core] Removing hidden class from drawer...");
            drawer.classList.remove("hidden");
            // Allow a single frame for layout so display:flex takes effect before animation starts
            requestAnimationFrame(() => {
                drawer.classList.remove("opacity-0");
                drawer.classList.add("opacity-100");
                drawerContent.classList.remove("-translate-x-full");
                drawerContent.classList.add("translate-x-0");
                console.log("[Core] Transition classes applied for opening drawer.");
            });
        } else {
            console.error("[Core] Drawer or drawerContent is missing from the DOM!");
        }
    }

    function closeDrawer() {
        console.log("[Core] closeDrawer() called!");
        if (drawer && drawerContent) {
            drawer.classList.add("opacity-0");
            drawer.classList.remove("opacity-100");
            drawerContent.classList.add("-translate-x-full");
            drawerContent.classList.remove("translate-x-0");
            console.log("[Core] Transition classes applied for closing drawer.");
            
            // Wait for 300ms transition to finish before setting display to none
            setTimeout(() => {
                drawer.classList.add("hidden");
                console.log("[Core] Drawer display set to hidden after transition completed.");
            }, 300);
        } else {
            console.error("[Core] Drawer or drawerContent is missing from the DOM!");
        }
    }

    if (openBtn) {
        console.log("[Core] Binding click listener to mobile-admin-menu-btn");
        openBtn.addEventListener("click", (e) => {
            e.preventDefault();
            console.log("[Core] Hamburger icon clicked!");
            openDrawer();
        });
    } else {
        console.warn("[Core] mobile-admin-menu-btn not found in HTML!");
    }

    if (closeBtn) {
        console.log("[Core] Binding click listener to close-admin-drawer-btn");
        closeBtn.addEventListener("click", (e) => {
            e.preventDefault();
            console.log("[Core] Drawer close icon clicked!");
            closeDrawer();
        });
    }

    if (drawer) {
        console.log("[Core] Binding click-outside listener to mobile-admin-drawer overlay");
        drawer.addEventListener("click", function (e) {
            if (e.target === drawer) {
                console.log("[Core] Clicked outside drawer content. Closing drawer...");
                closeDrawer();
            }
        });
    }

    console.log("[Core] Registering drawer menu buttons click listeners...");
    document.getElementById('drawer-dashboard-btn')?.addEventListener('click', () => { 
        console.log("[Core] Drawer dashboard button clicked");
        showPrimarySection('dashboard'); 
        closeDrawer(); 
    });
    document.getElementById('drawer-movies-btn')?.addEventListener('click', () => { 
        console.log("[Core] Drawer movies button clicked");
        showPrimarySection('movies'); 
        closeDrawer(); 
    });
    document.getElementById('drawer-festivals-btn')?.addEventListener('click', () => { 
        console.log("[Core] Drawer festivals button clicked");
        showPrimarySection('festivals'); 
        closeDrawer(); 
    });
    document.getElementById('drawer-actors-btn')?.addEventListener('click', () => { 
        console.log("[Core] Drawer actors button clicked");
        showPrimarySection('actors'); 
        closeDrawer(); 
    });
    document.getElementById('drawer-genres-btn')?.addEventListener('click', () => { 
        console.log("[Core] Drawer genres button clicked");
        showPrimarySection('genres'); 
        closeDrawer(); 
    });
    document.getElementById('drawer-approvals-btn')?.addEventListener('click', () => { 
        console.log("[Core] Drawer approvals button clicked");
        showPrimarySection('approvals'); 
        closeDrawer(); 
    });
    document.getElementById('drawer-users-btn')?.addEventListener('click', () => { 
        console.log("[Core] Drawer users button clicked");
        showPrimarySection('users'); 
        closeDrawer(); 
    });

    // Close modals on overlay click
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => btn.closest('[id$="-modal"]').classList.add('hidden'));
    });
    
    console.log("[Core] initCore execution completed.");
}

// BULLETPROOF INITIALIZATION: Run on DOMContentLoaded or immediately if DOM already parsed
if (document.readyState !== "loading") {
    console.log("[Core] DOM is already parsed (readyState: " + document.readyState + "). Initializing immediately...");
    initCore();
} else {
    console.log("[Core] DOM is loading. Registering DOMContentLoaded listener...");
    document.addEventListener("DOMContentLoaded", () => {
        console.log("[Core] DOMContentLoaded fired!");
        initCore();
    });
}

function showPrimarySection(sectionId) {
    console.log("showPrimarySection called for sectionId:", sectionId);
    const sections = ['dashboard', 'movies', 'festivals', 'actors', 'genres', 'approvals', 'users'];
    const btns = ['dashboard', 'movies', 'festivals', 'actors', 'genres', 'approvals', 'users'];

    // Hide all sections using both methods for compatibility and to resolve Tailwind overrides
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
        const drawerBtn = document.getElementById(`drawer-${id}-btn`);
        if (drawerBtn) {
            drawerBtn.classList.remove('bg-[#715A5A]', 'text-white');
            drawerBtn.classList.add('text-stone-400');
        }
    });

    // Show the active section using style.display and by removing 'hidden' class
    const targetSection = document.getElementById(`section-${sectionId}`) || document.getElementById(`admin-${sectionId}`);
    console.log("targetSection resolved:", targetSection);
    if (targetSection) {
        targetSection.style.display = 'flex';
        targetSection.classList.remove('hidden');
        console.log("Success: Section display set to flex, and hidden class removed.");
    } else {
        console.warn("Warning: Could not find section element for:", sectionId);
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
