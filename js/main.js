/**
 * MAIN.JS
 * Application entry point.
 * Calls init() once the DOM is fully loaded.
 */
function init() {
    if (!supabaseClient) {
        document.getElementById('loading-spinner').innerText = 'Supabase non initialisé';
        return;
    }

    setupOTPInputs();
    renderHistoryUI();

    const hash = window.location.hash.substring(1);
    if (hash) {
        currentBoardId = hash;
        connectToBoard(currentBoardId);
    } else {
        document.getElementById('loading-spinner').classList.add('hidden');
        document.getElementById('landing-modal').classList.remove('hidden');
    }
}

// Wait for the DOM to be ready before initialising
document.addEventListener('DOMContentLoaded', init);
