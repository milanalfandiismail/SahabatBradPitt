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
        .catch(() => {/* silent */});
}

document.addEventListener('DOMContentLoaded', () => {
    const syncBtn = document.getElementById('sync-btn');
    if (!syncBtn) return;

    let syncPollInterval = null;
    let idleRetryCount = 0;
    const MAX_IDLE_RETRIES = 5;          // Retry saat dapat 'idle' di tengah sesi aktif
    const SYNC_SESSION_TTL = 90 * 1000; // 90 detik — sesi sync dianggap aktif

    const progressCard = document.getElementById("sync-progress-card");
    const progressText = document.getElementById("sync-progress-text");

    // ---------------------------------------------------------------
    // localStorage helpers — agar sesi sync survive halaman di-refresh
    // ---------------------------------------------------------------
    const LS_KEY = 'sbp_sync_started_at';

    function markSyncStarted() {
        localStorage.setItem(LS_KEY, Date.now().toString());
    }

    function clearSyncSession() {
        localStorage.removeItem(LS_KEY);
    }

    function isSyncSessionActive() {
        const ts = parseInt(localStorage.getItem(LS_KEY) || '0', 10);
        return ts > 0 && (Date.now() - ts < SYNC_SESSION_TTL);
    }

    // ---------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------
    function stopPolling() {
        if (syncPollInterval) {
            clearInterval(syncPollInterval);
            syncPollInterval = null;
        }
        idleRetryCount = 0;
    }

    function resetSyncBtn() {
        syncBtn.disabled = false;
        syncBtn.innerHTML = '<span class="material-symbols-outlined text-base">cloud_download</span> Sinkronkan Sekarang';
    }

    function showProgress(actorId) {
        if (progressCard) progressCard.classList.remove("hidden");
        if (progressText) progressText.textContent = actorId ? `- Sync ID Actor ${actorId}` : '';
        syncBtn.disabled = true;
        syncBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-base">sync</span> Mensinkronisasi...';
    }

    function hideProgress() {
        if (progressCard) progressCard.classList.add("hidden");
    }

    // ---------------------------------------------------------------
    // Core polling function
    // ---------------------------------------------------------------
    function checkSyncStatus() {
        fetch('/api/films/sync_status/')
            .then(res => res.json())
            .then(data => {
                if (data.status === 'running') {
                    idleRetryCount = 0;
                    // Selalu refresh timestamp agar TTL 90 detik terus diperbarui
                    // selama server mengonfirmasi sync masih berjalan.
                    // Ini menjamin retry logic tetap aktif untuk sync yang berjalan lama.
                    markSyncStarted();
                    showProgress(data.actor_id);
                    if (!syncPollInterval) {
                        syncPollInterval = setInterval(checkSyncStatus, 3000);
                    }

                } else if (data.status === 'completed') {
                    stopPolling();
                    clearSyncSession();
                    hideProgress();
                    resetSyncBtn();
                    showToast(`Sinkronisasi sukses! Berhasil memproses ${data.synced_count} film baru.`, 'success');
                    fetchStats();
                    fetchFilms(1);
                    fetchActors(1);

                } else if (data.status === 'error') {
                    stopPolling();
                    clearSyncSession();
                    hideProgress();
                    resetSyncBtn();
                    showToast(`Error: ${data.error}`, 'error');

                } else {
                    // status === 'idle'
                    if (isSyncSessionActive() && idleRetryCount < MAX_IDLE_RETRIES) {
                        // Sesi sync masih dianggap aktif (berdasarkan localStorage) tapi
                        // server balas 'idle' — kemungkinan kena worker berbeda (LocMemCache)
                        // atau cache belum terpasang. Retry dulu sebelum menyerah.
                        idleRetryCount++;
                        if (!syncPollInterval) {
                            syncPollInterval = setInterval(checkSyncStatus, 3000);
                        }
                    } else {
                        // Benar-benar idle: bersihkan semua state
                        stopPolling();
                        clearSyncSession();
                        hideProgress();
                        resetSyncBtn();
                    }
                }
            })
            .catch(() => {/* silent */});
    }

    // Cek status saat halaman pertama kali dimuat.
    // Jika ada sesi aktif di localStorage, langsung tampilkan progress card
    // agar user tidak melihat halaman kosong dulu sebelum polling selesai.
    if (isSyncSessionActive()) {
        showProgress(null);
    }
    checkSyncStatus();

    // ---------------------------------------------------------------
    // Sync button click handler
    // ---------------------------------------------------------------
    syncBtn.addEventListener('click', () => {
        const actorIdVal = document.getElementById('sync-actor-id').value.trim();
        const minRatingVal = document.getElementById('sync-min-rating').value.trim();

        if (!actorIdVal) {
            showToast('Harap masukkan TMDB Actor ID.', 'warning');
            return;
        }

        // Reset state dan tandai sesi sync baru di localStorage
        stopPolling();
        clearSyncSession();
        markSyncStarted();
        idleRetryCount = 0;

        showProgress(null);

        secureFetch('/api/films/sync/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                actor_id: parseInt(actorIdVal),
                min_rating: minRatingVal ? parseFloat(minRatingVal) : 7.0
            })
        })
        .then(res => {
            if (!res.ok) throw new Error("Gagal memulai sinkronisasi");
            return res.json();
        })
        .then(() => {
            showToast('Sinkronisasi dimulai di background. Anda dapat menutup halaman jika perlu.', 'info');
            // Beri jeda 500ms sebelum polling pertama agar cache 'running' sudah terpasang
            setTimeout(checkSyncStatus, 500);
        })
        .catch(err => {
            stopPolling();
            clearSyncSession();
            hideProgress();
            resetSyncBtn();
            showToast(err.message || 'Gagal memulai sinkronisasi.', 'error');
        });
    });
});
