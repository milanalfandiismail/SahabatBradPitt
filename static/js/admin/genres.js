/**
 * admin/genres.js
 * Handles: Genre CRUD, fetching, rendering list, and deletion.
 * Target < 150 lines.
 */

window.genresList = [];

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

    if (genresTableBody) {
        genresTableBody.textContent = '';
        genresEmpty?.classList.add('hidden');
        genresLoading?.classList.remove('hidden');
    }

    return fetchAllGenres().then(all => {
        window.genresList = all;
        if (typeof genresList !== 'undefined') {
            genresList = all;
        }

        if (typeof renderFormGenres === 'function') {
            renderFormGenres();
        }

        if (genresTableBody) {
            genresLoading?.classList.add('hidden');
            if (all.length === 0) {
                genresEmpty?.classList.remove('hidden');
            } else {
                renderGenresTable();
            }
        }
        return all;
    }).catch(err => {
        console.error("Gagal memuat daftar genre:", err);
        if (genresTableBody) {
            genresLoading?.classList.add('hidden');
            genresEmpty?.classList.remove('hidden');
        }
        showToast('Gagal memuat daftar genre.', 'error');
        throw err;
    });
}

function renderGenresTable() {
    const genresTableBody = document.getElementById('genres-table-body');
    const genresEmpty = document.getElementById('genres-empty');
    if (!genresTableBody) return;
    genresTableBody.textContent = "";
    genresEmpty?.classList.add('hidden');

    if (window.genresList.length === 0) {
        genresEmpty?.classList.remove('hidden');
        return;
    }

    window.genresList.forEach((genre) => {
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

// Open / Close actions for Genre Form UIs
function openGenreEditor() {
    document.getElementById('genre-form').reset();
    document.getElementById('view-genres-manage').classList.add('hidden');
    document.getElementById('view-genre-editor').classList.remove('hidden');
}

function closeGenreEditor() {
    document.getElementById('view-genre-editor').classList.add('hidden');
    document.getElementById('view-genres-manage').classList.remove('hidden');
}

// Event bindings on DOM load
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('add-genre-btn')?.addEventListener('click', openGenreEditor);
    document.getElementById('genre-editor-cancel-btn')?.addEventListener('click', closeGenreEditor);
    document.getElementById('genre-editor-close-btn')?.addEventListener('click', closeGenreEditor);
    document.getElementById('genre-form')?.addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('genre-form-name').value.trim();
        if (!name) return;
        secureFetch('/api/films/genres/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        })
            .then(res => { if (!res.ok) throw new Error(); return res.json(); })
            .then(() => { showToast('Genre Kustom berhasil ditambahkan!', 'success'); closeGenreEditor(); fetchGenres(); })
            .catch(() => showToast('Gagal menambahkan genre kustom.', 'error'));
    });
});

// Expose functions globally
window.fetchAllGenres = fetchAllGenres;
window.fetchGenres = fetchGenres;
window.renderGenresTable = renderGenresTable;
window.deleteGenre = deleteGenre;
window.openGenreEditor = openGenreEditor;
window.closeGenreEditor = closeGenreEditor;
