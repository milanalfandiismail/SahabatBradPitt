// ============================================================
// SPA PANEL — renders actor detail as an overlay
// ============================================================
function renderActorDetailPanel(actor) {
    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'actor-panel-backdrop';
    backdrop.className = 'fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm animate-fade-in';
    backdrop.addEventListener('click', closeActorPanel);

    // Panel
    const panel = document.createElement('div');
    panel.id = 'actor-panel';
    panel.className = 'fixed inset-0 z-[101] flex items-center justify-center p-4 md:p-8 pointer-events-none';

    const inner = document.createElement('div');
    inner.className = 'relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1e1d1e] border border-white/10 rounded-2xl shadow-2xl pointer-events-auto animate-scale-in';

    // Loading placeholder
    const loadingEl = document.createElement('div');
    loadingEl.className = 'flex flex-col items-center justify-center py-20 gap-4';
    loadingEl.innerHTML = `<span class="material-symbols-outlined text-5xl text-[#715A5A] animate-spin">sync</span><p class="font-['DM_Sans'] text-stone-400">Memuat profil sineas...</p>`;
    inner.appendChild(loadingEl);

    document.body.style.overflow = 'hidden';
    document.body.appendChild(backdrop);
    document.body.appendChild(panel);
    panel.appendChild(inner);

    // Fetch full detail
    fetch(`/api/actors/${actor.id}/`)
        .then(res => { if (!res.ok) throw new Error('Gagal memuat data sineas.'); return res.json(); })
        .then(act => {
            inner.innerHTML = '';
            inner.className = 'relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#201f20] border border-white/10 rounded-2xl shadow-2xl pointer-events-auto animate-scale-in';

            // Close btn
            const closeBtn = document.createElement('button');
            closeBtn.className = 'absolute top-4 right-4 w-9 h-9 rounded-full bg-white/5 border border-white/10 text-stone-300 hover:text-white hover:bg-white/10 flex items-center justify-center z-10 transition-all';
            closeBtn.innerHTML = `<span class="material-symbols-outlined text-lg">close</span>`;
            closeBtn.addEventListener('click', closeActorPanel);
            inner.appendChild(closeBtn);

            // Backdrop banner
            let photoUrl = '';
            if (act.photo) photoUrl = act.photo;
            else if (act.photo_path) photoUrl = act.photo_path.startsWith('http') ? act.photo_path : `https://image.tmdb.org/t/p/original${act.photo_path}`;

            const banner = document.createElement('div');
            banner.className = 'h-48 md:h-56 relative overflow-hidden rounded-t-2xl';
            banner.style.background = photoUrl ? `url('${photoUrl}') center/cover no-repeat` : '#2a2930';
            if (photoUrl) {
                banner.style.filter = 'blur(8px)';
                banner.style.transform = 'scale(1.1)';
                const overlay = document.createElement('div');
                overlay.className = 'absolute inset-0 bg-gradient-to-t from-[#201f20] via-transparent to-transparent';
                banner.appendChild(overlay);
            }
            inner.appendChild(banner);

            // Content
            const content = document.createElement('div');
            content.className = 'px-8 pb-8 -mt-16 relative';

            // Photo + name row
            const header = document.createElement('div');
            header.className = 'flex items-end gap-5 mb-6';

            const photoCircle = document.createElement('div');
            photoCircle.className = 'w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-[#201f20] overflow-hidden bg-[#37353E] shadow-xl shrink-0';
            if (photoUrl) {
                const img = document.createElement('img');
                img.src = photoUrl;
                img.className = 'w-full h-full object-cover';
                photoCircle.appendChild(img);
            } else {
                photoCircle.innerHTML = `<span class="material-symbols-outlined text-4xl text-stone-500 flex items-center justify-center w-full h-full">person</span>`;
            }
            header.appendChild(photoCircle);

            const nameBlock = document.createElement('div');
            nameBlock.className = 'pb-1';

            const nameEl = document.createElement('h2');
            nameEl.className = "font-['Playfair_Display'] text-2xl md:text-3xl text-white font-bold leading-tight";
            nameEl.textContent = act.name;
            nameBlock.appendChild(nameEl);

            if (act.native_name) {
                const nat = document.createElement('p');
                nat.className = "font-['DM_Sans'] text-stone-400 text-sm";
                nat.textContent = act.native_name;
                nameBlock.appendChild(nat);
            }

            // Badges
            const badges = document.createElement('div');
            badges.className = 'flex flex-wrap gap-2 mt-1';
            if (act.birth_year) {
                const b = document.createElement('span');
                b.className = 'px-2.5 py-1 rounded-full border border-white/10 text-stone-400 text-xs font-[\'DM_Sans\']';
                b.textContent = `Lahir ${act.birth_year}`;
                badges.appendChild(b);
            }
            if (act.place_of_birth) {
                const b = document.createElement('span');
                b.className = 'px-2.5 py-1 rounded-full border border-white/10 text-stone-400 text-xs font-[\'DM_Sans\']';
                b.textContent = act.place_of_birth;
                badges.appendChild(b);
            }
            nameBlock.appendChild(badges);
            header.appendChild(nameBlock);
            content.appendChild(header);

            // Bio
            const bioTitle = document.createElement('h3');
            bioTitle.className = "font-['DM_Sans'] font-bold text-white text-xs uppercase tracking-wider mb-2";
            bioTitle.textContent = 'Biografi';
            content.appendChild(bioTitle);

            const bioText = document.createElement('p');
            bioText.className = "font-['DM_Sans'] text-stone-400 text-sm leading-relaxed mb-8";
            const rawBio = act.bio || 'Biografi untuk sineas ini belum tersedia.';
            bioText.textContent = rawBio.length > 400 ? rawBio.substring(0, 400) + '…' : rawBio;
            content.appendChild(bioText);

            // Filmography
            if (act.filmographies && act.filmographies.length > 0) {
                const filmTitle = document.createElement('h3');
                filmTitle.className = "font-['Playfair_Display'] text-xl text-white font-bold mb-4";
                filmTitle.textContent = 'Filmography';
                content.appendChild(filmTitle);

                const filmGrid = document.createElement('div');
                filmGrid.className = 'grid grid-cols-2 md:grid-cols-3 gap-4 mb-4';

                act.filmographies.slice(0, 9).forEach((item, idx) => {
                    const card = document.createElement('div');
                    card.className = 'bg-[#1e1d1e] rounded-lg overflow-hidden group cursor-pointer border border-white/5 hover:border-[#715A5A]/50 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 animate-fade-up';
                    card.style.animationDelay = `${idx * 60}ms`;
                    card.addEventListener('click', () => {
                        closeActorPanel();
                        setTimeout(() => { window.location.href = `/movies/${item.film}/`; }, 200);
                    });

                    let posterUrl = item.poster || (item.poster_path ? (item.poster_path.startsWith('http') ? item.poster_path : `https://image.tmdb.org/t/p/w342${item.poster_path}`) : '');
                    if (!posterUrl) posterUrl = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500";

                    const imgWrap = document.createElement('div');
                    imgWrap.className = 'aspect-[2/3] bg-[#141314] overflow-hidden';
                    const img = document.createElement('img');
                    img.className = 'w-full h-full object-cover group-hover:scale-105 transition-all duration-500';
                    img.src = posterUrl;
                    img.alt = item.film_title || '';
                    imgWrap.appendChild(img);
                    card.appendChild(imgWrap);

                    const info = document.createElement('div');
                    info.className = 'p-2.5';
                    const t = document.createElement('h4');
                    t.className = "font-['DM_Sans'] text-xs font-semibold text-stone-200 truncate leading-tight";
                    t.textContent = item.film_title || 'Unknown';
                    info.appendChild(t);
                    if (item.release_year) {
                        const yr = document.createElement('span');
                        yr.className = "font-['DM_Sans'] text-[10px] text-stone-500";
                        yr.textContent = item.release_year;
                        info.appendChild(yr);
                    }
                    card.appendChild(info);
                    filmGrid.appendChild(card);
                });
                content.appendChild(filmGrid);

                // "Lihat semua" link
                const seeAllLink = document.createElement('a');
                seeAllLink.href = `/actors/${act.id}/`;
                seeAllLink.className = 'inline-flex items-center gap-1 font-[\'DM_Sans\'] text-xs text-[#715A5A] hover:text-white transition-colors mb-4';
                seeAllLink.innerHTML = `<span>Lihat semua film karya</span><span class="material-symbols-outlined text-sm">arrow_forward</span>`;
                content.appendChild(seeAllLink);
            }

            inner.appendChild(content);

            // Escape key close
            const escHandler = (e) => { if (e.key === 'Escape') { closeActorPanel(); document.removeEventListener('keydown', escHandler); } };
            document.addEventListener('keydown', escHandler);
        })
        .catch(err => {
            inner.innerHTML = '';
            const errEl = document.createElement('div');
            errEl.className = 'flex flex-col items-center justify-center py-20 gap-4';
            errEl.innerHTML = `<span class="material-symbols-outlined text-5xl text-rose-500">error</span><p class="font-['DM_Sans'] text-stone-400">${err.message}</p><button class="mt-2 px-4 py-2 bg-[#715A5A] text-white rounded text-sm font-['DM_Sans'] hover:bg-[#8A6E6E] transition-all" onclick="closeActorPanel()">Tutup</button>`;
            inner.appendChild(errEl);
        });
}

function closeActorPanel() {
    document.getElementById('actor-panel-backdrop')?.remove();
    document.getElementById('actor-panel')?.remove();
    document.body.style.overflow = '';
}

// ============================================================
// MAIN — Actors grid with SPA click
// ============================================================
document.addEventListener("DOMContentLoaded", function () {
    const actorsList = document.getElementById("actors-list");

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
                const block = document.createElement("div");
                block.className = "flex flex-col items-center group cursor-pointer animate-fade-up";
                block.style.animationDelay = `${idx * 60}ms`;
                block.addEventListener("click", () => renderActorDetailPanel(actor));

                const wrap = document.createElement("div");
                wrap.className = "w-28 h-28 rounded-full overflow-hidden mb-4 border-2 border-transparent group-hover:border-[#715A5A] group-hover:scale-105 transition-all duration-300 shadow-lg shadow-white/5";

                let photoUrl = '';
                if (actor.photo) {
                    photoUrl = actor.photo;
                } else if (actor.photo_path) {
                    photoUrl = actor.photo_path.startsWith("http") ? actor.photo_path : `https://image.tmdb.org/t/p/w500${actor.photo_path}`;
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
            console.error("Gagal memuat aktor:", err);
            actorsList.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-12 gap-3">
                    <span class="material-symbols-outlined text-4xl text-red-500/60">wifi_off</span>
                    <p class="font-['DM_Sans'] text-stone-500 text-sm">Gagal memuat data aktor.</p>
                </div>`;
        });
});