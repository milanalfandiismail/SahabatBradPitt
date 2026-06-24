/**
 * festivals/festival_list.js
 * Handles: Festival list fetch, render cards, search (debounced), pagination.
 */
document.addEventListener("DOMContentLoaded", function() {
    const grid = document.getElementById("festivals-grid");
    const searchInput = document.getElementById("search-festivals");
    const paginationControls = document.getElementById("pagination-controls");

    let currentPage = 1;
    let isLoading = false;

    function fetchFestivals(page = 1) {
        if (isLoading) return;
        isLoading = true;
        currentPage = page;

        grid.innerHTML = "";
        const initialLoading = document.createElement("div");
        initialLoading.id = "initial-loading";
        initialLoading.className = "col-span-full text-center py-12 text-[#c9c5cb]";
        initialLoading.innerHTML = `<span class="material-symbols-outlined text-4xl animate-spin">sync</span><p class="mt-2 font-['DM_Sans']">Memuat festival...</p>`;
        grid.appendChild(initialLoading);

        if (paginationControls) paginationControls.classList.add("hidden");

        const params = new URLSearchParams();
        params.append("page", page);
        if (searchInput && searchInput.value.trim()) {
            params.append("search", searchInput.value.trim());
        }

        fetch(`/api/festivals/festivals/?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                isLoading = false;
                const loader = document.getElementById("initial-loading");
                if (loader) loader.remove();

                const results = data.results || [];
                const totalCount = data.count || results.length;

                grid.innerHTML = "";

                if (results.length === 0) {
                    grid.innerHTML = `<p class="col-span-full text-center text-[#c9c5cb] italic py-12">Tidak ada data festival ditemukan.</p>`;
                    if (paginationControls) paginationControls.innerHTML = "";
                    return;
                }

                results.forEach((festival, idx) => {
                    const article = document.createElement("article");
                    article.className = "group bg-[#201f20] rounded-lg p-4 sm:p-6 border border-white/5 hover:border-[#715A5A]/50 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between animate-fade-up";
                    article.style.animationDelay = `${idx * 60}ms`;
                    article.addEventListener("click", () => {
                        window.location.href = `/festivals/${festival.id}/`;
                    });

                    let topHtml = `<div class="w-full flex justify-between items-start mb-4">
                        <div class="w-16 h-16 rounded bg-[#141314] flex items-center justify-center p-2 border border-white/5 shadow-inner">`;
                    if (festival.local_logo) {
                        topHtml += `<img src="${festival.local_logo}" alt="${festival.name}" class="w-full h-full object-contain" />`;
                    } else if (festival.tmdb_logo) {
                        let url = festival.tmdb_logo.startsWith("http") ? festival.tmdb_logo : `https://image.tmdb.org/t/p/w500${festival.tmdb_logo}`;
                        topHtml += `<img src="${url}" alt="${festival.name}" class="w-full h-full object-contain" />`;
                    } else {
                        topHtml += `<span class="material-symbols-outlined text-3xl text-amber-500">emoji_events</span>`;
                    }
                    topHtml += `</div></div>`;

                    let titles = `<h3 class="font-['Playfair_Display'] text-xl font-bold text-white mb-1 group-hover:text-[#715A5A] transition-colors">${festival.name}</h3>`;
                    if (festival.native_name) {
                        titles += `<p class="font-['DM_Sans'] text-xs text-[#D3DAD9]/40 mb-3">${festival.native_name}</p>`;
                    }

                    let location = `<div class="flex items-center gap-1.5 text-xs text-[#D3DAD9]/60 font-['DM_Sans'] mb-4"><span class="material-symbols-outlined text-[14px]">location_on</span> ${festival.city ? festival.city + ', ' : ''}${festival.country}</div>`;

                    let info = `<div class="flex gap-2">`;
                    if (festival.founded_year) info += `<span class="bg-white/5 px-2 py-1 rounded text-[10px] text-white uppercase tracking-wider">Est. ${festival.founded_year}</span>`;
                    if (festival.awards && festival.awards.length) info += `<span class="bg-[#715A5A]/20 px-2 py-1 rounded text-[10px] text-[#715A5A] font-bold uppercase tracking-wider">${festival.awards.length} Awards</span>`;
                    info += `</div>`;

                    article.innerHTML = topHtml + `<div class="flex-grow">` + titles + location + `</div>` + info;
                    grid.appendChild(article);
                });

                renderPagination(page, totalCount);
            })
            .catch(() => {
                isLoading = false;
                grid.innerHTML = `<p class="col-span-full text-center text-red-500 py-12">Gagal memuat data festival.</p>`;
            });
    }

    function renderPagination(page, totalCount) {
        if (!paginationControls) return;
        paginationControls.textContent = "";
        paginationControls.classList.remove("hidden");

        const totalPages = Math.ceil(totalCount / 12);
        if (totalPages <= 1) return;

        const prevBtn = document.createElement("button");
        prevBtn.className = "flex items-center justify-center w-8 h-8 rounded border transition-all " + (page === 1 ? "border-white/5 text-stone-600 cursor-not-allowed opacity-50" : "border-white/10 text-stone-300 hover:border-[#715A5A] hover:bg-white/5");
        prevBtn.innerHTML = `<span class="material-symbols-outlined text-base">chevron_left</span>`;
        if (page > 1) prevBtn.addEventListener("click", () => fetchFestivals(page - 1));
        paginationControls.appendChild(prevBtn);

        const pageBtn = document.createElement("button");
        pageBtn.className = "px-4 h-8 rounded border border-[#715A5A] bg-[#715A5A]/20 text-[#715A5A] text-xs font-bold transition-all";
        pageBtn.textContent = `Page ${page} of ${totalPages}`;
        paginationControls.appendChild(pageBtn);

        const nextBtn = document.createElement("button");
        nextBtn.className = "flex items-center justify-center w-8 h-8 rounded border transition-all " + (page === totalPages ? "border-white/5 text-stone-600 cursor-not-allowed opacity-50" : "border-white/10 text-stone-300 hover:border-[#715A5A] hover:bg-white/5");
        nextBtn.innerHTML = `<span class="material-symbols-outlined text-base">chevron_right</span>`;
        if (page < totalPages) nextBtn.addEventListener("click", () => fetchFestivals(page + 1));
        paginationControls.appendChild(nextBtn);
    }

    const triggerSearch = () => fetchFestivals(1);
    document.getElementById("search-submit-btn")?.addEventListener("click", triggerSearch);
    document.getElementById("search-icon-btn")?.addEventListener("click", triggerSearch);

    let festivalSearchTimeout;
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            clearTimeout(festivalSearchTimeout);
            festivalSearchTimeout = setTimeout(() => triggerSearch(), 500);
        });
        searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                clearTimeout(festivalSearchTimeout);
                triggerSearch();
            }
        });
    }

    fetchFestivals(1);
});
