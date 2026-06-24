/**
 * movies/recommendations.js
 * Handles: Questionnaire form, preferences loading, fetch AI recommendations, pagination, render results.
 */

document.addEventListener("DOMContentLoaded", function () {
    const genresGrid = document.getElementById("genres-grid");
    const recommendBtn = document.getElementById("recommend-btn");
    const resultsPlaceholder = document.getElementById("results-placeholder");
    const resultsLoading = document.getElementById("results-loading");
    const feed = document.getElementById("recommendations-feed");

    let selectedFocus = "balanced";
    let selectedGenres = [];
    let selectedEra = null;
    let selectedDuration = null;

    // 1. Interactive selectors binding
    const focusBtns = document.querySelectorAll(".focus-btn");
    focusBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            focusBtns.forEach(b => b.classList.remove("border-[#715A5A]", "bg-[#715A5A]/20"));
            selectedFocus = btn.getAttribute("data-focus");
            btn.classList.add("border-[#715A5A]", "bg-[#715A5A]/20");
        });
    });

    const eraBtns = document.querySelectorAll(".era-btn");
    eraBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            eraBtns.forEach(b => b.classList.remove("border-[#715A5A]", "bg-[#715A5A]/20", "text-white"));
            if (selectedEra === btn.getAttribute("data-era")) {
                selectedEra = null;
            } else {
                selectedEra = btn.getAttribute("data-era");
                btn.classList.add("border-[#715A5A]", "bg-[#715A5A]/20", "text-white");
            }
        });
    });

    const durationBtns = document.querySelectorAll(".duration-btn");
    durationBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            durationBtns.forEach(b => b.classList.remove("border-[#715A5A]", "bg-[#715A5A]/20", "text-white"));
            if (selectedDuration === btn.getAttribute("data-duration")) {
                selectedDuration = null;
            } else {
                selectedDuration = btn.getAttribute("data-duration");
                btn.classList.add("border-[#715A5A]", "bg-[#715A5A]/20", "text-white");
            }
        });
    });

    // 2. Load user preferences & available genres as select chips
    let savedPreferences = null;

    fetch("/api/auth/me/")
        .then(res => { if (!res.ok) throw new Error("Not logged in"); return res.json(); })
            .then(user => {
                if (user.preferences) {
                    savedPreferences = user.preferences;
                    const badge = document.getElementById("preferences-badge");
                    if (badge) badge.classList.remove("hidden");

                    if (savedPreferences.pref_focus) {
                        selectedFocus = savedPreferences.pref_focus;
                        document.querySelectorAll(".focus-btn").forEach(b => b.classList.remove("border-[#715A5A]", "bg-[#715A5A]/20"));
                        const focusBtn = document.querySelector(`.focus-btn[data-focus="${selectedFocus}"]`);
                        if (focusBtn) focusBtn.classList.add("border-[#715A5A]", "bg-[#715A5A]/20");
                    }
                    if (savedPreferences.pref_era) {
                        selectedEra = savedPreferences.pref_era;
                        const eraBtn = document.querySelector(`.era-btn[data-era="${selectedEra}"]`);
                        if (eraBtn) eraBtn.classList.add("border-[#715A5A]", "bg-[#715A5A]/20", "text-white");
                    }
                    if (savedPreferences.pref_duration) {
                        selectedDuration = savedPreferences.pref_duration;
                        const durationBtn = document.querySelector(`.duration-btn[data-duration="${selectedDuration}"]`);
                        if (durationBtn) durationBtn.classList.add("border-[#715A5A]", "bg-[#715A5A]/20", "text-white");
                    }
                }
            })
            .catch(() => {})
            .finally(() => loadGenres());

    function loadGenres() {
        fetch("/api/films/genres/")
            .then(res => res.json())
            .then(genres => {
                if (!genresGrid) return;
                genresGrid.textContent = "";
                const genreList = Array.isArray(genres) ? genres : (genres.results || []);
                genreList.forEach(genre => {
                    const chip = document.createElement("button");
                    chip.type = "button";
                    chip.className = "px-3 py-1.5 rounded-full border border-white/10 text-stone-400 text-xs hover:border-[#715A5A] transition-all";
                    chip.textContent = genre.name;

                    if (savedPreferences && savedPreferences.pref_genres && savedPreferences.pref_genres.includes(genre.id)) {
                        selectedGenres.push(genre.id);
                        chip.classList.add("border-[#715A5A]", "bg-[#715A5A]/20", "text-[#c7c5d1]");
                    }

                    chip.addEventListener("click", () => {
                        if (selectedGenres.includes(genre.id)) {
                            selectedGenres = selectedGenres.filter(id => id !== genre.id);
                            chip.classList.remove("border-[#715A5A]", "bg-[#715A5A]/20", "text-[#c7c5d1]");
                        } else {
                            selectedGenres.push(genre.id);
                            chip.classList.add("border-[#715A5A]", "bg-[#715A5A]/20", "text-[#c7c5d1]");
                        }
                    });
                    genresGrid.appendChild(chip);
                });
            });
    }

    // 3. Post preferences to REST API
    let allRecommendations = [];
    let currentRecPage = 1;

    recommendBtn?.addEventListener("click", () => {
        resultsPlaceholder.classList.add("hidden");
        feed.classList.add("hidden");
        resultsLoading.classList.remove("hidden");

        const bodyData = {
            focus: selectedFocus || "balanced",
            genres: selectedGenres,
            era: selectedEra || "",
            duration: selectedDuration || ""
        };

        const headers = { "Content-Type": "application/json" };

        secureFetch("/api/recommendations/", {
            method: "POST",
            headers: headers,
            body: JSON.stringify(bodyData)
        })
            .then(res => res.json())
            .then(data => {
                resultsLoading.classList.add("hidden");
                allRecommendations = data.results || [];
                currentRecPage = 1;
                renderRecommendationsPage();
            })
            .catch(err => {
                resultsLoading.classList.add("hidden");
                feed.classList.remove("hidden");
                document.getElementById("pagination-controls")?.classList.add("hidden");
                feed.innerHTML = `<p class="text-red-500 text-center py-12 italic text-sm">Gagal menghubungkan ke mesin AI rekomendasi.</p>`;
            });
    });

    function renderRecommendationsPage() {
        const paginationCtrls = document.getElementById("pagination-controls");
        feed.classList.remove("hidden");
        feed.textContent = "";

        if (!allRecommendations || allRecommendations.length === 0) {
            if (paginationCtrls) paginationCtrls.classList.add("hidden");
            feed.innerHTML = `
                <div class="bg-[#201f20] rounded-xl p-12 border border-white/5 text-center text-stone-500 font-['DM_Sans'] h-[300px] flex flex-col justify-center items-center">
                    <span class="material-symbols-outlined text-5xl text-stone-600 mb-3">gavel</span>
                    <h3 class="text-stone-300 font-medium">Tidak Ada Rekomendasi</h3>
                    <p class="text-xs text-stone-500 mt-2 max-w-xs">Sistem tidak menemukan film yang cocok dengan kombinasi kriteria tersebut di database kami. Silakan ubah durasi, era, atau kurangi jumlah filter genre.</p>
                </div>`;
            return;
        }

        const itemsPerPage = 5;
        const totalItems = allRecommendations.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        const startIndex = (currentRecPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
        const pageItems = allRecommendations.slice(startIndex, endIndex);

        pageItems.forEach((item, index) => {
            const globalIndex = startIndex + index;
            const card = document.createElement("div");
            card.className = "bg-[#201f20] rounded-xl p-5 border border-white/5 flex flex-col sm:flex-row items-center sm:items-stretch gap-5 shadow-2xl relative hover:scale-[1.01] transition-all cursor-pointer";
            card.addEventListener("click", () => window.location.href = `/movies/${item.id}/`);

            const badge = document.createElement("div");
            badge.className = "absolute -left-3 -top-3 w-8 h-8 rounded-full bg-[#715A5A] text-white flex items-center justify-center font-serif text-sm font-bold shadow-lg border border-white/10";
            badge.textContent = `#${globalIndex + 1}`;
            card.appendChild(badge);

            const posterWrap = document.createElement("div");
            posterWrap.className = "w-20 h-28 sm:w-28 sm:h-40 rounded-lg overflow-hidden shrink-0 bg-surface-dim shadow-md";
            let pUrl = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300";
            if (item.local_poster) pUrl = item.local_poster;
            else if (item.poster_path) pUrl = item.poster_path.startsWith("http") ? item.poster_path : `https://image.tmdb.org/t/p/w500${item.poster_path}`;
            const img = document.createElement("img");
            img.className = "w-full h-full object-cover"; img.src = pUrl; img.alt = item.title;
            posterWrap.appendChild(img);

            const content = document.createElement("div");
            content.className = "flex-grow flex flex-col gap-2 justify-center min-w-0 w-full";

            const titleRow = document.createElement("div");
            titleRow.className = "flex justify-between items-start gap-4 min-w-0 w-full";
            const titleCol = document.createElement("div");
            titleCol.className = "min-w-0 flex-1";
            const title = document.createElement("h3");
            title.className = "font-['Playfair_Display'] text-xl font-bold text-white line-clamp-2 break-words whitespace-normal";
            title.textContent = item.title;
            titleCol.appendChild(title);
            titleRow.appendChild(titleCol);

            const matchPercent = document.createElement("div");
            matchPercent.className = "px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400 font-bold text-[11px] shrink-0";
            const scoreVal = item.topsis_score ? (item.topsis_score * 100).toFixed(0) : "N/A";
            matchPercent.textContent = `${scoreVal}% MATCH`;
            titleRow.appendChild(matchPercent);
            content.appendChild(titleRow);

            const meta = document.createElement("div");
            meta.className = "flex items-center gap-2 text-stone-400 text-xs font-['DM_Sans']";
            const starSpan = document.createElement("span");
            starSpan.className = "material-symbols-outlined text-xs text-[#F5C518]";
            starSpan.style.fontVariationSettings = "'FILL' 1"; starSpan.textContent = "star";
            meta.appendChild(starSpan);
            const ratingSpan = document.createElement("span");
            ratingSpan.className = "text-stone-300 font-medium";
            ratingSpan.textContent = item.avg_rating ? parseFloat(item.avg_rating).toFixed(1) : 'N/A';
            meta.appendChild(ratingSpan);
            meta.appendChild(document.createTextNode(" • "));
            const yearSpan = document.createElement("span"); yearSpan.textContent = item.release_year; meta.appendChild(yearSpan);
            meta.appendChild(document.createTextNode(" • "));
            const durationSpan = document.createElement("span"); durationSpan.textContent = item.duration ? `${item.duration} menit` : 'N/A'; meta.appendChild(durationSpan);
            content.appendChild(meta);

            const reason = document.createElement("p");
            reason.className = "text-stone-400 text-xs leading-relaxed mt-2 p-3 rounded bg-[#141314]/50 border border-white/5 font-['DM_Sans']";
            reason.textContent = item.reasoning || "Direkomendasikan karena kesesuaian parameter rating tinggi dan bobot popularitas TOPSIS.";
            content.appendChild(reason);

            card.appendChild(posterWrap); card.appendChild(content);
            feed.appendChild(card);
        });

        renderPaginationControls(totalPages);
    }

    function renderPaginationControls(totalPages) {
        const container = document.getElementById("pagination-controls");
        if (!container) return;
        container.textContent = "";

        if (totalPages <= 1) { container.classList.add("hidden"); return; }
        container.classList.remove("hidden");

        const prevBtn = document.createElement("button");
        prevBtn.className = "flex items-center justify-center w-8 h-8 rounded border transition-all " +
            (currentRecPage === 1 ? "border-white/5 text-stone-600 cursor-not-allowed opacity-50" : "border-white/10 text-stone-300 hover:border-[#715A5A] hover:bg-[#715A5A]/10");
        prevBtn.innerHTML = `<span class="material-symbols-outlined text-base">chevron_left</span>`;
        if (currentRecPage > 1) {
            prevBtn.addEventListener("click", () => { currentRecPage--; renderRecommendationsPage(); feed.scrollIntoView({ behavior: 'smooth' }); });
        }
        container.appendChild(prevBtn);

        let startPage = Math.max(1, currentRecPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement("button");
            pageBtn.className = "w-8 h-8 rounded border transition-all " + (i === currentRecPage ? "bg-[#715A5A] text-white border-[#715A5A] font-semibold" : "border-white/10 text-stone-300 hover:border-[#715A5A] hover:bg-[#715A5A]/10");
            pageBtn.textContent = i;
            pageBtn.addEventListener("click", () => { currentRecPage = i; renderRecommendationsPage(); feed.scrollIntoView({ behavior: 'smooth' }); });
            container.appendChild(pageBtn);
        }

        const nextBtn = document.createElement("button");
        nextBtn.className = "flex items-center justify-center w-8 h-8 rounded border transition-all " +
            (currentRecPage === totalPages ? "border-white/5 text-stone-600 cursor-not-allowed opacity-50" : "border-white/10 text-stone-300 hover:border-[#715A5A] hover:bg-[#715A5A]/10");
        nextBtn.innerHTML = `<span class="material-symbols-outlined text-base">chevron_right</span>`;
        if (currentRecPage < totalPages) {
            nextBtn.addEventListener("click", () => { currentRecPage++; renderRecommendationsPage(); feed.scrollIntoView({ behavior: 'smooth' }); });
        }
        container.appendChild(nextBtn);
    }
});
