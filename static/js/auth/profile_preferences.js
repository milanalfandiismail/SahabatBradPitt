/**
 * auth/profile_preferences.js
 * Manajemen preferensi film AI rekomendasi (Collapsible accordion di mobile, pemilihan focus, genres, era, duration, load/save preferensi).
 */

document.addEventListener("DOMContentLoaded", function () {
    // Accordion Toggle for Mobile (Preferensi Film)
    const accordionToggleBtn = document.getElementById("accordion-toggle-btn");
    const accordionContent = document.getElementById("accordion-content");
    const accordionChevron = document.getElementById("accordion-chevron");

    accordionToggleBtn?.addEventListener("click", () => {
        if (window.innerWidth >= 768) return; // Disable accordion on desktop
        const isCollapsed = accordionContent.classList.contains("hidden");
        if (isCollapsed) {
            accordionContent.classList.remove("hidden");
            accordionContent.classList.add("flex");
            accordionChevron.style.transform = "rotate(180deg)";
        } else {
            accordionContent.classList.add("hidden");
            accordionContent.classList.remove("flex");
            accordionChevron.style.transform = "rotate(0deg)";
        }
    });

    // Preferensi Film Logic
    let prefFocus = ""; let prefGenres = []; let prefEra = ""; let prefDuration = "";

    document.querySelectorAll(".pref-focus-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".pref-focus-btn").forEach(b => b.classList.remove("border-[#715A5A]", "bg-[#715A5A]/20"));
            if (prefFocus === btn.dataset.focus) prefFocus = "";
            else { prefFocus = btn.dataset.focus; btn.classList.add("border-[#715A5A]", "bg-[#715A5A]/20"); }
        });
    });

    document.querySelectorAll(".pref-era-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".pref-era-btn").forEach(b => b.classList.remove("border-[#715A5A]", "bg-[#715A5A]/20", "text-white"));
            if (prefEra === btn.dataset.era) prefEra = "";
            else { prefEra = btn.dataset.era; btn.classList.add("border-[#715A5A]", "bg-[#715A5A]/20", "text-white"); }
        });
    });

    document.querySelectorAll(".pref-duration-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".pref-duration-btn").forEach(b => b.classList.remove("border-[#715A5A]", "bg-[#715A5A]/20", "text-white"));
            if (prefDuration === btn.dataset.duration) prefDuration = "";
            else { prefDuration = btn.dataset.duration; btn.classList.add("border-[#715A5A]", "bg-[#715A5A]/20", "text-white"); }
        });
    });

    fetch("/api/films/genres/")
        .then(r => r.json())
        .then(genres => {
            const grid = document.getElementById("pref-genres-grid");
            if (!grid) return;
            grid.textContent = "";
            const genreList = Array.isArray(genres) ? genres : (genres.results || []);
            genreList.forEach(g => {
                const chip = document.createElement("button");
                chip.type = "button";
                chip.className = "px-3 py-1.5 rounded-full border border-white/10 text-stone-400 text-xs hover:border-[#715A5A] transition-all";
                chip.textContent = g.name;
                chip.dataset.genreId = g.id;
                chip.addEventListener("click", () => {
                    if (prefGenres.includes(g.id)) {
                        prefGenres = prefGenres.filter(id => id !== g.id);
                        chip.classList.remove("border-[#715A5A]", "bg-[#715A5A]/20", "text-[#c7c5d1]");
                    } else {
                        prefGenres.push(g.id);
                        chip.classList.add("border-[#715A5A]", "bg-[#715A5A]/20", "text-[#c7c5d1]");
                    }
                });
                grid.appendChild(chip);
            });
            loadSavedPreferences();
        });

    function loadSavedPreferences() {
        fetch("/api/auth/me/preferences/")
            .then(r => r.json())
            .then(prefs => {
                if (prefs.pref_focus) {
                    prefFocus = prefs.pref_focus;
                    document.querySelector(`.pref-focus-btn[data-focus="${prefs.pref_focus}"]`)?.classList.add("border-[#715A5A]", "bg-[#715A5A]/20");
                }
                if (prefs.pref_genres && prefs.pref_genres.length > 0) {
                    prefGenres = prefs.pref_genres;
                    prefs.pref_genres.forEach(gId => document.querySelector(`#pref-genres-grid button[data-genre-id="${gId}"]`)?.classList.add("border-[#715A5A]", "bg-[#715A5A]/20", "text-[#c7c5d1]"));
                }
                if (prefs.pref_era) {
                    prefEra = prefs.pref_era;
                    document.querySelector(`.pref-era-btn[data-era="${prefs.pref_era}"]`)?.classList.add("border-[#715A5A]", "bg-[#715A5A]/20", "text-white");
                }
                if (prefs.pref_duration) {
                    prefDuration = prefs.pref_duration;
                    document.querySelector(`.pref-duration-btn[data-duration="${prefs.pref_duration}"]`)?.classList.add("border-[#715A5A]", "bg-[#715A5A]/20", "text-white");
                }
            }).catch(() => { });
    }

    document.getElementById("save-prefs-btn")?.addEventListener("click", () => {
        const msg = document.getElementById("prefs-save-msg");
        if (!msg) return;
        msg.classList.add("hidden");
        secureFetch("/api/auth/me/preferences/", {
            method: "PUT",
            body: JSON.stringify({ pref_focus: prefFocus, pref_genres: prefGenres, pref_era: prefEra, pref_duration: prefDuration })
        })
            .then(r => r.json())
            .then(data => {
                msg.textContent = data.message || "Preferensi tersimpan!";
                msg.classList.remove("hidden", "text-red-400"); msg.classList.add("text-green-400");
                setTimeout(() => msg.classList.add("hidden"), 3000);
            })
            .catch(() => {
                msg.textContent = "Gagal menyimpan preferensi.";
                msg.classList.remove("hidden", "text-green-400"); msg.classList.add("text-red-400");
            });
    });
});
