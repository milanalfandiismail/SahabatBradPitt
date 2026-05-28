/**
 * admin/users.js
 * Handles: User management (Superuser only).
 * Includes: Search filter, stagger animations, modal integration.
 */

// selectedUserId sudah dideklarasikan di core.js sebagai global
let allUsers = [];

// =============================================
// FETCH & RENDER USERS
// =============================================
function fetchUsers() {
    const tbody = document.getElementById('users-table-body');
    const empty = document.getElementById('users-empty');
    const loading = document.getElementById('users-loading');
    const error = document.getElementById('users-error');

    tbody.textContent = '';
    empty?.classList.add('hidden');
    error?.classList.add('hidden');
    loading?.classList.remove('hidden');

    secureFetch('/api/auth/users/')
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(data => {
            loading?.classList.add('hidden');
            allUsers = Array.isArray(data) ? data : (data.results || []);

            // Apply search filter client-side
            const query = document.getElementById('users-search-input')?.value.toLowerCase() || '';
            const filtered = query
                ? allUsers.filter(u =>
                    u.username.toLowerCase().includes(query) ||
                    (u.email && u.email.toLowerCase().includes(query))
                  )
                : allUsers;

            if (filtered.length === 0) {
                empty?.classList.remove('hidden');
                return;
            }

            renderUsersTable(filtered);
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
        tr.className = 'border-b border-white/5 hover:bg-white/[0.03] hover:-translate-y-0.5 transition-all font-[\'DM_Sans\'] animate-fade-up';
        tr.style.animationDelay = `${idx * 60}ms`;

        const tdUsername = document.createElement('td');
        tdUsername.className = 'p-4 font-semibold text-stone-200 text-sm align-middle';
        tdUsername.textContent = user.username;
        tr.appendChild(tdUsername);

        const tdEmail = document.createElement('td');
        tdEmail.className = 'p-4 text-stone-400 align-middle text-sm';
        tdEmail.textContent = user.email || '-';
        tr.appendChild(tdEmail);

        const tdStaff = document.createElement('td');
        tdStaff.className = 'p-4 text-center align-middle';
        const staffBadge = document.createElement('span');
        staffBadge.className = 'inline-flex px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ' +
            (user.is_staff
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-stone-500/10 text-stone-500');
        staffBadge.textContent = user.is_staff ? 'Admin' : 'Regular';
        tdStaff.appendChild(staffBadge);
        tr.appendChild(tdStaff);

        const tdSuper = document.createElement('td');
        tdSuper.className = 'p-4 text-center align-middle';
        const superBadge = document.createElement('span');
        superBadge.className = 'inline-flex px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ' +
            (user.is_superuser
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-stone-500/10 text-stone-500');
        superBadge.textContent = user.is_superuser ? 'Super Admin' : '—';
        tdSuper.appendChild(superBadge);
        tr.appendChild(tdSuper);

        const tdActions = document.createElement('td');
        tdActions.className = 'p-4 text-center align-middle';
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
    modal.classList.add('animate-scale-in');
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
                fetchUsers();
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
    // Search handlers
    const searchInput = document.getElementById('users-search-input');
    let searchTimeout = null;

    searchInput?.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            if (allUsers.length > 0) {
                renderUsersTable(allUsers);
            } else {
                fetchUsers();
            }
        }, 300);
    });

    document.getElementById('users-search-icon-btn')?.addEventListener('click', () => {
        if (allUsers.length > 0) renderUsersTable(allUsers);
        else fetchUsers();
    });

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
                fetchUsers();
            })
            .catch(err => {
                console.error(err);
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
window._buildConfirmToast = _buildConfirmToast;
