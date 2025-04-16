// --- Utility Functions ---

/**
 * Displays a temporary notification message on the screen.
 * @param {string} message - The message to display.
 * @param {string} [type='info'] - The type of notification ('info', 'success', 'warning', 'error').
 */
function showNotification(mess2age, type = 'info') {
    const notificationArea = document.getElementById('notification-area');
    if (!notificationArea) {
        console.error("Notification area not found!");
        return;
    }
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    notificationArea.appendChild(notification);

    // Auto-remove notification after a few seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500); // Remove after fade out
    }, 4000); // Display for 4 seconds
}

/**
 * Generates a simple pseudo-unique ID string.
 * @returns {string} A unique ID starting with '_'.
 */
function generateUniqueId() {
    // Basic implementation, suitable for small scale / example purposes.
    // For production, consider UUID libraries if collision risk is higher.
    return '_' + Math.random().toString(36).substr(2, 9);
}