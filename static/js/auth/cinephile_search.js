document.addEventListener("DOMContentLoaded", function() {
    var grid = document.getElementById("users-grid");
    var searchInput = document.getElementById("search-input");
    var searchBtn = document.getElementById("search-btn");
    var paginationControls = document.getElementById("pagination-controls");
    var currentPage = 1;
    var isLoading = false;

    function fetchUsers(page) {
        if (page === undefined) page = 1;
        if (isLoading) return;
        isLoading = true;
        currentPage = page;

        grid.innerHTML = '<div class="col-span-full text-center py-12 text-[#c9c5cb]"><span class="material-symbols-outlined text-4xl animate-spin">sync</span><p class="mt-2 font-[\'DM_Sans\']">Memuat user...</p></div>';
        paginationControls.classList.add("hidden");

        var params = new URLSearchParams();
        params.append("page", page);
        params.append("page_size", 16);
        var q = searchInput ? searchInput.value.trim() : "";
        if (q) params.append("q", q);

        fetch("/profile/search/?" + params.toString())
            .then(function(res) { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
            .then(function(data) {
                isLoading = false;
                var users = data.users || [];
                if (users.length === 0) {
                    grid.innerHTML = "<p class='col-span-full text-center text-[#c9c5cb] italic py-12'>Tidak ada Cinephile yang ditemukan.</p>";
                    return;
                }
                grid.innerHTML = "";
                for (var i = 0; i < users.length; i++) {
                    var u = users[i];
                    var card = document.createElement("article");
                    card.className = "bg-[#201f20] rounded-xl border border-white/5 p-6 hover:scale-[1.02] hover:border-white/10 transition-all duration-300 flex flex-col items-center text-center shadow-lg relative overflow-hidden group";

                    var avatar = document.createElement("div");
                    avatar.className = "w-20 h-20 rounded-full border border-white/10 overflow-hidden mb-4 bg-[#37353E] relative z-10 shrink-0";
                    var fallbackSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a8a29e'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";
                    if (u.profile && u.profile.avatar) {
                        var img = document.createElement("img");
                        img.src = u.profile.avatar.url;
                        img.className = "w-full h-full object-cover";
                        img.onerror = function() { this.src = fallbackSvg; };
                        avatar.appendChild(img);
                    } else {
                        avatar.innerHTML = '<img src="' + fallbackSvg + '" alt="Avatar" class="w-full h-full object-cover" />';
                    }

                    var name = document.createElement("h3");
                    name.className = "font-['DM_Sans'] text-base font-semibold text-white mb-1 line-clamp-1 relative z-10";
                    name.textContent = u.profile ? u.profile.display_name : "Cinephile #" + u.id;

                    var stats = document.createElement("div");
                    stats.className = "flex items-center gap-4 text-stone-500 text-xs mb-6 relative z-10";
                    var reviews = u.profile ? u.profile.reviews_count || 0 : 0;
                    var rating = u.avg_rating || 0;
                    stats.innerHTML = '<span class="flex items-center gap-1"><span class="material-symbols-outlined text-sm">rate_review</span> ' + reviews + ' Ulasan</span><span class="flex items-center gap-1"><span class="material-symbols-outlined text-sm">star</span> ' + rating + '</span>';

                    var link = document.createElement("a");
                    link.href = "/profile/" + u.id + "/";
                    link.className = "w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-xs font-semibold tracking-wide transition-all relative z-10 flex items-center justify-center gap-1";
                    link.innerHTML = 'Lihat Profil <span class="material-symbols-outlined text-xs">arrow_forward</span>';

                    card.appendChild(avatar);
                    card.appendChild(name);
                    card.appendChild(stats);
                    card.appendChild(link);
                    grid.appendChild(card);
                }
                renderPagination(page, data.total_pages);
            })
            .catch(function(err) {
                isLoading = false;
                console.error(err);
                grid.innerHTML = "<p class='col-span-full text-center text-red-500 py-12'>Gagal memuat data.</p>";
            });
    }

    function renderPagination(page, totalPages) {
        if (!paginationControls) return;
        paginationControls.textContent = "";
        paginationControls.classList.remove("hidden");

        if (totalPages <= 1) return;

        const prevBtn = document.createElement("button");
        prevBtn.className = "flex items-center justify-center w-8 h-8 rounded border transition-all " + 
            (page === 1 
                ? "border-white/5 text-stone-600 cursor-not-allowed opacity-50" 
                : "border-white/10 text-stone-300 hover:border-[#715A5A] hover:bg-white/5");
        prevBtn.innerHTML = '<span class="material-symbols-outlined text-base">chevron_left</span>';
        if (page > 1) prevBtn.addEventListener("click", () => fetchUsers(page - 1));
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
            pageBtn.addEventListener("click", () => fetchUsers(i));
            paginationControls.appendChild(pageBtn);
        }

        const nextBtn = document.createElement("button");
        nextBtn.className = "flex items-center justify-center w-8 h-8 rounded border transition-all " + 
            (page === totalPages 
                ? "border-white/5 text-stone-600 cursor-not-allowed opacity-50" 
                : "border-white/10 text-stone-300 hover:border-[#715A5A] hover:bg-white/5");
        nextBtn.innerHTML = '<span class="material-symbols-outlined text-base">chevron_right</span>';
        if (page < totalPages) nextBtn.addEventListener("click", () => fetchUsers(page + 1));
        paginationControls.appendChild(nextBtn);
    }

    if (searchBtn) searchBtn.addEventListener("click", function() { fetchUsers(1); });
    if (searchInput) searchInput.addEventListener("keypress", function(e) { if (e.key === "Enter") fetchUsers(1); });

    fetchUsers(1);
});
