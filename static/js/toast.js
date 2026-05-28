/**
 * Toast Notification Utility
 * Usage: showToast("Message", "success", 3000)
 */

function showToast(message, type = 'info', duration = 3000) {
    // Create container if it doesn't exist
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // Icon mapping
    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠'
    };

    // Build toast HTML
    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.info}</div>
        <div class="toast-message">${escapeHtml(message)}</div>
        <div class="toast-close"></div>
    `;

    // Add to container
    container.appendChild(toast);

    // Close button handler
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => removeToast(toast));

    // Auto-remove after duration
    const timeoutId = setTimeout(() => removeToast(toast), duration);

    // Store timeout ID for manual removal
    toast.timeoutId = timeoutId;

    return toast;
}

function removeToast(toast) {
    if (!toast) return;

    // Clear timeout if exists
    if (toast.timeoutId) {
        clearTimeout(toast.timeoutId);
    }

    // Add removing class for animation
    toast.classList.add('removing');

    // Remove after animation completes
    setTimeout(() => {
        toast.remove();
    }, 300);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * secureFetch — Pengganti fetch() yang aman untuk session auth.
 *
 * Otomatis menyertakan:
 * - Cookie sesi browser (via `credentials: 'same-origin'` default)
 * - Header `X-CSRFToken` untuk semua unsafe methods (POST, PUT, PATCH, DELETE)
 * - Header `Content-Type: application/json` jika body berupa object (bukan FormData)
 *
 * Usage: await secureFetch('/api/endpoint/', { method: 'POST', body: JSON.stringify(data) })
 */
async function secureFetch(url, options = {}) {
    if (!options.headers) {
        options.headers = {};
    }
    const method = (options.method || 'GET').toUpperCase();

    // Untuk unsafe HTTP methods, sertakan CSRF token
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        // Ambil CSRF token: dari variabel global (diinjeksi Django di base.html)
        // atau fallback ke cookie
        let csrfToken = (typeof CSRF_TOKEN !== 'undefined') ? CSRF_TOKEN : null;
        if (!csrfToken) {
            const match = document.cookie.match(/csrftoken=([^;]+)/);
            if (match) csrfToken = match[1];
        }
        if (csrfToken) {
            options.headers['X-CSRFToken'] = csrfToken;
        }

        // Auto-set Content-Type jika body bukan FormData
        if (options.body && !(options.body instanceof FormData) && !options.headers['Content-Type']) {
            options.headers['Content-Type'] = 'application/json';
        }
    }

    // Selalu sertakan session cookie untuk autentikasi berbasis sesi Django
    options.credentials = 'same-origin';

    return fetch(url, options);
}

// Export for use in other scripts
window.showToast = showToast;
window.secureFetch = secureFetch;

