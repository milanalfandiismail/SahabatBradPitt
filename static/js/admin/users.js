/**
 * admin/users.js
 * Handles: User management (Superuser only).
 * Includes: Search filter, server-side pagination, modal integration.
 * Mirrors pagination pattern from movies.js / actors.js / festivals.js.
 */

// selectedUserId sudah dideklarasikan di core.js sebagai global
let usersCurrentPage = 1;

// =============================================
// FETCH & RENDER USERS
// =============================================
function fetchUsers(page = 1) {
    usersCurrentPage = page;
    const tbody = document.getElementById('users-table-body');
    const empty = document.getElementById('users-empty');
    const loading = document.getElementById('users-loading');
    const error = document.getElementById('users-error');
    const paginationInfo = document.getElementById('users-pagination-info');
    const paginationControls = document.getElementById('users-pagination-controls');

    tbody.textContent = '';
    empty?.classList.add('hidden');
    error?.classList.add('hidden');
    loading?.classList.remove('hidden');

    // Build query params — kirim filter ke backend biar server-side pagination jalan
    const params = new URLSearchParams();
    params.append('page', page);

    const search = document.getElementById('users-search-input')?.value.trim();
    if (search) params.append('search', search);

    const roleFilter = document.getElementById('users-role-filter')?.value || 'all';
    if (roleFilter !== 'all') params.append('role', roleFilter);

    const loginFilter = document.getElementById('users-login-filter')?.value || 'all';
    if (loginFilter !== 'all') params.append('login_provider', loginFilter);

    secureFetch(`/api/auth/users/?${params.toString()}`)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(data => {
            loading?.classList.add('hidden');
            const users = data.results || [];
            const total = data.count || 0;

            if (users.length === 0) {
                empty?.classList.remove('hidden');
                if (paginationInfo) paginationInfo.textContent = 'Menampilkan 0 pengguna';
                if (paginationControls) paginationControls.textContent = '';
                return;
            }

            renderUsersTable(users);

            // Pagination info
            const start = (page - 1) * 12 + 1;
            const end = Math.min(page * 12, total);
            if (paginationInfo) {
                paginationInfo.textContent = `Menampilkan ${start} - ${end} dari ${total} pengguna`;
            }

            // Pagination controls
            renderUsersPagination(page, total);
        })
        .catch(() => {
            loading?.classList.add('hidden');
            error?.classList.remove('hidden');
            showToast('Gagal memuat daftar pengguna.', 'error');
        });
}

function renderUsersTable(users) {
    const tbody = document.getElementById('users-table-body');
    tbody.textContent = '';

    users.forEach((user, idx) => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-white/5 hover:bg-white/[0.03] hover:-translate-y-0.5 transition-all font-[\'DM_Sans\']';
        tr.style.animationDelay = `${idx * 60}ms`;

        const tdUsername = document.createElement('td');
        tdUsername.className = 'p-2 sm:p-4 font-semibold text-stone-200 text-sm align-middle min-w-[100px] sm:min-w-[150px]';
        tdUsername.textContent = user.username;
        tr.appendChild(tdUsername);

        const tdEmail = document.createElement('td');
        tdEmail.className = 'p-2 sm:p-4 text-stone-400 align-middle text-sm hidden md:table-cell';
        tdEmail.textContent = user.email || '-';
        tr.appendChild(tdEmail);

        const tdLoginVia = document.createElement('td');
        tdLoginVia.className = 'p-2 sm:p-4 text-center align-middle w-[100px] sm:w-[120px]';
        const loginBadge = document.createElement('span');
        const authProvider = (user.profile && user.profile.auth_provider) ? user.profile.auth_provider : 'local';
        loginBadge.className = 'inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded text-[10px] font-bold uppercase tracking-wider ' +
            (authProvider === 'google'
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20');
        loginBadge.innerHTML = authProvider === 'google' 
            ? '<img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" class="w-3 h-3" alt="G"> GOOGLE' 
            : '<span class="material-symbols-outlined text-[10px]">key</span> LOKAL';
        tdLoginVia.appendChild(loginBadge);
        tr.appendChild(tdLoginVia);

        const tdStaff = document.createElement('td');
        tdStaff.className = 'p-2 sm:p-4 text-center align-middle w-[80px] sm:w-[120px]';
        const staffBadge = document.createElement('span');
        staffBadge.className = 'inline-flex px-2 py-0.5 sm:px-2.5 sm:py-1 rounded text-[10px] font-bold uppercase tracking-wider ' +
            (user.is_staff
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-stone-500/10 text-stone-500');
        staffBadge.textContent = user.is_staff ? 'Admin' : 'Regular';
        tdStaff.appendChild(staffBadge);
        tr.appendChild(tdStaff);

        const tdSuper = document.createElement('td');
        tdSuper.className = 'p-2 sm:p-4 text-center align-middle w-[80px] sm:w-[120px]';
        const superBadge = document.createElement('span');
        superBadge.className = 'inline-flex px-2 py-0.5 sm:px-2.5 sm:py-1 rounded text-[10px] font-bold uppercase tracking-wider ' +
            (user.is_superuser
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-stone-500/10 text-stone-500');
        superBadge.textContent = user.is_superuser ? 'Super Admin' : '—';
        tdSuper.appendChild(superBadge);
        tr.appendChild(tdSuper);

        const tdActions = document.createElement('td');
        tdActions.className = 'p-2 sm:p-4 text-center align-middle w-[80px] sm:w-[100px]';
        const actionsWrapper = document.createElement('div');
        actionsWrapper.className = 'flex items-center justify-center gap-1.5';

        const editBtn = document.createElement('button');
        editBtn.className = 'w-7 h-7 rounded border border-white/10 text-stone-300 hover:border-white/40 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center shadow-sm';
        editBtn.innerHTML = `<span class="material-symbols-outlined text-sm">edit</span>`;
        editBtn.title = 'Sunting pengguna';
        editBtn.addEventListener('click', () => openUserEditor(user));
        actionsWrapper.appendChild(editBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'w-7 h-7 rounded border border-rose-500/10 text-rose-400 hover:bg-rose-500/10 hover:border-rose-400/50 hover:text-rose-300 transition-all flex items-center justify-center shadow-sm';
        deleteBtn.innerHTML = `<span class="material-symbols-outlined text-sm">delete</span>`;
        deleteBtn.title = 'Hapus pengguna';
        deleteBtn.addEventListener('click', () => deleteUser(user.id, user.username));
        actionsWrapper.appendChild(deleteBtn);

        tdActions.appendChild(actionsWrapper);
        tr.appendChild(tdActions);
        tbody.appendChild(tr);
    });
}

// =============================================
// PAGINATION CONTROLS
// =============================================
function renderUsersPagination(page, totalCount) {
    const container = document.getElementById('users-pagination-controls');
    if (!container) return;
    container.textContent = '';
    const totalPages = Math.ceil(totalCount / 12);
    if (totalPages <= 1) return;

    // Prev button
    const prev = document.createElement('button');
    prev.className = `flex items-center justify-center w-7 h-7 rounded border border-white/10 text-stone-300 hover:border-[#715A5A] hover:bg-white/5 transition-all text-xs ${page === 1 ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`;
    prev.innerHTML = `<span class="material-symbols-outlined text-sm">chevron_left</span>`;
    prev.addEventListener('click', () => fetchUsers(page - 1));
    container.appendChild(prev);

    // Page numbers
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    for (let i = start; i <= end; i++) {
        const btn = document.createElement('button');
        btn.className = `w-7 h-7 rounded border text-xs font-bold transition-all ${i === page ? 'bg-[#715A5A] border-[#715A5A] text-white shadow-md' : 'border-white/10 text-stone-300 hover:border-[#715A5A] hover:bg-white/5'}`;
        btn.textContent = i;
        btn.addEventListener('click', () => fetchUsers(i));
        container.appendChild(btn);
    }

    // Next button
    const next = document.createElement('button');
    next.className = `flex items-center justify-center w-7 h-7 rounded border border-white/10 text-stone-300 hover:border-[#715A5A] hover:bg-white/5 transition-all text-xs ${page === totalPages ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`;
    next.innerHTML = `<span class="material-symbols-outlined text-sm">chevron_right</span>`;
    next.addEventListener('click', () => fetchUsers(page + 1));
    container.appendChild(next);
}

// =============================================
// USER EDITOR MODAL
// =============================================
function openUserEditor(user) {
    document.getElementById('user-form').reset();
    const usernameInput = document.getElementById('user-form-username');
    const modal = document.getElementById('user-editor-modal');

    if (user) {
        selectedUserId = user.id;
        document.getElementById('user-editor-title').textContent = 'Sunting Otoritas Pengguna';
        usernameInput.value = user.username;
        usernameInput.disabled = true;
        document.getElementById('user-form-email').value = user.email || '';
        document.getElementById('user-form-password').placeholder = 'Ketik password baru (biarkan kosong jika tidak diubah)';
        document.getElementById('user-form-is-staff').checked = user.is_staff;
        document.getElementById('user-form-is-superuser').checked = user.is_superuser;
    } else {
        selectedUserId = null;
        document.getElementById('user-editor-title').textContent = 'Tambah Pengguna / Admin Baru';
        usernameInput.disabled = false;
        document.getElementById('user-form-email').value = '';
        document.getElementById('user-form-password').placeholder = 'Kata sandi wajib diisi (min. 8 karakter)';
        document.getElementById('user-form-is-staff').checked = false;
        document.getElementById('user-form-is-superuser').checked = false;
    }

    modal.classList.remove('hidden');
}

// =============================================
// DELETE USER
// =============================================
function deleteUser(id, username) {
    const toast = _buildConfirmToast(`Hapus pengguna '${username}' secara permanen? Aksi ini tidak dapat dibatalkan.`, () => {
        secureFetch(`/api/auth/users/${id}/`, { method: 'DELETE' })
            .then(res => {
                if (!res.ok) return res.json().then(err => { throw new Error(err.error || 'Gagal menghapus pengguna.'); });
                showToast('Pengguna terhapus.', 'success');
                fetchUsers(usersCurrentPage);
            })
            .catch(err => showToast(err.message || 'Gagal menghapus pengguna.', 'error'));
    });
    document.body.appendChild(toast);
}

// =============================================
// CONFIRM TOAST FACTORY
// =============================================
function _buildConfirmToast(message, onConfirm) {
    const toast = document.createElement('div');
    toast.className = 'bg-[#201f20] border border-rose-500/20 p-4 rounded-lg flex flex-col gap-3 font-[\'DM_Sans\'] text-xs text-[#c9c5cb] shadow-2xl fixed bottom-6 right-6 z-50 max-w-sm animate-fade-up';

    const p = document.createElement('p');
    p.className = 'font-medium text-stone-200';
    p.textContent = message;

    const btnGroup = document.createElement('div');
    btnGroup.className = 'flex gap-2 justify-end';

    const noBtn = document.createElement('button');
    noBtn.className = 'px-3 py-1.5 rounded border border-white/10 text-[#c9c5cb] hover:bg-white/5 transition-all font-semibold';
    noBtn.textContent = 'Batal';
    noBtn.addEventListener('click', () => toast.remove());

    const yesBtn = document.createElement('button');
    yesBtn.className = 'px-3 py-1.5 rounded text-white bg-rose-500 hover:bg-rose-600 transition-all font-semibold';
    yesBtn.textContent = 'Ya, Hapus';
    yesBtn.addEventListener('click', () => { onConfirm(); toast.remove(); });

    btnGroup.appendChild(noBtn);
    btnGroup.appendChild(yesBtn);
    toast.appendChild(p);
    toast.appendChild(btnGroup);
    return toast;
}

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    // Load first page on mount
    fetchUsers(1);

    // Search with debounce — reset ke halaman 1
    const searchInput = document.getElementById('users-search-input');
    let searchTimeout = null;
    searchInput?.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => fetchUsers(1), 500);
    });

    document.getElementById('users-search-icon-btn')?.addEventListener('click', () => fetchUsers(1));

    // Filter changes — reset ke halaman 1
    document.getElementById('users-role-filter')?.addEventListener('change', () => fetchUsers(1));
    document.getElementById('users-login-filter')?.addEventListener('change', () => fetchUsers(1));

    // Add user button
    document.getElementById('add-user-btn')?.addEventListener('click', () => openUserEditor(null));

    // Cancel/close modal
    document.getElementById('user-editor-cancel-btn')?.addEventListener('click', () => {
        document.getElementById('user-editor-modal').classList.add('hidden');
    });

    // User editor modal close on backdrop click
    const userModal = document.getElementById('user-editor-modal');
    userModal?.addEventListener('click', (e) => {
        if (e.target === userModal) {
            userModal.classList.add('hidden');
        }
    });

    // User form submit
    document.getElementById('user-form')?.addEventListener('submit', e => {
        e.preventDefault();
        const submitBtn = document.getElementById('user-editor-save-btn');
        const username = document.getElementById('user-form-username').value.trim();
        const email = document.getElementById('user-form-email').value.trim();
        const password = document.getElementById('user-form-password').value;
        const isStaff = document.getElementById('user-form-is-staff').checked;
        const isSuperuser = document.getElementById('user-form-is-superuser').checked;

        if (!username || !email) { showToast('Username dan Email wajib diisi.', 'warning'); return; }
        if (!selectedUserId && !password) { showToast('Kata sandi wajib diisi untuk pengguna baru.', 'warning'); return; }

        const payload = { username, email, is_staff: isStaff, is_superuser: isSuperuser };
        if (password) payload.password = password;

        const url = selectedUserId ? `/api/auth/users/${selectedUserId}/` : '/api/auth/users/';
        const method = selectedUserId ? 'PUT' : 'POST';

        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan...';

        secureFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
            .then(res => {
                if (!res.ok) return res.json().then(err => { throw new Error(err.error || err.detail || 'Gagal menyimpan.'); });
                return res.json();
            })
            .then(() => {
                showToast('Data otoritas pengguna berhasil disimpan!', 'success');
                document.getElementById('user-editor-modal').classList.add('hidden');
                if (searchInput?.value) searchInput.value = '';
                fetchUsers(1);
            })
            .catch(err => {
                showToast(err.message || 'Gagal menyimpan perubahan.', 'error');
            })
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Simpan Perubahan';
            });
    });
});

// Expose for global use
window.openUserEditor = openUserEditor;
window.deleteUser = deleteUser;
window.fetchUsers = fetchUsers;
window.renderUsersTable = renderUsersTable;
window.renderUsersPagination = renderUsersPagination;
window._buildConfirmToast = _buildConfirmToast;
