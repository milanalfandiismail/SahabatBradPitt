/**
 * admin/actors_genres.js
 * Handles: Actors CRUD, Genres CRUD.
 */

function fetchAllActorsForCast() {
    fetch('/api/actors/?limit=1000', {  })
        .then(res => res.json())
        .then(data => { allActorsList = Array.isArray(data) ? data : (data.results || []); })
        .catch(err => console.error("Failed to fetch all actors", err));
}

function fetchActors(page = 1) {
    actorsCurrentPage = page;
    const actorsTableBody = document.getElementById('actors-table-body');
    const actorsEmpty = document.getElementById('actors-empty');
    const actorsLoading = document.getElementById('actors-loading');
    const actorsPaginationInfo = document.getElementById('actors-pagination-info');
    const actorsPaginationControls = document.getElementById('actors-pagination-controls');

    actorsTableBody.textContent = "";
    actorsEmpty.classList.add('hidden');
    actorsLoading.classList.remove('hidden');

    let url = `/api/actors/?page=${page}&ordering=name`;
    if (actorsSearchQuery) url += `&search=${encodeURIComponent(actorsSearchQuery)}`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            actorsLoading.classList.add('hidden');
            const results = data.results || [];
            const count = data.count || 0;
            if (results.length === 0) {
                actorsEmpty.classList.remove('hidden');
                actorsPaginationInfo.textContent = "Menampilkan 0 sineas";
                actorsPaginationControls.textContent = "";
                return;
            }
            renderActorsTable(results);
            actorsPaginationInfo.textContent = `Menampilkan ${(page - 1) * 10 + 1} - ${Math.min(page * 10, count)} dari ${count} sineas`;
            renderActorsPagination(page, count);
        })
        .catch(() => { document.getElementById('actors-loading').classList.add('hidden'); showToast('Gagal memuat data sineas.', 'error'); });
}

function renderActorsTable(actors) {
    const actorsTableBody = document.getElementById('actors-table-body');
    actorsTableBody.textContent = "";
    actors.forEach((actor, idx) => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-white/5 hover:bg-white/[0.03] hover:-translate-y-0.5 transition-all font-['DM_Sans']";

        const tdPhoto = document.createElement('td');
        tdPhoto.className = "p-4 text-center align-middle w-[80px]";
        const avatar = document.createElement('div');
        avatar.className = "w-10 h-10 rounded-full overflow-hidden border border-white/10 mx-auto bg-stone-700 flex items-center justify-center text-stone-500 shadow-md";
        if (actor.photo) {
            const img = document.createElement('img');
            img.src = actor.photo;
            img.className = "w-full h-full object-cover";
            avatar.appendChild(img);
        } else if (actor.photo_path) {
            const img = document.createElement('img');
            img.src = actor.photo_path.startsWith('http') ? actor.photo_path : `https://image.tmdb.org/t/p/w185${actor.photo_path}`;
            img.className = "w-full h-full object-cover";
            avatar.appendChild(img);
        } else {
            avatar.innerHTML = `<span class="material-symbols-outlined text-xl">person</span>`;
        }
        tdPhoto.appendChild(avatar);
        tr.appendChild(tdPhoto);

        const tdName = document.createElement('td');
        tdName.className = "p-4 font-semibold text-stone-200 text-sm align-middle";
        tdName.textContent = actor.name;
        tr.appendChild(tdName);

        const tdTmdb = document.createElement('td');
        tdTmdb.className = "p-4 text-center text-stone-400 align-middle";
        tdTmdb.textContent = actor.tmdb_id || "Manual";
        tr.appendChild(tdTmdb);

        const tdBirth = document.createElement('td');
        tdBirth.className = "p-4 text-center text-stone-400 align-middle";
        tdBirth.textContent = actor.birth_year || "N/A";
        tr.appendChild(tdBirth);

        const tdBio = document.createElement('td');
        tdBio.className = "p-4 text-stone-400 align-middle";
        const bioWrapper = document.createElement('div');
        bioWrapper.className = "line-clamp-2 max-w-sm text-xs leading-relaxed";
        bioWrapper.textContent = actor.bio || "-";
        tdBio.appendChild(bioWrapper);
        tr.appendChild(tdBio);

        const tdActions = document.createElement('td');
        tdActions.className = "p-4 text-center align-middle";
        const actionsWrapper = document.createElement('div');
        actionsWrapper.className = "flex items-center justify-center gap-1.5";

        const editBtn = document.createElement('button');
        editBtn.className = "w-7 h-7 rounded border border-white/10 text-stone-300 hover:border-white/40 hover:text-white transition-all flex items-center justify-center shadow-sm";
        editBtn.innerHTML = `<span class="material-symbols-outlined text-sm">edit</span>`;
        editBtn.addEventListener('click', () => openActorEditor(actor));
        actionsWrapper.appendChild(editBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = "w-7 h-7 rounded border border-rose-500/10 text-rose-400 hover:bg-rose-500/10 hover:border-rose-400/50 transition-all flex items-center justify-center shadow-sm";
        deleteBtn.innerHTML = `<span class="material-symbols-outlined text-sm">delete</span>`;
        deleteBtn.addEventListener('click', () => deleteActor(actor.id, actor.name));
        actionsWrapper.appendChild(deleteBtn);

        tdActions.appendChild(actionsWrapper);
        tr.appendChild(tdActions);
        actorsTableBody.appendChild(tr);
    });
}

function renderActorsPagination(page, totalCount) {
    const container = document.getElementById('actors-pagination-controls');
    container.textContent = "";
    const totalPages = Math.ceil(totalCount / 10);
    if (totalPages <= 1) return;

    const prev = document.createElement('button');
    prev.className = `flex items-center justify-center w-7 h-7 rounded border border-white/10 text-stone-300 hover:bg-white/5 transition-all text-xs ${page === 1 ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`;
    prev.innerHTML = `<span class="material-symbols-outlined text-sm">chevron_left</span>`;
    prev.addEventListener('click', () => fetchActors(page - 1));
    container.appendChild(prev);

    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    for (let i = start; i <= end; i++) {
        const btn = document.createElement('button');
        btn.className = `w-7 h-7 rounded border text-xs font-bold transition-all ${i === page ? 'bg-[#715A5A] border-[#715A5A] text-white shadow-md' : 'border-white/10 text-stone-300 hover:bg-white/5'}`;
        btn.textContent = i;
        btn.addEventListener('click', () => fetchActors(i));
        container.appendChild(btn);
    }

    const next = document.createElement('button');
    next.className = `flex items-center justify-center w-7 h-7 rounded border border-white/10 text-stone-300 hover:bg-white/5 transition-all text-xs ${page === totalPages ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`;
    next.innerHTML = `<span class="material-symbols-outlined text-sm">chevron_right</span>`;
    next.addEventListener('click', () => fetchActors(page + 1));
    container.appendChild(next);
}

function openActorEditor(actor) {
    const actorForm = document.getElementById('actor-form');
    actorForm.reset();
    if (actor) {
        selectedActorId = actor.id;
        document.getElementById('actor-editor-title').textContent = "Sunting Profil Sineas";
        let baseName = actor.name;
        if (actor.name && actor.name.includes('(')) baseName = actor.name.split('(')[0].trim();
        document.getElementById('actor-form-name').value = baseName;
        document.getElementById('actor-form-native-name').value = actor.native_name || "";
        document.getElementById('actor-form-tmdb-id').value = actor.tmdb_id || "";
        document.getElementById('actor-form-birth-year').value = actor.birth_year || "";
        
        const tmdbContainer = document.getElementById('actor-form-tmdb-container');
        if (tmdbContainer) {
            if (actor.tmdb_id) {
                tmdbContainer.classList.remove('hidden');
            } else {
                tmdbContainer.classList.add('hidden');
            }
        }
        
        document.getElementById('actor-form-photo').value = "";
        document.getElementById('actor-form-photo-path-hidden').value = actor.photo_path || "";
        document.getElementById('actor-form-instagram').value = actor.instagram_id || "";
        document.getElementById('actor-form-twitter').value = actor.twitter_id || "";
        document.getElementById('actor-form-facebook').value = actor.facebook_id || "";
        document.getElementById('actor-form-tiktok').value = actor.tiktok_id || "";
        document.getElementById('actor-form-bio').value = actor.bio || "";
        
        const preview = document.getElementById('actor-form-photo-preview');
        const placeholder = document.getElementById('actor-form-photo-placeholder');
        if (preview && placeholder) {
            let photoUrl = '';
            if (actor.photo) {
                photoUrl = actor.photo;
            } else if (actor.photo_path) {
                photoUrl = actor.photo_path.startsWith('http') ? actor.photo_path : `https://image.tmdb.org/t/p/w400${actor.photo_path}`; // Using w400 for better HD quality
            }
            if (photoUrl) {
                preview.src = photoUrl;
                preview.classList.remove('hidden');
                placeholder.classList.add('hidden');
            } else {
                preview.src = '';
                preview.classList.add('hidden');
                placeholder.classList.remove('hidden');
            }
        }
    } else {
        selectedActorId = null;
        document.getElementById('actor-editor-title').textContent = "Tambah Sineas Baru";
        
        const tmdbContainer = document.getElementById('actor-form-tmdb-container');
        if (tmdbContainer) tmdbContainer.classList.add('hidden');
        
        const preview = document.getElementById('actor-form-photo-preview');
        const placeholder = document.getElementById('actor-form-photo-placeholder');
        if (preview && placeholder) {
            preview.src = ''; 
            preview.classList.add('hidden');
            placeholder.classList.remove('hidden');
        }
    }
    document.getElementById('view-actors-manage').classList.add('hidden');
    document.getElementById('view-actor-editor').classList.remove('hidden');
}

function closeActorEditor() {
    document.getElementById('view-actor-editor').classList.add('hidden');
    document.getElementById('view-actors-manage').classList.remove('hidden');
}

function deleteActor(id, name) {
    const toast = _buildConfirmToast(`Hapus Sineas '${name}' dari database secara permanen?`, () => {
        secureFetch(`/api/actors/${id}/`, { method: 'DELETE' })
            .then(res => { if (!res.ok) throw new Error(); showToast('Sineas terhapus.', 'success'); fetchActors(actorsCurrentPage); })
            .catch(() => showToast('Gagal menghapus sineas.', 'error'));
    });
    document.body.appendChild(toast);
}

// ---- Genres ----
async function fetchAllGenres(url = '/api/films/genres/', allGenres = []) {
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (Array.isArray(data)) {
            allGenres = allGenres.concat(data);
        } else if (data.results) {
            allGenres = allGenres.concat(data.results);
            if (data.next) return fetchAllGenres(data.next, allGenres);
        }
        return allGenres;
    } catch (err) {
        console.error("Error loading genres:", err);
        return allGenres;
    }
}

function fetchGenres() {
    const genresTableBody = document.getElementById('genres-table-body');
    const genresEmpty = document.getElementById('genres-empty');
    const genresLoading = document.getElementById('genres-loading');
    if (!genresTableBody) return;
    genresTableBody.textContent = '';
    genresEmpty?.classList.add('hidden');
    genresLoading?.classList.remove('hidden');

    fetchAllGenres().then(all => {
        genresLoading?.classList.add('hidden');
        genresList = all;
        if (genresList.length === 0) {
            genresEmpty?.classList.remove('hidden');
            return;
        }
        renderGenresTable();
    }).catch(() => {
        genresLoading?.classList.add('hidden');
        genresEmpty?.classList.remove('hidden');
        showToast('Gagal memuat daftar genre.', 'error');
    });
}

function renderGenresTable() {
    const genresTableBody = document.getElementById('genres-table-body');
    const genresEmpty = document.getElementById('genres-empty');
    genresTableBody.textContent = "";
    genresEmpty.classList.add('hidden');
    if (genresList.length === 0) { genresEmpty.classList.remove('hidden'); return; }
    genresList.forEach((genre, idx) => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-white/5 hover:bg-white/[0.03] hover:-translate-y-0.5 transition-all font-['DM_Sans']";

        const tdName = document.createElement('td');
        tdName.className = "p-4 font-semibold text-stone-200 text-sm align-middle";
        tdName.textContent = genre.name;
        tr.appendChild(tdName);

        const tdTmdb = document.createElement('td');
        tdTmdb.className = "p-4 text-center text-stone-400 align-middle";
        tdTmdb.textContent = genre.tmdb_genre_id || "Custom";
        tr.appendChild(tdTmdb);

        const tdActions = document.createElement('td');
        tdActions.className = "p-4 text-center align-middle";
        const deleteBtn = document.createElement('button');
        deleteBtn.className = "w-7 h-7 rounded border border-rose-500/10 text-rose-400 hover:bg-rose-500/10 hover:border-rose-400/50 transition-all flex items-center justify-center shadow-sm mx-auto";
        deleteBtn.innerHTML = `<span class="material-symbols-outlined text-sm">delete</span>`;
        deleteBtn.addEventListener('click', () => deleteGenre(genre.id, genre.name));
        tdActions.appendChild(deleteBtn);
        tr.appendChild(tdActions);
        genresTableBody.appendChild(tr);
    });
}

function deleteGenre(id, name) {
    const toast = _buildConfirmToast(`Hapus Genre '${name}'? Relasi genrenya pada film akan lepas.`, () => {
        secureFetch(`/api/films/genres/${id}/`, { method: 'DELETE' })
            .then(res => { if (!res.ok) throw new Error(); showToast('Genre terhapus.', 'success'); fetchGenres(); })
            .catch(() => showToast('Gagal menghapus genre.', 'error'));
    });
    document.body.appendChild(toast);
}

document.addEventListener('DOMContentLoaded', () => {
    // Actor search
    const submitActorSearch = () => { actorsSearchQuery = document.getElementById('actor-search').value.trim(); fetchActors(1); };
    document.getElementById('actor-search-submit-btn')?.addEventListener('click', submitActorSearch);
    document.getElementById('actor-search-icon-btn')?.addEventListener('click', submitActorSearch);
    document.getElementById('actor-search')?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submitActorSearch(); } });
    document.getElementById('add-actor-btn')?.addEventListener('click', () => openActorEditor(null));
    document.getElementById('actor-editor-cancel-btn')?.addEventListener('click', closeActorEditor);
    document.getElementById('actor-editor-close-btn')?.addEventListener('click', closeActorEditor);
    
    document.getElementById('actor-form-photo-trigger-btn')?.addEventListener('click', () => {
        document.getElementById('actor-form-photo')?.click();
    });
    
    const actorPhotoInput = document.getElementById('actor-form-photo');
    const actorPhotoPreview = document.getElementById('actor-form-photo-preview');
    const actorPhotoPlaceholder = document.getElementById('actor-form-photo-placeholder');
    if (actorPhotoInput && actorPhotoPreview && actorPhotoPlaceholder) {
        actorPhotoInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    actorPhotoPreview.src = e.target.result;
                    actorPhotoPreview.classList.remove('hidden');
                    actorPhotoPlaceholder.classList.add('hidden');
                }
                reader.readAsDataURL(this.files[0]);
            } else {
                actorPhotoPreview.src = '';
                actorPhotoPreview.classList.add('hidden');
                actorPhotoPlaceholder.classList.remove('hidden');
            }
        });
    }

    document.getElementById('actor-form')?.addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('actor-form-name').value.trim();
        if (!name) return;
        const formData = new FormData();
        formData.append('name', name);
        formData.append('native_name', document.getElementById('actor-form-native-name').value.trim());
        const tmdbId = document.getElementById('actor-form-tmdb-id').value;
        if (tmdbId) formData.append('tmdb_id', parseInt(tmdbId));
        const birthYear = document.getElementById('actor-form-birth-year').value;
        if (birthYear) formData.append('birth_year', parseInt(birthYear));
        
        formData.append('instagram_id', document.getElementById('actor-form-instagram').value.trim());
        formData.append('twitter_id', document.getElementById('actor-form-twitter').value.trim());
        formData.append('facebook_id', document.getElementById('actor-form-facebook').value.trim());
        formData.append('tiktok_id', document.getElementById('actor-form-tiktok').value.trim());
        formData.append('bio', document.getElementById('actor-form-bio').value.trim());
        
        const photoInput = document.getElementById('actor-form-photo');
        if (photoInput.files && photoInput.files[0]) {
            formData.append('photo', photoInput.files[0]);
        }
        const hiddenPath = document.getElementById('actor-form-photo-path-hidden').value.trim();
        if (hiddenPath) formData.append('photo_path', hiddenPath);
        
        const url = selectedActorId ? `/api/actors/${selectedActorId}/` : '/api/actors/';
        const method = selectedActorId ? 'PUT' : 'POST';
        secureFetch(url, { method, body: formData })
            .then(res => { if (!res.ok) throw new Error(); return res.json(); })
            .then(() => { showToast('Profil Sineas berhasil disimpan!', 'success'); closeActorEditor(); fetchActors(actorsCurrentPage); })
            .catch(() => showToast('Gagal menyimpan profil Sineas.', 'error'));
    });

    // Genre
    function openGenreEditor() {
        document.getElementById('genre-form').reset();
        document.getElementById('view-genres-manage').classList.add('hidden');
        document.getElementById('view-genre-editor').classList.remove('hidden');
    }
    function closeGenreEditor() {
        document.getElementById('view-genre-editor').classList.add('hidden');
        document.getElementById('view-genres-manage').classList.remove('hidden');
    }
    
    document.getElementById('add-genre-btn')?.addEventListener('click', openGenreEditor);
    document.getElementById('genre-editor-cancel-btn')?.addEventListener('click', closeGenreEditor);
    document.getElementById('genre-editor-close-btn')?.addEventListener('click', closeGenreEditor);
    document.getElementById('genre-form')?.addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('genre-form-name').value.trim();
        if (!name) return;
        secureFetch('/api/films/genres/', { method: 'POST', headers: { 'Content-Type': 'application/json', }, body: JSON.stringify({ name }) })
            .then(res => { if (!res.ok) throw new Error(); return res.json(); })
            .then(() => { showToast('Genre Kustom berhasil ditambahkan!', 'success'); closeGenreEditor(); fetchGenres(); })
            .catch(() => showToast('Gagal menambahkan genre kustom.', 'error'));
    });
});
