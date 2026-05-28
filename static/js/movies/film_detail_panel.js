// ============================================================
// SPA FILM DETAIL PANEL — shared across all frontend pages
// ============================================================
window.renderFilmDetailPanel = function(filmId) {
    const backdrop = document.createElement('div');
    backdrop.id = 'film-panel-backdrop';
    backdrop.className = 'fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm animate-fade-in';
    backdrop.addEventListener('click', window.closeFilmPanel);

    const panel = document.createElement('div');
    panel.id = 'film-panel';
    panel.className = 'fixed inset-0 z-[101] flex items-center justify-center p-4 md:p-8 pointer-events-none';

    const inner = document.createElement('div');
    inner.className = 'relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-[#201f20] border border-white/10 rounded-2xl shadow-2xl pointer-events-auto animate-scale-in';
    inner.innerHTML = `
        <div class="flex flex-col items-center justify-center py-24 gap-4">
            <span class="material-symbols-outlined text-5xl text-[#715A5A] animate-spin">sync</span>
            <p class="font-['DM_Sans'] text-stone-400">Memuat detail film...</p>
        </div>`;

    document.body.style.overflow = 'hidden';
    document.body.appendChild(backdrop);
    document.body.appendChild(panel);
    panel.appendChild(inner);

    fetch(`/api/films/${filmId}/`)
        .then(res => { if (!res.ok) throw new Error('Film tidak ditemukan.'); return res.json(); })
        .then(film => {
            inner.innerHTML = '';
            inner.className = 'relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-[#201f20] border border-white/10 rounded-2xl shadow-2xl pointer-events-auto animate-scale-in';

            // Close button
            const closeBtn = document.createElement('button');
            closeBtn.className = 'absolute top-4 right-4 w-9 h-9 rounded-full bg-white/5 border border-white/10 text-stone-300 hover:text-white hover:bg-white/10 flex items-center justify-center z-10 transition-all';
            closeBtn.innerHTML = `<span class="material-symbols-outlined text-lg">close</span>`;
            closeBtn.addEventListener('click', window.closeFilmPanel);
            inner.appendChild(closeBtn);

            // Hero backdrop
            let posterUrl = '';
            if (film.poster) posterUrl = film.poster;
            else if (film.poster_path) posterUrl = film.poster_path.startsWith('http') ? film.poster_path : `https://image.tmdb.org/t/p/original${film.poster_path}`;

            const hero = document.createElement('div');
            hero.className = 'h-56 md:h-72 relative overflow-hidden rounded-t-2xl';
            if (posterUrl) {
                hero.style.background = `url('${posterUrl}') center/cover no-repeat`;
                hero.style.filter = 'blur(6px)';
                hero.style.transform = 'scale(1.1)';
            } else {
                hero.style.background = '#2a2930';
            }
            const heroOverlay = document.createElement('div');
            heroOverlay.className = 'absolute inset-0 bg-gradient-to-t from-[#201f20] via-[#201f20]/40 to-transparent';
            hero.appendChild(heroOverlay);
            inner.appendChild(hero);

            // Content area
            const content = document.createElement('div');
            content.className = 'px-8 pb-8 -mt-20 relative';

            // Poster + meta row
            const infoRow = document.createElement('div');
            infoRow.className = 'flex items-start gap-6 mb-6';

            const posterBox = document.createElement('div');
            posterBox.className = 'w-28 md:w-36 shrink-0 rounded-lg overflow-hidden border border-white/10 shadow-2xl bg-[#141314]';
            if (posterUrl) {
                const pImg = document.createElement('img');
                pImg.src = posterUrl;
                pImg.className = 'w-full aspect-[2/3] object-cover';
                posterBox.appendChild(pImg);
            } else {
                posterBox.style.height = '160px';
                posterBox.innerHTML = `<span class="material-symbols-outlined text-5xl text-stone-600 flex items-center justify-center w-full h-full">movie</span>`;
            }
            infoRow.appendChild(posterBox);

            const metaBlock = document.createElement('div');
            metaBlock.className = 'pt-2 flex-1';

            const titleEl = document.createElement('h2');
            titleEl.className = "font-['Playfair_Display'] text-2xl md:text-3xl text-white font-bold leading-tight mb-2";
            titleEl.textContent = film.title;
            metaBlock.appendChild(titleEl);

            const metaRow = document.createElement('div');
            metaRow.className = 'flex flex-wrap items-center gap-3 mb-3 text-xs text-stone-400';
            metaRow.innerHTML = `
                <span class="flex items-center gap-1 text-[#F5C518] font-bold">
                    <span class="material-symbols-outlined text-sm" style="font-variation-settings:'FILL'1">star</span>
                    ${film.avg_rating ? parseFloat(film.avg_rating).toFixed(1) : 'N/A'}
                </span>
                <span class="w-1 h-1 rounded-full bg-stone-500"></span>
                <span>${film.release_year || 'N/A'}</span>
                <span class="w-1 h-1 rounded-full bg-stone-500"></span>
                <span>${film.is_tv_series ? (film.episodes_count ? `${film.episodes_count} Episode` : 'TV Series') : (film.duration ? `${film.duration} menit` : 'N/A')}</span>`;
            metaBlock.appendChild(metaRow);

            // Genres
            if (film.genre_display && film.genre_display.length > 0) {
                const genreRow = document.createElement('div');
                genreRow.className = 'flex flex-wrap gap-2 mb-4';
                film.genre_display.forEach(g => {
                    const chip = document.createElement('span');
                    chip.className = 'px-3 py-1 rounded-full border border-[#715A5A]/50 text-stone-300 text-xs font-[\'DM_Sans\']';
                    chip.textContent = typeof g === 'object' ? g.name : g;
                    genreRow.appendChild(chip);
                });
                metaBlock.appendChild(genreRow);
            }

            // Synopsis
            const synTitle = document.createElement('h3');
            synTitle.className = "font-['DM_Sans'] font-bold text-white text-xs uppercase tracking-wider mb-2";
            synTitle.textContent = 'Sinopsis';
            content.appendChild(synTitle);

            const synText = document.createElement('p');
            synText.className = "font-['DM_Sans'] text-stone-400 text-sm leading-relaxed mb-6";
            synText.textContent = film.synopsis || 'Sinopsis belum tersedia.';
            content.appendChild(synText);

            // Trailer button
            if (film.trailer_url && (film.trailer_url.includes('youtube.com') || film.trailer_url.includes('youtu.be'))) {
                const trailerBtn = document.createElement('a');
                trailerBtn.href = '#';
                trailerBtn.className = 'inline-flex items-center gap-2 px-5 py-2.5 rounded bg-[#C0392B] text-white text-sm font-semibold hover:bg-[#A93226] hover:-translate-y-0.5 transition-all shadow-lg mb-6';
                trailerBtn.innerHTML = `<span class="material-symbols-outlined text-base">play_arrow</span> Tonton Trailer`;
                trailerBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (window.openTrailerModal) window.openTrailerModal(film.trailer_url);
                });
                content.appendChild(trailerBtn);
            }

            // CTA
            const ctaRow = document.createElement('div');
            ctaRow.className = 'flex items-center gap-3';
            const detailLink = document.createElement('a');
            detailLink.href = `/movies/${film.id}/`;
            detailLink.className = 'px-5 py-2.5 bg-[#715A5A] text-white rounded text-sm font-semibold hover:bg-[#8A6E6E] hover:-translate-y-0.5 transition-all shadow-lg flex items-center gap-2';
            detailLink.innerHTML = `<span class="material-symbols-outlined text-base">info</span> Detail Lengkap`;
            ctaRow.appendChild(detailLink);
            content.appendChild(ctaRow);

            infoRow.appendChild(metaBlock);
            content.insertBefore(infoRow, content.firstChild);
            inner.appendChild(content);

            // Escape key
            const escHandler = (e) => { if (e.key === 'Escape') { window.closeFilmPanel(); document.removeEventListener('keydown', escHandler); } };
            document.addEventListener('keydown', escHandler);
        })
        .catch(err => {
            inner.innerHTML = '';
            inner.innerHTML = `
                <div class="flex flex-col items-center justify-center py-24 gap-4">
                    <span class="material-symbols-outlined text-5xl text-rose-500">error</span>
                    <p class="font-['DM_Sans'] text-stone-400">${err.message}</p>
                    <button onclick="window.closeFilmPanel()" class="px-4 py-2 bg-[#715A5A] text-white rounded text-sm hover:bg-[#8A6E6E] transition-all">Tutup</button>
                </div>`;
        });
};

window.closeFilmPanel = function() {
    document.getElementById('film-panel-backdrop')?.remove();
    document.getElementById('film-panel')?.remove();
    document.body.style.overflow = '';
};
