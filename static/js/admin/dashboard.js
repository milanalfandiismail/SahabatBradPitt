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

    let syncPollInterval = null;
    const progressCard = document.getElementById("sync-progress-card");
    const progressText = document.getElementById("sync-progress-text");

    function checkSyncStatus() {
        fetch('/api/films/sync_status/')
            .then(res => res.json())
            .then(data => {
                if (data.status === 'running') {
                    if (progressCard) progressCard.classList.remove("hidden");
                    if (progressText) progressText.textContent = `- Sync ID Actor ${data.actor_id}`;
                    syncBtn.disabled = true;
                    syncBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-base">sync</span> Mensinkronisasi...';
                    
                    if (!syncPollInterval) {
                        syncPollInterval = setInterval(checkSyncStatus, 3000);
                    }
                } else if (data.status === 'completed') {
                    clearInterval(syncPollInterval);
                    syncPollInterval = null;
                    if (progressCard) progressCard.classList.add("hidden");
                    syncBtn.disabled = false;
                    syncBtn.innerHTML = '<span class="material-symbols-outlined text-base">cloud_download</span> Sinkronkan Sekarang';
                    showToast(`Sinkronisasi sukses! Berhasil memproses ${data.synced_count} film baru.`, 'success');
                    fetchStats();
                    fetchFilms(1);
                    fetchActors(1);
                } else if (data.status === 'error') {
                    clearInterval(syncPollInterval);
                    syncPollInterval = null;
                    if (progressCard) progressCard.classList.add("hidden");
                    syncBtn.disabled = false;
                    syncBtn.innerHTML = '<span class="material-symbols-outlined text-base">cloud_download</span> Sinkronkan Sekarang';
                    showToast(`Error: ${data.error}`, 'error');
                } else {
                    // idle
                    if (syncPollInterval) {
                        clearInterval(syncPollInterval);
                        syncPollInterval = null;
                    }
                    if (progressCard) progressCard.classList.add("hidden");
                    syncBtn.disabled = false;
                    syncBtn.innerHTML = '<span class="material-symbols-outlined text-base">cloud_download</span> Sinkronkan Sekarang';
                }
            })
            .catch(err => console.error("Error polling sync status:", err));
    }

    // Check status on load
    checkSyncStatus();

    syncBtn.addEventListener('click', () => {
        const actorIdVal = document.getElementById('sync-actor-id').value.trim();
        const minRatingVal = document.getElementById('sync-min-rating').value.trim();

        if (!actorIdVal) {
            showToast('Harap masukkan TMDB Actor ID.', 'warning');
            return;
        }

        syncBtn.disabled = true;
        syncBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-base">sync</span> Memulai...';
        if (progressCard) progressCard.classList.remove("hidden");

        secureFetch('/api/films/sync/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify({ actor_id: parseInt(actorIdVal), min_rating: minRatingVal ? parseFloat(minRatingVal) : 7.0 })
        })
        .then(res => {
            if (!res.ok) throw new Error("Gagal memulai sinkronisasi");
            return res.json();
        })
        .then(data => {
            showToast('Sinkronisasi dimulai di background. Anda dapat menutup halaman jika perlu.', 'info');
            checkSyncStatus(); // Trigger polling
        })
        .catch(err => {
            console.error(err);
            syncBtn.disabled = false;
            syncBtn.innerHTML = '<span class="material-symbols-outlined text-base">cloud_download</span> Sinkronkan Sekarang';
            if (progressCard) progressCard.classList.add("hidden");
            showToast(err.message || 'Gagal memulai sinkronisasi.', 'error');
        });
    });
});
