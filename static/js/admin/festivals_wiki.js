/**
 * admin/festivals_wiki.js
 * Handles: Wikipedia Accolades Importer and dynamic autocomplete film search.
 */

function openWikiImportModal() {
    const searchInput = document.getElementById('wiki-import-film-search');
    const hiddenIdInput = document.getElementById('wiki-import-film-id');
    const autocompleteDiv = document.getElementById('wiki-import-film-autocomplete');

    if (searchInput) searchInput.value = '';
    if (hiddenIdInput) hiddenIdInput.value = '';
    if (autocompleteDiv) {
        autocompleteDiv.classList.add('hidden');
        autocompleteDiv.textContent = '';
    }

    document.getElementById('wiki-import-form').reset();
    const statusDiv = document.getElementById('wiki-import-status');
    if (statusDiv) statusDiv.classList.add('hidden');
    document.getElementById('wiki-import-modal').classList.remove('hidden');
}

function closeWikiImportModal() {
    document.getElementById('wiki-import-modal').classList.add('hidden');
}

function submitWikiImport(e) {
    e.preventDefault();
    const filmId = document.getElementById('wiki-import-film-id')?.value;
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
        body: JSON.stringify({ film_id: parseInt(filmId), wikipedia_url: wikiUrl })
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
        if (window.fetchFestivals) window.fetchFestivals(1);
    })
    .catch(err => {
        statusText.textContent = 'Import Gagal!';
        statusText.className = 'text-rose-400 font-semibold text-xs';
        statusDetails.textContent = err.message || 'Terjadi kesalahan.';
        showToast('Gagal mengimpor penghargaan', 'error');
    })
    .finally(() => { submitBtn.disabled = false; });
}

// Inisialisasi Autocomplete untuk Wikipedia Importer Film Search
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('wiki-import-film-search');
    const hiddenIdInput = document.getElementById('wiki-import-film-id');
    const autocompleteDiv = document.getElementById('wiki-import-film-autocomplete');
    let searchTimeout;

    searchInput?.addEventListener('input', function() {
        hiddenIdInput.value = '';
        const query = this.value.trim();
        if (query.length < 2) {
            autocompleteDiv.classList.add('hidden');
            autocompleteDiv.textContent = '';
            return;
        }

        autocompleteDiv.innerHTML = `<div class="px-4 py-3 text-xs text-stone-500 italic text-center flex items-center justify-center gap-2"><span class="material-symbols-outlined animate-spin text-sm">sync</span> Mencari film...</div>`;
        autocompleteDiv.classList.remove('hidden');

        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            secureFetch(`/api/films/?search=${encodeURIComponent(query)}&page_size=5`)
                .then(res => res.json())
                .then(data => {
                    autocompleteDiv.textContent = "";
                    const matches = data.results || [];
                    if (matches.length > 0) {
                        matches.forEach(film => {
                            const div = document.createElement('div');
                            div.className = "px-4 py-2 hover:bg-[#715A5A]/20 cursor-pointer flex items-center gap-3 border-b border-white/5 last:border-0 text-stone-200";
                            const posterUrl = window._getFilmPosterUrl ? window._getFilmPosterUrl(film) : '';
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
                                hiddenIdInput.value = film.id;
                                searchInput.value = film.title;
                                autocompleteDiv.classList.add('hidden');
                                autocompleteDiv.textContent = '';
                            });
                            autocompleteDiv.appendChild(div);
                        });
                    } else {
                        autocompleteDiv.innerHTML = `<div class="px-4 py-3 text-xs text-stone-500 italic text-center">Tidak ditemukan.</div>`;
                    }
                })
                .catch(() => {
                    autocompleteDiv.innerHTML = `<div class="px-4 py-3 text-xs text-rose-500 italic text-center">Gagal memuat.</div>`;
                });
        }, 300);
    });

    document.addEventListener('click', function(e) {
        if (!searchInput?.contains(e.target) && !autocompleteDiv?.contains(e.target)) {
            autocompleteDiv?.classList.add('hidden');
        }
    });
});

// Expose globally
window.openWikiImportModal = openWikiImportModal;
window.closeWikiImportModal = closeWikiImportModal;
window.submitWikiImport = submitWikiImport;
