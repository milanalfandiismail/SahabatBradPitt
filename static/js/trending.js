document.addEventListener("DOMContentLoaded", function() {
    const spotlightLoading = document.getElementById("spotlight-loading");
    const spotlightContainer = document.getElementById("spotlight-container");
    const risingList = document.getElementById("rising-list");

    fetch("/api/films/?ordering=-popularity")
        .then(res => res.json())
        .then(data => {
            const films = data.results || data;
            if (films.length === 0) {
                spotlightLoading.textContent = "Tidak ada data film saat ini.";
                return;
            }

            spotlightLoading.classList.add("hidden");
            spotlightContainer.classList.remove("hidden");

            const f1 = films[0];
            let poster1 = f1.poster_path ? (f1.poster_path.startsWith("http") ? f1.poster_path : `https://image.tmdb.org/t/p/w500${f1.poster_path}`) : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800";
            document.getElementById("rank-1-img").src = poster1;
            document.getElementById("rank-1-title").textContent = f1.title;
            document.getElementById("rank-1-rating").textContent = f1.avg_rating ? parseFloat(f1.avg_rating).toFixed(1) : "N/A";
            let rank1YearText = f1.release_year || "";
            if (f1.genre_display && f1.genre_display.length > 0) {
                const genreNames = f1.genre_display.map(g => g.name || g).join(", ");
                rank1YearText += ` • ${genreNames}`;
            }
            document.getElementById("rank-1-year").textContent = rank1YearText;
            document.getElementById("rank-1-synopsis").textContent = f1.synopsis || "Sinopsis tidak tersedia.";
            document.getElementById("backdrop-banner").style.backgroundImage = `url('${poster1}')`;
            
            document.getElementById("rank-1-card").addEventListener("click", () => {
                window.location.href = `/movies/${f1.id}/`;
            });
            document.getElementById("rank-1-btn").addEventListener("click", (e) => {
                e.stopPropagation();
                window.location.href = `/movies/${f1.id}/`;
            });

            if (films.length > 1) {
                const f2 = films[1];
                let poster2 = f2.poster_path ? (f2.poster_path.startsWith("http") ? f2.poster_path : `https://image.tmdb.org/t/p/w500${f2.poster_path}`) : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500";
                document.getElementById("rank-2-img").src = poster2;
                document.getElementById("rank-2-title").textContent = f2.title;
                document.getElementById("rank-2-rating").textContent = f2.avg_rating ? parseFloat(f2.avg_rating).toFixed(1) : "N/A";
                let rank2YearText = f2.release_year || "";
                if (f2.genre_display && f2.genre_display.length > 0) {
                    const genreNames = f2.genre_display.map(g => g.name || g).join(", ");
                    rank2YearText += ` • ${genreNames}`;
                }
                document.getElementById("rank-2-year").textContent = rank2YearText;
                document.getElementById("rank-2-synopsis").textContent = f2.synopsis || "Sinopsis tidak tersedia.";
                
                document.getElementById("rank-2-card").addEventListener("click", () => {
                    window.location.href = `/movies/${f2.id}/`;
                });
            } else {
                document.getElementById("rank-2-card").classList.add("hidden");
            }

            if (films.length > 2) {
                const f3 = films[2];
                let poster3 = f3.poster_path ? (f3.poster_path.startsWith("http") ? f3.poster_path : `https://image.tmdb.org/t/p/w500${f3.poster_path}`) : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500";
                document.getElementById("rank-3-img").src = poster3;
                document.getElementById("rank-3-title").textContent = f3.title;
                document.getElementById("rank-3-rating").textContent = f3.avg_rating ? parseFloat(f3.avg_rating).toFixed(1) : "N/A";
                let rank3YearText = f3.release_year || "";
                if (f3.genre_display && f3.genre_display.length > 0) {
                    const genreNames = f3.genre_display.map(g => g.name || g).join(", ");
                    rank3YearText += ` • ${genreNames}`;
                }
                document.getElementById("rank-3-year").textContent = rank3YearText;
                document.getElementById("rank-3-synopsis").textContent = f3.synopsis || "Sinopsis tidak tersedia.";
                
                document.getElementById("rank-3-card").addEventListener("click", () => {
                    window.location.href = `/movies/${f3.id}/`;
                });
            } else {
                document.getElementById("rank-3-card").classList.add("hidden");
            }

            risingList.textContent = "";
            const risingFilms = films.slice(3, 6);
            if (risingFilms.length === 0) {
                risingList.innerHTML = `<p class="text-stone-500 italic text-sm">Tidak ada film rising saat ini.</p>`;
                return;
            }

            risingFilms.forEach((film, index) => {
                const rankNum = index + 4;
                const item = document.createElement("div");
                item.className = "group flex items-center gap-6 p-4 rounded-xl bg-[#201f20]/50 border border-transparent hover:border-white/5 hover:bg-[#201f20] transition-all cursor-pointer";
                item.addEventListener("click", () => {
                    window.location.href = `/movies/${film.id}/`;
                });

                const num = document.createElement("div");
                num.className = "text-2xl font-serif font-bold text-stone-600 w-12 text-center group-hover:text-[#715A5A] transition-colors";
                num.textContent = rankNum;

                const posterWrap = document.createElement("div");
                posterWrap.className = "w-12 h-16 bg-surface-dim rounded overflow-hidden shrink-0";
                
                let pUrl = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200";
                if (film.poster_path) {
                    pUrl = film.poster_path.startsWith("http") ? film.poster_path : `https://image.tmdb.org/t/p/w500${film.poster_path}`;
                }
                const img = document.createElement("img");
                img.className = "w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity";
                img.src = pUrl;
                img.alt = film.title;
                posterWrap.appendChild(img);

                const mid = document.createElement("div");
                mid.className = "flex-grow";
                const title = document.createElement("h4");
                title.className = "font-['DM_Sans'] text-base text-[#D3DAD9] font-medium mb-1";
                title.textContent = film.title;
                const meta = document.createElement("p");
                meta.className = "font-['DM_Sans'] text-xs text-stone-500 uppercase tracking-wider";
                let metaText = `${film.release_year} • ${film.duration ? film.duration + ' menit' : 'N/A'}`;
                if (film.genre_display && film.genre_display.length > 0) {
                    const genreNames = film.genre_display.map(g => g.name || g).join(", ");
                    metaText += ` • ${genreNames}`;
                }
                meta.textContent = metaText;
                mid.appendChild(title);
                mid.appendChild(meta);

                const end = document.createElement("div");
                end.className = "flex flex-col items-end gap-1 mr-4 hidden sm:flex";
                
                const trend = document.createElement("span");
                trend.className = "flex items-center gap-1 text-[#D3DAD9] text-xs font-['DM_Sans']";
                trend.innerHTML = `<span class="material-symbols-outlined text-sm text-[#715A5A]">trending_up</span> Rising`;
                
                const rate = document.createElement("span");
                rate.className = "text-[11px] text-stone-500 font-bold";
                rate.textContent = `★ ${film.avg_rating ? parseFloat(film.avg_rating).toFixed(1) : 'N/A'}`;
                
                end.appendChild(trend);
                end.appendChild(rate);

                const btn = document.createElement("button");
                btn.className = "w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-[#D3DAD9] hover:bg-[#715A5A] hover:border-[#715A5A] transition-colors shrink-0";
                btn.innerHTML = `<span class="material-symbols-outlined text-xs">arrow_forward_ios</span>`;

                item.appendChild(num);
                item.appendChild(posterWrap);
                item.appendChild(mid);
                item.appendChild(end);
                item.appendChild(btn);
                risingList.appendChild(item);
            });
        })
        .catch(err => {
            console.error("Gagal memuat film trending:", err);
            spotlightLoading.textContent = "Terjadi kegagalan saat memuat data.";
        });
});
