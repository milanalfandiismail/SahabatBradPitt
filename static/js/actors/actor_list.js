/**
 * actors/actor_list.js
 * Handles: Actor list fetch, render cards, search (debounced), pagination.
 */
document.addEventListener("DOMContentLoaded", function() {
    const grid = document.getElementById("actors-grid");
    const searchInput = document.getElementById("search-actors");
    const paginationControls = document.getElementById("pagination-controls");

    let currentPage = 1;
    let isLoading = false;

    function fetchActors(page = 1) {
        if (isLoading) return;
        isLoading = true;
        currentPage = page;

        grid.innerHTML = "";
        const initialLoading = document.createElement("div");
        initialLoading.id = "initial-loading";
        initialLoading.className = "col-span-full text-center py-12 text-[#c9c5cb]";
        initialLoading.innerHTML = `<span class="material-symbols-outlined text-4xl animate-spin">sync</span><p class="mt-2 font-['DM_Sans']">Memuat tokoh film...</p>`;
        grid.appendChild(initialLoading);

        if (paginationControls) paginationControls.classList.add("hidden");

        const params = new URLSearchParams();
        params.append("page", page);
        params.append("ordering", "name");
        params.append("page_size", 15);
        if (searchInput && searchInput.value.trim()) {
            params.append("search", searchInput.value.trim());
        }

        fetch(`/api/actors/?${params.toString()}`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(data => {
                isLoading = false;
                const loader = document.getElementById("initial-loading");
                if (loader) loader.remove();

                const results = data.results || [];
                const totalCount = data.count || results.length;

                grid.innerHTML = "";

                if (results.length === 0) {
                    grid.innerHTML = `<p class="col-span-full text-center text-[#c9c5cb] italic py-12">Tidak ada data aktor/tokoh ditemukan.</p>`;
                    if (paginationControls) paginationControls.innerHTML = "";
                    return;
                }

                results.forEach((actor, idx) => {
                    const article = document.createElement("article");
                    article.className = "group bg-[#201f20] rounded-lg p-5 border border-white/5 hover:-translate-y-1 hover:shadow-2xl hover:border-[#715A5A]/50 transition-all duration-300 cursor-pointer flex flex-col items-center text-center animate-fade-up";
                    article.style.animationDelay = `${idx * 60}ms`;
                    article.addEventListener("click", () => {
                        if (window.renderActorDetailPanel) window.renderActorDetailPanel(actor);
                        else window.location.href = `/actors/${actor.id}/`;
                    });

                    const portraitWrap = document.createElement("div");
                    portraitWrap.className = "w-28 h-28 rounded-full overflow-hidden mb-4 border-2 border-transparent group-hover:border-[#715A5A] transition-all duration-300 group-hover:scale-105 shadow-lg shadow-white/5";

                    let photoUrl = '';
                    if (actor.local_photo) {
                        photoUrl = actor.local_photo;
                    } else if (actor.tmdb_photo) {
                        photoUrl = actor.tmdb_photo.startsWith("http") ? actor.tmdb_photo : `https://image.tmdb.org/t/p/w500${actor.tmdb_photo}`;
                    }

                    if (photoUrl) {
                        const img = document.createElement("img");
                        img.className = "w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500";
                        img.src = photoUrl;
                        img.alt = actor.name;
                        portraitWrap.appendChild(img);
                    } else {
                        portraitWrap.className += " bg-[#37353E] flex items-center justify-center";
                        const icon = document.createElement("span");
                        icon.className = "material-symbols-outlined text-5xl text-stone-600";
                        icon.textContent = "help";
                        portraitWrap.appendChild(icon);
                    }

                    const name = document.createElement("h3");
                    name.className = "font-['DM_Sans'] text-base font-semibold text-white mb-1 truncate w-full";
                    name.textContent = actor.name;

                    const origin = document.createElement("p");
                    origin.className = "font-['DM_Sans'] text-xs text-[#D3DAD9]/50";

                    let roleLabel = "Aktor";
                    const filmographies = actor.filmographies || [];
                    const hasSutradara = filmographies.some(f => {
                        const r = (f.role || "").toLowerCase();
                        return r.includes("sutradara") || r.includes("director");
                    });
                    const hasPemeran = filmographies.some(f => {
                        const r = (f.role || "").toLowerCase();
                        return r.includes("pemeran") || r.includes("actor") || r.includes("cast");
                    });

                    if (hasSutradara && hasPemeran) {
                        roleLabel = "Aktor & Sutradara";
                    } else if (hasSutradara) {
                        roleLabel = "Sutradara";
                    } else if (hasPemeran) {
                        roleLabel = "Aktor";
                    }

                    origin.textContent = actor.birth_year
                        ? `${roleLabel} · ${actor.birth_year}`
                        : roleLabel;

                    article.appendChild(portraitWrap);
                    article.appendChild(name);
                    article.appendChild(origin);
                    grid.appendChild(article);
                });

                renderPagination(page, totalCount);
            })
            .catch(() => {
                isLoading = false;
                const loader = document.getElementById("initial-loading");
                if (loader) loader.remove();
                grid.innerHTML = `<p class="col-span-full text-center text-red-500 py-12">Terjadi kesalahan saat memuat data.</p>`;
                if (paginationControls) paginationControls.innerHTML = "";
            });
    }

    function renderPagination(page, totalCount) {
        if (!paginationControls) return;
        paginationControls.textContent = "";
        paginationControls.classList.remove("hidden");

        const totalPages = Math.ceil(totalCount / 15);
        if (totalPages <= 1) return;

        const prevBtn = document.createElement("button");
        prevBtn.className = "flex items-center justify-center w-8 h-8 rounded border transition-all " +
            (page === 1
                ? "border-white/5 text-stone-600 cursor-not-allowed opacity-50"
                : "border-white/10 text-stone-300 hover:border-[#715A5A] hover:bg-white/5");
        prevBtn.innerHTML = `<span class="material-symbols-outlined text-base">chevron_left</span>`;
        if (page > 1) prevBtn.addEventListener("click", () => fetchActors(page - 1));
        paginationControls.appendChild(prevBtn);

        let startPage, endPage;
        if (totalPages <= 5) {
            startPage = 1;
            endPage = totalPages;
        } else {
            if (page <= 3) {
                startPage = 1;
                endPage = 5;
            } else if (page + 2 >= totalPages) {
                startPage = totalPages - 4;
                endPage = totalPages;
            } else {
                startPage = page - 2;
                endPage = page + 2;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement("button");
            pageBtn.className = "w-8 h-8 rounded border text-xs font-bold transition-all " +
                (i === page
                    ? "bg-[#715A5A] border-[#715A5A] text-white shadow-md"
                    : "border-white/10 text-stone-300 hover:border-[#715A5A] hover:bg-white/5");
            pageBtn.textContent = i;
            pageBtn.addEventListener("click", () => fetchActors(i));
            paginationControls.appendChild(pageBtn);
        }

        const nextBtn = document.createElement("button");
        nextBtn.className = "flex items-center justify-center w-8 h-8 rounded border transition-all " +
            (page === totalPages
                ? "border-white/5 text-stone-600 cursor-not-allowed opacity-50"
                : "border-white/10 text-stone-300 hover:border-[#715A5A] hover:bg-white/5");
        nextBtn.innerHTML = `<span class="material-symbols-outlined text-base">chevron_right</span>`;
        if (page < totalPages) nextBtn.addEventListener("click", () => fetchActors(page + 1));
        paginationControls.appendChild(nextBtn);
    }

    const searchIconBtn = document.getElementById("search-icon-btn");
    const searchSubmitBtn = document.getElementById("search-submit-btn");
    const triggerSearch = () => fetchActors(1);

    if (searchSubmitBtn) searchSubmitBtn.addEventListener("click", triggerSearch);
    if (searchIconBtn) searchIconBtn.addEventListener("click", triggerSearch);

    let actorsSearchTimeout;
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            clearTimeout(actorsSearchTimeout);
            actorsSearchTimeout = setTimeout(() => triggerSearch(), 500);
        });
        searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                clearTimeout(actorsSearchTimeout);
                triggerSearch();
            }
        });
    }

    fetchActors(1);
});
