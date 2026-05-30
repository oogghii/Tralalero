/**
 * MAIN.JS
 * Application entry point.
 * Calls init() once the DOM is fully loaded.
 */

/**
 * Bootstraps the application:
 *  1. Validates that Supabase is available
 *  2. Sets up OTP inputs
 *  3. Renders existing history in the landing dropdown
 *  4. Checks the URL hash — if a board ID is present, loads it directly;
 *     otherwise shows the landing page.
 */
function init() {
    if (!supabaseClient) {
        document.getElementById('loading-spinner').innerText = 'Supabase non initialisé';
        return;
    }

    setupOTPInputs();
    renderHistoryUI();

    const hash = window.location.hash.substring(1);
    if (hash && hash.length > 0) {
        currentBoardId = hash;
        connectToBoard(currentBoardId);
    } else {
        document.getElementById('loading-spinner').classList.add('hidden');
        document.getElementById('landing-modal').classList.remove('hidden');
    }
}

// Wait for the DOM to be ready before initialising
document.addEventListener('DOMContentLoaded', init);
