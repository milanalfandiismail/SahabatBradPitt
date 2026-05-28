/**
 * admin/users.js
 * Handles: User management (Superuser only).
 */

function fetchUsers() {
    const usersTableBody = document.getElementById('users-table-body');
    const usersEmpty = document.getElementById('users-empty');
    const usersLoading = document.getElementById('users-loading');
    usersTableBody.textContent = "";
    usersEmpty.classList.add('hidden');
    usersLoading.classList.remove('hidden');

    secureFetch('/api/auth/users/')
        .then(res => res.json())
        .then(data => {
            usersLoading.classList.add('hidden');
            const users = Array.isArray(data) ? data : (data.results || []);
            if (users.length === 0) { usersEmpty.classList.remove('hidden'); return; }
            renderUsersTable(users);
        })
        .catch(() => { document.getElementById('users-loading').classList.add('hidden'); showToast('Gagal memuat daftar pengguna.', 'error'); });
}

function renderUsersTable(users) {
    const usersTableBody = document.getElementById('users-table-body');
    usersTableBody.textContent = "";
    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-white/5 hover:bg-white/[0.02] transition-colors font-['DM_Sans']";

        const tdUsername = document.createElement('td');
        tdUsername.className = "p-4 font-semibold text-stone-200 text-sm align-middle";
        tdUsername.textContent = user.username;
        tr.appendChild(tdUsername);

        const tdEmail = document.createElement('td');
        tdEmail.className = "p-4 text-stone-400 align-middle";
        tdEmail.textContent = user.email || "-";
        tr.appendChild(tdEmail);

        const tdStaff = document.createElement('td');
        tdStaff.className = "p-4 text-center align-middle";
        const staffBadge = document.createElement('span');
        staffBadge.className = "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider " + (user.is_staff ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-stone-500/10 text-stone-500");
        staffBadge.textContent = user.is_staff ? "Admin" : "Regular";
        tdStaff.appendChild(staffBadge);
        tr.appendChild(tdStaff);

        const tdSuper = document.createElement('td');
        tdSuper.className = "p-4 text-center align-middle";
        const superBadge = document.createElement('span');
        superBadge.className = "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider " + (user.is_superuser ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-stone-500/10 text-stone-500");
        superBadge.textContent = user.is_superuser ? "Super Admin" : "-";
        tdSuper.appendChild(superBadge);
        tr.appendChild(tdSuper);

        const tdActions = document.createElement('td');
        tdActions.className = "p-4 text-center align-middle";
        const actionsWrapper = document.createElement('div');
        actionsWrapper.className = "flex items-center justify-center gap-1.5";

        const editBtn = document.createElement('button');
        editBtn.className = "w-7 h-7 rounded border border-white/10 text-stone-300 hover:border-white/40 hover:text-white transition-all flex items-center justify-center shadow-sm";
        editBtn.innerHTML = `<span class="material-symbols-outlined text-sm">edit</span>`;
        editBtn.addEventListener('click', () => openUserEditor(user));
        actionsWrapper.appendChild(editBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = "w-7 h-7 rounded border border-rose-500/10 text-rose-400 hover:bg-rose-500/10 hover:border-rose-400/50 transition-all flex items-center justify-center shadow-sm";
        deleteBtn.innerHTML = `<span class="material-symbols-outlined text-sm">delete</span>`;
        deleteBtn.addEventListener('click', () => deleteUser(user.id, user.username));
        actionsWrapper.appendChild(deleteBtn);

        tdActions.appendChild(actionsWrapper);
        tr.appendChild(tdActions);
        document.getElementById('users-table-body').appendChild(tr);
    });
}

function openUserEditor(user) {
    document.getElementById('user-form').reset();
    const usernameInput = document.getElementById('user-form-username');
    if (user) {
        selectedUserId = user.id;
        document.getElementById('user-editor-title').textContent = "Sunting Otoritas Pengguna";
        usernameInput.value = user.username;
        usernameInput.disabled = true;
        document.getElementById('user-form-email').value = user.email || "";
        document.getElementById('user-form-password').placeholder = "Ketik password baru (biarkan kosong jika tidak diubah)";
        document.getElementById('user-form-is-staff').checked = user.is_staff;
        document.getElementById('user-form-is-superuser').checked = user.is_superuser;
    } else {
        selectedUserId = null;
        document.getElementById('user-editor-title').textContent = "Tambah Pengguna / Admin Baru";
        usernameInput.disabled = false;
        document.getElementById('user-form-password').placeholder = "Kata sandi wajib diisi";
    }
    document.getElementById('user-editor-modal').classList.remove('hidden');
}

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

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('add-user-btn')?.addEventListener('click', () => openUserEditor(null));
    document.getElementById('user-editor-cancel-btn')?.addEventListener('click', () => document.getElementById('user-editor-modal').classList.add('hidden'));

    document.getElementById('user-form')?.addEventListener('submit', e => {
        e.preventDefault();
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

        secureFetch(url, { method, headers: { 'Content-Type': 'application/json', }, body: JSON.stringify(payload) })
            .then(res => {
                if (!res.ok) return res.json().then(err => { throw new Error(err.error || err.detail || 'Gagal menyimpan perubahan pengguna.'); });
                return res.json();
            })
            .then(() => { showToast('Data otoritas pengguna berhasil disimpan!', 'success'); document.getElementById('user-editor-modal').classList.add('hidden'); fetchUsers(); })
            .catch(err => { console.error(err); showToast(err.message || 'Gagal menyimpan perubahan pengguna.', 'error'); });
    });
});
