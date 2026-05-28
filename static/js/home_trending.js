document.addEventListener("DOMContentLoaded", function () {
    const carousel = document.getElementById("trending-carousel");

    function renderTrending(films) {
        carousel.textContent = "";
        if (!films || films.length === 0) {
            carousel.innerHTML = `
                <div class="flex flex-col items-center justify-center w-full py-12 gap-3 text-center">
                    <span class="material-symbols-outlined text-4xl text-stone-600">movie_off</span>
                    <p class="font-['DM_Sans'] text-stone-500 text-sm">Belum ada film di katalog.</p>
                    <a href="/movies/" class="text-xs text-[#715A5A] hover:underline">Kunjungi halaman film</a>
                </div>`;
            return;
        }

        films.slice(0, 5).forEach((film) => {
            const card = document.createElement("div");
            card.className = "relative w-[200px] md:w-[240px] flex-shrink-0 snap-start group cursor-pointer";
            card.addEventListener("click", () => {
                window.location.href = `/movies/${film.id}/`;
            });

            const inner = document.createElement("div");
            inner.className = "bg-[#37353E] rounded-lg overflow-hidden border border-white/5 group-hover:scale-[1.03] group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-300 aspect-[2/3] relative w-full";

            let posterUrl = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400";
            if (film.poster) {
                posterUrl = film.poster;
            } else if (film.poster_path) {
                posterUrl = film.poster_path.startsWith("http") ? film.poster_path : `https://image.tmdb.org/t/p/w500${film.poster_path}`;
            }

            const img = document.createElement("img");
            img.className = "w-full h-full object-cover opacity-95 group-hover:opacity-100 transition-opacity";
            img.src = posterUrl;
            img.alt = film.title;
            inner.appendChild(img);

            const overlay = document.createElement("div");
            overlay.className = "absolute inset-0 bg-gradient-to-t from-[#44444E] via-[#44444E]/30 to-transparent opacity-90";
            inner.appendChild(overlay);

            const textWrap = document.createElement("div");
            textWrap.className = "absolute bottom-0 left-0 p-4 w-full";

            const title = document.createElement("h3");
            title.className = "font-medium text-white text-sm md:text-base mb-1 truncate";
            title.textContent = film.title;
            textWrap.appendChild(title);

            const meta = document.createElement("div");
            meta.className = "flex items-center gap-2 text-xs text-stone-400 flex-wrap";
            let metaHTML = `<span class="flex items-center text-[#F5C518]"><span class="material-symbols-outlined text-[10px] mr-1" style="font-variation-settings: 'FILL' 1;">star</span> ${film.avg_rating ? parseFloat(film.avg_rating).toFixed(1) : 'N/A'}</span> <span>${film.release_year}</span>`;
            
            if (film.genre_display && film.genre_display.length > 0) {
                const genreNames = film.genre_display.map(g => g.name || g).join(", ");
                metaHTML += ` <span class="text-[#D3DAD9]">${genreNames}</span>`;
            }
            
            meta.innerHTML = metaHTML;
            textWrap.appendChild(meta);

            inner.appendChild(textWrap);
            card.appendChild(inner);
            carousel.appendChild(card);
        });
    }

    document.addEventListener("filmsLoaded", function(e) {
        renderTrending(e.detail);
    });

    document.addEventListener("filmsLoadError", function(e) {
        carousel.innerHTML = `
            <div class="flex flex-col items-center justify-center w-full py-12 gap-3 text-center">
                <span class="material-symbols-outlined text-4xl text-red-500/60">wifi_off</span>
                <p class="font-['DM_Sans'] text-stone-500 text-sm">Gagal memuat katalog film. Periksa koneksi server.</p>
            </div>`;
    });
});
