document.addEventListener("DOMContentLoaded", function() {
    window.FilmListState = window.FilmListState || {
        selectedGenreIds: [],
        currentPage: 1,
        isLoading: false
    };

    const filmGrid = document.getElementById("film-grid");
    const resultsCount = document.getElementById("results-count");
    const searchInput = document.getElementById("search-input");
    const yearFrom = document.getElementById("year-from");
    const yearTo = document.getElementById("year-to");
    const ratingSlider = document.getElementById("rating-slider");

    window.fetchFilms = function(page = 1) {
        if (window.FilmListState.isLoading) return;
        window.FilmListState.isLoading = true;
        window.FilmListState.currentPage = page;
        
        filmGrid.innerHTML = "";
        
        const spinner = document.createElement("div");
        spinner.id = "initial-loading";
        spinner.className = "text-center py-12 text-[#c9c5cb]";
        spinner.innerHTML = `<span class="material-symbols-outlined text-4xl animate-spin">sync</span><p class="mt-2 font-['DM_Sans']">Memuat film...</p>`;
        filmGrid.appendChild(spinner);

        const paginationControls = document.getElementById("pagination-controls");
        if (paginationControls) paginationControls.classList.add("hidden");

        const params = new URLSearchParams();
        params.append("page", page);
        if (searchInput && searchInput.value.trim()) {
            params.append("search", searchInput.value.trim());
        }
        if (window.FilmListState.selectedGenreIds.length > 0) {
            params.append("genre", window.FilmListState.selectedGenreIds.join(","));
        }
        if (yearFrom && yearFrom.value) {
            params.append("year_from", yearFrom.value);
        }
        if (yearTo && yearTo.value) {
            params.append("year_to", yearTo.value);
        }
        if (ratingSlider && ratingSlider.value > 0) {
            params.append("min_rating", ratingSlider.value);
        }
        
        const activeSortRadio = document.querySelector('input[name="sort"]:checked');
        if (activeSortRadio) {
            params.append("ordering", activeSortRadio.value);
        }

        fetch(`/api/films/?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                window.FilmListState.isLoading = false;
                const initialLoading = document.getElementById("initial-loading");
                if (initialLoading) initialLoading.remove();

                const results = data.results || [];
                const totalCount = data.count || results.length;

                filmGrid.innerHTML = "";

                if (results.length === 0) {
                    if(resultsCount) resultsCount.textContent = "Menampilkan 0 hasil";
                    const emptyState = document.createElement("div");
                    emptyState.className = "text-center py-16 bg-[#201f20] rounded-lg border border-white/5";
                    emptyState.innerHTML = `
                        <span class="material-symbols-outlined text-5xl text-[#938f95] mb-3">sentiment_dissatisfied</span>
                        <h3 class="text-lg font-medium text-stone-300">Tidak ada film yang cocok</h3>
                        <p class="text-sm text-stone-500 mt-1">Coba sesuaikan kata kunci atau filter pencarian Anda.</p>
                    `;
                    filmGrid.appendChild(emptyState);
                    if (paginationControls) paginationControls.innerHTML = "";
                    return;
                }

                results.forEach((film, index) => {
                    const card = document.createElement("div");
                    card.className = `bg-[#201f20] rounded-lg overflow-hidden flex shadow-lg hover:-translate-y-1 hover:shadow-2xl hover:border-[#715A5A]/50 transition-all duration-300 group border border-white/5 cursor-pointer animate-fade-up`;
                    card.style.animationDelay = `${index * 60}ms`;
                    
                    let posterUrl = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500";
                    if (film.poster) {
                        posterUrl = film.poster;
                    } else if (film.poster_path) {
                        posterUrl = film.poster_path.startsWith("http") ? film.poster_path : `https://image.tmdb.org/t/p/w500${film.poster_path}`;
                    }

                    const thumbDiv = document.createElement("div");
                    thumbDiv.className = "w-[100px] sm:w-[130px] shrink-0 bg-surface-dim relative overflow-hidden";
                    
                    const img = document.createElement("img");
                    img.alt = film.title;
                    img.className = "w-full h-full object-cover group-hover:scale-105 transition-all duration-500";
                    img.src = posterUrl;
                    thumbDiv.appendChild(img);

                    const contentDiv = document.createElement("div");
                    contentDiv.className = "flex-grow p-5 flex flex-col justify-between gap-3 relative";

                    const mainInfoDiv = document.createElement("div");
                    const titleHeader = document.createElement("div");
                    titleHeader.className = "flex justify-between items-start gap-4";
                    
                    const title = document.createElement("h2");
                    title.className = "font-['DM_Sans'] text-lg md:text-xl font-medium text-[#c7c5d1] group-hover:text-white transition-colors line-clamp-1";
                    title.textContent = film.title;
                    titleHeader.appendChild(title);

                    const rankBadge = document.createElement("div");
                    rankBadge.className = "w-7 h-7 rounded-full bg-[#715A5A] flex items-center justify-center text-[#D3DAD9] font-bold text-xs shrink-0 shadow-md";
                    rankBadge.textContent = `#${(page - 1) * 12 + index + 1}`;
                    titleHeader.appendChild(rankBadge);
                    mainInfoDiv.appendChild(titleHeader);

                    const metaRow = document.createElement("div");
                    metaRow.className = "flex flex-wrap items-center gap-x-2 gap-y-1 font-['DM_Sans'] text-xs text-stone-400 mt-2";
                    
                    const yearSpan = document.createElement("span");
                    yearSpan.textContent = film.release_year;
                    metaRow.appendChild(yearSpan);
                    
                    metaRow.appendChild(document.createTextNode(" • "));
                    
                    const durationSpan = document.createElement("span");
                    if (film.is_tv_series) {
                        durationSpan.textContent = film.episodes_count ? `${film.episodes_count} Eps` : "TV Series";
                    } else {
                        durationSpan.textContent = film.duration ? `${film.duration} min` : "N/A";
                    }
                    metaRow.appendChild(durationSpan);

                    metaRow.appendChild(document.createTextNode(" • "));

                    const ratingDiv = document.createElement("div");
                    ratingDiv.className = "flex items-center gap-1 text-[#F5C518]";
                    ratingDiv.innerHTML = `<span class="material-symbols-outlined text-xs fill-1" style="font-variation-settings: 'FILL' 1;">star</span>`;
                    const ratingText = document.createElement("span");
                    ratingText.className = "text-stone-300 font-medium";
                    ratingText.textContent = film.avg_rating ? parseFloat(film.avg_rating).toFixed(1) : "N/A";
                    ratingDiv.appendChild(ratingText);
                    metaRow.appendChild(ratingDiv);
                    
                    if (film.genre_display && film.genre_display.length > 0) {
                        metaRow.appendChild(document.createTextNode(" • "));
                        const genreSpan = document.createElement("span");
                        const genreNames = film.genre_display.map(g => g.name || g).join(", ");
                        genreSpan.textContent = genreNames;
                        metaRow.appendChild(genreSpan);
                    }
                    
                    mainInfoDiv.appendChild(metaRow);

                    const synopsis = document.createElement("p");
                    synopsis.className = "font-['DM_Sans'] text-xs text-[#c9c5cb] line-clamp-2 mt-3 leading-relaxed";
                    synopsis.textContent = film.synopsis || "Tidak ada sinopsis tersedia.";
                    mainInfoDiv.appendChild(synopsis);
                    contentDiv.appendChild(mainInfoDiv);

                    const actionsDiv = document.createElement("div");
                    actionsDiv.className = "flex items-center gap-3 mt-1";
                    
                    const detailBtn = document.createElement("button");
                    detailBtn.className = "px-3 py-1.5 rounded text-xs font-medium border border-[#715A5A] text-[#c7c5d1] bg-[#715A5A]/10 hover:bg-[#715A5A] hover:text-white transition-all flex items-center gap-1";
                    detailBtn.innerHTML = `<span class="material-symbols-outlined text-sm">info</span> Detail Film`;
                    detailBtn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        window.location.href = `/movies/${film.id}/`;
                    });
                    actionsDiv.appendChild(detailBtn);

                    if (film.trailer_url) {
                        const trailerBtn = document.createElement("a");
                        trailerBtn.className = "px-3 py-1.5 rounded text-xs font-medium border border-white/10 text-stone-300 hover:border-[#715A5A] hover:text-[#c7c5d1] transition-all flex items-center gap-1";
                        trailerBtn.href = film.trailer_url;
                        trailerBtn.target = "_blank";
                        trailerBtn.innerHTML = `<span class="material-symbols-outlined text-sm">play_circle</span> Trailer`;
                        trailerBtn.addEventListener("click", (e) => e.stopPropagation());
                        actionsDiv.appendChild(trailerBtn);
                    }
                    contentDiv.appendChild(actionsDiv);

                    card.appendChild(thumbDiv);
                    card.appendChild(contentDiv);
                    
                    card.addEventListener("click", () => {
                        window.location.href = `/movies/${film.id}/`;
                    });

                    filmGrid.appendChild(card);
                });

                const startIdx = (page - 1) * 12 + 1;
                const endIdx = Math.min(page * 12, totalCount);
                if(resultsCount) resultsCount.textContent = `Menampilkan ${startIdx} - ${endIdx} dari ${totalCount} film`;
                
                renderPagination(page, totalCount);
            })
            .catch(err => {
                window.FilmListState.isLoading = false;
                console.error("Gagal mengambil data film:", err);
                filmGrid.textContent = "";
                const errorState = document.createElement("div");
                errorState.className = "text-center py-16 bg-[#201f20] rounded-lg border border-white/5";
                errorState.innerHTML = `
                    <span class="material-symbols-outlined text-5xl text-red-500 mb-3">error</span>
                    <h3 class="text-lg font-medium text-stone-300">Gagal mengambil data</h3>
                    <p class="text-sm text-stone-500 mt-1">Terjadi kesalahan koneksi dengan server.</p>
                `;
                filmGrid.appendChild(errorState);
                if (paginationControls) paginationControls.innerHTML = "";
            });
    };

    function renderPagination(page, totalCount) {
        const container = document.getElementById("pagination-controls");
        if (!container) return;
        container.textContent = "";
        container.classList.remove("hidden");

        const totalPages = Math.ceil(totalCount / 12);
        if (totalPages <= 1) return;

        const prevBtn = document.createElement("button");
        prevBtn.className = "flex items-center justify-center w-8 h-8 rounded border transition-all " + 
            (page === 1 
                ? "border-white/5 text-stone-600 cursor-not-allowed opacity-50" 
                : "border-white/10 text-stone-300 hover:border-[#715A5A] hover:bg-white/5");
        prevBtn.innerHTML = `<span class="material-symbols-outlined text-base">chevron_left</span>`;
        if (page > 1) {
            prevBtn.addEventListener("click", () => window.fetchFilms(page - 1));
        }
        container.appendChild(prevBtn);

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
            pageBtn.addEventListener("click", () => window.fetchFilms(i));
            container.appendChild(pageBtn);
        }

        const nextBtn = document.createElement("button");
        nextBtn.className = "flex items-center justify-center w-8 h-8 rounded border transition-all " + 
            (page === totalPages 
                ? "border-white/5 text-stone-600 cursor-not-allowed opacity-50" 
                : "border-white/10 text-stone-300 hover:border-[#715A5A] hover:bg-white/5");
        nextBtn.innerHTML = `<span class="material-symbols-outlined text-base">chevron_right</span>`;
        if (page < totalPages) {
            nextBtn.addEventListener("click", () => window.fetchFilms(page + 1));
        }
        container.appendChild(nextBtn);
    }
});
