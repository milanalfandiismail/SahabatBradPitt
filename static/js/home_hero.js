document.addEventListener("DOMContentLoaded", function () {
    let heroFilms = [];
    let heroIndex = 0;
    let heroInterval = null;

    function formatDuration(minutes) {
        if (!minutes) return "";
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return h > 0 ? `${h}j ${m}m` : `${m}m`;
    }

    function renderHero(film) {
        const heroPoster = document.getElementById("hero-poster");
        const heroContent = document.getElementById("hero-content");
        const heroLoading = document.getElementById("hero-loading");

        let posterUrl = "";
        if (film.poster) {
            posterUrl = film.poster;
        } else if (film.poster_path) {
            posterUrl = film.poster_path.startsWith("http")
                ? film.poster_path
                : `https://image.tmdb.org/t/p/original${film.poster_path}`;
        }
        if (posterUrl) heroPoster.src = posterUrl;

        document.getElementById("hero-title").textContent = film.title;
        document.getElementById("hero-rating").textContent = film.avg_rating
            ? parseFloat(film.avg_rating).toFixed(1)
            : "N/A";
        document.getElementById("hero-year").textContent = film.release_year || "";
        document.getElementById("hero-duration").textContent = formatDuration(film.duration);
        document.getElementById("hero-synopsis").textContent = film.synopsis || "Film berkualitas tinggi dari katalog sinema premium.";
        document.getElementById("hero-detail-btn").href = `/movies/${film.id}/`;
        
        if (film.genre_display && film.genre_display.length > 0) {
            const genreNames = film.genre_display.map(g => g.name || g).join(", ");
            document.getElementById("hero-year").textContent = `${film.release_year || ""} • ${genreNames}`;
        }

        const dotsEl = document.getElementById("hero-dots");
        dotsEl.textContent = "";
        heroFilms.slice(0, 5).forEach((_, i) => {
            const dot = document.createElement("button");
            dot.className = `w-2 h-2 rounded-full transition-all duration-300 ${i === heroIndex ? "bg-[#C0392B] w-5" : "bg-white/30 hover:bg-white/60"}`;
            dot.addEventListener("click", () => {
                heroIndex = i;
                renderHero(heroFilms[heroIndex]);
                resetHeroInterval();
            });
            dotsEl.appendChild(dot);
        });

        heroLoading.classList.add("hidden");
        heroContent.classList.remove("hidden");
    }

    function resetHeroInterval() {
        if (heroInterval) clearInterval(heroInterval);
        heroInterval = setInterval(() => {
            heroIndex = (heroIndex + 1) % Math.min(heroFilms.length, 5);
            renderHero(heroFilms[heroIndex]);
        }, 8000);
    }

    function showEmptyHero() {
        const heroLoading = document.getElementById("hero-loading");
        const heroContent = document.getElementById("hero-content");
        heroLoading.innerHTML = `
            <div class="max-w-2xl w-full flex flex-col items-start gap-4">
                <span class="material-symbols-outlined text-6xl text-stone-600">movie_off</span>
                <h2 class="font-['Playfair_Display'] text-3xl text-stone-400 font-bold">Katalog Kosong</h2>
                <p class="font-['DM_Sans'] text-stone-500 text-sm">Belum ada film di database. Jalankan perintah sync TMDB untuk mengisi katalog.</p>
                <code class="text-xs bg-white/5 text-stone-400 px-3 py-2 rounded border border-white/10">python manage.py sync_tmdb --all-actors</code>
            </div>`;
    }

    window.showEmptyHero = showEmptyHero;

    fetch("/api/films/?ordering=-popularity")
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(data => {
            const films = data.results || data;
            if (films.length === 0) {
                showEmptyHero();
                document.dispatchEvent(new CustomEvent('filmsLoaded', { detail: [] }));
                return;
            }
            heroFilms = films.slice(0, 5);
            renderHero(heroFilms[0]);
            resetHeroInterval();
            document.dispatchEvent(new CustomEvent('filmsLoaded', { detail: films }));
        })
        .catch(err => {
            console.error("Gagal memuat film hero:", err);
            showEmptyHero();
            document.dispatchEvent(new CustomEvent('filmsLoadError', { detail: err }));
        });
});
