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

// Export for use in other scripts
window.showToast = showToast;
