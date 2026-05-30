/**
 * admin/approvals.js
 * Handles: Content approval for films and actors (Superuser only).
 * Includes: Stagger animations, hover effects, detail modal integration.
 */

function showApprovalTab(tab) {
    const filmsTab = document.getElementById('approval-films-tab');
    const actorsTab = document.getElementById('approval-actors-tab');
    const tabFilmsBtn = document.getElementById('tab-btn-films');
    const tabActorsBtn = document.getElementById('tab-btn-actors');

    if (tab === 'films') {
        filmsTab?.classList.remove('hidden');
        actorsTab?.classList.add('hidden');

        if (tabFilmsBtn && tabActorsBtn) {
            // Active state
            tabFilmsBtn.className = 'px-4 py-2.5 text-xs font-semibold rounded-md border transition-all flex items-center gap-1.5 bg-[#715A5A] border-[#715A5A] text-white';
            tabActorsBtn.className = 'px-4 py-2.5 text-xs font-semibold rounded-md border border-white/10 text-stone-300 hover:border-[#715A5A] hover:text-white hover:bg-white/5 transition-all flex items-center gap-1.5';
        }

        loadPendingFilmsForApproval();
    } else {
        filmsTab?.classList.add('hidden');
        actorsTab?.classList.remove('hidden');

        if (tabFilmsBtn && tabActorsBtn) {
            tabActorsBtn.className = 'px-4 py-2.5 text-xs font-semibold rounded-md border transition-all flex items-center gap-1.5 bg-[#715A5A] border-[#715A5A] text-white';
            tabFilmsBtn.className = 'px-4 py-2.5 text-xs font-semibold rounded-md border border-white/10 text-stone-300 hover:border-[#715A5A] hover:text-white hover:bg-white/5 transition-all flex items-center gap-1.5';
        }

        loadPendingActorsForApproval();
    }
}

// =============================================
// FILMS LOADING
// =============================================
function loadPendingFilmsForApproval() {
    const container = document.getElementById('pending-films-container');
    const loading = document.getElementById('pending-films-loading');
    const empty = document.getElementById('pending-films-empty');
    const countBadge = document.getElementById('pending-films-count');

    if (!container) return;

    container.innerHTML = '';
    container.classList.add('hidden');
    empty?.classList.add('hidden');
    loading?.classList.remove('hidden');

    secureFetch('/api/films/?status=pending_approval&include_drafts=true&page_size=100')
    .then(res => res.json())
    .then(data => {
        loading?.classList.add('hidden');
        container.classList.remove('hidden');

        const films = data.results || [];
        if (countBadge) {
            if (films.length > 0) {
                countBadge.textContent = films.length;
                countBadge.classList.remove('hidden');
            } else {
                countBadge.classList.add('hidden');
            }
        }

        if (films.length === 0) {
            empty?.classList.remove('hidden');
            return;
        }

        container.innerHTML = '';
        films.forEach((film, idx) => {
            const card = _buildFilmApprovalCard(film);
            // card.classList.add('animate-fade-up');
            // card.style.animationDelay = `${idx * 60}ms`;
            container.appendChild(card);
        });
    })
    .catch(() => {
        loading?.classList.add('hidden');
        container.innerHTML = `<p class="col-span-full text-center text-rose-400 py-12 font-['DM_Sans'] text-sm">Gagal memuat film pending. Periksa koneksi server.</p>`;
        showToast('Gagal memuat film pending.', 'error');
    });
}

// =============================================
// ACTORS LOADING
// =============================================
function loadPendingActorsForApproval() {
    const container = document.getElementById('pending-actors-container');
    const loading = document.getElementById('pending-actors-loading');
    const empty = document.getElementById('pending-actors-empty');
    const countBadge = document.getElementById('pending-actors-count');

    if (!container) return;

    container.innerHTML = '';
    container.classList.add('hidden');
    empty?.classList.add('hidden');
    loading?.classList.remove('hidden');

    secureFetch('/api/actors/?status=pending_approval&page_size=100')
    .then(res => res.json())
    .then(data => {
        loading?.classList.add('hidden');
        container.classList.remove('hidden');

        const actors = data.results || [];
        if (countBadge) {
            if (actors.length > 0) {
                countBadge.textContent = actors.length;
                countBadge.classList.remove('hidden');
            } else {
                countBadge.classList.add('hidden');
            }
        }

        if (actors.length === 0) {
            empty?.classList.remove('hidden');
            return;
        }

        container.innerHTML = '';
        actors.forEach((actor, idx) => {
            const card = _buildActorApprovalCard(actor);
            // card.classList.add('animate-fade-up');
            // card.style.animationDelay = `${idx * 60}ms`;
            container.appendChild(card);
        });
    })
    .catch(() => {
        loading?.classList.add('hidden');
        container.innerHTML = `<p class="col-span-full text-center text-rose-400 py-12 font-['DM_Sans'] text-sm">Gagal memuat sineas pending. Periksa koneksi server.</p>`;
        showToast('Gagal memuat sineas pending.', 'error');
    });
}

// =============================================
// FILM APPROVAL CARD
// =============================================
function _buildFilmApprovalCard(film) {
    let posterUrl = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400";
    if (film.local_poster) {
        posterUrl = film.local_poster;
    } else if (film.tmdb_poster) {
        posterUrl = film.tmdb_poster.startsWith('http') ? film.tmdb_poster : `https://image.tmdb.org/t/p/w342${film.tmdb_poster}`;
    }

    const card = document.createElement('div');
    card.className = "bg-[#201f20] rounded-lg border border-white/5 shadow-lg overflow-hidden flex flex-col group hover:border-[#715A5A]/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer";
    card.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
            showFilmApprovalDetail(film);
        }
    });

    card.innerHTML = `
        <div class="aspect-[2/3] overflow-hidden bg-black/30 relative">
            <img src="${posterUrl}" alt="${film.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div class="absolute inset-0 bg-gradient-to-t from-[#201f20]/60 to-transparent opacity-80"></div>
            <!-- Status Badge -->
            <div class="absolute top-3 right-3">
                <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/25 text-amber-300 border border-amber-500/40 backdrop-blur-sm">
                    Pending
                </span>
            </div>
        </div>
        <div class="p-4 flex flex-col gap-3 flex-grow">
            <h4 class="font-['Playfair_Display'] text-sm font-bold text-stone-100 line-clamp-2 leading-tight">${film.title}</h4>
            <div class="flex items-center gap-2 text-[10px] text-stone-500 font-['DM_Sans']">
                <span>${film.release_year || 'N/A'}</span>
                <span>•</span>
                <span>${film.duration ? film.duration + ' mnt' : 'N/A'}</span>
                ${film.genre_display && film.genre_display.length > 0 ? `<span>•</span><span class="text-[#715A5A] truncate">${film.genre_display[0].name || film.genre_display[0]}</span>` : ''}
            </div>
            ${film.synopsis ? `<p class="text-[11px] text-stone-400 font-['DM_Sans'] line-clamp-2 leading-relaxed">${film.synopsis}</p>` : ''}
            <!-- Creator -->
            <p class="text-[10px] text-stone-600 font-['DM_Sans'] border-t border-white/5 pt-2 mt-auto">
                oleh: ${film.created_by_name || 'Unknown'}
            </p>
            <!-- Actions -->
            <div class="flex gap-2 pt-1">
                <button class="flex-1 py-2 text-xs font-semibold rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/25 hover:border-blue-400/50 transition-all flex items-center justify-center gap-1" onclick="event.stopPropagation(); showFilmApprovalDetail(film)">
                    <span class="material-symbols-outlined text-sm">visibility</span> Detail
                </button>
                <button class="flex-1 py-2 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 hover:border-emerald-400/50 transition-all flex items-center justify-center gap-1" onclick="event.stopPropagation(); approveFilmFromCard(${film.id})">
                    <span class="material-symbols-outlined text-sm">check</span> Setuju
                </button>
                <button class="flex-1 py-2 text-xs font-semibold rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/25 hover:border-rose-400/50 transition-all flex items-center justify-center gap-1" onclick="event.stopPropagation(); openRejectModal(${film.id}, 'film')">
                    <span class="material-symbols-outlined text-sm">close</span> Tolak
                </button>
            </div>
        </div>
    `;

    return card;
}

// =============================================
// ACTOR APPROVAL CARD
// =============================================
function _buildActorApprovalCard(actor) {
    let photoUrl = "/static/images/placeholder-poster.jpg";
    if (actor.local_photo) {
        photoUrl = actor.local_photo;
    } else if (actor.tmdb_photo) {
        photoUrl = actor.tmdb_photo.startsWith('http') ? actor.tmdb_photo : `https://image.tmdb.org/t/p/w185${actor.tmdb_photo}`;
    }

    const card = document.createElement('div');
    card.className = "bg-[#201f20] rounded-lg border border-white/5 shadow-lg overflow-hidden flex flex-col group hover:border-[#715A5A]/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer";
    card.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
            showActorApprovalDetail(actor);
        }
    });

    card.innerHTML = `
        <div class="aspect-square overflow-hidden bg-black/30 relative">
            <img src="${photoUrl}" alt="${actor.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div class="absolute inset-0 bg-gradient-to-t from-[#201f20]/60 to-transparent opacity-80"></div>
            <div class="absolute top-3 right-3">
                <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/25 text-amber-300 border border-amber-500/40 backdrop-blur-sm">
                    Pending
                </span>
            </div>
        </div>
        <div class="p-4 flex flex-col gap-3 flex-grow justify-between">
            <div>
                <h4 class="font-['Playfair_Display'] text-sm font-bold text-stone-100 line-clamp-1 leading-tight">${actor.name}</h4>
                <p class="text-[10px] text-stone-500 font-['DM_Sans'] mt-1">TMDB: ${actor.tmdb_id || 'Manual'} • Lahir: ${actor.birth_year || 'N/A'}</p>
                <p class="text-[11px] text-stone-400 font-['DM_Sans'] line-clamp-2 mt-2 leading-relaxed">${actor.bio || 'Tidak ada biografi.'}</p>
            </div>
            <p class="text-[10px] text-stone-600 font-['DM_Sans'] border-t border-white/5 pt-2">
                oleh: ${actor.created_by_name || 'Unknown'}
            </p>
            <div class="flex gap-2 pt-2">
                <button class="flex-1 py-2 text-xs font-semibold rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/25 hover:border-blue-400/50 transition-all flex items-center justify-center gap-1" onclick="event.stopPropagation(); showActorApprovalDetail(actor)">
                    <span class="material-symbols-outlined text-sm">visibility</span> Detail
                </button>
                <button class="flex-1 py-2 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 hover:border-emerald-400/50 transition-all flex items-center justify-center gap-1" onclick="event.stopPropagation(); approveActorFromCard(${actor.id})">
                    <span class="material-symbols-outlined text-sm">check</span> Setuju
                </button>
                <button class="flex-1 py-2 text-xs font-semibold rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/25 hover:border-rose-400/50 transition-all flex items-center justify-center gap-1" onclick="event.stopPropagation(); openRejectModal(${actor.id}, 'actor')">
                    <span class="material-symbols-outlined text-sm">close</span> Tolak
                </button>
            </div>
        </div>
    `;

    return card;
}

// =============================================
// APPROVE / REJECT ACTIONS
// =============================================
function approveFilmFromCard(filmId) {
    secureFetch(`/api/films/${filmId}/approve/`, { method: 'POST' })
    .then(res => { if (!res.ok) throw new Error(); return res.json(); })
    .then(() => {
        showToast('Film berhasil disetujui dan terbit publik.', 'success');
        loadPendingFilmsForApproval();
    })
    .catch(() => showToast('Gagal menyetujui film.', 'error'));
}

function approveActorFromCard(actorId) {
    secureFetch(`/api/actors/${actorId}/approve/`, { method: 'POST' })
    .then(res => { if (!res.ok) throw new Error(); return res.json(); })
    .then(() => {
        showToast('Aktor berhasil disetujui dan terbit publik.', 'success');
        loadPendingActorsForApproval();
    })
    .catch(() => showToast('Gagal menyetujui aktor.', 'error'));
}

// =============================================
// APPROVAL MODALS (from rbac-integration.js / modals.html)
// =============================================
function showFilmApprovalDetail(film) {
    if (typeof _showFilmApprovalDetail === 'function') {
        _showFilmApprovalDetail(film);
        return;
    }
    // Fallback inline modal
    const modal = document.getElementById('film-approval-detail-modal');
    if (!modal) return;

    document.getElementById('detail-film-title').textContent = film.title;
    document.getElementById('detail-film-year').textContent = film.release_year || '-';
    document.getElementById('detail-film-duration').textContent = film.duration ? `${film.duration} min` : '-';
    document.getElementById('detail-film-rating').textContent = `★ ${film.avg_rating || '0.0'}`;

    let posterUrl = "/static/images/placeholder-poster.jpg";
    if (film.local_poster) posterUrl = film.local_poster;
    else if (film.tmdb_poster) posterUrl = film.tmdb_poster.startsWith('http') ? film.tmdb_poster : `https://image.tmdb.org/t/p/w500${film.tmdb_poster}`;
    document.getElementById('detail-film-poster').src = posterUrl;

    let genreText = '-';
    if (film.genre_display && film.genre_display.length > 0) {
        genreText = film.genre_display.map(g => g.name || g).join(', ');
    }
    document.getElementById('detail-film-genres').textContent = genreText;
    document.getElementById('detail-film-synopsis').textContent = film.synopsis || 'Tidak ada sinopsis.';
    const trailer = document.getElementById('detail-film-trailer');
    if (film.trailer_url) { trailer.href = film.trailer_url; trailer.textContent = film.trailer_url; }
    else { trailer.removeAttribute('href'); trailer.textContent = 'Tidak ada trailer'; }

    // Gallery
    const galleryContainer = document.getElementById('detail-film-gallery');
    galleryContainer.innerHTML = '';
    if (film.images && film.images.length > 0) {
        film.images.filter(img => img.image_type === 'backdrop').forEach(img => {
            const imgEl = document.createElement('img');
            imgEl.src = img.file_path.startsWith('/media/') ? img.file_path : `https://image.tmdb.org/t/p/w500${img.file_path}`;
            imgEl.className = 'w-full aspect-[16/9] object-cover rounded border border-white/10 hover:scale-105 transition-transform duration-300';
            galleryContainer.appendChild(imgEl);
        });
    }
    if (!galleryContainer.children.length) {
        galleryContainer.innerHTML = '<span class="text-xs text-stone-500 italic">Belum ada galeri backdrop.</span>';
    }

    modal.classList.remove('hidden');
    // modal.classList.add('animate-scale-in');
}

function showActorApprovalDetail(actor) {
    if (typeof _showActorApprovalDetail === 'function') {
        _showActorApprovalDetail(actor);
        return;
    }
    const modal = document.getElementById('actor-approval-detail-modal');
    if (!modal) return;

    document.getElementById('detail-actor-name').textContent = actor.name;
    document.getElementById('detail-actor-native').textContent = actor.native_name || '';
    document.getElementById('detail-actor-birth').textContent = actor.birth_year || 'Unknown Year';
    document.getElementById('detail-actor-tmdb').textContent = `TMDB: ${actor.tmdb_id || '-'}`;

    let photoUrl = "/static/images/placeholder-poster.jpg";
    if (actor.local_photo) photoUrl = actor.local_photo;
    else if (actor.tmdb_photo) photoUrl = actor.tmdb_photo.startsWith('http') ? actor.tmdb_photo : `https://image.tmdb.org/t/p/w500${actor.tmdb_photo}`;
    document.getElementById('detail-actor-photo').src = photoUrl;
    document.getElementById('detail-actor-bio').textContent = actor.bio || 'Tidak ada biografi.';

    modal.classList.remove('hidden');
    // modal.classList.add('animate-scale-in');
}

// =============================================
// INIT: set default tab + attach close buttons
// =============================================
document.addEventListener('DOMContentLoaded', function () {
    // Ensure default tab
    showApprovalTab('films');

    // Modal close button handlers
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('[id$="-modal"]')?.classList.add('hidden');
        });
    });

    // Also close modals when clicking backdrop
    document.querySelectorAll('#film-approval-detail-modal, #actor-approval-detail-modal').forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        }
    });
});

// Expose for use in HTML
// Expose for global access
window.showApprovalTab = showApprovalTab;
window.loadPendingFilmsForApproval = loadPendingFilmsForApproval;
window.loadPendingActorsForApproval = loadPendingActorsForApproval;
window.showFilmApprovalDetail = showFilmApprovalDetail;
window.showActorApprovalDetail = showActorApprovalDetail;
window.approveFilmFromCard = approveFilmFromCard;
window.approveActorFromCard = approveActorFromCard;
