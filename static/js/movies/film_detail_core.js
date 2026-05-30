document.addEventListener("DOMContentLoaded", function () {
    const loading = document.getElementById("loading");
    const errorContainer = document.getElementById("error-container");
    const detailWrapper = document.getElementById("detail-wrapper");

    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const filmId = pathParts[pathParts.length - 1];
// ---- Watchlist ----
    let userWatchlistEntry = null;
    const watchlistBtn = document.getElementById("watchlist-btn");

    if (typeof isAuthenticated !== 'undefined' && isAuthenticated) {
        fetch("/api/auth/me/")
            .then(res => { if(!res.ok) throw new Error(); return res.json(); })
            .then(me => checkWatchlistState(me.id))
            .catch(err => console.log("Failed to fetch user for watchlist state"));
    }

    function checkWatchlistState(userId) {
        fetch(`/api/ratings/watchlist/?user=${userId}`, {  })
            .then(res => { if (!res.ok) throw new Error(); return res.json(); })
            .then(data => {
                const list = Array.isArray(data.results || data) ? (data.results || data) : [];
                userWatchlistEntry = list.find(item => item.film === parseInt(filmId));
                updateWatchlistButton();
            })
            .catch(() => { userWatchlistEntry = null; updateWatchlistButton(); });
    }

    function updateWatchlistButton() {
        if (!watchlistBtn) return;
        if (userWatchlistEntry) {
            watchlistBtn.innerHTML = `<span class="material-symbols-outlined">done</span> Di Watchlist`;
            watchlistBtn.className = "bg-[#715A5A]/30 border-[#715A5A] text-white px-6 py-2.5 rounded font-medium transition-all hover:scale-[1.02] flex items-center gap-2";
        } else {
            watchlistBtn.innerHTML = `<span class="material-symbols-outlined">add</span> Watchlist`;
            watchlistBtn.className = "border border-[#D3DAD9]/30 hover:border-[#D3DAD9]/60 hover:bg-white/5 text-[#D3DAD9] px-6 py-2.5 rounded font-medium transition-all hover:scale-[1.02] flex items-center gap-2";
        }
    }

    if (watchlistBtn) {
        watchlistBtn.addEventListener("click", () => {
            if (typeof isAuthenticated === 'undefined' || !isAuthenticated) {
                if(window.showToast) window.showToast("Silakan sign in terlebih dahulu.", "warning"); 
                setTimeout(() => { window.location.href = "/login/"; }, 1500);
            } else {
                executeWatchlistToggle();
            }

            function executeWatchlistToggle() {
            watchlistBtn.disabled = true;
            if (userWatchlistEntry) {
                secureFetch(`/api/ratings/watchlist/${userWatchlistEntry.id}/`, { method: "DELETE" })
                    .then(res => { watchlistBtn.disabled = false; if (res.ok) { userWatchlistEntry = null; updateWatchlistButton(); } })
                    .catch(() => { watchlistBtn.disabled = false; });
            } else {
                secureFetch("/api/ratings/watchlist/", { method: "POST", headers: { "Content-Type": "application/json", }, body: JSON.stringify({ film: parseInt(filmId) }) })
                    .then(res => { if (!res.ok) return res.json().then(e => { throw new Error(e.error || "Gagal"); }); return res.json(); })
                    .then(data => { watchlistBtn.disabled = false; userWatchlistEntry = data; updateWatchlistButton(); })
                    .catch(err => { watchlistBtn.disabled = false; if(window.showToast) window.showToast(err.message || "Gagal menambah ke watchlist.", "error"); });
            }
            }
        });
    }

    fetch(`/api/films/${filmId}/`)
        .then(res => { if (!res.ok) throw new Error("Film not found"); return res.json(); })
        .then(film => {
            if (loading) loading.classList.add("hidden");
            if (detailWrapper) detailWrapper.classList.remove("hidden");

            const setTxt = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
            setTxt("film-title", film.title);
            setTxt("bc-name", film.title);
            setTxt("avg-rating-val", film.avg_rating ? parseFloat(film.avg_rating).toFixed(1) : "N/A");
            setTxt("release-year-val", film.release_year);
            if (film.is_tv_series) {
                setTxt("runtime-val", film.episodes_count ? `${film.episodes_count} Eps` : "TV Series");
            } else {
                setTxt("runtime-val", film.duration ? `${film.duration} menit` : "N/A");
            }
            setTxt("popularity-val", `${Math.round(film.popularity)} popularitas`);
            setTxt("synopsis-val", film.synopsis || "Tidak ada sinopsis tersedia.");

            let posterUrl = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500";
            if (film.local_poster) posterUrl = film.local_poster;
            else if (film.tmdb_poster) posterUrl = film.tmdb_poster.startsWith("http") ? film.tmdb_poster : `https://image.tmdb.org/t/p/w500${film.tmdb_poster}`;
            const pImg = document.getElementById("poster-img"); if(pImg) pImg.src = posterUrl;
            const bImg = document.getElementById("backdrop-img"); if(bImg) bImg.style.backgroundImage = `url('${posterUrl}')`;

            const genreContainer = document.getElementById("genre-chips");
            if (genreContainer && film.genre_display && film.genre_display.length > 0) {
                film.genre_display.forEach(g => {
                    const chip = document.createElement("a");
                    chip.href = `/movies/?genre=${g.id || g}`;
                    chip.className = "px-3 py-1 rounded-full border border-[#715A5A] font-['DM_Sans'] text-xs text-[#D3DAD9]/90 hover:bg-[#715A5A]/20 hover:text-white transition-all cursor-pointer";
                    chip.textContent = typeof g === 'object' ? g.name : g;
                    genreContainer.appendChild(chip);
                });
            }

            if (film.trailer_url && (film.trailer_url.includes("youtube.com") || film.trailer_url.includes("youtu.be"))) {
                const trailerBtn = document.getElementById("trailer-btn");
                if (trailerBtn) {
                    trailerBtn.classList.remove("hidden");
                    trailerBtn.classList.add("inline-flex");
                    trailerBtn.addEventListener("click", () => {
                        if(window.openTrailerModal) window.openTrailerModal(film.trailer_url);
                    });
                }
            }

            if (typeof isAuthenticated !== 'undefined' && isAuthenticated) {
                fetch('/api/auth/me/')
                    .then(r => { if(!r.ok) throw new Error(); return r.json(); })
                    .then(user => {
                            if (user.is_staff || user.is_superuser) {
                                const container = document.getElementById('admin-status-container');
                                const badge = document.getElementById('detail-status-badge');
                                const rejAlert = document.getElementById('detail-rejection-alert');
                                const rejText = document.getElementById('detail-rejection-text');
                                const editBtn = document.getElementById('admin-edit-direct-btn');

                                if (container && badge) {
                                    const statusEl = document.createElement('span');
                                    const statusMap = {
                                        published: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25",
                                        pending_approval: "bg-amber-500/10 text-amber-400 border border-amber-500/25",
                                        rejected: "bg-rose-500/10 text-rose-400 border border-rose-500/25",
                                    };
                                    statusEl.className = "px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase " + (statusMap[film.status] || "bg-stone-500/10 text-stone-400 border border-white/10");
                                    statusEl.textContent = film.status === 'pending_approval' ? 'Pending Approval' : (film.status || 'Draft');
                                    badge.replaceChildren(statusEl);
                                    container.classList.remove('hidden');

                                    if (film.status === 'rejected' && film.rejection_reason && rejText && rejAlert) {
                                        rejText.textContent = film.rejection_reason;
                                        rejAlert.classList.remove('hidden');
                                    }
                                    if (editBtn) editBtn.addEventListener('click', () => { window.location.href = `/admin-films/?edit=${film.id}`; });
                                }
                            }
                        }).catch(()=> {});
            }

            _renderGallery(film);

            if(window.fetchCast) window.fetchCast(film.id);
            if(window.fetchReviews) window.fetchReviews(film.id);
            fetchSimilar(film.id);
        })
        .catch(err => { if (loading) loading.classList.add("hidden"); if(errorContainer) errorContainer.classList.remove("hidden"); console.error(err); });

    function _renderGallery(film) {
        const gallerySection = document.getElementById("gallery-section");
        const galleryGrid = document.getElementById("gallery-grid");
        if (!gallerySection || !galleryGrid) return;
        gallerySection.classList.remove("hidden");
        galleryGrid.textContent = "";

        if (film.images && film.images.length > 0) {
            window.galleryImages = film.images.map(img => img.file_path.startsWith('/media/') ? img.file_path : `https://image.tmdb.org/t/p/original${img.file_path}`);
            film.images.forEach((img, index) => {
                const imgEl = document.createElement("img");
                imgEl.className = "w-full h-[150px] object-cover rounded-lg shadow-md hover:scale-105 transition-transform duration-300 cursor-pointer animate-fade-up";
                imgEl.style.animationDelay = `${index * 60}ms`;
                imgEl.src = img.file_path.startsWith('/media/') ? img.file_path : `https://image.tmdb.org/t/p/w780${img.file_path}`;
                imgEl.alt = `Galeri`;
                imgEl.addEventListener("click", () => {
                    if(window.openGalleryLightbox) window.openGalleryLightbox(index);
                });
                galleryGrid.appendChild(imgEl);
            });
        } else {
            const msg = document.createElement("p");
            msg.className = "col-span-full text-stone-500 italic text-sm py-8 text-center";
            msg.textContent = "Tidak ada data untuk galeri.";
            galleryGrid.appendChild(msg);
        }
    }

    function fetchSimilar(currentId) {
        const container = document.getElementById("similar-films");
        if (!container) return;
        container.textContent = "";
        fetch(`/api/films/${currentId}/similar/`)
            .then(res => { if (!res.ok) throw new Error(); return res.json(); })
            .then(results => {
                const list = Array.isArray(results) ? results : (results.results || []);
                if (list.length === 0) { container.innerHTML = `<p class="text-stone-500 italic text-sm">Tidak ada film rekomendasi serupa saat ini.</p>`; return; }
                list.slice(0, 6).forEach(film => {
                    const card = document.createElement("div");
                    card.className = "min-w-[150px] w-[150px] shrink-0 group cursor-pointer relative overflow-hidden rounded-[8px] bg-[#201f20] border border-white/5 transition-all hover:scale-105";
                    card.addEventListener("click", () => { window.location.href = `/movies/${film.id}/`; });
                    let posterUrl = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300";
                    if (film.local_poster) posterUrl = film.local_poster;
                    else if (film.tmdb_poster) posterUrl = film.tmdb_poster.startsWith("http") ? film.tmdb_poster : `https://image.tmdb.org/t/p/w500${film.tmdb_poster}`;
                    const imgDiv = document.createElement("div");
                    imgDiv.className = "h-[200px] w-full overflow-hidden";
                    const img = document.createElement("img");
                    img.className = "w-full h-full object-cover group-hover:scale-105 transition-all duration-500";
                    img.src = posterUrl; img.alt = film.title;
                    imgDiv.appendChild(img);
                    const p = document.createElement("div");
                    p.className = "p-3";
                    const title = document.createElement("h4");
                    title.className = "font-['DM_Sans'] text-xs font-semibold text-[#D3DAD9] truncate mb-1";
                    title.textContent = film.title;
                    const sub = document.createElement("div");
                    sub.className = "flex items-center gap-1 font-['DM_Sans'] text-[10px] text-[#D3DAD9]/60";
                    sub.innerHTML = `<span class="material-symbols-outlined text-xs text-[#F5C518]" style="font-variation-settings: 'FILL' 1;">star</span> ${film.avg_rating ? parseFloat(film.avg_rating).toFixed(1) : "N/A"}`;
                    p.appendChild(title); p.appendChild(sub);
                    card.appendChild(imgDiv); card.appendChild(p);
                    container.appendChild(card);
                });
            })
            .catch(() => { container.innerHTML = `<p class="text-stone-500 italic text-sm">Gagal memuat film rekomendasi serupa.</p>`; });
    }
});
