/**
 * auth/profile_core.js
 * Inti manajemen halaman profil (Pemuatan data profil, Edit modal, Avatar, Logout, Tab navigation).
 */

document.addEventListener("DOMContentLoaded", function () {
    const loading = document.getElementById("loading");
    const profileContainer = document.getElementById("profile-container");
    const logoutBtn = document.getElementById("logout-btn");

    const editProfileBtn = document.getElementById("edit-profile-btn");
    const editModal = document.getElementById("edit-modal");
    const cancelEditBtn = document.getElementById("cancel-edit-btn");
    const saveProfileBtn = document.getElementById("save-profile-btn");

    const editDisplayName = document.getElementById("edit-display-name");
    const editBio = document.getElementById("edit-bio");

    // Expose loadProfile globally so lists/preferences can trigger it if needed
    window.loadProfile = function () {
        fetch("/api/auth/me/")
            .then(res => {
                if (!res.ok) {
                    window.location.href = "/login/";
                    throw new Error("Unauthorized");
                }
                return res.json();
            })
            .then(user => {
                loading.classList.add("hidden");
                profileContainer.classList.remove("hidden");

                document.getElementById("display-name").textContent = (user.profile && user.profile.display_name) || user.username;
                document.getElementById("username-val").textContent = `@${user.username}`;
                document.getElementById("bio-val").textContent = (user.profile && user.profile.bio) || "Bio belum diisi. Ceritakan sedikit tentang diri Anda!";

                editDisplayName.value = (user.profile && user.profile.display_name) || "";
                editBio.value = (user.profile && user.profile.bio) || "";

                const defaultAvatar = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a8a29e'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";
                const heroBg = document.getElementById("hero-bg-img");

                if (user.profile && user.profile.avatar_url) {
                    document.getElementById("avatar-img").src = user.profile.avatar_url;
                    document.getElementById("avatar-preview").src = user.profile.avatar_url;
                    const navAvatar = document.getElementById("navbar-avatar-img");
                    if (navAvatar) navAvatar.src = user.profile.avatar_url;
                    if (heroBg) heroBg.style.backgroundImage = `url('${user.profile.avatar_url}')`;
                } else {
                    document.getElementById("avatar-img").src = defaultAvatar;
                    document.getElementById("avatar-preview").src = defaultAvatar;
                    const navAvatar = document.getElementById("navbar-avatar-img");
                    if (navAvatar) navAvatar.src = defaultAvatar;
                    if (heroBg) heroBg.style.backgroundImage = `url('${defaultAvatar}')`;
                }

                if (user.profile) {
                    document.getElementById("stat-ratings").textContent = user.profile.ratings_count || 0;
                    document.getElementById("stat-reviews").textContent = user.profile.reviews_count || 0;
                    document.getElementById("stat-avg").textContent = (user.profile.avg_rating || 0).toFixed(1);
                }

                if (window.fetchUserRatings) window.fetchUserRatings(user.id);
                if (window.fetchUserWatchlist) window.fetchUserWatchlist(user.id);
            })
    };

    // Tab Navigation Logic
    const tabReviewsBtn = document.getElementById("tab-reviews-btn");
    const tabWatchlistBtn = document.getElementById("tab-watchlist-btn");
    const tabPrefsBtn = document.getElementById("tab-prefs-btn");
    const sectionReviews = document.getElementById("section-reviews");
    const sectionWatchlist = document.getElementById("section-watchlist");
    const sectionPrefs = document.getElementById("section-prefs");
    const tabActiveBar = document.getElementById("tab-active-bar");

    function updateActiveBar(btn) {
        if (!tabActiveBar || !btn) return;
        const rect = btn.getBoundingClientRect();
        const containerRect = btn.parentElement.getBoundingClientRect();
        tabActiveBar.style.width = `${rect.width}px`;
        tabActiveBar.style.left = `${rect.left - containerRect.left + btn.parentElement.scrollLeft}px`;
    }

    function switchTab(activeTab) {
        [tabReviewsBtn, tabWatchlistBtn, tabPrefsBtn].forEach(btn => {
            if (btn) btn.className = "pb-4 text-[#D3DAD9]/60 hover:text-white transition-all flex items-center gap-1.5 focus:outline-none shrink-0 relative z-20";
        });
        [sectionReviews, sectionWatchlist, sectionPrefs].forEach(sec => sec?.classList.add("hidden"));

        let activeBtn = null;
        if (activeTab === 'reviews' && tabReviewsBtn) {
            tabReviewsBtn.className = "pb-4 text-white font-semibold transition-all flex items-center gap-1.5 focus:outline-none shrink-0 relative z-20";
            sectionReviews?.classList.remove("hidden");
            activeBtn = tabReviewsBtn;
        } else if (activeTab === 'watchlist' && tabWatchlistBtn) {
            tabWatchlistBtn.className = "pb-4 text-white font-semibold transition-all flex items-center gap-1.5 focus:outline-none shrink-0 relative z-20";
            sectionWatchlist?.classList.remove("hidden");
            activeBtn = tabWatchlistBtn;
        } else if (activeTab === 'prefs' && tabPrefsBtn) {
            tabPrefsBtn.className = "pb-4 text-white font-semibold transition-all flex items-center gap-1.5 focus:outline-none shrink-0 relative z-20";
            sectionPrefs?.classList.remove("hidden");
            activeBtn = tabPrefsBtn;
        }

        if (activeBtn) updateActiveBar(activeBtn);
    }

    tabReviewsBtn?.addEventListener("click", () => switchTab('reviews'));
    tabWatchlistBtn?.addEventListener("click", () => switchTab('watchlist'));
    tabPrefsBtn?.addEventListener("click", () => {
        switchTab('prefs');
        setTimeout(() => updateActiveBar(tabPrefsBtn), 50);
    });

    window.addEventListener("resize", () => {
        const activeBtn = sectionReviews?.classList.contains("hidden") 
            ? (sectionWatchlist?.classList.contains("hidden") ? tabPrefsBtn : tabWatchlistBtn)
            : tabReviewsBtn;
        if (activeBtn) updateActiveBar(activeBtn);
    });

    setTimeout(() => { if (tabReviewsBtn) updateActiveBar(tabReviewsBtn); }, 150);

    // Profile Edit events
    editProfileBtn?.addEventListener("click", () => editModal.classList.remove("hidden"));
    cancelEditBtn?.addEventListener("click", () => editModal.classList.add("hidden"));

    const uploadAvatarBtn = document.getElementById("upload-avatar-btn");
    const editAvatarFile = document.getElementById("edit-avatar-file");
    const avatarPreview = document.getElementById("avatar-preview");

    uploadAvatarBtn?.addEventListener("click", () => editAvatarFile.click());

    editAvatarFile?.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { showToast("Ukuran file tidak boleh lebih dari 5MB", "error"); editAvatarFile.value = ""; return; }
            if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { showToast("Format file harus JPG, PNG, atau WebP", "error"); editAvatarFile.value = ""; return; }
            const reader = new FileReader();
            reader.onload = (event) => { avatarPreview.src = event.target.result; };
            reader.readAsDataURL(file);
        }
    });

    saveProfileBtn?.addEventListener("click", () => {
        saveProfileBtn.disabled = true; saveProfileBtn.textContent = "Menyimpan...";
        const formData = new FormData();
        formData.append("display_name", editDisplayName.value.trim());
        formData.append("bio", editBio.value.trim());
        if (editAvatarFile.files.length > 0) formData.append("avatar", editAvatarFile.files[0]);

        secureFetch("/api/auth/me/", { method: "PUT", body: formData })
            .then(res => { if (!res.ok) throw new Error("Gagal menyimpan profil."); return res.json(); })
            .then(() => {
                editModal.classList.add("hidden");
                showToast("Profil berhasil diperbarui!", "success");
                editAvatarFile.value = "";
                window.loadProfile();
            })
            .catch(() => showToast("Gagal memperbarui profil.", "error"))
            .finally(() => { saveProfileBtn.disabled = false; saveProfileBtn.textContent = "Simpan"; });
    });

    logoutBtn?.addEventListener("click", () => {
        logoutBtn.disabled = true;
        secureFetch("/api/auth/logout/", { method: "POST" })
            .finally(() => { window.location.href = "/login/"; });
    });

    window.loadProfile();
});
