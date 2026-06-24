document.addEventListener("DOMContentLoaded", function () {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const filmId = pathParts[pathParts.length - 1];
    let selectedScore = 0;
    const starBtns = document.querySelectorAll(".star-btn");
    const starHint = document.getElementById("star-hint");
    const reviewText = document.getElementById("review-text");
    const authAlert = document.getElementById("auth-alert");
    const submitBtn = document.getElementById("submit-review-btn");

    let currentUserId = null;
    let currentUserIsAdmin = false;
    let isEditing = false;
    let currentUserReviewId = null;

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
        fetch(`/api/ratings/?film=${id}`)
            .then(res => res.json())
            .then(reviews => {
                const results = reviews.results || reviews;
                feed.textContent = ""; // Clear feed here to avoid duplicate rendering race conditions
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
                    
                    // Avatar Link
                    const avatarLink = document.createElement("a");
                    avatarLink.href = `/profile/${review.user}/`;
                    avatarLink.className = "shrink-0";
                    
                    const img = document.createElement("img");
                    img.className = "w-10 h-10 rounded-full object-cover border border-white/10 hover:opacity-80 transition-all";
                    img.src = review.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100";
                    img.alt = review.username;
                    avatarLink.appendChild(img);
                    
                    const details = document.createElement("div");
                    details.className = "flex-grow flex flex-col gap-1";
                    
                    const header = document.createElement("div");
                    header.className = "flex justify-between items-center";
                    
                    const nameEl = document.createElement("h4");
                    nameEl.className = "font-['DM_Sans'] text-sm font-semibold text-[#D3DAD9]";
                    
                    // Name Link
                    const nameLink = document.createElement("a");
                    nameLink.href = `/profile/${review.user}/`;
                    nameLink.className = "hover:text-[#F5C518] transition-colors";
                    nameLink.textContent = review.display_name || review.username;
                    nameEl.appendChild(nameLink);
                    
                    const stars = document.createElement("div");
                    stars.className = "flex items-center text-[#F5C518] text-xs font-bold gap-1";
                    stars.innerHTML = `<span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">star</span> ${review.score}/10`;
                    header.appendChild(nameEl); header.appendChild(stars);
                    
                    const text = document.createElement("p");
                    text.className = "font-['DM_Sans'] text-xs text-[#c9c5cb] leading-relaxed mt-2";
                    text.textContent = review.review || "Memberikan rating tanpa tulisan ulasan.";
                    
                    // Meta Row
                    const metaRow = document.createElement("div");
                    metaRow.className = "flex justify-between items-center mt-2 border-t border-white/5 pt-2";
                    
                    const date = document.createElement("span");
                    date.className = "text-[10px] text-stone-500";
                    date.textContent = new Date(review.created_at).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' });
                    metaRow.appendChild(date);

                    // Actions Container
                    const actionsWrap = document.createElement("div");
                    actionsWrap.className = "flex items-center gap-3";
                    
                    // Render edit button for owner
                    if (review.user === currentUserId) {
                        const editBtn = document.createElement("button");
                        editBtn.className = "text-xs text-amber-500 hover:text-amber-400 font-semibold transition-colors flex items-center gap-1 focus:outline-none";
                        editBtn.innerHTML = `<span class="material-symbols-outlined text-xs">edit</span> Ubah`;
                        editBtn.addEventListener("click", () => {
                            const reviewInput = document.getElementById("review-text");
                            if (reviewInput) {
                                reviewInput.focus();
                                reviewInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        });
                        actionsWrap.appendChild(editBtn);
                    }
                    
                    // Render delete button for staff/superuser
                    if (currentUserIsAdmin) {
                        const deleteBtn = document.createElement("button");
                        deleteBtn.className = "text-xs text-red-400 hover:text-red-300 font-semibold transition-colors flex items-center gap-1 focus:outline-none";
                        deleteBtn.innerHTML = `<span class="material-symbols-outlined text-xs">delete</span> Hapus`;
                        deleteBtn.addEventListener("click", () => {
                            if (confirm("Apakah Anda yakin ingin menghapus ulasan ini?")) {
                                secureFetch(`/api/ratings/${review.id}/`, {
                                    method: "DELETE"
                                })
                                .then(res => {
                                    if (res.ok) {
                                        if (window.showToast) window.showToast("Ulasan berhasil dihapus.", "success");
                                        window.fetchReviews(filmId);
                                        // Reset current user review editing state if their review is deleted
                                        if (review.user === currentUserId) {
                                            isEditing = false;
                                            currentUserReviewId = null;
                                            if (submitBtn) submitBtn.textContent = "Submit Ulasan";
                                            if (reviewText) reviewText.value = "";
                                            selectedScore = 0;
                                            highlightStars(0);
                                            if (starHint) starHint.textContent = "0/10";
                                        }
                                    } else {
                                        if (window.showToast) window.showToast("Gagal menghapus ulasan.", "error");
                                    }
                                })
                                .catch(err => {
                                    if (window.showToast) window.showToast("Terjadi kesalahan saat menghapus ulasan.", "error");
                                });
                            }
                        });
                        actionsWrap.appendChild(deleteBtn);
                    }

                    if (actionsWrap.children.length > 0) {
                        metaRow.appendChild(actionsWrap);
                    }
                    
                    details.appendChild(header); details.appendChild(text); details.appendChild(metaRow);
                    box.appendChild(avatarLink); box.appendChild(details);
                    feed.appendChild(box);
                });
            });
    }

    if (submitBtn) {
        submitBtn.addEventListener("click", () => {
            if (selectedScore === 0) { alert("Harap pilih rating bintang terlebih dahulu."); return; }
            submitBtn.disabled = true; 
            submitBtn.textContent = isEditing ? "Memperbarui..." : "Mengirim...";
            
            const url = isEditing ? `/api/ratings/${currentUserReviewId}/` : "/api/ratings/";
            const method = isEditing ? "PUT" : "POST";
            
            secureFetch(url, {
                method: method,
                headers: { "Content-Type": "application/json", },
                body: JSON.stringify({ film: parseInt(filmId), score: selectedScore, review: reviewText.value.trim() })
            })
            .then(res => { if (!res.ok) return res.json().then(e => { throw new Error(JSON.stringify(e)); }); return res.json(); })
            .then((data) => {
                if(window.showToast) window.showToast(isEditing ? "Ulasan Anda berhasil diperbarui!" : "Ulasan Anda berhasil disimpan!", "success");
                
                // Transition to edit state after successful post
                isEditing = true;
                currentUserReviewId = data.id;
                submitBtn.textContent = "Perbarui Ulasan";
                
                window.fetchReviews(filmId);
            })
            .catch(err => { 
                if(window.showToast) {
                    const errorMsg = isEditing ? "Gagal memperbarui ulasan." : "Gagal mengirim ulasan. Pastikan Anda belum memberikan ulasan sebelumnya.";
                    window.showToast(errorMsg, "error");
                }
            })
            .finally(() => { 
                submitBtn.disabled = false; 
                submitBtn.textContent = isEditing ? "Perbarui Ulasan" : "Submit Ulasan"; 
            });
        });
    }

    // Load active user session on startup to pre-populate edit states and check admin roles
    if (typeof isAuthenticated !== 'undefined' && isAuthenticated) {
        fetch("/api/auth/me/")
            .then(res => {
                if (res.ok) return res.json();
                throw new Error("Unauthorized");
            })
            .then(user => {
                currentUserId = user.id;
                currentUserIsAdmin = user.is_staff || user.is_superuser;
                
                // Fetch user's rating for this film to pre-populate form
                return fetch(`/api/ratings/?film=${filmId}&user=${currentUserId}`);
            })
            .then(res => {
                if (res) return res.json();
            })
            .then(data => {
                if (data) {
                    const results = data.results || data;
                    if (results && results.length > 0) {
                        const myReview = results[0];
                        currentUserReviewId = myReview.id;
                        isEditing = true;
                        selectedScore = myReview.score;
                        if (reviewText) reviewText.value = myReview.review || "";
                        
                        if (submitBtn) {
                            submitBtn.textContent = "Perbarui Ulasan";
                        }
                        highlightStars(selectedScore);
                        if (starHint) {
                            starHint.textContent = `${selectedScore}/10`;
                        }
                    }
                }
            })
            .catch(() => {})
            .finally(() => {
                window.fetchReviews(filmId);
            });
    } else {
        window.fetchReviews(filmId);
    }
});
