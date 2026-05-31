/**
 * admin/editor.js
 * Handles: Film CRUD editor, gallery, cast/filmography management.
 */

let tempBackdropFiles = [];

function openEditor(filmId) {
    selectedFilmId = filmId;
    const formPosterPreview = document.getElementById('form-poster-preview');
    const formPosterPlaceholder = document.getElementById('form-poster-placeholder');
    const formPosterInput = document.getElementById('form-poster-input');
    const editorGallerySection = document.getElementById('editor-gallery-section');
    const formDeleteBtn = document.getElementById('form-delete-btn');
    const editorRejectionAlert = document.getElementById('editor-rejection-alert');

    document.getElementById('film-form').reset();
    formPosterPreview.src = "";
    formPosterPreview.classList.add('hidden');
    formPosterPlaceholder.classList.remove('hidden');
    document.querySelectorAll('input[name="genres-checkbox"]').forEach(cb => cb.checked = false);

    if (selectedFilmId) {
        document.getElementById('editor-title').textContent = "Edit Film";
        document.getElementById('editor-subtitle').textContent = "Ubah detail metadata dan unggah berkas galeri.";
        formDeleteBtn.classList.remove('hidden');
        editorGallerySection.classList.remove('hidden');

        fetch(`/api/films/${selectedFilmId}/`, {

        })
            .then(res => res.json())
            .then(async (film) => {
                currentFilmData = film;
                document.getElementById('form-title').value = film.title || "";
                document.getElementById('form-synopsis').value = film.synopsis || "";
                document.getElementById('form-year').value = film.release_year || "";
                document.getElementById('form-duration').value = film.duration || "";
                document.getElementById('form-popularity').value = Math.round(film.popularity) || 0;
                document.getElementById('form-trailer').value = film.trailer_url || "";

                const isTvSeriesCb = document.getElementById('form-is-tv-series');
                const epsContainer = document.getElementById('episodes-container');
                isTvSeriesCb.checked = !!film.is_tv_series;
                document.getElementById('form-episodes-count').value = film.episodes_count || "";
                epsContainer.style.display = film.is_tv_series ? 'flex' : 'none';

                if (genresList.length === 0) await fetchGenres();
                else renderFormGenres();

                if (film.genre_display && film.genre_display.length > 0) {
                    setTimeout(() => {
                        film.genre_display.forEach(genre => {
                            const cb = document.querySelector(`input[name="genres-checkbox"][value="${genre.id}"]`);
                            if (cb) cb.checked = true;
                        });
                    }, 50);
                }

                _loadFilmPoster(film, formPosterPreview, formPosterPlaceholder);
                renderEditorStatusBadge(film.status);

                if (film.status === 'rejected' && film.rejection_reason) {
                    document.getElementById('rejection-reason-text').textContent = film.rejection_reason;
                    editorRejectionAlert.classList.remove('hidden');
                } else {
                    editorRejectionAlert.classList.add('hidden');
                }

                activeGalleryImages = film.images || [];
                stagedImageDeletions = [];
                tempBackdropFiles = [];
                renderGalleryGrid(activeGalleryImages);

                selectedCastData = film.cast ? film.cast.map(c => ({
                    actor_id: c.actor_id, role_name: c.role_name, role_type: c.role_type, order: c.order,
                    actorData: { name: c.actor_name, local_photo: c.actor_local_photo, tmdb_photo: c.actor_photo }
                })) : [];
                renderFilmCastRows();
                showMoviesSubView('editor');
            })
            .catch(() => showToast('Gagal memuat detail film.', 'error'));
    } else {
        document.getElementById('editor-title').textContent = "Tambah Film Baru";
        document.getElementById('editor-subtitle').textContent = "Tambahkan film baru ke database lokal secara manual.";
        formDeleteBtn.classList.add('hidden');
        editorRejectionAlert.classList.add('hidden');
        ['form-title', 'form-synopsis', 'form-year', 'form-duration', 'form-popularity', 'form-trailer'].forEach(id => {
            document.getElementById(id).value = "";
        });
        activeGalleryImages = [];
        stagedImageDeletions = [];
        tempBackdropFiles = [];
        renderGalleryGrid(activeGalleryImages);
        updateGalleryCounter();
        renderEditorStatusBadge('draft');
        selectedCastData = [];
        renderFilmCastRows();
        if (genresList.length === 0) fetchGenres();
        else renderFormGenres();
        showMoviesSubView('editor');
    }
}

function _loadFilmPoster(film, previewEl, placeholderEl) {
    let url = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500";
    if (film.local_poster) {
        url = film.local_poster;
    } else if (film.tmdb_poster) {
        url = film.tmdb_poster.startsWith('http') ? film.tmdb_poster : `https://image.tmdb.org/t/p/w500${film.tmdb_poster}`;
    }
    if (url) {
        previewEl.src = url;
        previewEl.classList.remove('hidden');
        placeholderEl.classList.add('hidden');
    }
}

function renderEditorStatusBadge(status) {
    const container = document.getElementById('editor-status-badge');
    container.textContent = "";
    const badge = document.createElement('span');
    badge.className = "px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase whitespace-nowrap ";
    const statusMap = {
        published: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25",
        pending_approval: "bg-amber-500/10 text-amber-400 border border-amber-500/25",
        rejected: "bg-rose-500/10 text-rose-400 border border-rose-500/25",
    };
    badge.className += statusMap[status] || "bg-stone-500/10 text-stone-400 border border-white/10";
    badge.textContent = status === 'pending_approval' ? 'Pending Approval' : (status || 'Draft');
    container.appendChild(badge);
}

// ---- Gallery ----
function updateGalleryCounter() {
    const total = activeGalleryImages.length + tempBackdropFiles.length;
    document.getElementById('gallery-image-count').textContent = `${total}/8`;
}

function renderGalleryGrid(images) {
    const grid = document.getElementById('editor-gallery-grid');
    grid.textContent = "";
    const allImages = [
        ...images.map(img => ({ ...img, isTemp: false })),
        ...tempBackdropFiles.map((file, idx) => ({ file, id: `temp-${idx}`, isTemp: true }))
    ];
    updateGalleryCounter();
    if (allImages.length === 0) {
        const empty = document.createElement('div');
        empty.className = "col-span-full py-8 text-center text-[#c9c5cb]/40 italic text-[10px]";
        empty.textContent = "Galeri kosong.";
        grid.appendChild(empty);
        return;
    }
    allImages.forEach((img, idx) => {
        const div = document.createElement('div');
        div.className = "min-w-0 aspect-video bg-black/35 rounded border border-white/5 relative overflow-hidden group shadow-sm";
        const image = document.createElement('img');
        image.className = "w-full h-full object-cover";
        image.src = img.isTemp ? URL.createObjectURL(img.file) : (img.file_path.startsWith('/media/') ? img.file_path : `https://image.tmdb.org/t/p/w500${img.file_path}`);
        image.alt = "Backdrop";
        div.appendChild(image);
        const del = document.createElement('button');
        del.className = "absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-rose-400";
        del.type = "button";
        del.innerHTML = `<span class="material-symbols-outlined text-lg">delete</span>`;
        del.addEventListener('click', () => {
            if (img.isTemp) {
                const tempIdx = idx - images.length;
                if (tempIdx >= 0) tempBackdropFiles.splice(tempIdx, 1);
            } else {
                activeGalleryImages = activeGalleryImages.filter(i => i.id !== img.id);
                if (!stagedImageDeletions.includes(img.id)) stagedImageDeletions.push(img.id);
            }
            renderGalleryGrid(activeGalleryImages);
        });
        div.appendChild(del);
        grid.appendChild(div);
    });
}

// ---- Cast ----
function renderFilmCastRows() {
    const castTableBody = document.getElementById('cast-table-body');
    const castCount = document.getElementById('cast-count');
    castTableBody.textContent = "";
    castCount.textContent = `${selectedCastData.length} Sineas`;
    if (selectedCastData.length === 0) {
        castTableBody.innerHTML = `<tr id="cast-empty-row" class="block sm:table-row"><td colspan="5" class="p-6 text-center text-stone-500 italic block sm:table-cell">Belum ada pemeran yang ditambahkan.</td></tr>`;
        return;
    }
    selectedCastData.sort((a, b) => a.order - b.order).forEach((cast, idx) => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-white/5 hover:bg-white/[0.02] transition-colors block sm:table-row p-4 sm:p-0 flex flex-col sm:flex-none gap-3.5 sm:gap-0";
        let photoUrl = "/static/images/placeholder-poster.jpg";
        if (cast.actorData) {
            if (cast.actorData.local_photo) {
                photoUrl = cast.actorData.local_photo;
            } else if (cast.actorData.tmdb_photo) {
                photoUrl = cast.actorData.tmdb_photo.startsWith('http') ? cast.actorData.tmdb_photo : `https://image.tmdb.org/t/p/w200${cast.actorData.tmdb_photo}`;
            }
        }
        tr.innerHTML = `
            <td class="p-0 sm:p-3 block sm:table-cell text-left sm:text-center">
                <div class="flex items-center gap-3 sm:block">
                    <img src="${photoUrl}" class="w-10 h-10 object-cover rounded-full border border-white/10 sm:mx-auto shadow-md" alt="Photo" />
                    <div class="block sm:hidden font-semibold text-stone-200 text-sm">${cast.actorData ? cast.actorData.name : 'Unknown'}</div>
                </div>
            </td>
            <td class="p-0 sm:p-3 block sm:table-cell">
                <div class="hidden sm:block font-semibold text-stone-200 mb-1.5">${cast.actorData ? cast.actorData.name : 'Unknown'}</div>
                <div class="text-[9px] font-bold text-stone-400 tracking-wider uppercase mb-1 block sm:hidden">PERAN SINEAS</div>
                <select class="w-full bg-[#141314] border border-white/10 rounded-md py-1.5 px-2 text-xs text-stone-200 focus:border-[#715A5A] focus:outline-none" onchange="updateCastRoleType(${idx}, this.value)">
                    <option value="lead" ${cast.role_type === 'lead' ? 'selected' : ''}>Pemeran Utama</option>
                    <option value="supporting" ${cast.role_type === 'supporting' || !cast.role_type ? 'selected' : ''}>Pemeran Pendukung</option>
                    <option value="cameo" ${cast.role_type === 'cameo' ? 'selected' : ''}>Kameo</option>
                    <option value="director" ${cast.role_type === 'director' ? 'selected' : ''}>Sutradara</option>
                    <option value="producer" ${cast.role_type === 'producer' ? 'selected' : ''}>Produser</option>
                    <option value="writer" ${cast.role_type === 'writer' ? 'selected' : ''}>Penulis Skenario</option>
                    <option value="other" ${cast.role_type === 'other' ? 'selected' : ''}>Lainnya</option>
                </select>
            </td>
            <td class="p-0 sm:p-3 block sm:table-cell text-stone-400 align-bottom">
                <div class="text-[9px] font-bold text-stone-400 tracking-wider uppercase mb-1 block sm:hidden">NAMA PERAN</div>
                <input type="text" class="w-full bg-[#141314] border border-white/10 rounded-md py-1.5 px-2 text-xs text-stone-200 focus:border-[#715A5A] focus:outline-none" value="${cast.role_name}" onchange="updateCastRole(${idx}, this.value)" />
            </td>
            <td class="p-0 sm:p-3 block sm:table-cell text-left sm:text-center text-stone-400 align-bottom font-['DM_Sans']">
                <div class="text-[9px] font-bold text-stone-400 tracking-wider uppercase mb-1 block sm:hidden">URUTAN TAMPIL</div>
                <input type="number" class="w-full sm:w-16 bg-[#141314] border border-white/10 rounded-md py-1.5 px-2 text-xs text-stone-200 text-left sm:text-center focus:border-[#715A5A] focus:outline-none" value="${cast.order}" onchange="updateCastOrder(${idx}, this.value)" />
            </td>
            <td class="p-0 sm:p-3 block sm:table-cell text-center align-middle sm:align-bottom">
                <button type="button" class="w-full sm:w-7 h-9 sm:h-7 rounded border border-rose-500/10 text-rose-400 hover:bg-rose-500/10 hover:border-rose-400/50 transition-all flex items-center justify-center gap-1.5 sm:gap-0 font-semibold text-xs sm:text-base sm:mx-auto mb-[2px]" onclick="removeCastRow(${idx})">
                    <span class="material-symbols-outlined text-sm">delete</span>
                    <span class="inline sm:hidden">Hapus Pemeran</span>
                </button>
            </td>
        `;
        castTableBody.appendChild(tr);
    });
}

window.updateCastRoleType = (idx, val) => {
    if (selectedCastData[idx]) {
        selectedCastData[idx].role_type = val;
        renderFilmCastRows();
    }
};

window.updateCastRole = (idx, val) => {
    if (selectedCastData[idx]) {
        selectedCastData[idx].role_name = val;
        renderFilmCastRows();
    }
};

window.updateCastOrder = (idx, val) => { if (selectedCastData[idx]) selectedCastData[idx].order = parseInt(val) || 0; };
window.removeCastRow = (idx) => { selectedCastData.splice(idx, 1); renderFilmCastRows(); };

document.addEventListener('DOMContentLoaded', () => {
    // Poster upload
    document.getElementById('form-poster-trigger-btn')?.addEventListener('click', () => document.getElementById('form-poster-input').click());
    document.getElementById('form-poster-input')?.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size / (1024 * 1024) > 5) { showToast('Maksimal ukuran poster adalah 5MB.', 'error'); e.target.value = ""; return; }
        const reader = new FileReader();
        reader.onload = ev => {
            document.getElementById('form-poster-preview').src = ev.target.result;
            document.getElementById('form-poster-preview').classList.remove('hidden');
            document.getElementById('form-poster-placeholder').classList.add('hidden');
        };
        reader.readAsDataURL(file);
    });

    // Gallery upload
    document.getElementById('form-gallery-trigger-btn')?.addEventListener('click', () => document.getElementById('form-gallery-input').click());
    document.getElementById('form-gallery-input')?.addEventListener('change', e => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const existingCount = activeGalleryImages.length + tempBackdropFiles.length;
        if (existingCount + files.length > 8) { showToast('Maksimal galeri backdrop adalah 8 gambar.', 'warning'); e.target.value = ""; return; }
        Array.from(files).forEach(file => {
            if (file.size / (1024 * 1024) > 5) { showToast(`File ${file.name} melebihi 5MB.`, 'warning'); return; }
            if (!selectedFilmId) {
                tempBackdropFiles.push(file);
                renderGalleryGrid(activeGalleryImages);
            } else {
                const fd = new FormData();
                fd.append('image', file);
                fd.append('image_type', 'backdrop');
                secureFetch(`/api/films/${selectedFilmId}/images/`, { method: 'POST', body: fd })
                    .then(res => { if (!res.ok) throw new Error(); return res.json(); })
                    .then(img => { activeGalleryImages.push(img); renderGalleryGrid(activeGalleryImages); })
                    .catch(() => showToast(`Gagal unggah ${file.name}`, 'error'));
            }
        });
        e.target.value = "";
    });

    // Cast search autocomplete
    const castSearchInput = document.getElementById('cast-search-input');
    const castAutocompleteResults = document.getElementById('cast-autocomplete-results');
    const addCastBtn = document.getElementById('add-cast-btn');
    const castRoleInput = document.getElementById('cast-role-input');
    const castRoleTypeInput = document.getElementById('cast-role-type-input');

    let castSearchTimeout = null;
    castSearchInput?.addEventListener('input', e => {
        const query = e.target.value.trim();
        castAutocompleteResults.textContent = "";
        selectedActorForCast = null;
        addCastBtn.disabled = true;

        if (query.length < 2) {
            castAutocompleteResults.classList.add('hidden');
            return;
        }

        castAutocompleteResults.innerHTML = `<div class="px-4 py-3 text-xs text-stone-500 italic text-center flex items-center justify-center gap-2"><span class="material-symbols-outlined animate-spin text-sm">sync</span> Mencari...</div>`;
        castAutocompleteResults.classList.remove('hidden');

        clearTimeout(castSearchTimeout);
        castSearchTimeout = setTimeout(() => {
            fetch(`/api/actors/?search=${encodeURIComponent(query)}&page_size=5`, {

            })
                .then(res => res.json())
                .then(data => {
                    castAutocompleteResults.textContent = "";
                    const matches = data.results || [];
                    if (matches.length > 0) {
                        matches.forEach(actor => {
                            const div = document.createElement('div');
                            div.className = "px-4 py-2 hover:bg-[#715A5A]/20 cursor-pointer flex items-center gap-3 border-b border-white/5 last:border-0";
                            let photoUrl = "/static/images/placeholder-poster.jpg";
                            if (actor.local_photo) {
                                photoUrl = actor.local_photo;
                            } else if (actor.tmdb_photo) {
                                photoUrl = actor.tmdb_photo.startsWith('http') ? actor.tmdb_photo : `https://image.tmdb.org/t/p/w200${actor.tmdb_photo}`;
                            }
                            div.innerHTML = `<img src="${photoUrl}" class="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0" /><div class="flex flex-col"><span class="text-xs font-semibold text-stone-200 line-clamp-1">${actor.name}</span><span class="text-[10px] text-stone-500">${actor.tmdb_id ? 'TMDB: ' + actor.tmdb_id : 'Local'}</span></div>`;
                            div.addEventListener('click', () => {
                                selectedActorForCast = actor;
                                castSearchInput.value = actor.name;
                                castAutocompleteResults.classList.add('hidden');
                                addCastBtn.disabled = false;
                                castRoleInput.focus();
                            });
                            castAutocompleteResults.appendChild(div);
                        });
                    } else {
                        castAutocompleteResults.innerHTML = `<div class="px-4 py-3 text-xs text-stone-500 italic text-center">Tidak ditemukan. Pastikan sineas terdaftar di database.</div>`;
                    }
                })
                .catch(err => {
                    castAutocompleteResults.innerHTML = `<div class="px-4 py-3 text-xs text-rose-500 italic text-center">Gagal memuat hasil pencarian.</div>`;
                });
        }, 400); // 400ms debounce
    });

    document.addEventListener('click', e => {
        if (!castSearchInput?.contains(e.target) && !castAutocompleteResults?.contains(e.target)) {
            castAutocompleteResults?.classList.add('hidden');
        }
    });

    addCastBtn?.addEventListener('click', () => {
        if (!selectedActorForCast) return;
        if (selectedCastData.some(c => c.actor_id === selectedActorForCast.id)) { showToast('Aktor ini sudah ada di daftar cast!', 'warning'); return; }

        let initialRoleName = castRoleInput.value.trim();

        selectedCastData.push({ actor_id: selectedActorForCast.id, role_name: initialRoleName, role_type: castRoleTypeInput.value, order: selectedCastData.length, actorData: selectedActorForCast });
        castSearchInput.value = "";
        castRoleInput.value = "";
        castRoleTypeInput.value = "supporting";
        selectedActorForCast = null;
        addCastBtn.disabled = true;
        renderFilmCastRows();
    });

    // Cancel / Back
    document.getElementById('form-cancel-btn')?.addEventListener('click', () => showMoviesSubView('manage'));
    document.getElementById('editor-back-btn')?.addEventListener('click', () => showMoviesSubView('manage'));

    // Save
    document.getElementById('form-save-btn')?.addEventListener('click', _saveFilm);

    // Delete
    document.getElementById('form-delete-btn')?.addEventListener('click', () => {
        const toast = _buildConfirmToast(`Apakah Anda yakin ingin menghapus '${currentFilmData.title}' secara permanen?`, () => {
            secureFetch(`/api/films/${selectedFilmId}/`, { method: 'DELETE' })
                .then(res => { if (!res.ok) throw new Error(); showToast('Film berhasil terhapus.', 'success'); showMoviesSubView('manage'); })
                .catch(() => showToast('Gagal menghapus film.', 'error'));
        });
        document.body.appendChild(toast);
    });
});

function _saveFilm() {
    const titleVal = document.getElementById('form-title').value.trim();
    const synopsisVal = document.getElementById('form-synopsis').value.trim();
    const yearVal = document.getElementById('form-year').value;
    const durationVal = document.getElementById('form-duration').value;
    const popularityVal = document.getElementById('form-popularity').value;
    const trailerVal = document.getElementById('form-trailer').value.trim();
    const isTvSeries = document.getElementById('form-is-tv-series').checked;
    const epsCountVal = document.getElementById('form-episodes-count').value;
    const genreIds = Array.from(document.querySelectorAll('input[name="genres-checkbox"]:checked')).map(cb => parseInt(cb.value));
    const formSaveBtn = document.getElementById('form-save-btn');

    if (!titleVal || !yearVal) { showToast('Harap lengkapi judul dan tahun rilis.', 'warning'); return; }
    if (genreIds.length === 0) { showToast('Pilih minimal satu genre.', 'warning'); return; }

    const formData = new FormData();
    formData.append('title', titleVal);
    formData.append('synopsis', synopsisVal);
    formData.append('release_year', parseInt(yearVal));
    if (durationVal) formData.append('duration', parseInt(durationVal));
    if (popularityVal) formData.append('popularity', parseFloat(popularityVal));
    formData.append('trailer_url', trailerVal);
    formData.append('is_tv_series', isTvSeries);
    if (isTvSeries && epsCountVal) formData.append('episodes_count', parseInt(epsCountVal));
    genreIds.forEach(id => formData.append('genre', id));
    formData.append('actors_data', JSON.stringify(selectedCastData.map(c => ({ actor_id: c.actor_id, role_name: c.role_name, role_type: c.role_type, order: c.order }))));

    const posterFile = document.getElementById('form-poster-input').files[0];
    if (posterFile) {
        formData.append('local_poster', posterFile);
    } else if (!selectedFilmId) {
        showToast('Harap unggah poster film untuk film baru.', 'warning'); return;
    }

    formSaveBtn.disabled = true;
    const url = selectedFilmId ? `/api/films/${selectedFilmId}/` : '/api/films/';
    const method = selectedFilmId ? 'PUT' : 'POST';

    secureFetch(url, { method, body: formData })
        .then(res => {
            formSaveBtn.disabled = false;
            if (!res.ok) return res.json().then(err => { throw new Error(err.error || 'Validasi server gagal'); });
            return res.json();
        })
        .then(savedFilm => {
            const filmIdToUse = selectedFilmId || savedFilm.id;

            const handleDeletions = () => {
                if (stagedImageDeletions.length === 0) return Promise.resolve();
                return Promise.all(stagedImageDeletions.map(imgId =>
                    secureFetch(`/api/films/${filmIdToUse}/images/${imgId}/`, { method: 'DELETE' }).catch(console.error)
                )).then(() => { stagedImageDeletions = []; });
            };

            const uploadTempBackdrops = () => {
                if (tempBackdropFiles.length === 0) return Promise.resolve();
                return Promise.all(tempBackdropFiles.map(file => {
                    const fd = new FormData();
                    fd.append('image', file);
                    fd.append('image_type', 'backdrop');
                    return secureFetch(`/api/films/${filmIdToUse}/images/`, { method: 'POST', body: fd }).catch(console.error);
                }));
            };

            handleDeletions().then(uploadTempBackdrops).then(() => {
                showToast('Film berhasil disimpan!', 'success');
                document.getElementById('film-form').reset();
                document.getElementById('form-poster-preview').classList.add('hidden');
                document.getElementById('form-poster-placeholder').classList.remove('hidden');
                document.getElementById('editor-gallery-grid').textContent = "";
                selectedFilmId = null;
                tempBackdropFiles = [];
                activeGalleryImages = [];
                updateGalleryCounter();
                showMoviesSubView('manage');
            }).catch(() => { showToast('Film disimpan tapi ada error saat upload backdrop.', 'warning'); showMoviesSubView('manage'); });
        })
        .catch(err => { formSaveBtn.disabled = false; console.error(err); showToast(err.message || 'Gagal menyimpan data film.', 'error'); });
}

document.addEventListener("DOMContentLoaded", function () {
    const isTvSeriesCb = document.getElementById('form-is-tv-series');
    const epsContainer = document.getElementById('episodes-container');
    if (isTvSeriesCb && epsContainer) {
        isTvSeriesCb.addEventListener('change', function () {
            epsContainer.style.display = this.checked ? 'flex' : 'none';
        });
    }
});
