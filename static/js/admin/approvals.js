/**
 * admin/approvals.js
 * Handles: Content approval for films and actors (Superuser only).
 */

function showApprovalTab(tab) {
    const filmsTab = document.getElementById('approval-films-tab');
    const actorsTab = document.getElementById('approval-actors-tab');
    const btns = document.querySelectorAll('.tab-btn');

    filmsTab.classList.toggle('hidden', tab !== 'films');
    actorsTab.classList.toggle('hidden', tab !== 'actors');

    btns.forEach(btn => {
        const isActive = btn.textContent.toLowerCase().includes(tab);
        btn.classList.toggle('border-[#715A5A]', isActive);
        btn.classList.toggle('text-stone-200', isActive);
        btn.classList.toggle('border-transparent', !isActive);
        btn.classList.toggle('text-stone-400', !isActive);
    });
}

function loadPendingFilmsForApproval() {
    const container = document.getElementById('pending-films-container');
    const empty = document.getElementById('pending-films-empty');
    if (!container) return;

    container.innerHTML = `<div class="col-span-4 py-10 text-center text-[#c9c5cb]/40 flex items-center justify-center gap-2"><span class="material-symbols-outlined animate-spin">sync</span></div>`;
    empty.classList.add('hidden');

    secureFetch('/api/films/?status=pending_approval&include_drafts=true&page_size=100')
    .then(res => res.json())
    .then(data => {
        const films = data.results || [];
        container.textContent = "";
        if (films.length === 0) { empty.classList.remove('hidden'); return; }
        films.forEach(film => container.appendChild(_buildFilmApprovalCard(film)));
    })
    .catch(() => showToast('Gagal memuat film pending.', 'error'));
}

function loadPendingActorsForApproval() {
    const container = document.getElementById('pending-actors-container');
    const empty = document.getElementById('pending-actors-empty');
    if (!container) return;

    container.innerHTML = `<div class="col-span-4 py-10 text-center text-[#c9c5cb]/40 flex items-center justify-center gap-2"><span class="material-symbols-outlined animate-spin">sync</span></div>`;
    empty.classList.add('hidden');

    secureFetch('/api/actors/?status=pending_approval&page_size=100')
    .then(res => res.json())
    .then(data => {
        const actors = data.results || [];
        container.textContent = "";
        if (actors.length === 0) { empty.classList.remove('hidden'); return; }
        actors.forEach(actor => container.appendChild(_buildActorApprovalCard(actor)));
    })
    .catch(() => showToast('Gagal memuat sineas pending.', 'error'));
}

function _buildFilmApprovalCard(film) {
    let posterUrl = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400";
    if (film.poster) {
        posterUrl = film.poster;
    } else if (film.poster_path) {
        posterUrl = film.poster_path.startsWith('http') ? film.poster_path : `https://image.tmdb.org/t/p/w342${film.poster_path}`;
    }

    const card = document.createElement('div');
    card.className = "bg-[#201f20] rounded-lg border border-white/5 shadow-md overflow-hidden flex flex-col";
    card.innerHTML = `
        <div class="aspect-[2/3] overflow-hidden bg-black/30 relative">
            <img src="${posterUrl}" alt="${film.title}" class="w-full h-full object-cover" />
        </div>
        <div class="p-4 flex flex-col gap-3 flex-grow">
            <h4 class="font-['Playfair_Display'] text-sm font-bold text-stone-100 line-clamp-2">${film.title}</h4>
            <p class="text-[10px] text-stone-500 font-['DM_Sans']">${film.release_year || 'N/A'} • ${film.duration ? film.duration + ' mnt' : 'N/A'}</p>
            <div class="flex gap-2 mt-auto">
                <button class="flex-1 py-2 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all" onclick="approveFilm(${film.id})">
                    <span class="material-symbols-outlined text-sm align-middle">check</span> Setujui
                </button>
                <button class="flex-1 py-2 text-xs font-semibold rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all" onclick="openRejectModal(${film.id})">
                    <span class="material-symbols-outlined text-sm align-middle">close</span> Tolak
                </button>
            </div>
        </div>
    `;
    return card;
}

function _buildActorApprovalCard(actor) {
    let photoUrl = "/static/images/placeholder-poster.jpg";
    if (actor.photo) {
        photoUrl = actor.photo;
    } else if (actor.photo_path) {
        photoUrl = actor.photo_path.startsWith('http') ? actor.photo_path : `https://image.tmdb.org/t/p/w185${actor.photo_path}`;
    }

    const card = document.createElement('div');
    card.className = "bg-[#201f20] rounded-lg border border-white/5 shadow-md overflow-hidden flex flex-col h-full";
    card.innerHTML = `
        <div class="aspect-square overflow-hidden bg-black/30 relative">
            <img src="${photoUrl}" alt="${actor.name}" class="w-full h-full object-cover" />
        </div>
        <div class="p-4 flex flex-col gap-3 flex-grow justify-between">
            <div>
                <h4 class="font-['Playfair_Display'] text-sm font-bold text-stone-100 line-clamp-1">${actor.name}</h4>
                <p class="text-[10px] text-stone-500 font-['DM_Sans'] mt-1">TMDB: ${actor.tmdb_id || 'Manual'} • Lahir: ${actor.birth_year || 'N/A'}</p>
                <p class="text-[11px] text-stone-400 font-['DM_Sans'] line-clamp-2 mt-2 leading-relaxed">${actor.bio || 'Tidak ada biografi.'}</p>
            </div>
            <div class="flex gap-2 mt-2">
                <button class="flex-1 py-2 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-1" onclick="approveActor(${actor.id})">
                    <span class="material-symbols-outlined text-sm">check</span> Setujui
                </button>
                <button class="flex-1 py-2 text-xs font-semibold rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center justify-center gap-1" onclick="openRejectModal(${actor.id}, 'actor')">
                    <span class="material-symbols-outlined text-sm">close</span> Tolak
                </button>
            </div>
        </div>
    `;
    return card;
}

function approveActor(actorId) {
    secureFetch(`/api/actors/${actorId}/approve/`, {
        method: 'POST'
    })
    .then(res => { if (!res.ok) throw new Error(); return res.json(); })
    .then(() => {
        showToast('Aktor berhasil disetujui dan diterbitkan.', 'success');
        loadPendingActorsForApproval();
    })
    .catch(() => showToast('Gagal menyetujui aktor.', 'error'));
}

window.approveActor = approveActor;
