/**
 * admin/festivals.js
 * Handles: Core Festival CRUD List, Search, Pagination, Deletion.
 * Targets < 200 lines.
 */

window.festivalCurrentPage = 1;

function initFestivals() {
    fetchFestivals(1);
}

// =============================================
// FETCH FESTIVALS
// =============================================
function fetchFestivals(page = 1) {
    window.festivalCurrentPage = page;
    const search = document.getElementById('festival-search')?.value.trim() || '';
    const tbody = document.getElementById('festivals-tbody');
    const loading = document.getElementById('festivals-loading');
    const empty = document.getElementById('festivals-empty');
    const countInfo = document.getElementById('festivals-count-info');

    if (!tbody) return;
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

    festivals.forEach((fest) => {
        let logoUrl = '';
        if (fest.local_logo) {
            logoUrl = fest.local_logo;
        } else if (fest.tmdb_logo) {
            logoUrl = fest.tmdb_logo.startsWith('http')
                ? fest.tmdb_logo
                : `https://image.tmdb.org/t/p/w200${fest.tmdb_logo}`;
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
// DELETE FESTIVAL
// =============================================
function deleteFestival(id, name) {
    const toast = _buildConfirmToast(`Hapus Festival '${name}' secara permanen?`, () => {
        secureFetch(`/api/festivals/festivals/${id}/`, { method: 'DELETE' })
            .then(res => {
                if (!res.ok) throw new Error();
                showToast('Festival berhasil dihapus.', 'success');
                fetchFestivals(window.festivalCurrentPage);
            })
            .catch(() => showToast('Gagal menghapus festival', 'error'));
    });
    document.body.appendChild(toast);
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

// Search listeners on DOM load
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('festival-search');
    searchInput?.addEventListener('input', debouncedFetchFestivals);
    document.getElementById('festival-search-icon-btn')?.addEventListener('click', () => fetchFestivals(1));
});

// Expose core functions to window scope
window.fetchFestivals = fetchFestivals;
window.deleteFestival = deleteFestival;
window._buildConfirmToast = _buildConfirmToast;
window.initFestivals = initFestivals;
