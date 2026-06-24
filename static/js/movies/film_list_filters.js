document.addEventListener("DOMContentLoaded", function () {
    window.FilmListState = window.FilmListState || {
        selectedGenreIds: [],
        currentPage: 1,
        isLoading: false
    };

    const searchInput = document.getElementById("search-input");
    const searchInputMobile = document.getElementById("search-input-mobile");
    const searchInputMobileBottom = document.getElementById("search-input-mobile-bottom");
    const genresContainer = document.getElementById("genres-container");
    const yearFrom = document.getElementById("year-from");
    const yearTo = document.getElementById("year-to");
    const ratingSlider = document.getElementById("rating-slider");
    const ratingVal = document.getElementById("rating-val");
    const resetBtn = document.getElementById("reset-btn");
    const searchIconBtn = document.getElementById("search-icon-btn");
    const searchSubmitBtn = document.getElementById("search-submit-btn");

    let genresList = [];

    const urlParams = new URLSearchParams(window.location.search);
    const genreParam = urlParams.get('genre');
    if (genreParam) {
        window.FilmListState.selectedGenreIds = genreParam.split(',').map(id => parseInt(id.trim())).filter(Boolean);
    }
    const searchParam = urlParams.get('search');
    if (searchParam) {
        if (searchParam === '1') {
            setTimeout(() => {
                if (searchInputMobileBottom) searchInputMobileBottom.focus();
                else if (searchInputMobile) searchInputMobile.focus();
                else if (searchInput) searchInput.focus();
            }, 100);
        } else {
            if (searchInput) searchInput.value = searchParam;
            if (searchInputMobile) searchInputMobile.value = searchParam;
            if (searchInputMobileBottom) searchInputMobileBottom.value = searchParam;
        }
    }

    if (genresContainer) {
        fetch("/api/films/genres/")
            .then(res => res.json())
            .then(data => {
                genresList = Array.isArray(data) ? data : (data.results || []);
                renderGenreChips();
            })
    }

    function renderGenreChips() {
        if (!genresContainer) return;
        genresContainer.textContent = "";
        genresList.forEach(genre => {
            const btn = document.createElement("button");
            btn.className = "px-3 py-1 rounded-full border text-xs font-medium transition-all";
            btn.dataset.genreId = genre.id;
            if (window.FilmListState.selectedGenreIds.includes(genre.id)) {
                btn.classList.add("border-[#715A5A]", "bg-[#715A5A]/20", "text-[#c7c5d1]");
            } else {
                btn.classList.add("border-white/10", "text-stone-400", "hover:border-white/30");
            }
            btn.textContent = genre.name;
            btn.addEventListener("click", () => {
                if (window.FilmListState.selectedGenreIds.includes(genre.id)) {
                    window.FilmListState.selectedGenreIds = window.FilmListState.selectedGenreIds.filter(id => id !== genre.id);
                } else {
                    window.FilmListState.selectedGenreIds.push(genre.id);
                }
                renderGenreChips();
                if (window.fetchFilms) window.fetchFilms(1);
            });
            genresContainer.appendChild(btn);
        });
    }

    const triggerSearch = () => {
        if (window.fetchFilms) window.fetchFilms(1);
    };

    if (searchSubmitBtn) {
        searchSubmitBtn.addEventListener("click", triggerSearch);
    }
    if (searchIconBtn) {
        searchIconBtn.addEventListener("click", triggerSearch);
    }
    function syncSearchInputs(value) {
        if (searchInput && searchInput.value !== value) searchInput.value = value;
        if (searchInputMobile && searchInputMobile.value !== value) searchInputMobile.value = value;
        if (searchInputMobileBottom && searchInputMobileBottom.value !== value) searchInputMobileBottom.value = value;
    }

    [searchInput, searchInputMobile, searchInputMobileBottom].forEach(input => {
        if (input) {
            input.addEventListener("input", (e) => syncSearchInputs(e.target.value));
            input.addEventListener("keypress", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    triggerSearch();
                }
            });
        }
    });

    if (yearFrom) yearFrom.addEventListener("input", triggerSearch);
    if (yearTo) yearTo.addEventListener("input", triggerSearch);

    if (ratingSlider && ratingVal) {
        ratingSlider.addEventListener("input", () => {
            ratingVal.textContent = parseFloat(ratingSlider.value).toFixed(1);
            triggerSearch();
        });
    }

    document.querySelectorAll('input[name="sort"]').forEach(radio => {
        radio.addEventListener("change", triggerSearch);
    });

    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            if (searchInput) searchInput.value = "";
            if (searchInputMobile) searchInputMobile.value = "";
            if (searchInputMobileBottom) searchInputMobileBottom.value = "";
            window.FilmListState.selectedGenreIds = [];
            if (yearFrom) yearFrom.value = "";
            if (yearTo) yearTo.value = "";
            if (ratingSlider) {
                ratingSlider.value = 0;
                if (ratingVal) ratingVal.textContent = "0.0";
            }
            const defaultSort = document.querySelector('input[name="sort"][value="-popularity"]');
            if (defaultSort) defaultSort.checked = true;
            renderGenreChips();
            triggerSearch();
        });
    }

    // Initial load
    if (window.fetchFilms) {
        window.fetchFilms(1);
    } else {
        setTimeout(() => {
            if (window.fetchFilms) window.fetchFilms(1);
        }, 100);
    }
});
