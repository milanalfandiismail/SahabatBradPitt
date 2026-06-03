/**
 * auth/profile_lists.js
 * Penanganan daftar ulasan (ratings) dan watchlist pada profil pengguna.
 */

document.addEventListener("DOMContentLoaded", function () {
    window.fetchUserRatings = function (userId, isOwner = true) {
        const grid = document.getElementById("rated-movies-grid");
        const moreContainer = document.getElementById("reviews-more-container");
        if (!grid) return;
        grid.textContent = "";
        if (moreContainer) moreContainer.classList.add("hidden");

        fetch(`/api/ratings/?user=${userId}`)
            .then(res => res.json())
            .then(ratings => {
                const results = ratings.results || ratings;
                if (results.length === 0) {
                    const msg = isOwner ? "Anda belum mengulas film apa pun." : "Cinephile ini belum mengulas film apa pun.";
                    grid.innerHTML = `<p class="col-span-full text-stone-500 italic text-sm">${msg}</p>`;
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
    };

    window.fetchUserWatchlist = function (userId, isOwner = true) {
        const grid = document.getElementById("watchlist-grid");
        const moreContainer = document.getElementById("watchlist-more-container");
        if (!grid) return;
        grid.textContent = "";
        if (moreContainer) moreContainer.classList.add("hidden");

        fetch(`/api/ratings/watchlist/?user=${userId}`)
            .then(res => res.json())
            .then(watchlist => {
                const results = watchlist.results || watchlist;
                if (results.length === 0) {
                    const msg = isOwner ? "Belum ada film di watchlist Anda." : "Belum ada film di watchlist.";
                    grid.innerHTML = `
                    <div class="col-span-full text-center py-12 text-stone-500">
                        <span class="material-symbols-outlined text-4xl mb-2">bookmark_border</span>
                        <p class="italic text-sm">${msg}</p>
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

                    if (isOwner) {
                        const overlay = document.createElement("button");
                        overlay.className = "absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 hover:bg-red-600 hover:scale-110 flex items-center justify-center text-white transition-all z-20 shadow-md";
                        overlay.innerHTML = `<span class="material-symbols-outlined text-base">close</span>`;
                        overlay.title = "Hapus dari Watchlist";
                        overlay.addEventListener("click", (e) => { e.stopPropagation(); deleteFromWatchlist(item.id, userId); });
                        card.appendChild(overlay);
                    }

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
                    card.appendChild(imgWrap);
                    p.appendChild(title); p.appendChild(meta);
                    card.appendChild(p);
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
    };

    function deleteFromWatchlist(watchlistId, userId) {
        if (!confirm("Apakah Anda yakin ingin menghapus film ini dari watchlist?")) return;
        secureFetch(`/api/ratings/watchlist/${watchlistId}/`, { method: "DELETE" })
            .then(res => {
                if (res.ok) { showToast("Film berhasil dihapus dari watchlist.", "success"); window.fetchUserWatchlist(userId); }
                else showToast("Gagal menghapus film dari watchlist.", "error");
            })
            .catch(err => { console.error(err); showToast("Terjadi kesalahan.", "error"); });
    }
});
