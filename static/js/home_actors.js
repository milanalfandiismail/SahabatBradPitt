// ============================================================
// MAIN — Actors grid with SPA click
// ============================================================
document.addEventListener("DOMContentLoaded", function () {
    const actorsList = document.getElementById("actors-list");
    if (!actorsList) return;

    fetch("/api/actors/")
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(data => {
            actorsList.textContent = "";
            const actors = data.results || data;
            if (actors.length === 0) {
                actorsList.innerHTML = `
                    <div class="col-span-full flex flex-col items-center justify-center py-12 gap-3">
                        <span class="material-symbols-outlined text-4xl text-stone-600">person_off</span>
                        <p class="font-['DM_Sans'] text-stone-500 text-sm text-center">Belum ada data aktor/sutradara di katalog.</p>
                    </div>`;
                return;
            }

            actors.slice(0, 6).forEach((actor, idx) => {
                const block = document.createElement("a");
                block.href = `/actors/${actor.id}/`;
                block.className = "flex flex-col items-center group cursor-pointer animate-fade-up block";
                block.style.animationDelay = `${idx * 60}ms`;

                const wrap = document.createElement("div");
                wrap.className = "w-28 h-28 rounded-full overflow-hidden mb-4 border-2 border-transparent group-hover:border-[#715A5A] group-hover:scale-105 transition-all duration-300 shadow-lg shadow-white/5";

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
                    wrap.appendChild(img);
                } else {
                    wrap.className += " bg-[#37353E] flex items-center justify-center";
                    const icon = document.createElement("span");
                    icon.className = "material-symbols-outlined text-5xl text-stone-600";
                    icon.textContent = "help";
                    wrap.appendChild(icon);
                }

                const name = document.createElement("h3");
                name.className = "font-medium text-white text-center text-sm md:text-base mb-0.5 truncate w-full group-hover:text-[#715A5A] transition-colors duration-300";

                name.textContent = actor.name;

                const desc = document.createElement("p");
                desc.className = "text-xs text-stone-500 text-center transition-colors duration-300";
                desc.textContent = actor.birth_year ? `Lahir ${actor.birth_year}` : "Sineas";

                block.appendChild(wrap);
                block.appendChild(name);
                block.appendChild(desc);
                actorsList.appendChild(block);
            });
        })
        .catch(err => {
            actorsList.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-12 gap-3">
                    <span class="material-symbols-outlined text-4xl text-red-500/60">wifi_off</span>
                    <p class="font-['DM_Sans'] text-stone-500 text-sm">Gagal memuat data aktor.</p>
                </div>`;
        });
});
