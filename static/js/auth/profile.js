/**
 * auth/profile.js
 * Handles: User profile loading, avatar upload, preference saving, watchlist/reviews display.
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

    // Fetch User Info
    function loadProfile() {
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

                if (user.profile && user.profile.avatar_url) {
                    document.getElementById("avatar-img").src = user.profile.avatar_url;
                    document.getElementById("avatar-preview").src = user.profile.avatar_url;
                    const navAvatar = document.getElementById("navbar-avatar-img");
                    if (navAvatar) navAvatar.src = user.profile.avatar_url;
                } else {
                    const defaultAvatar = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a8a29e'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";
                    document.getElementById("avatar-img").src = defaultAvatar;
                    document.getElementById("avatar-preview").src = defaultAvatar;
                    const navAvatar = document.getElementById("navbar-avatar-img");
                    if (navAvatar) navAvatar.src = defaultAvatar;
                }

                if (user.profile) {
                    document.getElementById("stat-ratings").textContent = user.profile.ratings_count || 0;
                    document.getElementById("stat-reviews").textContent = user.profile.reviews_count || 0;
                    document.getElementById("stat-avg").textContent = (user.profile.avg_rating || 0).toFixed(1);
                }

                fetchUserRatings(user.id);
                fetchUserWatchlist(user.id);
            })
            .catch(err => console.error(err));
    }

    function fetchUserRatings(userId) {
        const grid = document.getElementById("rated-movies-grid");
        const moreContainer = document.getElementById("reviews-more-container");
        grid.textContent = "";
        if (moreContainer) moreContainer.classList.add("hidden");

        fetch(`/api/ratings/?user=${userId}`)
            .then(res => res.json())
            .then(ratings => {
                const results = ratings.results || ratings;
                if (results.length === 0) {
                    grid.innerHTML = `<p class="col-span-full text-stone-500 italic text-sm">Anda belum mengulas film apa pun.</p>`;
                    return;
                }

                const isMobile = window.innerWidth < 768;
                results.forEach((item, index) => {
                    const card = document.createElement("div");
                    card.className = "bg-[#201f20] rounded-lg overflow-hidden group cursor-pointer hover:scale-[1.03] transition-all duration-300 border border-white/5 shadow-lg animate-fade-in";
                    if (isMobile && index >= 4) {
                        card.classList.add("hidden", "js-more-ratings");
                    }
                    card.addEventListener("click", () => { window.location.href = `/movies/${item.film}/`; });

                    const imgWrap = document.createElement("div");
                    imgWrap.className = "relative aspect-[2/3] overflow-hidden bg-surface-dim";
                    let posterUrl = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500";
                    if (item.local_poster) posterUrl = item.local_poster;
                    else if (item.tmdb_poster) posterUrl = item.tmdb_poster.startsWith("http") ? item.tmdb_poster : `https://image.tmdb.org/t/p/w500${item.tmdb_poster}`;

                    const img = document.createElement("img");
                    img.className = "w-full h-full object-cover group-hover:scale-105 transition-all duration-500";
                    img.src = posterUrl; img.alt = item.film_title;
                    imgWrap.appendChild(img);

                    const p = document.createElement("div");
                    p.className = "p-4 flex flex-col gap-1";
                    const title = document.createElement("h3");
                    title.className = "font-['DM_Sans'] text-sm font-semibold text-white truncate";
                    title.textContent = item.film_title;

                    const meta = document.createElement("div");
                    meta.className = "flex justify-between items-center mt-1";
                    const stars = document.createElement("span");
                    stars.className = "flex items-center text-[#F5C518] text-xs font-bold gap-0.5";
                    stars.innerHTML = `<span class="material-symbols-outlined text-xs" style="font-variation-settings: 'FILL' 1;">star</span> ${item.score}/10`;
                    const year = document.createElement("span");
                    year.className = "text-[10px] text-stone-500";
                    year.textContent = item.release_year || "";

                    meta.appendChild(stars); meta.appendChild(year);
                    p.appendChild(title); p.appendChild(meta);
                    card.appendChild(imgWrap); card.appendChild(p);
                    grid.appendChild(card);
                });

                if (isMobile && results.length > 4 && moreContainer) {
                    moreContainer.classList.remove("hidden");
                    const btn = document.getElementById("btn-reviews-more");
                    btn.onclick = () => {
                        document.querySelectorAll(".js-more-ratings").forEach(c => c.classList.remove("hidden"));
                        moreContainer.classList.add("hidden");
                    };
                }
            });
    }

    function fetchUserWatchlist(userId) {
        const grid = document.getElementById("watchlist-grid");
        const moreContainer = document.getElementById("watchlist-more-container");
        grid.textContent = "";
        if (moreContainer) moreContainer.classList.add("hidden");

        fetch(`/api/ratings/watchlist/?user=${userId}`)
            .then(res => res.json())
            .then(watchlist => {
                const results = watchlist.results || watchlist;
                if (results.length === 0) {
                    grid.innerHTML = `
                    <div class="col-span-full text-center py-12 text-stone-500">
                        <span class="material-symbols-outlined text-4xl mb-2">bookmark_border</span>
                        <p class="italic text-sm">Belum ada film di watchlist Anda.</p>
                    </div>`;
                    return;
                }

                const isMobile = window.innerWidth < 768;
                results.forEach((item, index) => {
                    const card = document.createElement("div");
                    card.className = "bg-[#201f20] rounded-lg overflow-hidden group cursor-pointer hover:scale-[1.03] transition-all duration-300 border border-white/5 shadow-lg relative animate-fade-in";
                    if (isMobile && index >= 4) {
                        card.classList.add("hidden", "js-more-watchlist");
                    }
                    card.addEventListener("click", () => { window.location.href = `/movies/${item.film}/`; });

                    const imgWrap = document.createElement("div");
                    imgWrap.className = "relative aspect-[2/3] overflow-hidden bg-surface-dim";
                    let posterUrl = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500";
                    if (item.local_poster) posterUrl = item.local_poster;
                    else if (item.tmdb_poster) posterUrl = item.tmdb_poster.startsWith("http") ? item.tmdb_poster : `https://image.tmdb.org/t/p/w500${item.tmdb_poster}`;

                    const img = document.createElement("img");
                    img.className = "w-full h-full object-cover group-hover:scale-105 transition-all duration-500";
                    img.src = posterUrl; img.alt = item.film_title;
                    imgWrap.appendChild(img);

                    const overlay = document.createElement("button");
                    overlay.className = "absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 hover:bg-red-600 hover:scale-110 flex items-center justify-center text-white transition-all z-20 shadow-md";
                    overlay.innerHTML = `<span class="material-symbols-outlined text-base">close</span>`;
                    overlay.title = "Hapus dari Watchlist";
                    overlay.addEventListener("click", (e) => { e.stopPropagation(); deleteFromWatchlist(item.id, userId); });
                    card.appendChild(overlay);

                    const p = document.createElement("div");
                    p.className = "p-4 flex flex-col gap-1";
                    const title = document.createElement("h3");
                    title.className = "font-['DM_Sans'] text-sm font-semibold text-white truncate";
                    title.textContent = item.film_title;

                    const meta = document.createElement("div");
                    meta.className = "flex justify-between items-center mt-1";
                    const rating = document.createElement("span");
                    rating.className = "flex items-center text-[#F5C518] text-xs font-bold gap-0.5";
                    rating.innerHTML = `<span class="material-symbols-outlined text-xs" style="font-variation-settings: 'FILL' 1;">star</span> ${item.avg_rating ? parseFloat(item.avg_rating).toFixed(1) : "N/A"}`;
                    const year = document.createElement("span");
                    year.className = "text-[10px] text-stone-500";
                    year.textContent = item.release_year || "";

                    meta.appendChild(rating); meta.appendChild(year);
                    p.appendChild(title); p.appendChild(meta);
                    card.appendChild(imgWrap); card.appendChild(overlay); card.appendChild(p);
                    grid.appendChild(card);
                });

                if (isMobile && results.length > 4 && moreContainer) {
                    moreContainer.classList.remove("hidden");
                    const btn = document.getElementById("btn-watchlist-more");
                    btn.onclick = () => {
                        document.querySelectorAll(".js-more-watchlist").forEach(c => c.classList.remove("hidden"));
                        moreContainer.classList.add("hidden");
                    };
                }
            });
    }

    function deleteFromWatchlist(watchlistId, userId) {
        if (!confirm("Apakah Anda yakin ingin menghapus film ini dari watchlist?")) return;
        secureFetch(`/api/ratings/watchlist/${watchlistId}/`, { method: "DELETE" })
            .then(res => {
                if (res.ok) { showToast("Film berhasil dihapus dari watchlist.", "success"); fetchUserWatchlist(userId); }
                else showToast("Gagal menghapus film dari watchlist.", "error");
            })
            .catch(err => { console.error(err); showToast("Terjadi kesalahan.", "error"); });
    }

    // Tab Navigation
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
        tabReviewsBtn.className = "pb-3 text-[#D3DAD9]/60 hover:text-white transition-all flex items-center gap-1.5 focus:outline-none shrink-0 relative";
        tabWatchlistBtn.className = "pb-3 text-[#D3DAD9]/60 hover:text-white transition-all flex items-center gap-1.5 focus:outline-none shrink-0 relative";
        tabPrefsBtn.className = "pb-3 text-[#D3DAD9]/60 hover:text-white transition-all flex items-center gap-1.5 focus:outline-none shrink-0 relative";
        sectionReviews.classList.add("hidden");
        sectionWatchlist.classList.add("hidden");
        sectionPrefs.classList.add("hidden");

        let activeBtn = null;
        if (activeTab === 'reviews') {
            tabReviewsBtn.className = "pb-3 text-white font-semibold transition-all flex items-center gap-1.5 focus:outline-none shrink-0 relative";
            sectionReviews.classList.remove("hidden");
            activeBtn = tabReviewsBtn;
        } else if (activeTab === 'watchlist') {
            tabWatchlistBtn.className = "pb-3 text-white font-semibold transition-all flex items-center gap-1.5 focus:outline-none shrink-0 relative";
            sectionWatchlist.classList.remove("hidden");
            activeBtn = tabWatchlistBtn;
        } else if (activeTab === 'prefs') {
            tabPrefsBtn.className = "pb-3 text-white font-semibold transition-all flex items-center gap-1.5 focus:outline-none shrink-0 relative";
            sectionPrefs.classList.remove("hidden");
            activeBtn = tabPrefsBtn;
        }

        if (activeBtn) {
            updateActiveBar(activeBtn);
        }
    }

    tabReviewsBtn?.addEventListener("click", () => switchTab('reviews'));
    tabWatchlistBtn?.addEventListener("click", () => switchTab('watchlist'));
    tabPrefsBtn?.addEventListener("click", () => {
        switchTab('prefs');
        setTimeout(() => updateActiveBar(tabPrefsBtn), 50);
    });

    // Make active bar responsive to window resizing
    window.addEventListener("resize", () => {
        const activeBtn = sectionReviews.classList.contains("hidden") 
            ? (sectionWatchlist.classList.contains("hidden") ? tabPrefsBtn : tabWatchlistBtn)
            : tabReviewsBtn;
        if (activeBtn) updateActiveBar(activeBtn);
    });

    // Initialize active bar on first load
    setTimeout(() => {
        if (tabReviewsBtn) updateActiveBar(tabReviewsBtn);
    }, 150);

    // Accordion Toggle for Mobile (Preferensi Film)
    const accordionToggleBtn = document.getElementById("accordion-toggle-btn");
    const accordionContent = document.getElementById("accordion-content");
    const accordionChevron = document.getElementById("accordion-chevron");

    accordionToggleBtn?.addEventListener("click", () => {
        if (window.innerWidth >= 768) return; // Disable accordion on desktop
        const isCollapsed = accordionContent.classList.contains("hidden");
        if (isCollapsed) {
            accordionContent.classList.remove("hidden");
            accordionContent.classList.add("flex");
            accordionChevron.style.transform = "rotate(180deg)";
        } else {
            accordionContent.classList.add("hidden");
            accordionContent.classList.remove("flex");
            accordionChevron.style.transform = "rotate(0deg)";
        }
    });

    // Preferensi Film Logic
    let prefFocus = ""; let prefGenres = []; let prefEra = ""; let prefDuration = "";

    document.querySelectorAll(".pref-focus-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".pref-focus-btn").forEach(b => b.classList.remove("border-[#715A5A]", "bg-[#715A5A]/20"));
            if (prefFocus === btn.dataset.focus) prefFocus = "";
            else { prefFocus = btn.dataset.focus; btn.classList.add("border-[#715A5A]", "bg-[#715A5A]/20"); }
        });
    });

    document.querySelectorAll(".pref-era-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".pref-era-btn").forEach(b => b.classList.remove("border-[#715A5A]", "bg-[#715A5A]/20", "text-white"));
            if (prefEra === btn.dataset.era) prefEra = "";
            else { prefEra = btn.dataset.era; btn.classList.add("border-[#715A5A]", "bg-[#715A5A]/20", "text-white"); }
        });
    });

    document.querySelectorAll(".pref-duration-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".pref-duration-btn").forEach(b => b.classList.remove("border-[#715A5A]", "bg-[#715A5A]/20", "text-white"));
            if (prefDuration === btn.dataset.duration) prefDuration = "";
            else { prefDuration = btn.dataset.duration; btn.classList.add("border-[#715A5A]", "bg-[#715A5A]/20", "text-white"); }
        });
    });

    fetch("/api/films/genres/")
        .then(r => r.json())
        .then(genres => {
            const grid = document.getElementById("pref-genres-grid");
            if (!grid) return;
            grid.textContent = "";
            const genreList = Array.isArray(genres) ? genres : (genres.results || []);
            genreList.forEach(g => {
                const chip = document.createElement("button");
                chip.type = "button";
                chip.className = "px-3 py-1.5 rounded-full border border-white/10 text-stone-400 text-xs hover:border-[#715A5A] transition-all";
                chip.textContent = g.name;
                chip.dataset.genreId = g.id;
                chip.addEventListener("click", () => {
                    if (prefGenres.includes(g.id)) {
                        prefGenres = prefGenres.filter(id => id !== g.id);
                        chip.classList.remove("border-[#715A5A]", "bg-[#715A5A]/20", "text-[#c7c5d1]");
                    } else {
                        prefGenres.push(g.id);
                        chip.classList.add("border-[#715A5A]", "bg-[#715A5A]/20", "text-[#c7c5d1]");
                    }
                });
                grid.appendChild(chip);
            });
            loadSavedPreferences();
        });

    function loadSavedPreferences() {
        fetch("/api/auth/me/preferences/")
            .then(r => r.json())
            .then(prefs => {
                if (prefs.pref_focus) {
                    prefFocus = prefs.pref_focus;
                    document.querySelector(`.pref-focus-btn[data-focus="${prefs.pref_focus}"]`)?.classList.add("border-[#715A5A]", "bg-[#715A5A]/20");
                }
                if (prefs.pref_genres && prefs.pref_genres.length > 0) {
                    prefGenres = prefs.pref_genres;
                    prefs.pref_genres.forEach(gId => document.querySelector(`#pref-genres-grid button[data-genre-id="${gId}"]`)?.classList.add("border-[#715A5A]", "bg-[#715A5A]/20", "text-[#c7c5d1]"));
                }
                if (prefs.pref_era) {
                    prefEra = prefs.pref_era;
                    document.querySelector(`.pref-era-btn[data-era="${prefs.pref_era}"]`)?.classList.add("border-[#715A5A]", "bg-[#715A5A]/20", "text-white");
                }
                if (prefs.pref_duration) {
                    prefDuration = prefs.pref_duration;
                    document.querySelector(`.pref-duration-btn[data-duration="${prefs.pref_duration}"]`)?.classList.add("border-[#715A5A]", "bg-[#715A5A]/20", "text-white");
                }
            }).catch(() => { });
    }

    document.getElementById("save-prefs-btn")?.addEventListener("click", () => {
        const msg = document.getElementById("prefs-save-msg");
        msg.classList.add("hidden");
        secureFetch("/api/auth/me/preferences/", {
            method: "PUT",
            body: JSON.stringify({ pref_focus: prefFocus, pref_genres: prefGenres, pref_era: prefEra, pref_duration: prefDuration })
        })
            .then(r => r.json())
            .then(data => {
                msg.textContent = data.message || "Preferensi tersimpan!";
                msg.classList.remove("hidden", "text-red-400"); msg.classList.add("text-green-400");
                setTimeout(() => msg.classList.add("hidden"), 3000);
            })
            .catch(() => {
                msg.textContent = "Gagal menyimpan preferensi.";
                msg.classList.remove("hidden", "text-green-400"); msg.classList.add("text-red-400");
            });
    });

    // Profile Edit
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
                loadProfile();
            })
            .catch(() => showToast("Gagal memperbarui profil.", "error"))
            .finally(() => { saveProfileBtn.disabled = false; saveProfileBtn.textContent = "Simpan"; });
    });

    logoutBtn?.addEventListener("click", () => {
        logoutBtn.disabled = true;
        secureFetch("/api/auth/logout/", { method: "POST" })
            .finally(() => { window.location.href = "/login/"; });
    });

    loadProfile();
});
