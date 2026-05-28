document.addEventListener("DOMContentLoaded", function () {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const filmId = pathParts[pathParts.length - 1];
let selectedScore = 0;
    const starBtns = document.querySelectorAll(".star-btn");
    const starHint = document.getElementById("star-hint");
    const reviewText = document.getElementById("review-text");
    const authAlert = document.getElementById("auth-alert");
    const submitBtn = document.getElementById("submit-review-btn");

    if (starBtns.length) {
        starBtns.forEach(btn => {
            btn.addEventListener("mouseover", () => highlightStars(parseInt(btn.getAttribute("data-star"))));
            btn.addEventListener("mouseout", () => highlightStars(selectedScore));
            btn.addEventListener("click", () => {
                selectedScore = parseInt(btn.getAttribute("data-star"));
                starHint.textContent = `${selectedScore}/10`;
                highlightStars(selectedScore);
            });
        });
    }

    function highlightStars(val) {
        starBtns.forEach(btn => {
            const starVal = parseInt(btn.getAttribute("data-star"));
            btn.classList.toggle("text-[#D3DAD9]/30", starVal > val);
            btn.classList.toggle("text-[#F5C518]", starVal <= val);
        });
    }

    if (authAlert) {
        if (typeof isAuthenticated === 'undefined' || !isAuthenticated) {
            authAlert.classList.remove("hidden");
            if(submitBtn) {
                submitBtn.disabled = true;
                submitBtn.classList.add("opacity-50", "cursor-not-allowed");
            }
        }
    }

    window.fetchReviews = function(id) {
        const feed = document.getElementById("reviews-feed");
        if (!feed) return;
        feed.textContent = "";
        fetch(`/api/ratings/?film=${id}`)
            .then(res => res.json())
            .then(reviews => {
                const results = reviews.results || reviews;
                if (results.length === 0) {
                    const msg = document.createElement("p");
                    msg.className = "text-stone-500 italic text-sm";
                    msg.textContent = "Belum ada ulasan untuk film ini. Jadilah yang pertama memberikan penilaian!";
                    feed.appendChild(msg);
                    return;
                }
                results.forEach((review, idx) => {
                    const box = document.createElement("div");
                    box.className = "bg-[#201f20] rounded-lg p-5 border border-white/5 flex gap-4 shadow-lg animate-fade-up";
                    box.style.animationDelay = `${idx * 60}ms`;
                    const img = document.createElement("img");
                    img.className = "w-10 h-10 rounded-full object-cover shrink-0 border border-white/10";
                    img.src = review.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100";
                    img.alt = review.username;
                    const details = document.createElement("div");
                    details.className = "flex-grow flex flex-col gap-1";
                    const header = document.createElement("div");
                    header.className = "flex justify-between items-center";
                    const nameEl = document.createElement("h4");
                    nameEl.className = "font-['DM_Sans'] text-sm font-semibold text-[#D3DAD9]";
                    nameEl.textContent = review.display_name || review.username;
                    const stars = document.createElement("div");
                    stars.className = "flex items-center text-[#F5C518] text-xs font-bold gap-1";
                    stars.innerHTML = `<span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">star</span> ${review.score}/10`;
                    header.appendChild(nameEl); header.appendChild(stars);
                    const text = document.createElement("p");
                    text.className = "font-['DM_Sans'] text-xs text-[#c9c5cb] leading-relaxed mt-2";
                    text.textContent = review.review || "Memberikan rating tanpa tulisan ulasan.";
                    const date = document.createElement("span");
                    date.className = "text-[10px] text-stone-500 mt-2";
                    date.textContent = new Date(review.created_at).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' });
                    details.appendChild(header); details.appendChild(text); details.appendChild(date);
                    box.appendChild(img); box.appendChild(details);
                    feed.appendChild(box);
                });
            });
    }

    if (submitBtn) {
        submitBtn.addEventListener("click", () => {
            if (selectedScore === 0) { alert("Harap pilih rating bintang terlebih dahulu."); return; }
            submitBtn.disabled = true; submitBtn.textContent = "Mengirim...";
            secureFetch("/api/ratings/", {
                method: "POST",
                headers: { "Content-Type": "application/json", },
                body: JSON.stringify({ film: parseInt(filmId), score: selectedScore, review: reviewText.value.trim() })
            })
            .then(res => { if (!res.ok) return res.json().then(e => { throw new Error(JSON.stringify(e)); }); return res.json(); })
            .then(() => {
                if(window.showToast) window.showToast("Ulasan Anda berhasil disimpan!", "success");
                reviewText.value = ""; selectedScore = 0; highlightStars(0); starHint.textContent = "0/10";
                window.fetchReviews(filmId);
            })
            .catch(err => { console.error(err); if(window.showToast) window.showToast("Gagal mengirim ulasan. Pastikan Anda belum memberikan ulasan sebelumnya.", "error"); })
            .finally(() => { submitBtn.disabled = false; submitBtn.textContent = "Submit Ulasan"; });
        });
    }
});
