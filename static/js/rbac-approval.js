/**
 * RBAC & Approval Workflow Module
 * Handles poster uploads, approval workflows, and role-based access control
 */

class RBACManager {
    constructor() {
        this.userRole = null;
        this.initializeRole();
    }

    /**
     * Initialize user role from localStorage or API
     */
    async initializeRole() {
        try {
            const response = await fetch('/api/auth/me/');
            if (response.ok) {
                const userData = await response.json();
                this.userRole = userData.groups || [];
                this.isSuperadmin = this.userRole.includes('Superadmin');
                this.isAdmin = this.userRole.includes('Admin') || this.isSuperadmin;
                localStorage.setItem('userRole', JSON.stringify(this.userRole));
                localStorage.setItem('isSuperadmin', this.isSuperadmin);
            }
        } catch (error) {
        }
    }

    /**
     * Check if user is Superadmin
     */
    isSuperAdmin() {
        return localStorage.getItem('isSuperadmin') === 'true';
    }

    /**
     * Check if user is Admin or Superadmin
     */
    isAdminOrSuperAdmin() {
        const role = JSON.parse(localStorage.getItem('userRole') || '[]');
        return role.includes('Admin') || role.includes('Superadmin');
    }
}

/**
 * Poster Upload Manager
 * Handles uploading poster images for films
 */
class PosterUploadManager {
    constructor() {}

    /**
     * Upload poster image for a film
     * @param {number} filmId - Film ID
     * @param {File} file - Image file to upload
     * @returns {Promise<Object>} - Response from API
     */
    async uploadPoster(filmId, file) {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('image_type', 'poster');

        try {
            const response = await secureFetch(`/api/films/${filmId}/images/`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Gagal mengunggah poster');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Upload backdrop image for a film
     * @param {number} filmId - Film ID
     * @param {File} file - Image file to upload
     * @returns {Promise<Object>} - Response from API
     */
    async uploadBackdrop(filmId, file) {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('image_type', 'backdrop');

        try {
            const response = await secureFetch(`/api/films/${filmId}/images/`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Gagal mengunggah backdrop');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete image from film
     * @param {number} filmId - Film ID
     * @param {number} imageId - Image ID
     * @returns {Promise<void>}
     */
    async deleteImage(filmId, imageId) {
        try {
            const response = await secureFetch(`/api/films/${filmId}/images/${imageId}/`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Gagal menghapus gambar');
            }
        } catch (error) {
            throw error;
        }
    }
}

/**
 * Approval Workflow Manager
 * Handles approval and rejection of films and actors
 */
class ApprovalManager {
    constructor() {}

    /**
     * Fetch pending films for approval
     * @returns {Promise<Array>} - Array of pending films
     */
    async fetchPendingFilms() {
        try {
            const response = await fetch('/api/films/?status=pending_approval');

            if (!response.ok) {
                throw new Error('Gagal mengambil daftar film pending');
            }

            const data = await response.json();
            return data.results || [];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Fetch pending actors for approval
     * @returns {Promise<Array>} - Array of pending actors
     */
    async fetchPendingActors() {
        try {
            const response = await fetch('/api/actors/?status=pending_approval');

            if (!response.ok) {
                throw new Error('Gagal mengambil daftar aktor pending');
            }

            const data = await response.json();
            return data.results || [];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Approve a pending film
     * @param {number} filmId - Film ID
     * @returns {Promise<Object>} - Updated film object
     */
    async approveFilm(filmId) {
        try {
            const response = await secureFetch(`/api/films/${filmId}/approve/`, {
                method: 'POST'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Gagal menyetujui film');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Reject a pending film
     * @param {number} filmId - Film ID
     * @param {string} reason - Rejection reason
     * @returns {Promise<Object>} - Updated film object
     */
    async rejectFilm(filmId, reason) {
        try {
            const response = await secureFetch(`/api/films/${filmId}/reject/`, {
                method: 'POST',
                body: JSON.stringify({ rejection_reason: reason })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Gagal menolak film');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Approve a pending actor
     * @param {number} actorId - Actor ID
     * @returns {Promise<Object>} - Updated actor object
     */
    async approveActor(actorId) {
        try {
            const response = await secureFetch(`/api/actors/${actorId}/approve/`, {
                method: 'POST'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Gagal menyetujui aktor');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Reject a pending actor
     * @param {number} actorId - Actor ID
     * @param {string} reason - Rejection reason
     * @returns {Promise<Object>} - Updated actor object
     */
    async rejectActor(actorId, reason) {
        try {
            const response = await secureFetch(`/api/actors/${actorId}/reject/`, {
                method: 'POST',
                body: JSON.stringify({ rejection_reason: reason })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Gagal menolak aktor');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }
}

/**
 * UI Components for Approval Workflow
 */
class ApprovalUIComponents {
    /**
     * Create a pending film card
     * @param {Object} film - Film object
     * @param {Function} onApprove - Callback for approve button
     * @param {Function} onReject - Callback for reject button
     * @param {Function} onDetail - Callback for detail button
     * @returns {HTMLElement} - Film card element
     */
    static createFilmCard(film, onApprove, onReject, onDetail = null) {
        const card = document.createElement('div');
        card.className = 'bg-[#201f20] rounded-lg border border-white/5 shadow-lg overflow-hidden flex flex-col hover:border-white/10 transition-all';
        
        // Get poster URL (check local first, then TMDB)
        let posterUrl = "/static/images/placeholder-poster.jpg";
        if (film.images && film.images.length > 0) {
            const localPoster = film.images.find(img => img.image_type === 'poster');
            if (localPoster) {
                posterUrl = localPoster.file_path;
            } else if (film.poster) {
                posterUrl = film.poster;
            } else if (film.poster_path) {
                posterUrl = film.poster_path.startsWith('http') ? film.poster_path : `https://image.tmdb.org/t/p/w500${film.poster_path}`;
            }
        } else if (film.poster) {
            posterUrl = film.poster;
        } else if (film.poster_path) {
            posterUrl = film.poster_path.startsWith('http') ? film.poster_path : `https://image.tmdb.org/t/p/w500${film.poster_path}`;
        }
        
        // Build genre display
        let genreText = '';
        if (film.genre_display && film.genre_display.length > 0) {
            genreText = film.genre_display.map(g => g.name || g).join(', ');
        }
        
        card.innerHTML = `
            <div class="bg-[#201f20] rounded-lg border border-white/5 hover:border-white/10 transition-all overflow-hidden">
                <!-- Header with Poster and Status Badge -->
                <div class="relative h-40 bg-gradient-to-b from-white/5 to-transparent overflow-hidden">
                    <img src="${posterUrl}" alt="${film.title}" class="w-full h-full object-cover opacity-40">
                    <div class="absolute inset-0 bg-gradient-to-b from-transparent via-[#201f20]/50 to-[#201f20]"></div>
                    <div class="absolute top-3 right-3">
                        <span class="px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/25 text-amber-300 border border-amber-500/40 backdrop-blur-sm whitespace-nowrap">
                            ${film.status_display || film.status}
                        </span>
                    </div>
                </div>
                
                <!-- Content -->
                <div class="p-4 flex flex-col gap-3">
                    <!-- Title + Year/Duration -->
                    <div>
                        <h3 class="text-sm font-bold text-stone-100 line-clamp-1">${film.title}</h3>
                        <p class="text-xs text-[#c9c5cb]/60 mt-1">${film.release_year || 'N/A'} ${film.duration ? '• ' + film.duration + ' min' : ''}</p>
                    </div>
                    
                    <!-- Genres -->
                    ${genreText ? `<p class="text-xs text-[#c9c5cb]/60 line-clamp-1">${genreText}</p>` : ''}
                    
                    <!-- Synopsis -->
                    <p class="text-xs text-[#c9c5cb]/70 line-clamp-2">${film.synopsis || 'Tidak ada sinopsis'}</p>
                    
                    <!-- Creator -->
                    <p class="text-xs text-[#c9c5cb]/60 border-t border-white/5 pt-2">
                        <span class="text-[#c9c5cb]/40">Dibuat oleh:</span> ${film.created_by_name || 'Unknown'}
                    </p>
                    
                    <!-- Buttons -->
                    <div class="flex gap-2 pt-1">
                        <button class="flex-1 px-3 py-2 rounded text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 hover:border-blue-400/50 transition-all" data-detail>
                            🔍 Detail
                        </button>
                        <button class="flex-1 px-3 py-2 rounded text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 hover:border-emerald-400/50 transition-all" data-approve>
                            ✓
                        </button>
                        <button class="flex-1 px-3 py-2 rounded text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 hover:border-rose-400/50 transition-all" data-reject>
                            ✕
                        </button>
                    </div>
                </div>
            </div>
        `;

        const detailBtn = card.querySelector('[data-detail]');
        const approveBtn = card.querySelector('[data-approve]');
        const rejectBtn = card.querySelector('[data-reject]');

        if (detailBtn && onDetail) {
            detailBtn.addEventListener('click', () => onDetail(film));
        }
        approveBtn.addEventListener('click', () => onApprove(film));
        rejectBtn.addEventListener('click', () => onReject(film));

        return card;
    }

    /**
     * Create a pending actor card
     * @param {Object} actor - Actor object
     * @param {Function} onApprove - Callback for approve button
     * @param {Function} onReject - Callback for reject button
     * @param {Function} onDetail - Callback for detail button
     * @returns {HTMLElement} - Actor card element
     */
    static createActorCard(actor, onApprove, onReject, onDetail = null) {
        const card = document.createElement('div');
        card.className = 'bg-[#201f20] rounded-lg p-6 border border-white/5 shadow-lg flex flex-col gap-4';
        card.innerHTML = `
            <div class="flex flex-col md:flex-row justify-between items-start gap-4">
                <div class="flex-1">
                    <h3 class="text-lg font-semibold text-stone-100">${actor.name}</h3>
                    <p class="text-xs text-[#c9c5cb]/70 mt-1 line-clamp-2">${actor.bio || 'Tidak ada biografi'}</p>
                    <div class="flex gap-2 mt-3">
                        <span class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400">
                            ${actor.status_display || actor.status}
                        </span>
                        <span class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-500/10 text-stone-400">
                            Dibuat oleh: ${actor.created_by_name || 'Unknown'}
                        </span>
                    </div>
                </div>
                <div class="flex gap-2 w-full md:w-auto">
                    <button class="px-3 py-2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all text-xs font-semibold" data-detail>
                        🔍
                    </button>
                    <button class="px-3 py-2 rounded bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all text-xs font-semibold" data-approve>
                        ✓
                    </button>
                    <button class="px-3 py-2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all text-xs font-semibold" data-reject>
                        ✕
                    </button>
                </div>
            </div>
        `;

        const detailBtn = card.querySelector('[data-detail]');
        const approveBtn = card.querySelector('[data-approve]');
        const rejectBtn = card.querySelector('[data-reject]');

        if (detailBtn && onDetail) {
            detailBtn.addEventListener('click', () => onDetail(actor));
        }
        approveBtn.addEventListener('click', () => onApprove(actor));
        rejectBtn.addEventListener('click', () => onReject(actor));

        return card;
    }

    /**
     * Create rejection reason modal
     * @param {string} title - Modal title
     * @param {Function} onSubmit - Callback when reason is submitted
     * @returns {HTMLElement} - Modal element
     */
    static createRejectionModal(title, onSubmit) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-[#201f20] rounded-lg p-6 border border-white/5 shadow-lg max-w-md w-full mx-4">
                <h2 class="text-lg font-semibold text-stone-100 mb-4">${title}</h2>
                <textarea class="w-full bg-[#141314] border border-white/10 rounded-md py-2 px-3 text-xs text-stone-200 placeholder-stone-500 focus:border-[#715A5A] focus:ring-1 focus:ring-[#715A5A] focus:outline-none transition-all mb-4" placeholder="Masukkan alasan penolakan..." rows="4"></textarea>
                <div class="flex gap-2 justify-end">
                    <button class="px-4 py-2 rounded border border-white/10 text-stone-300 hover:bg-white/5 transition-all text-xs font-semibold" data-cancel>
                        Batal
                    </button>
                    <button class="px-4 py-2 rounded bg-rose-500 text-white hover:bg-rose-600 transition-all text-xs font-semibold" data-submit>
                        Tolak
                    </button>
                </div>
            </div>
        `;

        const textarea = modal.querySelector('textarea');
        const cancelBtn = modal.querySelector('[data-cancel]');
        const submitBtn = modal.querySelector('[data-submit]');

        cancelBtn.addEventListener('click', () => modal.remove());
        submitBtn.addEventListener('click', () => {
            const reason = textarea.value.trim();
            if (!reason) {
                alert('Alasan penolakan harus diisi');
                return;
            }
            onSubmit(reason);
            modal.remove();
        });

        return modal;
    }
}

// Export for use in HTML
window.RBACManager = RBACManager;
window.PosterUploadManager = PosterUploadManager;
window.ApprovalManager = ApprovalManager;
window.ApprovalUIComponents = ApprovalUIComponents;
