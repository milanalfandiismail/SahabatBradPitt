document.addEventListener("DOMContentLoaded", function () {
    window.fetchCast = function(id) {
        const castList = document.getElementById("cast-list");
        if (!castList) return;
        castList.textContent = "";
        const expandContainer = document.getElementById("cast-expand-container");
        if (expandContainer) expandContainer.classList.add("hidden");

        fetch(`/api/actors/?film=${id}`)
            .then(res => res.json())
            .then(actors => {
                const results = actors.results || actors;
                if (results.length === 0) {
                    castList.innerHTML = `<p class="col-span-2 text-stone-500 text-xs italic">Data kru/pemeran tidak tersedia.</p>`;
                    return;
                }
                castList.className = "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-6";
                let showAll = false;

                function renderCast() {
                    castList.textContent = "";
                    const items = results.slice(0, showAll ? results.length : 10);
                    items.forEach((actor, idx) => {
                        const item = document.createElement("div");
                        item.className = "flex flex-col items-center gap-2 cursor-pointer group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 animate-fade-up";
                        item.style.animationDelay = `${idx * 60}ms`;
                        item.addEventListener("click", () => {
                            if (window.renderActorDetailPanel) window.renderActorDetailPanel({ id: actor.id, name: actor.name });
                            else window.location.href = `/actors/${actor.id}/`;
                        });

                        const roleText = actor.film_role || "Pemeran";
                        const roleType = actor.film_role_type || 'supporting';
                        
                        const isSutradara = roleType === 'director';
                        const isMainCast = roleType === 'lead';
                        const isSecondCast = roleType === 'supporting';

                        let borderClass = "border-2 border-white/5 group-hover:border-[#715A5A]";
                        if (isSutradara) borderClass = "border-2 border-[#C0392B]/40 group-hover:border-[#C0392B] group-hover:shadow-[0_0_12px_rgba(192,57,43,0.3)]";
                        else if (isMainCast) borderClass = "border-2 border-[#F5C518]/30 group-hover:border-[#F5C518] group-hover:shadow-[0_0_12px_rgba(245,197,24,0.3)]";
                        else if (isSecondCast) borderClass = "border-2 border-[#715A5A]/40 group-hover:border-[#715A5A] group-hover:shadow-[0_0_12px_rgba(113,90,90,0.3)]";

                        const wrapper = document.createElement("div");
                        wrapper.className = `w-[96px] h-[96px] rounded-full overflow-hidden shrink-0 bg-[#37353E] transition-all duration-300 ${borderClass}`;

                        if (actor.photo) {
                            const img = document.createElement("img");
                            img.className = "w-full h-full object-cover group-hover:scale-110 transition-transform duration-400";
                            img.src = actor.photo; img.alt = actor.name;
                            wrapper.appendChild(img);
                        } else if (actor.photo_path) {
                            const photoUrl = actor.photo_path.startsWith("http") ? actor.photo_path : `https://image.tmdb.org/t/p/w185${actor.photo_path}`;
                            const img = document.createElement("img");
                            img.className = "w-full h-full object-cover group-hover:scale-110 transition-transform duration-400";
                            img.src = photoUrl; img.alt = actor.name;
                            wrapper.appendChild(img);
                        } else {
                            wrapper.classList.add("flex", "items-center", "justify-center");
                            const icon = document.createElement("span");
                            icon.className = "material-symbols-outlined text-3xl text-stone-600";
                            icon.textContent = "person";
                            wrapper.appendChild(icon);
                        }

                        const textArea = document.createElement("div");
                        textArea.className = "flex flex-col items-center gap-1 w-full";
                        const name = document.createElement("p");
                        name.className = "font-['DM_Sans'] text-sm font-semibold text-white text-center leading-snug h-[40px] flex items-center justify-center line-clamp-2 w-full px-2";
                        name.textContent = actor.name;

                        const roleBadge = document.createElement("span");
                        let badgeStyle = "";
                        if (isSutradara) badgeStyle = "bg-[#C0392B]/20 text-[#C0392B] border border-[#C0392B]/30";
                        else if (isMainCast) badgeStyle = "bg-[#F5C518]/15 text-[#F5C518] border border-[#F5C518]/30 font-bold";
                        else if (isSecondCast) badgeStyle = "bg-[#715A5A]/25 text-[#D3DAD9] border border-[#715A5A]/40";
                        else badgeStyle = "bg-[#37353E]/40 text-[#D3DAD9]/45 border border-white/5";
                        roleBadge.className = `px-2 py-0.5 rounded text-[10px] font-semibold font-['DM_Sans'] ${badgeStyle}`;
                        roleBadge.textContent = roleText;

                        textArea.appendChild(name); textArea.appendChild(roleBadge);
                        item.appendChild(wrapper); item.appendChild(textArea);
                        castList.appendChild(item);
                    });
                }

                renderCast();
                if (results.length > 8) {
                    const expandBtn = document.getElementById("cast-expand-btn");
                    if (expandBtn && expandContainer) {
                        expandContainer.classList.remove("hidden");
                        expandBtn.onclick = () => { showAll = !showAll; renderCast(); expandBtn.textContent = showAll ? "Sembunyikan Tokoh" : "Lihat Semua Pemain & Sutradara"; };
                    }
                }
            });
    }
});
