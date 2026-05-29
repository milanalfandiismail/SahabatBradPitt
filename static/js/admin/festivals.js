/**
 * admin/festivals.js
 * Handles: Festival CRUD, List, Editor, Search, Pagination, Wikipedia Import.
 * Consistent pattern with other admin sections.
 */

let festivalCurrentPage = 1;

function initFestivals() {
    fetchFestivals(1);
}

// =============================================
// FETCH FESTIVALS
// =============================================
function fetchFestivals(page = 1) {
    festivalCurrentPage = page;
    const search = document.getElementById('festival-search')?.value.trim() || '';
    const tbody = document.getElementById('festivals-tbody');
    const loading = document.getElementById('festivals-loading');
    const empty = document.getElementById('festivals-empty');
    const countInfo = document.getElementById('festivals-count-info');

    tbody.textContent = '';
    empty?.classList.add('hidden');
    loading?.classList.remove('hidden');

    let url = `/api/festivals/festivals/?page=${page}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    secureFetch(url)
        .then(res => {
            if (!res.ok) throw new Error('Gagal mengambil data festival');
            return res.json();
        })
        .then(data => {
            loading?.classList.add('hidden');
            const festivals = data.results || [];
            const total = data.count || festivals.length;
            const totalPages = Math.ceil(total / 10);

            if (countInfo) {
                const start = (page - 1) * 10 + 1;
                const end = Math.min(page * 10, total);
                countInfo.textContent = total > 0
                    ? `Menampilkan ${start} - ${end} dari ${total} festival`
                    : `0 hasil ditemukan`;
            }

            if (festivals.length === 0) {
                empty?.classList.remove('hidden');
                renderFestivalsPagination(1, totalPages, total);
                return;
            }

            renderFestivalsTable(festivals);
            renderFestivalsPagination(page, totalPages);
        })
        .catch(err => {
            loading?.classList.add('hidden');
            console.error('Error fetching festivals:', err);
            showToast('Gagal memuat data festival', 'error');
        });
}

// =============================================
// SEARCH HANDLER (debounced)
// =============================================
// Debounce utility
function _debounceFestival(fn, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

const debouncedFetchFestivals = _debounceFestival(() => fetchFestivals(1), 400);

// =============================================
// RENDER TABLE
// =============================================
function renderFestivalsTable(festivals) {
    const tbody = document.getElementById('festivals-tbody');
    if (!tbody) return;
    tbody.textContent = '';

    festivals.forEach((fest, idx) => {
        let logoUrl = '';
        if (fest.logo) {
            logoUrl = fest.logo;
        } else if (fest.logo_path) {
            logoUrl = fest.logo_path.startsWith('http')
                ? fest.logo_path
                : `https://image.tmdb.org/t/p/w200${fest.logo_path}`;
        }

        const logoHtml = logoUrl
            ? `<img src="${logoUrl}" class="h-12 w-12 object-contain bg-[#141314] rounded p-1 shadow-inner" alt="${fest.name}">`
            : `<div class="h-12 w-12 bg-[#141314] rounded flex items-center justify-center shadow-inner">
                 <span class="material-symbols-outlined text-amber-500 text-xl" style="font-variation-settings:'FILL'1">emoji_events</span>
               </div>`;

        const loc = [fest.city, fest.country].filter(Boolean).join(', ') || '—';

        const tr = document.createElement('tr');
        tr.className = `border-b border-white/5 hover:bg-white/[0.03] transition-colors group`;

        tr.innerHTML = `
            <td class="p-2 sm:p-4 text-center align-middle shrink-0 hidden sm:table-cell">
                ${logoHtml}
            </td>
            <td class="p-2 sm:p-4 align-middle">
                <div class="font-semibold text-stone-100 text-sm leading-tight mb-1">${fest.name}</div>
                ${fest.native_name ? `<div class="text-[11px] text-stone-500 italic mb-1">${fest.native_name}</div>` : ''}
                <div class="text-xs text-stone-500">${loc}</div>
            </td>
            <td class="p-2 sm:p-4 text-center align-middle hidden md:table-cell">
                <span class="text-sm text-stone-400 font-['DM_Sans']">${fest.founded_year || '—'}</span>
            </td>
            <td class="p-2 sm:p-4 text-center align-middle w-[80px] sm:w-[100px]">
                ${fest.is_active
                    ? `<span class="inline-flex px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold uppercase tracking-wider">Active</span>`
                    : `<span class="inline-flex px-2.5 py-1 bg-stone-500/10 text-stone-500 border border-white/5 rounded text-[10px] font-bold uppercase tracking-wider">Inactive</span>`
                }
            </td>
            <td class="p-2 sm:p-4 text-right align-middle w-[100px] sm:w-[120px]">
                <div class="flex items-center justify-end gap-1.5">
                    <button onclick="editFestival(${fest.id})" class="w-7 h-7 rounded border border-white/10 text-stone-300 hover:border-white/40 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center shadow-sm" title="Sunting">
                        <span class="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button onclick="deleteFestival(${fest.id}, '${fest.name.replace(/'/g, "\\'")}')" class="w-7 h-7 rounded border border-rose-500/10 text-rose-400 hover:bg-rose-500/10 hover:border-rose-400/50 transition-all flex items-center justify-center shadow-sm" title="Hapus">
                        <span class="material-symbols-outlined text-sm">delete</span>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// =============================================
// PAGINATION
// =============================================
function renderFestivalsPagination(currentPage, totalPages) {
    const container = document.getElementById('festivals-pagination-controls');
    if (!container) return;
    container.textContent = '';

    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.className = `flex items-center justify-center w-7 h-7 rounded border transition-all text-xs font-bold ${
        currentPage === 1
            ? 'border-white/5 text-stone-600 cursor-not-allowed opacity-50'
            : 'border-white/10 text-stone-300 hover:border-[#715A5A] hover:bg-white/5'
    }`;
    prevBtn.innerHTML = `<span class="material-symbols-outlined text-sm">chevron_left</span>`;
    if (currentPage > 1) prevBtn.addEventListener('click', () => fetchFestivals(currentPage - 1));
    container.appendChild(prevBtn);

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);

    for (let i = start; i <= end; i++) {
        const btn = document.createElement('button');
        btn.className = `w-7 h-7 rounded border text-xs font-bold transition-all ${
            i === currentPage
                ? 'bg-[#715A5A] border-[#715A5A] text-white shadow-md'
                : 'border-white/10 text-stone-300 hover:border-[#715A5A] hover:bg-white/5'
        }`;
        btn.textContent = i;
        btn.addEventListener('click', () => fetchFestivals(i));
        container.appendChild(btn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.className = `flex items-center justify-center w-7 h-7 rounded border transition-all text-xs font-bold ${
        currentPage === totalPages
            ? 'border-white/5 text-stone-600 cursor-not-allowed opacity-50'
            : 'border-white/10 text-stone-300 hover:border-[#715A5A] hover:bg-white/5'
    }`;
    nextBtn.innerHTML = `<span class="material-symbols-outlined text-sm">chevron_right</span>`;
    if (currentPage < totalPages) nextBtn.addEventListener('click', () => fetchFestivals(currentPage + 1));
    container.appendChild(nextBtn);
}

// =============================================
// OPEN EDITOR (create)
// =============================================
function openFestivalEditor() {
    document.getElementById('festival-form').reset();
    document.getElementById('festival-id').value = '';
    document.getElementById('festival-active-input').checked = true;
    document.getElementById('festival-logo-path-input').value = '';

    // Logo preview reset
    const preview = document.getElementById('festival-logo-preview');
    const placeholder = document.getElementById('festival-logo-placeholder');
    if (preview && placeholder) {
        preview.src = '';
        preview.classList.add('hidden');
        placeholder.classList.remove('hidden');
    }

    document.getElementById('festival-editor-title').textContent = 'Tambah Festival Baru';
    document.getElementById('festival-editor-title').classList.remove('hidden');
    document.getElementById('view-festivals-manage').classList.add('hidden');
    document.getElementById('view-festival-editor').classList.remove('hidden');
}

function closeFestivalEditor() {
    document.getElementById('view-festival-editor').classList.add('hidden');
    document.getElementById('view-festivals-manage').classList.remove('hidden');
}

// =============================================
// EDIT FESTIVAL (pre-fill form)
// =============================================
function editFestival(fest) {
    // If fest is just an ID, fetch full data
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
    document.getElementById('festival-logo-path-input').value = fest.logo_path || '';

    // Logo preview
    const preview = document.getElementById('festival-logo-preview');
    const placeholder = document.getElementById('festival-logo-placeholder');
    if (preview && placeholder) {
        let logoUrl = '';
        if (fest.logo) logoUrl = fest.logo;
        else if (fest.logo_path) logoUrl = fest.logo_path.startsWith('http') ? fest.logo_path : `https://image.tmdb.org/t/p/w200${fest.logo_path}`;
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

    document.getElementById('festival-editor-title').textContent = 'Sunting Festival';
    document.getElementById('festival-editor-title').classList.remove('hidden');
    document.getElementById('view-festivals-manage').classList.add('hidden');
    document.getElementById('view-festival-editor').classList.remove('hidden');
}

// =============================================
// SAVE FESTIVAL
// =============================================
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
    if (logoFile) formData.append('logo', logoFile);
    const logoPath = document.getElementById('festival-logo-path-input').value;
    if (logoPath) formData.append('logo_path', logoPath);

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
            fetchFestivals(festivalCurrentPage);
        })
        .catch(() => showToast('Gagal menyimpan festival', 'error'));
}

// =============================================
// DELETE FESTIVAL
// =============================================
function deleteFestival(id, name) {
    const toast = _buildConfirmToast(`Hapus Festival '${name}' secara permanen?`, () => {
        secureFetch(`/api/festivals/festivals/${id}/`, { method: 'DELETE' })
            .then(res => {
                if (!res.ok) throw new Error();
                showToast('Festival berhasil dihapus.', 'success');
                fetchFestivals(festivalCurrentPage);
            })
            .catch(() => showToast('Gagal menghapus festival', 'error'));
    });
    document.body.appendChild(toast);
}

// =============================================
// WIKIPEDIA IMPORT
// =============================================
function openWikiImportModal() {
    const filmSelect = document.getElementById('wiki-import-film-select');
    if (!filmSelect) return;

    filmSelect.innerHTML = '<option value="">Memuat daftar film...</option>';
    document.getElementById('wiki-import-form').reset();
    const statusDiv = document.getElementById('wiki-import-status');
    if (statusDiv) statusDiv.classList.add('hidden');
    document.getElementById('wiki-import-modal').classList.remove('hidden');

    secureFetch('/api/films/?limit=100')
        .then(res => res.json())
        .then(data => {
            const films = data.results || data;
            filmSelect.innerHTML = '<option value="">-- Pilih Film --</option>';
            films.forEach(film => {
                const opt = document.createElement('option');
                opt.value = film.id;
                opt.textContent = `${film.title} (${film.release_year || 'N/A'})`;
                filmSelect.appendChild(opt);
            });
        })
        .catch(() => {
            filmSelect.innerHTML = '<option value="">Gagal memuat film</option>';
            showToast('Gagal memuat daftar film', 'error');
        });
}

function closeWikiImportModal() {
    document.getElementById('wiki-import-modal').classList.add('hidden');
}

function submitWikiImport(e) {
    e.preventDefault();
    const filmId = document.getElementById('wiki-import-film-select').value;
    const wikiUrl = document.getElementById('wiki-import-url-input').value;
    if (!filmId) { showToast('Pilih film terlebih dahulu', 'warning'); return; }

    const statusDiv = document.getElementById('wiki-import-status');
    const statusText = document.getElementById('wiki-import-status-text');
    const statusDetails = document.getElementById('wiki-import-status-details');
    const submitBtn = document.getElementById('wiki-import-submit-btn');

    statusDiv.classList.remove('hidden');
    statusText.textContent = 'Menghubungi Wikipedia & memproses...';
    statusText.className = 'text-blue-400 font-semibold text-xs';
    statusDetails.textContent = 'Mencari halaman Wikipedia...';
    submitBtn.disabled = true;

    secureFetch('/api/festivals/wikipedia-import/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ film_id: filmId, wikipedia_url: wikiUrl })
    })
    .then(res => {
        if (!res.ok) return res.json().then(err => { throw new Error(err.error || 'Import gagal'); });
        return res.json();
    })
    .then(data => {
        statusText.textContent = `Berhasil! Ditemukan ${data.total_extracted} data.`;
        statusText.className = 'text-emerald-400 font-semibold text-xs';
        statusDetails.textContent = `Baru: ${data.imported} | Sudah ada: ${data.skipped}`;
        showToast(`Berhasil mengimpor ${data.imported} penghargaan!`, 'success');
        closeWikiImportModal();
        if (document.getElementById('section-festivals')) fetchFestivals(1);
    })
    .catch(err => {
        statusText.textContent = 'Import Gagal!';
        statusText.className = 'text-rose-400 font-semibold text-xs';
        statusDetails.textContent = err.message || 'Terjadi kesalahan.';
        showToast('Gagal mengimpor penghargaan', 'error');
    })
    .finally(() => { submitBtn.disabled = false; });
}

// =============================================
// CONFIRM TOAST
// =============================================
function _buildConfirmToast(message, onConfirm) {
    const toast = document.createElement('div');
    toast.className = 'bg-[#201f20] border border-rose-500/20 p-4 rounded-lg flex flex-col gap-3 font-[\'DM_Sans\'] text-xs text-[#c9c5cb] shadow-2xl fixed bottom-6 right-6 z-50 max-w-sm animate-fade-up';
    const p = document.createElement('p');
    p.className = 'font-medium text-stone-200';
    p.textContent = message;
    const btnGroup = document.createElement('div');
    btnGroup.className = 'flex gap-2 justify-end';
    const okBtn = document.createElement('button');
    okBtn.className = 'px-3 py-1.5 rounded bg-rose-500 text-white font-semibold hover:bg-rose-600 transition-all';
    okBtn.textContent = 'Ya, Hapus';
    okBtn.addEventListener('click', () => { onConfirm(); toast.remove(); });
    const noBtn = document.createElement('button');
    noBtn.className = 'px-3 py-1.5 rounded border border-white/10 text-[#c9c5cb] hover:bg-white/5 transition-all';
    noBtn.textContent = 'Batal';
    noBtn.addEventListener('click', () => toast.remove());
    btnGroup.appendChild(noBtn);
    btnGroup.appendChild(okBtn);
    toast.appendChild(p);
    toast.appendChild(btnGroup);
    return toast;
}

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    // Search
    const searchInput = document.getElementById('festival-search');
    searchInput?.addEventListener('input', debouncedFetchFestivals);
    document.getElementById('festival-search-icon-btn')?.addEventListener('click', () => fetchFestivals(1));

    // Close editor
    document.getElementById('festival-editor-cancel-btn')?.addEventListener('click', closeFestivalEditor);
    document.getElementById('festival-editor-close-btn')?.addEventListener('click', closeFestivalEditor);

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

    // Wikipedia import modal close on backdrop
    const wikiModal = document.getElementById('wiki-import-modal');
    wikiModal?.addEventListener('click', (e) => {
        if (e.target === wikiModal) closeWikiImportModal();
    });
});

// Expose globally
window.fetchFestivals = fetchFestivals;
window.openFestivalEditor = openFestivalEditor;
window.closeFestivalEditor = closeFestivalEditor;
window.editFestival = editFestival;
window.deleteFestival = deleteFestival;
window.saveFestival = saveFestival;
window.openWikiImportModal = openWikiImportModal;
window.closeWikiImportModal = closeWikiImportModal;
window.submitWikiImport = submitWikiImport;
window.initFestivals = initFestivals;
window._buildConfirmToast = _buildConfirmToast;
