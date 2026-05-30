/**
 * admin/movies.js
 * Handles: Film list fetch, render, search, pagination, approval actions.
 */

function fetchGenres() {
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

    return fetchAllGenres().then(all => {
        genresList = all;
        renderFormGenres();
        // Always render the genre table — section visibility is handled by core.js
        if (typeof renderGenresTable === 'function') renderGenresTable();
    });
}

function renderFormGenres() {
    const container = document.getElementById('form-genres-container');
    if (!container) return;
    container.textContent = "";
    genresList.forEach(genre => {
        const label = document.createElement("label");
        label.className = "flex items-center gap-3 cursor-pointer group text-[#c9c5cb] hover:text-white transition-all text-xs";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = genre.id;
        checkbox.className = "border-white/20 bg-[#141314] text-[#715A5A] focus:ring-[#715A5A] focus:ring-offset-0 rounded transition-all";
        checkbox.name = "genres-checkbox";
        const span = document.createElement("span");
        span.textContent = genre.name;
        label.appendChild(checkbox);
        label.appendChild(span);
        container.appendChild(label);
    });
}

function fetchFilms(page = 1) {
    manageCurrentPage = page;
    const filmsTableBody = document.getElementById('films-table-body');
    const tableEmpty = document.getElementById('table-empty');
    const tableLoading = document.getElementById('table-loading');
    const managePaginationInfo = document.getElementById('manage-pagination-info');
    const managePaginationControls = document.getElementById('manage-pagination-controls');
    const manageSearch = document.getElementById('manage-search');
    const manageStatusFilter = document.getElementById('manage-status-filter');

    filmsTableBody.textContent = "";
    tableEmpty.classList.add('hidden');
    tableLoading.classList.remove('hidden');

    const params = new URLSearchParams();
    params.append('page', page);
    params.append('include_drafts', 'true');
    if (manageSearch.value.trim()) params.append('search', manageSearch.value.trim());
    if (manageStatusFilter.value) params.append('status', manageStatusFilter.value);

    fetch(`/api/films/?${params.toString()}`, {
        
    })
    .then(res => res.json())
    .then(data => {
        tableLoading.classList.add('hidden');
        const films = data.results || [];
        const totalCount = data.count || 0;

        if (films.length === 0) {
            tableEmpty.classList.remove('hidden');
            managePaginationInfo.textContent = "Menampilkan 0 film";
            managePaginationControls.textContent = "";
            return;
        }
        renderFilmsTable(films);
        const startIdx = (page - 1) * 12 + 1;
        const endIdx = Math.min(page * 12, totalCount);
        managePaginationInfo.textContent = `Menampilkan ${startIdx} - ${endIdx} dari ${totalCount} film`;
        renderPagination(page, totalCount);
    })
    .catch(err => {
        console.error(err);
        tableLoading.classList.add('hidden');
        showToast('Gagal memuat daftar film.', 'error');
    });
}

function renderFilmsTable(films) {
    const filmsTableBody = document.getElementById('films-table-body');
    filmsTableBody.textContent = "";
    films.forEach((film, idx) => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-white/5 hover:bg-white/[0.02] transition-colors font-['DM_Sans']";

        // Poster
        const tdPoster = document.createElement('td');
        tdPoster.className = "p-2 sm:p-4 text-center align-middle shrink-0 w-[60px] sm:w-[80px] hidden sm:table-cell";
        let posterUrl = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=100";
        if (film.local_poster) {
            posterUrl = film.local_poster;
        } else if (film.tmdb_poster) {
            posterUrl = film.tmdb_poster.startsWith('http') ? film.tmdb_poster : `https://image.tmdb.org/t/p/w92${film.tmdb_poster}`;
        }
        const img = document.createElement('img');
        img.src = posterUrl;
        img.className = "w-8 h-11 sm:w-10 sm:h-14 object-cover rounded shadow-md mx-auto";
        img.alt = film.title;
        tdPoster.appendChild(img);
        tr.appendChild(tdPoster);

        // Title
        const tdTitle = document.createElement('td');
        tdTitle.className = "p-2 sm:p-4 font-medium text-stone-200 align-middle min-w-[100px] sm:min-w-[150px]";
        const titleSpan = document.createElement('span');
        titleSpan.className = "block text-xs sm:text-sm line-clamp-2 sm:line-clamp-1";
        titleSpan.textContent = film.title;
        tdTitle.appendChild(titleSpan);
        tr.appendChild(tdTitle);

        // Year
        const tdYear = document.createElement('td');
        tdYear.className = "p-2 sm:p-4 text-center text-stone-400 align-middle w-[60px] sm:w-[80px] hidden md:table-cell";
        tdYear.textContent = film.release_year || "N/A";
        tr.appendChild(tdYear);

        // Genres
        const tdGenres = document.createElement('td');
        tdGenres.className = "p-2 sm:p-4 text-stone-400 align-middle min-w-[100px] hidden lg:table-cell";
        const genresWrapper = document.createElement('div');
        genresWrapper.className = "line-clamp-1 max-w-[200px] text-xs";
        genresWrapper.textContent = (film.genre_display && film.genre_display.length > 0) ? film.genre_display.map(g => g.name).join(', ') : "None";
        tdGenres.appendChild(genresWrapper);
        tr.appendChild(tdGenres);

        // Status Badge
        const tdStatus = document.createElement('td');
        tdStatus.className = "p-2 sm:p-4 text-center align-middle w-[100px] sm:w-[120px]";
        const badge = document.createElement('span');
        badge.className = "px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase whitespace-nowrap ";
        const statusMap = {
            published: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25",
            pending_approval: "bg-amber-500/10 text-amber-400 border border-amber-500/25",
            rejected: "bg-rose-500/10 text-rose-400 border border-rose-500/25",
        };
        badge.className += statusMap[film.status] || "bg-stone-500/10 text-stone-400 border border-white/10";
        badge.textContent = film.status === 'pending_approval' ? 'Pending Approval' : (film.status || 'Draft');
        tdStatus.appendChild(badge);
        tr.appendChild(tdStatus);

        // Actions
        const tdActions = document.createElement('td');
        tdActions.className = "p-2 sm:p-4 text-center align-middle w-[100px] sm:w-[120px]";
        const actionsWrapper = document.createElement('div');
        actionsWrapper.className = "flex items-center justify-center gap-1.5";

        const editBtn = document.createElement('button');
        editBtn.className = "w-8 h-8 rounded border border-white/10 text-[#c9c5cb] hover:border-white/30 hover:text-white transition-all flex items-center justify-center shadow-sm";
        editBtn.innerHTML = `<span class="material-symbols-outlined text-base">edit</span>`;
        editBtn.addEventListener('click', () => openEditor(film.id));
        actionsWrapper.appendChild(editBtn);

        if (film.status === 'draft' || film.status === 'rejected') {
            const submitBtn = document.createElement('button');
            submitBtn.className = "w-8 h-8 rounded border border-white/10 text-amber-400 hover:border-amber-400/50 hover:bg-amber-500/10 transition-all flex items-center justify-center shadow-sm";
            submitBtn.innerHTML = `<span class="material-symbols-outlined text-base">send</span>`;
            submitBtn.title = "Submit for Approval";
            submitBtn.addEventListener('click', () => submitForApproval(film.id));
            actionsWrapper.appendChild(submitBtn);
        }

        if (currentUser && currentUser.is_superuser && film.status === 'pending_approval') {
            const approveBtn = document.createElement('button');
            approveBtn.className = "w-8 h-8 rounded border border-emerald-500/20 text-emerald-400 hover:border-emerald-400 hover:bg-emerald-500/10 transition-all flex items-center justify-center shadow-sm";
            approveBtn.innerHTML = `<span class="material-symbols-outlined text-base">check_circle</span>`;
            approveBtn.addEventListener('click', () => approveFilm(film.id));
            actionsWrapper.appendChild(approveBtn);

            const rejectBtn = document.createElement('button');
            rejectBtn.className = "w-8 h-8 rounded border border-rose-500/20 text-rose-400 hover:border-rose-400 hover:bg-rose-500/10 transition-all flex items-center justify-center shadow-sm";
            rejectBtn.innerHTML = `<span class="material-symbols-outlined text-base">cancel</span>`;
            rejectBtn.addEventListener('click', () => openRejectModal(film.id));
            actionsWrapper.appendChild(rejectBtn);
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.className = "w-8 h-8 rounded border border-rose-500/10 text-rose-400 hover:bg-rose-500/10 hover:border-rose-400/50 transition-all flex items-center justify-center shadow-sm";
        deleteBtn.innerHTML = `<span class="material-symbols-outlined text-base">delete</span>`;
        deleteBtn.addEventListener('click', () => deleteFilm(film.id, film.title));
        actionsWrapper.appendChild(deleteBtn);

        tdActions.appendChild(actionsWrapper);
        tr.appendChild(tdActions);
        filmsTableBody.appendChild(tr);
    });
}

function renderPagination(page, totalCount) {
    const container = document.getElementById('manage-pagination-controls');
    container.textContent = "";
    const totalPages = Math.ceil(totalCount / 12);
    if (totalPages <= 1) return;

    const prev = document.createElement('button');
    prev.className = `flex items-center justify-center w-7 h-7 rounded border border-white/10 text-stone-300 hover:border-[#715A5A] hover:bg-white/5 transition-all text-xs ${page === 1 ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`;
    prev.innerHTML = `<span class="material-symbols-outlined text-sm">chevron_left</span>`;
    prev.addEventListener('click', () => fetchFilms(page - 1));
    container.appendChild(prev);

    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);

    for (let i = start; i <= end; i++) {
        const btn = document.createElement('button');
        btn.className = `w-7 h-7 rounded border text-xs font-bold transition-all ${i === page ? 'bg-[#715A5A] border-[#715A5A] text-white shadow-md' : 'border-white/10 text-stone-300 hover:border-[#715A5A] hover:bg-white/5'}`;
        btn.textContent = i;
        btn.addEventListener('click', () => fetchFilms(i));
        container.appendChild(btn);
    }

    const next = document.createElement('button');
    next.className = `flex items-center justify-center w-7 h-7 rounded border border-white/10 text-stone-300 hover:border-[#715A5A] hover:bg-white/5 transition-all text-xs ${page === totalPages ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`;
    next.innerHTML = `<span class="material-symbols-outlined text-sm">chevron_right</span>`;
    next.addEventListener('click', () => fetchFilms(page + 1));
    container.appendChild(next);
}

function submitForApproval(filmId) {
    secureFetch(`/api/films/${filmId}/submit-approval/`, {
        method: 'POST'
    })
    .then(res => { if (!res.ok) throw new Error(); return res.json(); })
    .then(() => { showToast('Film diserahkan ke Super Admin untuk persetujuan publikasi.', 'success'); fetchFilms(manageCurrentPage); })
    .catch(() => showToast('Gagal submit approval film.', 'error'));
}

function approveFilm(filmId) {
    secureFetch(`/api/films/${filmId}/approve/`, {
        method: 'POST'
    })
    .then(res => { if (!res.ok) throw new Error(); return res.json(); })
    .then(() => { showToast('Film berhasil disetujui dan terbit publik.', 'success'); fetchFilms(manageCurrentPage); })
    .catch(() => showToast('Gagal menyetujui film.', 'error'));
}

function openRejectModal(id, type = 'film') {
    rejectModalFilmId = id;
    rejectModalType = type;
    document.getElementById('reject-reason-input').value = "";
    
    const titleEl = document.querySelector('#reject-modal .text-rose-400 span:last-child');
    const descEl = document.querySelector('#reject-modal p');
    if (type === 'actor') {
        if (titleEl) titleEl.textContent = "Tolak Publikasi Sineas";
        if (descEl) descEl.textContent = "Masukkan alasan penolakan untuk sineas ini. Alasan ini akan ditampilkan agar metadata sineas diperbaiki.";
    } else {
        if (titleEl) titleEl.textContent = "Tolak Publikasi Film";
        if (descEl) descEl.textContent = "Masukkan alasan penolakan untuk film ini. Alasan ini akan ditampilkan kepada Admin penyunting agar metadata film diperbaiki.";
    }
    
    document.getElementById('reject-modal').classList.remove('hidden');
}

function deleteFilm(id, title) {
    const confirmToast = _buildConfirmToast(`Hapus Film '${title}' dari database secara permanen?`, () => {
        secureFetch(`/api/films/${id}/`, { method: 'DELETE' })
            .then(res => { if (!res.ok) throw new Error(); showToast('Film berhasil dihapus.', 'success'); fetchFilms(manageCurrentPage); })
            .catch(() => showToast('Gagal menghapus film.', 'error'));
    });
    document.body.appendChild(confirmToast);
}

// Shared confirm toast builder
function _buildConfirmToast(message, onConfirm) {
    const toast = document.createElement('div');
    toast.className = "bg-[#201f20] border border-rose-500/20 p-4 rounded-lg flex flex-col gap-3 font-['DM_Sans'] text-xs text-[#c9c5cb] shadow-2xl fixed bottom-6 right-6 z-50 max-w-sm";
    const p = document.createElement('p');
    p.className = "font-medium text-stone-200";
    p.textContent = message;
    const btnGroup = document.createElement('div');
    btnGroup.className = "flex gap-2 justify-end";
    const yesBtn = document.createElement('button');
    yesBtn.className = "px-3 py-1 rounded text-white bg-rose-500 font-semibold";
    yesBtn.textContent = "Ya, Hapus";
    yesBtn.addEventListener('click', () => { onConfirm(); toast.remove(); });
    const noBtn = document.createElement('button');
    noBtn.className = "px-3 py-1 rounded border border-white/10 text-[#c9c5cb]";
    noBtn.textContent = "Batal";
    noBtn.addEventListener('click', () => toast.remove());
    btnGroup.appendChild(noBtn);
    btnGroup.appendChild(yesBtn);
    toast.appendChild(p);
    toast.appendChild(btnGroup);
    return toast;
}

document.addEventListener('DOMContentLoaded', () => {
    const manageSearch = document.getElementById('manage-search');
    const manageStatusFilter = document.getElementById('manage-status-filter');
    const triggerSearch = () => fetchFilms(1);

    document.getElementById('manage-search-submit-btn')?.addEventListener('click', triggerSearch);
    document.getElementById('manage-search-icon-btn')?.addEventListener('click', triggerSearch);
    manageSearch?.addEventListener('keypress', e => { if (e.key === 'Enter') triggerSearch(); });
    manageStatusFilter?.addEventListener('change', () => fetchFilms(1));
    document.getElementById('add-film-btn')?.addEventListener('click', () => openEditor(null));

    const rejectModalCancel = document.getElementById('reject-modal-cancel');
    const rejectModalSubmit = document.getElementById('reject-modal-submit');

    rejectModalCancel?.addEventListener('click', () => {
        document.getElementById('reject-modal').classList.add('hidden');
        rejectModalFilmId = null;
    });

    rejectModalSubmit?.addEventListener('click', () => {
        const reason = document.getElementById('reject-reason-input').value.trim();
        if (!reason) { showToast('Alasan wajib diisi.', 'warning'); return; }
        rejectModalSubmit.disabled = true;
        
        const isActor = (typeof rejectModalType !== 'undefined' && rejectModalType === 'actor');
        const url = isActor ? `/api/actors/${rejectModalFilmId}/reject/` : `/api/films/${rejectModalFilmId}/reject/`;
        const payload = isActor ? { rejection_reason: reason } : { reason: reason };
        
        secureFetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify(payload)
        })
        .then(res => { rejectModalSubmit.disabled = false; if (!res.ok) throw new Error(); return res.json(); })
        .then(() => {
            showToast(isActor ? 'Sineas berhasil ditolak.' : 'Film berhasil ditolak.', 'success');
            document.getElementById('reject-modal').classList.add('hidden');
            rejectModalFilmId = null;
            if (isActor) {
                if (typeof loadPendingActorsForApproval === 'function') loadPendingActorsForApproval();
            } else {
                fetchFilms(manageCurrentPage);
                if (typeof loadPendingFilmsForApproval === 'function') loadPendingFilmsForApproval();
            }
        })
        .catch(() => showToast(isActor ? 'Gagal menolak sineas.' : 'Gagal menolak film.', 'error'));
    });
});
