/**
 * admin/dashboard.js
 * Handles: Stats fetching, TMDB Sync.
 */

function fetchStats() {
    fetch('/api/films/stats/')
        .then(res => res.json())
        .then(stats => {
            document.getElementById('stat-total').textContent = stats.total_films || 0;
            let published = 0, pending = 0, draft = 0, rejected = 0;
            if (stats.by_status && Array.isArray(stats.by_status)) {
                stats.by_status.forEach(item => {
                    if (item.status === 'published') published = item.count;
                    else if (item.status === 'pending_approval') pending = item.count;
                    else if (item.status === 'draft') draft = item.count;
                    else if (item.status === 'rejected') rejected = item.count;
                });
            }
            document.getElementById('stat-published').textContent = published;
            document.getElementById('stat-pending').textContent = pending;
            document.getElementById('stat-draft').textContent = draft;
            document.getElementById('stat-rejected').textContent = rejected;
        })
        .catch(err => console.error("Error loading stats:", err));
}

document.addEventListener('DOMContentLoaded', () => {
    const syncBtn = document.getElementById('sync-btn');
    if (!syncBtn) return;

    syncBtn.addEventListener('click', () => {
        const actorIdVal = document.getElementById('sync-actor-id').value.trim();
        const limitVal = document.getElementById('sync-limit').value.trim();

        if (!actorIdVal) {
            showToast('Harap masukkan TMDB Actor ID.', 'warning');
            return;
        }

        syncBtn.disabled = true;
        syncBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-base">sync</span> Mensinkronisasi...';

        secureFetch('/api/films/sync/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify({ actor_id: parseInt(actorIdVal), limit: limitVal ? parseInt(limitVal) : null })
        })
        .then(res => {
            syncBtn.disabled = false;
            syncBtn.innerHTML = '<span class="material-symbols-outlined text-base">cloud_download</span> Sinkronkan Sekarang';
            if (!res.ok) throw new Error("Gagal melakukan sinkronisasi");
            return res.json();
        })
        .then(data => {
            showToast(`Sinkronisasi sukses! Berhasil memproses ${data.synced_count} film baru ke database.`, 'success');
            fetchStats();
            fetchFilms(1);
            fetchActors(1);
        })
        .catch(err => {
            console.error(err);
            showToast(err.message || 'Gagal melakukan sinkronisasi dengan TMDB.', 'error');
        });
    });
});
