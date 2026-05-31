document.addEventListener("DOMContentLoaded", function () {
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
            let poster1 = f1.local_poster ? f1.local_poster : (f1.tmdb_poster ? (f1.tmdb_poster.startsWith("http") ? f1.tmdb_poster : `https://image.tmdb.org/t/p/w500${f1.tmdb_poster}`) : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800");
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

            document.getElementById("rank-1-card").addEventListener("click", () => window.location.href = '/movies/' + f1.id + '/');
            document.getElementById("rank-1-btn").addEventListener("click", (e) => {
                e.stopPropagation();
                window.location.href = '/movies/' + f1.id + '/';
            });

            if (films.length > 1) {
                const f2 = films[1];
                let poster2 = f2.local_poster ? f2.local_poster : (f2.tmdb_poster ? (f2.tmdb_poster.startsWith("http") ? f2.tmdb_poster : `https://image.tmdb.org/t/p/w500${f2.tmdb_poster}`) : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500");
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

                document.getElementById("rank-2-card").addEventListener("click", () => window.location.href = '/movies/' + f2.id + '/');
            } else {
                document.getElementById("rank-2-card").classList.add("hidden");
            }

            if (films.length > 2) {
                const f3 = films[2];
                let poster3 = f3.local_poster ? f3.local_poster : (f3.tmdb_poster ? (f3.tmdb_poster.startsWith("http") ? f3.tmdb_poster : `https://image.tmdb.org/t/p/w500${f3.tmdb_poster}`) : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500");
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

                document.getElementById("rank-3-card").addEventListener("click", () => window.location.href = '/movies/' + f3.id + '/');
            } else {
                document.getElementById("rank-3-card").classList.add("hidden");
            }

            risingList.textContent = "";
            const risingFilms = films.slice(3, 6);
            if (risingFilms.length === 0) {
                risingList.innerHTML = `<p class="text-stone-500 italic text-sm">Tidak ada film rising saat ini.</p>`;
                return;
            }

            // Animate spotlight section entrance
            const spotlightCard1 = document.getElementById("rank-1-card");
            const spotlightCard2 = document.getElementById("rank-2-card");
            const spotlightCard3 = document.getElementById("rank-3-card");
            [spotlightCard1, spotlightCard2, spotlightCard3].forEach((el, i) => {
                if (!el) return;
                el.style.opacity = '0';
                el.style.transform = 'translateY(30px)';
                el.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
                el.classList.remove("hidden");
                setTimeout(() => {
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                }, 200 + i * 60);
            });

            // Rising items with stagger - MOBILE FIXED layout
            risingFilms.forEach((film, index) => {
                const rankNum = index + 4;
                const item = document.createElement("div");
                item.style.cssText = `display:flex !important; align-items:center !important; justify-content:flex-start; gap:12px; background:rgba(20,19,20,0.5); border-radius:8px; padding:8px; cursor:pointer; min-height:88px; overflow:hidden; position:relative; flex-wrap:nowrap; transition:all 0.3s;`;
                item.style.animationDelay = `${index * 60}ms`;
                item.onclick = () => { window.location.href = '/movies/' + film.id + '/'; };
                item.onmouseenter = () => {
                    item.style.background = "rgba(20,19,20,0.8)";
                };
                item.onmouseleave = () => {
                    item.style.background = "rgba(20,19,20,0.5)";
                };

                // Rank number - Right-aligned with fixed width and premium Serif font to keep gap perfectly uniform
                const num = document.createElement("div");
                num.style.cssText = "font-family:'Playfair Display', 'Noto Serif', serif; font-size:36px; font-weight:900; color:rgba(120,119,126,0.3); width:36px; text-align:right; flex-shrink:0; display:flex; justify-content:flex-end; align-items:center; line-height:1;";
                num.textContent = rankNum;

                // Poster - FIXED SIZE
                const posterWrap = document.createElement("div");
                posterWrap.style.cssText = "width:56px; height:80px; flex-shrink:0; border-radius:8px; overflow:hidden; display:flex; align-items:center; justify-content:center;";
                posterWrap.onmouseenter = () => { img.style.opacity = "1"; };
                posterWrap.onmouseleave = () => { img.style.opacity = "0.8"; };

                let pUrl = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200";
                if (film.local_poster) {
                    pUrl = film.local_poster;
                } else if (film.tmdb_poster) {
                    pUrl = film.tmdb_poster.startsWith("http") ? film.tmdb_poster : `https://image.tmdb.org/t/p/w500${film.tmdb_poster}`;
                }
                const img = document.createElement("img");
                img.style.cssText = "width:100%; height:100%; object-fit:cover; opacity:0.8; transition:opacity 0.3s;";
                img.src = pUrl;
                img.alt = film.title;
                posterWrap.appendChild(img);

                // Text content
                const mid = document.createElement("div");
                mid.style.cssText = "flex:1; min-width:0; display:flex; flex-direction:column; justify-content:center;";

                const title = document.createElement("h4");
                title.style.cssText = "font-family:DM Sans,sans-serif; font-size:14px; color:#D3DAD9; font-weight:500; margin:0 0 4px 0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;";

                let metaText = `${film.release_year || 'N/A'}`;
                if (film.genre_display && film.genre_display.length > 0) {
                    const genreNames = film.genre_display.map(g => g.name || g).join(", ");
                    metaText += ` • ${genreNames}`;
                }
                const meta = document.createElement("p");
                meta.style.cssText = "font-family:DM Sans,sans-serif; font-size:11px; color:rgba(168,162,158,1); text-transform:uppercase; letter-spacing:0.05em; margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;";

                // Arrow button
                const btn = document.createElement("button");
                btn.style.cssText = "width:32px; height:32px; border-radius:9999px; border:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center; background:transparent; flex-shrink:0; cursor:pointer; transition:all 0.3s; color:#D3DAD9;";

                title.textContent = film.title;
                meta.textContent = metaText;
                btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M4.5 2L9.5 6L4.5 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
                btn.onmouseenter = () => { btn.style.background = "#715A5A"; btn.style.borderColor = "#715A5A"; };
                btn.onmouseleave = () => { btn.style.background = "transparent"; btn.style.borderColor = "rgba(255,255,255,0.1)"; };

                mid.appendChild(title);
                mid.appendChild(meta);

                item.appendChild(num);
                item.appendChild(posterWrap);
                item.appendChild(mid);
                item.appendChild(btn);
                risingList.appendChild(item);
            });
        })
        .catch(err => {
            console.error("Gagal memuat film trending:", err);
            spotlightLoading.textContent = "Terjadi kegagalan saat memuat data.";
        });
});
