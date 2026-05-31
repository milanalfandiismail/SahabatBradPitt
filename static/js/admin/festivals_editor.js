/**
 * admin/festivals_editor.js
 * Handles: Editor populating, visual grids, autocomplete, and saving festival.
 */

// Selected items states
window.selectedFestivalFilms = [];
window.selectedFestivalAwards = [];

function _getFilmPosterUrl(film) {
    if (film.local_poster) return film.local_poster;
    if (film.tmdb_poster) {
        return film.tmdb_poster.startsWith('http') 
            ? film.tmdb_poster 
            : `https://image.tmdb.org/t/p/w200${film.tmdb_poster}`;
    }
    if (film.film_poster) {
        return film.film_poster.startsWith('http') 
            ? film.film_poster 
            : `https://image.tmdb.org/t/p/w200${film.film_poster}`;
    }
    return '';
}

function _getActorPhotoUrl(actor) {
    if (actor.local_photo) return actor.local_photo;
    if (actor.tmdb_photo) {
        return actor.tmdb_photo.startsWith('http') 
            ? actor.tmdb_photo 
            : `https://image.tmdb.org/t/p/w200${actor.tmdb_photo}`;
    }
    if (actor.actor_photo) {
        return actor.actor_photo.startsWith('http') 
            ? actor.actor_photo 
            : `https://image.tmdb.org/t/p/w200${actor.actor_photo}`;
    }
    return '';
}

function renderFestivalFilmsGrid() {
    const grid = document.getElementById('festival-films-grid');
    const countSpan = document.getElementById('festival-films-count');
    if (!grid) return;

    grid.textContent = '';
    if (countSpan) {
        countSpan.textContent = `${window.selectedFestivalFilms.length} Film`;
    }

    if (window.selectedFestivalFilms.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-8 text-center text-[#c9c5cb]/40 italic text-xs">Belum ada film yang ditambahkan.</div>`;
        return;
    }

    window.selectedFestivalFilms.forEach((film, index) => {
        const posterUrl = _getFilmPosterUrl(film);
        const card = document.createElement('div');
        card.className = 'relative bg-[#141314] rounded border border-white/10 overflow-hidden flex flex-col group transition-all duration-300 hover:border-amber-500/50 shadow-md aspect-[2/3]';
        
        const imgHtml = posterUrl
            ? `<img src="${posterUrl}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="${film.film_title || film.title}">`
            : `<div class="w-full h-full bg-[#141314] flex flex-col items-center justify-center gap-1.5 text-stone-600">
                 <span class="material-symbols-outlined text-3xl">movie</span>
               </div>`;

        card.innerHTML = `
            ${imgHtml}
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2 pointer-events-none">
                <p class="text-[11px] font-bold text-stone-100 line-clamp-2">${film.film_title || film.title}</p>
                <p class="text-[9px] text-stone-400 mt-0.5">${film.release_year || 'N/A'}</p>
            </div>
            <button type="button" onclick="removeFestivalFilm(${index})" class="absolute top-1 right-1 w-6 h-6 rounded bg-rose-950/80 border border-rose-500/30 text-rose-400 hover:bg-rose-900 hover:text-white transition-all flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 duration-300 z-10" title="Hapus">
                <span class="material-symbols-outlined text-sm">close</span>
            </button>
        `;
        grid.appendChild(card);
    });
}

function removeFestivalFilm(index) {
    window.selectedFestivalFilms.splice(index, 1);
    renderFestivalFilmsGrid();
}

function renderFestivalAwardsTable() {
    const tbody = document.getElementById('awards-table-body');
    const countSpan = document.getElementById('festival-awards-count');
    if (!tbody) return;

    tbody.textContent = '';
    if (countSpan) {
        countSpan.textContent = `${window.selectedFestivalAwards.length} Penghargaan`;
    }

    if (window.selectedFestivalAwards.length === 0) {
        tbody.innerHTML = `
            <tr id="awards-empty-row" class="block sm:table-row">
                <td colspan="6" class="p-6 text-center text-stone-500 italic block sm:table-cell">Belum ada penghargaan yang ditambahkan.</td>
            </tr>
        `;
        return;
    }

    window.selectedFestivalAwards.forEach((aw, index) => {
        const typeBadge = aw.award_type === 'winner'
            ? `<span class="inline-flex px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold uppercase tracking-wider">Winner</span>`
            : `<span class="inline-flex px-2 py-0.5 bg-stone-500/10 text-stone-400 border border-white/5 rounded text-[10px] font-bold uppercase tracking-wider">Nominee</span>`;

        const tr = document.createElement('tr');
        tr.className = `border-b border-white/5 hover:bg-white/[0.02] transition-colors block sm:table-row py-3 sm:py-0`;
        
        tr.innerHTML = `
            <td class="p-3 block sm:table-cell font-medium text-stone-200">
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-stone-500 text-xs sm:hidden">movie</span>
                    <span class="text-xs sm:text-sm line-clamp-1">${aw.film_title}</span>
                </div>
            </td>
            <td class="p-3 block sm:table-cell text-stone-400 text-xs sm:text-sm">
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-stone-500 text-xs sm:hidden">person</span>
                    <span>${aw.actor_name || '<span class="text-stone-600">—</span>'}</span>
                </div>
            </td>
            <td class="p-3 block sm:table-cell text-stone-300 text-xs sm:text-sm">
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-stone-500 text-xs sm:hidden">stars</span>
                    <span>${aw.category}</span>
                </div>
            </td>
            <td class="p-3 block sm:table-cell text-center text-stone-400 font-mono text-xs sm:text-sm">
                <span class="sm:hidden font-bold mr-1 text-[#c9c5cb]/40">TAHUN:</span> ${aw.year}
            </td>
            <td class="p-3 block sm:table-cell text-center text-xs sm:text-sm">
                <span class="sm:hidden font-bold mr-1 text-[#c9c5cb]/40">TIPE:</span> ${typeBadge}
            </td>
            <td class="p-3 block sm:table-cell text-center">
                <button type="button" onclick="removeFestivalAward(${index})" class="w-7 h-7 rounded border border-rose-500/10 text-rose-400 hover:bg-rose-500/10 hover:border-rose-400/50 transition-all flex items-center justify-center shadow-sm mx-auto" title="Hapus">
                    <span class="material-symbols-outlined text-sm">delete</span>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function removeFestivalAward(index) {
    window.selectedFestivalAwards.splice(index, 1);
    renderFestivalAwardsTable();
}

// State for currently creating group
window.groupWinnerFilms = [];
window.groupNominees = []; // Array of { id: uniqueIndex, actor: { id, name } || null, films: [ { id, title } ] }
let nomineeIndexCounter = 0;

// Reusable Autocomplete Helpers
function initActorAutocomplete(inputEl, idEl, autocompleteEl, onSelect = null) {
    if (!inputEl) return;
    let timeout;
    inputEl.addEventListener('input', function() {
        if (idEl) idEl.value = '';
        const query = this.value.trim();
        if (query.length < 2) {
            autocompleteEl.classList.add('hidden');
            autocompleteEl.textContent = '';
            return;
        }

        autocompleteEl.innerHTML = `<div class="px-3 py-2 text-[10px] text-stone-500 italic text-center flex items-center justify-center gap-1.5"><span class="material-symbols-outlined animate-spin text-xs">sync</span> Mencari...</div>`;
        autocompleteEl.classList.remove('hidden');

        clearTimeout(timeout);
        timeout = setTimeout(() => {
            secureFetch(`/api/actors/?search=${encodeURIComponent(query)}&page_size=5`)
                .then(res => res.json())
                .then(data => {
                    autocompleteEl.textContent = "";
                    const matches = data.results || [];
                    if (matches.length > 0) {
                        matches.forEach(actor => {
                            const div = document.createElement('div');
                            div.className = "px-3 py-1.5 hover:bg-[#715A5A]/20 cursor-pointer flex items-center gap-2 border-b border-white/5 last:border-0 text-stone-200 text-xs";
                            const photoUrl = _getActorPhotoUrl(actor);
                            const imgHtml = photoUrl
                                ? `<img src="${photoUrl}" class="w-6 h-6 rounded-full object-cover border border-white/10 shrink-0" />`
                                : `<div class="w-6 h-6 rounded-full bg-[#141314] border border-white/10 flex items-center justify-center shrink-0"><span class="material-symbols-outlined text-stone-600 text-[10px]">person</span></div>`;
                            
                            div.innerHTML = `
                                ${imgHtml}
                                <div class="flex flex-col min-w-0">
                                    <span class="text-[11px] font-semibold text-stone-200 truncate">${actor.name}</span>
                                </div>
                            `;
                            div.addEventListener('click', () => {
                                if (idEl) idEl.value = actor.id;
                                inputEl.value = actor.name;
                                autocompleteEl.classList.add('hidden');
                                autocompleteEl.textContent = '';
                                if (onSelect) onSelect(actor);
                            });
                            autocompleteEl.appendChild(div);
                        });
                    } else {
                        autocompleteEl.innerHTML = `<div class="px-3 py-2 text-[10px] text-stone-500 italic text-center">Tidak ditemukan.</div>`;
                    }
                })
                .catch(() => {
                    autocompleteEl.innerHTML = `<div class="px-3 py-2 text-[10px] text-rose-500 italic text-center">Gagal memuat.</div>`;
                });
        }, 300);
    });
}

function initFilmAutocomplete(inputEl, idEl, autocompleteEl, onSelect = null) {
    if (!inputEl) return;
    let timeout;
    inputEl.addEventListener('input', function() {
        if (idEl) idEl.value = '';
        const query = this.value.trim();
        if (query.length < 2) {
            autocompleteEl.classList.add('hidden');
            autocompleteEl.textContent = '';
            return;
        }

        autocompleteEl.innerHTML = `<div class="px-3 py-2 text-[10px] text-stone-500 italic text-center flex items-center justify-center gap-1.5"><span class="material-symbols-outlined animate-spin text-xs">sync</span> Mencari...</div>`;
        autocompleteEl.classList.remove('hidden');

        clearTimeout(timeout);
        timeout = setTimeout(() => {
            secureFetch(`/api/films/?search=${encodeURIComponent(query)}&page_size=5`)
                .then(res => res.json())
                .then(data => {
                    autocompleteEl.textContent = "";
                    const matches = data.results || [];
                    if (matches.length > 0) {
                        matches.forEach(film => {
                            const div = document.createElement('div');
                            div.className = "px-3 py-1.5 hover:bg-[#715A5A]/20 cursor-pointer flex items-center gap-2 border-b border-white/5 last:border-0 text-stone-200 text-xs";
                            const posterUrl = _getFilmPosterUrl(film);
                            const imgHtml = posterUrl
                                ? `<img src="${posterUrl}" class="w-6 h-9 object-cover rounded border border-white/10 shrink-0" />`
                                : `<div class="w-6 h-9 bg-[#141314] border border-white/10 rounded flex items-center justify-center shrink-0"><span class="material-symbols-outlined text-stone-600 text-[10px]">movie</span></div>`;
                            
                            div.innerHTML = `
                                ${imgHtml}
                                <div class="flex flex-col min-w-0">
                                    <span class="text-[11px] font-semibold text-stone-200 truncate">${film.title}</span>
                                    <span class="text-[9px] text-stone-500">${film.release_year || 'N/A'}</span>
                                </div>
                            `;
                            div.addEventListener('click', () => {
                                if (idEl) idEl.value = film.id;
                                inputEl.value = film.title;
                                autocompleteEl.classList.add('hidden');
                                autocompleteEl.textContent = '';
                                if (onSelect) onSelect(film);
                            });
                            autocompleteEl.appendChild(div);
                        });
                    } else {
                        autocompleteEl.innerHTML = `<div class="px-3 py-2 text-[10px] text-stone-500 italic text-center">Tidak ditemukan.</div>`;
                    }
                })
                .catch(() => {
                    autocompleteEl.innerHTML = `<div class="px-3 py-2 text-[10px] text-rose-500 italic text-center">Gagal memuat.</div>`;
                });
        }, 300);
    });
}

function renderGroupFilmsBadges(containerId, filmsArray, onRemoveCallback) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.textContent = '';
    
    if (filmsArray.length === 0) {
        container.innerHTML = `<span class="text-[10px] text-stone-600 italic">Belum ada film ditambahkan</span>`;
        return;
    }

    filmsArray.forEach((film, index) => {
        const badge = document.createElement('div');
        badge.className = "inline-flex items-center gap-1 px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-stone-300";
        badge.innerHTML = `
            <span class="truncate max-w-[120px]">${film.title}</span>
            <button type="button" class="text-stone-500 hover:text-rose-400 focus:outline-none flex items-center justify-center">
                <span class="material-symbols-outlined text-[10px]">close</span>
            </button>
        `;
        badge.querySelector('button').addEventListener('click', () => {
            onRemoveCallback(index);
        });
        container.appendChild(badge);
    });
}

function renderNomineeGroups() {
    const container = document.getElementById('nominee-groups-container');
    if (!container) return;
    container.textContent = '';

    if (window.groupNominees.length === 0) {
        container.innerHTML = `<div class="py-4 text-center text-stone-600 italic text-[10px]">Belum ada nominee ditambahkan</div>`;
        return;
    }

    window.groupNominees.forEach((nom, index) => {
        const row = document.createElement('div');
        row.className = "nominee-row border border-white/5 p-2.5 rounded bg-[#141314]/30 relative flex flex-col gap-2 group";
        row.setAttribute('data-index', nom.id);
        
        row.innerHTML = `
            <button type="button" class="absolute top-1.5 right-1.5 text-stone-500 hover:text-rose-400 remove-nominee-btn focus:outline-none" title="Hapus Nominee">
                <span class="material-symbols-outlined text-xs">close</span>
            </button>
            <span class="text-[9px] font-bold text-[#c9c5cb]/40 tracking-wider uppercase">NOMINEE #${index + 1}</span>
            
            <!-- Actor -->
            <div class="relative flex flex-col gap-1">
                <label class="text-[8px] font-bold text-stone-400 tracking-wider uppercase">AKTOR / AKTRIS (OPSIONAL)</label>
                <input class="nominee-actor-search w-full bg-[#141314] border border-white/10 rounded py-1 px-2 text-xs text-stone-200 placeholder-stone-600 focus:outline-none" placeholder="Cari aktor..." type="text" autocomplete="off" value="${nom.actor ? nom.actor.name : ''}" />
                <input type="hidden" class="nominee-actor-id" value="${nom.actor ? nom.actor.id : ''}">
                <div class="nominee-actor-autocomplete hidden absolute top-full left-0 right-0 mt-1 bg-[#201f20] border border-white/10 rounded shadow-xl z-[60] max-h-32 overflow-y-auto custom-scroll"></div>
            </div>

            <!-- Films Multi-add -->
            <div class="flex flex-col gap-1">
                <label class="text-[8px] font-bold text-stone-400 tracking-wider uppercase">FILM PENDUKUNG *</label>
                <div class="flex gap-1 relative">
                    <input class="nominee-film-search flex-grow bg-[#141314] border border-white/10 rounded py-1 px-2 text-xs text-stone-200 placeholder-stone-600 focus:outline-none" placeholder="Cari dan tambahkan film..." type="text" autocomplete="off" />
                    <input type="hidden" class="nominee-film-id">
                    <button type="button" class="px-2 bg-[#715A5A]/20 hover:bg-[#715A5A]/40 text-[#c9c5cb] border border-[#715A5A]/20 rounded font-bold text-xs flex items-center justify-center add-nominee-film-btn focus:outline-none">
                        <span class="material-symbols-outlined text-xs">add</span>
                    </button>
                    <div class="nominee-film-autocomplete hidden absolute top-full left-0 right-0 mt-1 bg-[#201f20] border border-white/10 rounded shadow-xl z-[60] max-h-32 overflow-y-auto custom-scroll"></div>
                </div>
                <div class="nominee-films-badges flex flex-wrap gap-1 mt-1 min-h-[16px]"></div>
            </div>
        `;

        // Bind Autocompletes for this specific dynamic Nominee Row
        const actorSearch = row.querySelector('.nominee-actor-search');
        const actorIdInput = row.querySelector('.nominee-actor-id');
        const actorAutocomplete = row.querySelector('.nominee-actor-autocomplete');
        initActorAutocomplete(actorSearch, actorIdInput, actorAutocomplete, (actor) => {
            nom.actor = { id: actor.id, name: actor.name };
        });

        actorSearch.addEventListener('input', function() {
            if (this.value.trim() === '') {
                nom.actor = null;
                actorIdInput.value = '';
            }
        });

        const filmSearch = row.querySelector('.nominee-film-search');
        const filmIdInput = row.querySelector('.nominee-film-id');
        const filmAutocomplete = row.querySelector('.nominee-film-autocomplete');
        const addFilmBtn = row.querySelector('.add-nominee-film-btn');
        const badgesContainer = row.querySelector('.nominee-films-badges');

        const renderBadges = () => {
            badgesContainer.textContent = '';
            if (nom.films.length === 0) {
                badgesContainer.innerHTML = `<span class="text-[9px] text-stone-600 italic">Belum ada film ditambahkan</span>`;
                return;
            }
            nom.films.forEach((film, idx) => {
                const badge = document.createElement('div');
                badge.className = "inline-flex items-center gap-1 px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] text-stone-300";
                badge.innerHTML = `
                    <span class="truncate max-w-[100px]">${film.title}</span>
                    <button type="button" class="text-stone-500 hover:text-rose-400 focus:outline-none flex items-center justify-center">
                        <span class="material-symbols-outlined text-[9px]">close</span>
                    </button>
                `;
                badge.querySelector('button').addEventListener('click', () => {
                    nom.films.splice(idx, 1);
                    renderBadges();
                });
                badgesContainer.appendChild(badge);
            });
        };
        renderBadges();

        initFilmAutocomplete(filmSearch, filmIdInput, filmAutocomplete, (film) => {
            if (!nom.films.some(f => f.id === film.id)) {
                nom.films.push({ id: film.id, title: film.title });
                renderBadges();
            } else {
                showToast('Film sudah ditambahkan.', 'warning');
            }
            filmSearch.value = '';
            filmIdInput.value = '';
        });

        addFilmBtn.addEventListener('click', () => {
            const filmId = filmIdInput.value;
            const filmTitle = filmSearch.value;
            if (!filmId) return;
            if (!nom.films.some(f => f.id == filmId)) {
                nom.films.push({ id: parseInt(filmId), title: filmTitle });
                renderBadges();
            }
            filmSearch.value = '';
            filmIdInput.value = '';
        });

        row.querySelector('.remove-nominee-btn').addEventListener('click', () => {
            window.groupNominees = window.groupNominees.filter(n => n.id !== nom.id);
            renderNomineeGroups();
        });

        container.appendChild(row);
    });
}

function resetGroupedAwardForm() {
    const catInput = document.getElementById('award-group-category');
    if (catInput) catInput.value = '';
    
    const yearInput = document.getElementById('award-group-year');
    if (yearInput) {
        const foundedInput = document.getElementById('festival-founded-input');
        yearInput.value = foundedInput && foundedInput.value ? parseInt(foundedInput.value) : new Date().getFullYear();
    }

    const winnerActorSearch = document.getElementById('winner-actor-search');
    const winnerActorId = document.getElementById('winner-actor-id');
    if (winnerActorSearch) winnerActorSearch.value = '';
    if (winnerActorId) winnerActorId.value = '';

    const winnerFilmSearch = document.getElementById('winner-film-search');
    const winnerFilmId = document.getElementById('winner-film-id');
    if (winnerFilmSearch) winnerFilmSearch.value = '';
    if (winnerFilmId) winnerFilmId.value = '';

    window.groupWinnerFilms = [];
    window.groupNominees = [];
    renderGroupFilmsBadges('winner-films-badges', window.groupWinnerFilms, (idx) => {
        window.groupWinnerFilms.splice(idx, 1);
        renderGroupFilmsBadges('winner-films-badges', window.groupWinnerFilms, (i) => {
            window.groupWinnerFilms.splice(i, 1);
            resetGroupedAwardForm();
        });
    });
    renderNomineeGroups();
}

function openFestivalEditor() {
    document.getElementById('festival-form').reset();
    document.getElementById('festival-id').value = '';
    document.getElementById('festival-active-input').checked = true;
    document.getElementById('festival-logo-path-input').value = '';

    const preview = document.getElementById('festival-logo-preview');
    const placeholder = document.getElementById('festival-logo-placeholder');
    if (preview && placeholder) {
        preview.src = '';
        preview.classList.add('hidden');
        placeholder.classList.remove('hidden');
    }

    window.selectedFestivalFilms = [];
    window.selectedFestivalAwards = [];
    renderFestivalFilmsGrid();
    renderFestivalAwardsTable();
    
    resetGroupedAwardForm();

    document.getElementById('festival-editor-title').textContent = 'Tambah Festival Baru';
    document.getElementById('festival-editor-title').classList.remove('hidden');
    document.getElementById('view-festivals-manage').classList.add('hidden');
    document.getElementById('view-festival-editor').classList.remove('hidden');
}

function closeFestivalEditor() {
    document.getElementById('view-festival-editor').classList.add('hidden');
    document.getElementById('view-festivals-manage').classList.remove('hidden');
}

function editFestival(fest) {
    if (typeof fest === 'number') {
        secureFetch(`/api/festivals/festivals/${fest}/`)
            .then(res => res.json())
            .then(data => _populateFestivalEditor(data))
            .catch(() => showToast('Gagal memuat data festival.', 'error'));
        return;
    }
    _populateFestivalEditor(fest);
}

function _populateFestivalEditor(fest) {
    document.getElementById('festival-id').value = fest.id;
    document.getElementById('festival-name-input').value = fest.name || '';
    document.getElementById('festival-native-name-input').value = fest.native_name || '';
    document.getElementById('festival-country-input').value = fest.country || '';
    document.getElementById('festival-city-input').value = fest.city || '';
    document.getElementById('festival-founded-input').value = fest.founded_year || '';
    document.getElementById('festival-description-input').value = fest.description || '';
    document.getElementById('festival-website-input').value = fest.website || '';
    document.getElementById('festival-active-input').checked = fest.is_active;
    document.getElementById('festival-logo-input').value = '';
    document.getElementById('festival-logo-path-input').value = fest.tmdb_logo || '';

    const preview = document.getElementById('festival-logo-preview');
    const placeholder = document.getElementById('festival-logo-placeholder');
    if (preview && placeholder) {
        let logoUrl = '';
        if (fest.local_logo) logoUrl = fest.local_logo;
        else if (fest.tmdb_logo) logoUrl = fest.tmdb_logo.startsWith('http') ? fest.tmdb_logo : `https://image.tmdb.org/t/p/w200${fest.tmdb_logo}`;
        if (logoUrl) {
            preview.src = logoUrl;
            preview.classList.remove('hidden');
            placeholder.classList.add('hidden');
        } else {
            preview.src = '';
            preview.classList.add('hidden');
            placeholder.classList.remove('hidden');
        }
    }

    window.selectedFestivalFilms = fest.films || [];
    window.selectedFestivalAwards = (fest.awards || []).map(aw => ({
        id: aw.id,
        film_id: aw.film,
        film_title: aw.film_title,
        film_poster: aw.film_poster,
        actor_id: aw.actor,
        actor_name: aw.actor_name,
        actor_photo: aw.actor_photo,
        category: aw.category,
        year: aw.year,
        award_type: aw.award_type
    }));

    renderFestivalFilmsGrid();
    renderFestivalAwardsTable();
    
    resetGroupedAwardForm();

    document.getElementById('festival-editor-title').textContent = 'Sunting Festival';
    document.getElementById('festival-editor-title').classList.remove('hidden');
    document.getElementById('view-festivals-manage').classList.add('hidden');
    document.getElementById('view-festival-editor').classList.remove('hidden');
}

function saveFestival(e) {
    e.preventDefault();
    const id = document.getElementById('festival-id').value;
    const formData = new FormData();
    formData.append('name', document.getElementById('festival-name-input').value);
    formData.append('native_name', document.getElementById('festival-native-name-input').value);
    formData.append('country', document.getElementById('festival-country-input').value);
    formData.append('city', document.getElementById('festival-city-input').value);
    const founded = document.getElementById('festival-founded-input').value;
    if (founded) formData.append('founded_year', founded);
    formData.append('description', document.getElementById('festival-description-input').value);
    formData.append('website', document.getElementById('festival-website-input').value);
    formData.append('is_active', document.getElementById('festival-active-input').checked);

    const logoFile = document.getElementById('festival-logo-input').files?.[0];
    if (logoFile) formData.append('local_logo', logoFile);
    const logoPath = document.getElementById('festival-logo-path-input').value;
    if (logoPath) formData.append('tmdb_logo', logoPath);

    formData.append('films_data', JSON.stringify(window.selectedFestivalFilms.map(f => f.id)));
    formData.append('awards_data', JSON.stringify(window.selectedFestivalAwards));

    const url = id ? `/api/festivals/festivals/${id}/` : '/api/festivals/festivals/';
    const method = id ? 'PUT' : 'POST';

    secureFetch(url, { method, body: formData })
        .then(res => {
            if (!res.ok) throw new Error('Gagal menyimpan festival');
            return res.json();
        })
        .then(() => {
            showToast('Festival berhasil disimpan!', 'success');
            closeFestivalEditor();
            if (window.fetchFestivals) window.fetchFestivals(window.festivalCurrentPage || 1);
        })
        .catch(() => showToast('Gagal menyimpan festival', 'error'));
}

// Binds all autocomplete events for Editor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Close editor buttons
    document.getElementById('festival-editor-cancel-btn')?.addEventListener('click', closeFestivalEditor);
    document.getElementById('festival-editor-close-btn')?.addEventListener('click', closeFestivalEditor);

    // Save form submit
    document.getElementById('festival-form')?.addEventListener('submit', saveFestival);

    // Logo upload preview
    const logoInput = document.getElementById('festival-logo-input');
    const logoPreview = document.getElementById('festival-logo-preview');
    const logoPlaceholder = document.getElementById('festival-logo-placeholder');
    logoInput?.addEventListener('change', function () {
        if (this.files?.[0]) {
            const reader = new FileReader();
            reader.onload = e => {
                if (logoPreview && logoPlaceholder) {
                    logoPreview.src = e.target.result;
                    logoPreview.classList.remove('hidden');
                    logoPlaceholder.classList.add('hidden');
                }
            };
            reader.readAsDataURL(this.files[0]);
        }
    });
    document.getElementById('festival-logo-trigger-btn')?.addEventListener('click', () => {
        document.getElementById('festival-logo-input')?.click();
    });

    // 1. Autocomplete: Festival Featured Movies
    const filmSearchInput = document.getElementById('festival-film-search-input');
    const filmAutocomplete = document.getElementById('festival-film-autocomplete');
    let filmSearchTimeout;

    filmSearchInput?.addEventListener('input', function() {
        const query = this.value.trim();
        if (query.length < 2) {
            filmAutocomplete.classList.add('hidden');
            filmAutocomplete.textContent = '';
            return;
        }

        filmAutocomplete.innerHTML = `<div class="px-4 py-3 text-xs text-stone-500 italic text-center flex items-center justify-center gap-2"><span class="material-symbols-outlined animate-spin text-sm">sync</span> Mencari film...</div>`;
        filmAutocomplete.classList.remove('hidden');

        clearTimeout(filmSearchTimeout);
        filmSearchTimeout = setTimeout(() => {
            secureFetch(`/api/films/?search=${encodeURIComponent(query)}&page_size=5`)
                .then(res => res.json())
                .then(data => {
                    filmAutocomplete.textContent = "";
                    const matches = data.results || [];
                    if (matches.length > 0) {
                        matches.forEach(film => {
                            const div = document.createElement('div');
                            div.className = "px-4 py-2 hover:bg-[#715A5A]/20 cursor-pointer flex items-center gap-3 border-b border-white/5 last:border-0 text-stone-200";
                            const posterUrl = _getFilmPosterUrl(film);
                            const imgHtml = posterUrl
                                ? `<img src="${posterUrl}" class="w-8 h-12 object-cover rounded border border-white/10 shrink-0" />`
                                : `<div class="w-8 h-12 bg-[#141314] border border-white/10 rounded flex items-center justify-center shrink-0"><span class="material-symbols-outlined text-stone-600 text-xs">movie</span></div>`;
                            
                            div.innerHTML = `
                                ${imgHtml}
                                <div class="flex flex-col">
                                    <span class="text-xs font-semibold text-stone-200 line-clamp-1">${film.title}</span>
                                    <span class="text-[10px] text-stone-500">${film.release_year || 'N/A'}</span>
                                </div>
                            `;
                            div.addEventListener('click', () => {
                                if (!window.selectedFestivalFilms.some(f => f.id === film.id)) {
                                    window.selectedFestivalFilms.push({
                                        id: film.id,
                                        film_title: film.title,
                                        film_poster: film.tmdb_poster || film.local_poster,
                                        release_year: film.release_year
                                    });
                                    renderFestivalFilmsGrid();
                                } else {
                                    showToast('Film sudah ditambahkan ke festival.', 'warning');
                                }
                                filmSearchInput.value = '';
                                filmAutocomplete.classList.add('hidden');
                                filmAutocomplete.textContent = '';
                            });
                            filmAutocomplete.appendChild(div);
                        });
                    } else {
                        filmAutocomplete.innerHTML = `<div class="px-4 py-3 text-xs text-stone-500 italic text-center">Tidak ditemukan.</div>`;
                    }
                })
                .catch(() => {
                    filmAutocomplete.innerHTML = `<div class="px-4 py-3 text-xs text-rose-500 italic text-center">Gagal memuat.</div>`;
                });
        }, 300);
    });

    // 2. Initialize Autocomplete for Winner Inputs
    const winnerActorSearch = document.getElementById('winner-actor-search');
    const winnerActorId = document.getElementById('winner-actor-id');
    const winnerActorAutocomplete = document.getElementById('winner-actor-autocomplete');
    initActorAutocomplete(winnerActorSearch, winnerActorId, winnerActorAutocomplete);

    winnerActorSearch?.addEventListener('input', function() {
        if (this.value.trim() === '') winnerActorId.value = '';
    });

    const winnerFilmSearch = document.getElementById('winner-film-search');
    const winnerFilmId = document.getElementById('winner-film-id');
    const winnerFilmAutocomplete = document.getElementById('winner-film-autocomplete');
    const addWinnerFilmBtn = document.getElementById('add-winner-film-btn');

    const updateWinnerBadges = () => {
        renderGroupFilmsBadges('winner-films-badges', window.groupWinnerFilms, (idx) => {
            window.groupWinnerFilms.splice(idx, 1);
            updateWinnerBadges();
        });
    };

    initFilmAutocomplete(winnerFilmSearch, winnerFilmId, winnerFilmAutocomplete, (film) => {
        if (!window.groupWinnerFilms.some(f => f.id === film.id)) {
            window.groupWinnerFilms.push({ id: film.id, title: film.title });
            updateWinnerBadges();
        } else {
            showToast('Film sudah ditambahkan ke Winner.', 'warning');
        }
        winnerFilmSearch.value = '';
        winnerFilmId.value = '';
    });

    addWinnerFilmBtn?.addEventListener('click', () => {
        const filmId = winnerFilmId.value;
        const filmTitle = winnerFilmSearch.value.trim();
        if (!filmId) {
            showToast('Silakan cari dan pilih film dari daftar rekomendasi.', 'warning');
            return;
        }
        if (!window.groupWinnerFilms.some(f => f.id == filmId)) {
            window.groupWinnerFilms.push({ id: parseInt(filmId), title: filmTitle });
            updateWinnerBadges();
        }
        winnerFilmSearch.value = '';
        winnerFilmId.value = '';
    });

    // 3. Nominees Section Add Row Button
    const addNomineeGroupBtn = document.getElementById('add-nominee-group-btn');
    addNomineeGroupBtn?.addEventListener('click', () => {
        nomineeIndexCounter++;
        window.groupNominees.push({
            id: nomineeIndexCounter,
            actor: null,
            films: []
        });
        renderNomineeGroups();
    });

    // 4. Submit/Push Grouped Award Button
    const addGroupedAwardBtn = document.getElementById('add-grouped-award-btn');
    addGroupedAwardBtn?.addEventListener('click', () => {
        const category = document.getElementById('award-group-category').value.trim();
        const year = parseInt(document.getElementById('award-group-year').value);

        if (!category) {
            showToast('Kategori penghargaan wajib diisi.', 'warning');
            return;
        }
        if (!year) {
            showToast('Tahun penghargaan wajib diisi.', 'warning');
            return;
        }

        // Winner validation: Must have at least 1 film
        if (window.groupWinnerFilms.length === 0) {
            showToast('Winner wajib memiliki minimal 1 film pendukung.', 'warning');
            return;
        }

        const winnerActorIdVal = winnerActorId.value ? parseInt(winnerActorId.value) : null;
        const winnerActorNameVal = winnerActorSearch.value.trim();

        // 1. Push Winner records
        let addedCount = 0;
        window.groupWinnerFilms.forEach((film) => {
            const duplicate = window.selectedFestivalAwards.some(aw => 
                aw.film_id == film.id && 
                aw.actor_id == winnerActorIdVal && 
                aw.category.toLowerCase() === category.toLowerCase() && 
                aw.year == year && 
                aw.award_type === 'winner'
            );

            if (!duplicate) {
                window.selectedFestivalAwards.push({
                    film_id: film.id,
                    film_title: film.title,
                    actor_id: winnerActorIdVal,
                    actor_name: winnerActorIdVal ? winnerActorNameVal : '',
                    category: category,
                    year: year,
                    award_type: 'winner'
                });
                addedCount++;
            }
        });

        // 2. Push Nominees records
        window.groupNominees.forEach((nom) => {
            if (nom.films.length === 0) return; // skip nominee without films

            const nomActorId = nom.actor ? nom.actor.id : null;
            const nomActorName = nom.actor ? nom.actor.name : '';

            nom.films.forEach((film) => {
                const duplicate = window.selectedFestivalAwards.some(aw => 
                    aw.film_id == film.id && 
                    aw.actor_id == nomActorId && 
                    aw.category.toLowerCase() === category.toLowerCase() && 
                    aw.year == year && 
                    aw.award_type === 'nominee'
                );

                if (!duplicate) {
                    window.selectedFestivalAwards.push({
                        film_id: film.id,
                        film_title: film.title,
                        actor_id: nomActorId,
                        actor_name: nomActorId ? nomActorName : '',
                        category: category,
                        year: year,
                        award_type: 'nominee'
                    });
                    addedCount++;
                }
            });
        });

        if (addedCount > 0) {
            showToast(`${addedCount} Penghargaan berhasil ditambahkan ke daftar!`, 'success');
            renderFestivalAwardsTable();
            resetGroupedAwardForm();
        } else {
            showToast('Penghargaan sudah ada di daftar sebelumnya.', 'warning');
        }
    });

    // Close autocompletes on clicking outside
    document.addEventListener('click', function(e) {
        if (!filmSearchInput?.contains(e.target) && !filmAutocomplete?.contains(e.target)) {
            filmAutocomplete?.classList.add('hidden');
        }
        if (!winnerActorSearch?.contains(e.target) && !winnerActorAutocomplete?.contains(e.target)) {
            winnerActorAutocomplete?.classList.add('hidden');
        }
        if (!winnerFilmSearch?.contains(e.target) && !winnerFilmAutocomplete?.contains(e.target)) {
            winnerFilmAutocomplete?.classList.add('hidden');
        }
        
        // Dynamic nominees autocomplete closing
        document.querySelectorAll('.nominee-row').forEach(row => {
            const actorInput = row.querySelector('.nominee-actor-search');
            const actorAuto = row.querySelector('.nominee-actor-autocomplete');
            if (actorInput && actorAuto && !actorInput.contains(e.target) && !actorAuto.contains(e.target)) {
                actorAuto.classList.add('hidden');
            }
            
            const filmInput = row.querySelector('.nominee-film-search');
            const filmAuto = row.querySelector('.nominee-film-autocomplete');
            if (filmInput && filmAuto && !filmInput.contains(e.target) && !filmAuto.contains(e.target)) {
                filmAuto.classList.add('hidden');
            }
        });
    });
});

// Expose globally
window.renderFestivalFilmsGrid = renderFestivalFilmsGrid;
window.removeFestivalFilm = removeFestivalFilm;
window.renderFestivalAwardsTable = renderFestivalAwardsTable;
window.removeFestivalAward = removeFestivalAward;
window.openFestivalEditor = openFestivalEditor;
window.closeFestivalEditor = closeFestivalEditor;
window.editFestival = editFestival;
window._populateFestivalEditor = _populateFestivalEditor;
window.saveFestival = saveFestival;
window.resetGroupedAwardForm = resetGroupedAwardForm;
window.renderGroupFilmsBadges = renderGroupFilmsBadges;
window.renderNomineeGroups = renderNomineeGroups;
window.initActorAutocomplete = initActorAutocomplete;
window.initFilmAutocomplete = initFilmAutocomplete;
