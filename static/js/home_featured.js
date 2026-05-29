document.addEventListener("DOMContentLoaded", function () {
    const ecContainer = document.getElementById("editors-choice-container");
    const trContainer = document.getElementById("top-rated-container");
    if (!ecContainer || !trContainer) return;

    function showEmptyCard(container, message) {
        container.innerHTML = `
            <div class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#201f20] rounded-lg border border-white/5">
                <span class="material-symbols-outlined text-5xl text-stone-600">movie_off</span>
                <p class="font-['DM_Sans'] text-stone-500 text-sm text-center px-4">${message}</p>
            </div>`;
    }

    function renderChoiceCard(container, film, isTopRated, idx) {
        container.textContent = "";

        const wrap = document.createElement("a");
        wrap.href = `/movies/${film.id}/`;
        wrap.className = `absolute inset-0 bg-[#201f20] rounded-lg overflow-hidden border border-white/5 shadow-2xl z-10 cursor-pointer group
            hover:scale-[1.02] hover:shadow-[0_16px_48px_rgba(0,0,0,0.5)]
            transition-all duration-400 animate-fade-up block`;
        wrap.style.animationDelay = `${idx * 60}ms`;

        let posterUrl = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800";
        if (film.poster) {
            posterUrl = film.poster;
        } else if (film.poster_path) {
            posterUrl = film.poster_path.startsWith("http") ? film.poster_path : `https://image.tmdb.org/t/p/w500${film.poster_path}`;
        }

        const img = document.createElement("img");
        img.className = "w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-500";
        img.src = posterUrl;
        img.alt = film.title;
        wrap.appendChild(img);

        const overlay = document.createElement("div");
        overlay.className = "absolute inset-0 bg-gradient-to-t from-[#201f20] via-[#201f20]/65 to-transparent";
        wrap.appendChild(overlay);

        const textWrap = document.createElement("div");
        textWrap.className = "absolute bottom-0 left-0 p-6 w-full";

        const title = document.createElement("h3");
        title.className = "font-['Playfair_Display'] text-xl md:text-2xl text-white font-bold mb-2 drop-shadow-lg";
        title.textContent = film.title;
        textWrap.appendChild(title);

        const synopsis = document.createElement("p");
        synopsis.className = "text-xs text-stone-400 line-clamp-2 mb-4 leading-relaxed";
        synopsis.textContent = film.synopsis || "Film berkualitas tinggi dari aktor-aktor Hollywood terkenal.";
        textWrap.appendChild(synopsis);

        const meta = document.createElement("div");
        meta.className = "flex items-center gap-4 text-xs";

        const star = document.createElement("span");
        star.className = "flex items-center text-[#F5C518] font-bold";
        star.innerHTML = `<span class="material-symbols-outlined text-sm mr-1" style="font-variation-settings: 'FILL' 1;">star</span> ${film.avg_rating ? parseFloat(film.avg_rating).toFixed(1) : 'N/A'}`;
        meta.appendChild(star);

        if (film.genre_display && film.genre_display.length > 0) {
            const genre = document.createElement("span");
            genre.className = "text-[#D3DAD9] border border-white/10 px-2.5 py-0.5 rounded text-[11px] uppercase tracking-wider";
            const genreName = Array.isArray(film.genre_display)
                ? (film.genre_display[0].name || film.genre_display[0])
                : (film.genre_display.name || film.genre_display);
            genre.textContent = genreName;
            meta.appendChild(genre);
        }
        textWrap.appendChild(meta);
        wrap.appendChild(textWrap);

        const shadow = document.createElement("div");
        shadow.className = `absolute inset-0 bg-[#201f20] rounded-lg border border-white/5 shadow-2xl opacity-40 z-0
            ${isTopRated ? '-rotate-3 -translate-x-3 translate-y-3' : 'rotate-3 translate-x-3 translate-y-3'}`;

        container.appendChild(wrap);
        container.appendChild(shadow);
    }

    fetch("/api/films/?ordering=-avg_rating")
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(data => {
            const films = data.results || data;
            if (films.length === 0) {
                showEmptyCard(ecContainer, "Belum ada film pilihan editor.");
                showEmptyCard(trContainer, "Belum ada film dengan rating.");
                return;
            }

            const trFilm = films[0];
            renderChoiceCard(trContainer, trFilm, true, 0);

            const ecFilm = films.length > 1 ? films[1] : films[0];
            renderChoiceCard(ecContainer, ecFilm, false, 1);
        })
        .catch(err => {
            console.error("Gagal memuat film pilihan:", err);
            showEmptyCard(ecContainer, "Gagal memuat data. Periksa koneksi server.");
            showEmptyCard(trContainer, "Gagal memuat data. Periksa koneksi server.");
        });
});