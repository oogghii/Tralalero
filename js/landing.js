/**
 * LANDING.JS
 * Landing page logic:
 *   - OTP input setup and validation
 *   - Join existing board
 *   - Create new board
 *   - Board history (localStorage)
 *   - Leave / delete board
 *
 * Fixes applied:
 *  - leaveBoard() uses history.pushState to avoid trailing '#' in URL (#9)
 *  - History click-outside handler has null-check guard (#8)
 *  - createNewBoardAction passes skipInitialRender=true to avoid
 *    double-rendering race condition (#7)
 */

// ─── OTP Inputs ───────────────────────────────────────────────────────────────

function setupOTPInputs() {
    const container = document.getElementById('otp-container');
    if (!container) return;

    const inputs = container.querySelectorAll('.otp-input');

    inputs.forEach((input, index) => {
        // Character input — auto-advance
        input.addEventListener('input', (e) => {
            const val = e.target.value;
            if (val.length === 1) {
                if (index < inputs.length - 1) {
                    inputs[index + 1].focus();
                } else {
                    checkAndJoinBoard(); // Last field filled → try to join
                }
            } else if (val.length > 1) {
                e.target.value = val[0]; // Keep only first char
                if (index < inputs.length - 1) inputs[index + 1].focus();
            }
        });

        // Backspace, arrow keys, Enter
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                inputs[index - 1].focus();
            }
            if (e.key === 'ArrowLeft'  && index > 0)                  inputs[index - 1].focus();
            if (e.key === 'ArrowRight' && index < inputs.length - 1)  inputs[index + 1].focus();
            if (e.key === 'Enter') checkAndJoinBoard();
        });

        // Paste full code (e.g. "A1B2C3")
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const raw       = (e.clipboardData || window.clipboardData).getData('text');
            const cleanData = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
            if (!cleanData) return;

            cleanData.split('').forEach((char, i) => {
                if (inputs[i]) inputs[i].value = char;
            });

            const nextIdx = Math.min(cleanData.length, inputs.length - 1);
            inputs[nextIdx].focus();
            if (cleanData.length === 6) checkAndJoinBoard();
        });

        // Force uppercase visually
        input.addEventListener('keyup', function () {
            this.value = this.value.toUpperCase();
        });
    });
}

// ─── Join Board ───────────────────────────────────────────────────────────────

async function checkAndJoinBoard() {
    const errorMsg = document.getElementById('join-error');
    const inputs   = document.querySelectorAll('.otp-input');

    let code = '';
    inputs.forEach(input => {
        code += input.value.trim();
        input.classList.remove('border-red-500', 'ring-red-500');
    });
    code = code.toUpperCase();

    errorMsg.classList.add('hidden');

    if (!code || code.length < 6) {
        showJoinError('Le code doit contenir 6 caractères.');
        return;
    }

    inputs.forEach(i => (i.disabled = true));

    try {
        const { data, error } = await supabaseClient
            .from(TABLE_NAME)
            .select('id')
            .eq('id', code)
            .single();

        if (error || !data) {
            showJoinError("Ce tableau n'existe pas.");
            inputs.forEach(i => {
                i.disabled = false;
                i.value    = '';
            });
            inputs[0].focus();
        } else {
            currentBoardId = code;
            window.location.hash = code;

            setTimeout(() => {
                document.getElementById('landing-modal').classList.add('hidden');
                document.getElementById('loading-spinner').classList.remove('hidden');
                connectToBoard(code);
                inputs.forEach(i => (i.disabled = false));
            }, 500);
        }
    } catch (err) {
        console.error(err);
        showJoinError('Erreur de connexion.');
        inputs.forEach(i => (i.disabled = false));
    }
}

function showJoinError(msg) {
    const errorMsg = document.getElementById('join-error');
    errorMsg.innerText = msg;
    errorMsg.classList.remove('hidden');
    document.querySelectorAll('.otp-input').forEach(input => {
        input.classList.add('border-red-500', 'ring-1', 'ring-red-500');
    });
}

// ─── Create Board ─────────────────────────────────────────────────────────────

async function createNewBoardAction() {
    const newId     = generateId();
    currentBoardId  = newId;
    window.location.hash = newId;

    // Hide landing, show board immediately (Optimistic UI)
    document.getElementById('landing-modal').classList.add('hidden');

    boardData = JSON.parse(JSON.stringify(defaultBoardData));
    settings  = JSON.parse(JSON.stringify(defaultSettings));

    renderBoard();
    if (!document.getElementById('settings-modal').classList.contains('hidden')) {
        renderSettingsList();
    }

    document.getElementById('loading-spinner').classList.add('hidden');
    document.getElementById('add-col-container').classList.remove('hidden');

    try {
        await initializeNewBoard(newId);
        // FIX #7 — skipInitialRender=true so we don't clobber the already-rendered UI
        connectToBoard(newId, true);
    } catch (e) {
        console.error('Erreur lors de la création initiale :', e);
        showToast('Erreur lors de la création du tableau', 'red');
    }
}

// ─── History (LocalStorage) ───────────────────────────────────────────────────

function addToHistory(boardId) {
    if (!boardId) return;

    let history    = JSON.parse(localStorage.getItem('tralalero_history') || '[]');
    const title    = settings && settings.boardTitle ? settings.boardTitle : 'Chargement...';
    const entry    = {
        id:    boardId,
        title,
        date:  new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    };

    history = history.filter(h => h.id !== boardId); // Remove duplicate
    history.unshift(entry);
    if (history.length > 5) history.pop();

    localStorage.setItem('tralalero_history', JSON.stringify(history));
    renderHistoryUI();
}

function removeFromHistory(boardId) {
    let history = JSON.parse(localStorage.getItem('tralalero_history') || '[]');
    history     = history.filter(h => h.id !== boardId);
    localStorage.setItem('tralalero_history', JSON.stringify(history));
}

// ─── History Dropdown ─────────────────────────────────────────────────────────

function toggleHistoryDropdown() {
    const dropdown = document.getElementById('history-dropdown');
    const icon     = document.querySelector('#history-trigger i');
    if (!dropdown) return;

    if (dropdown.classList.contains('hidden')) {
        dropdown.classList.remove('hidden');
        dropdown.classList.add('animate-fade-in-down');
        if (icon) icon.classList.add('rotate-180');
    } else {
        dropdown.classList.add('hidden');
        dropdown.classList.remove('animate-fade-in-down');
        if (icon) icon.classList.remove('rotate-180');
    }
}

function selectHistoryItem(boardId) {
    toggleHistoryDropdown();
    document.getElementById('history-selected-text').innerText = 'Chargement...';
    loadFromHistory(boardId);
}

// Close dropdown when clicking outside — FIX #8: null-checks added
window.addEventListener('click', function (e) {
    const container = document.getElementById('history-container');
    const dropdown  = document.getElementById('history-dropdown');
    const trigger   = document.getElementById('history-trigger');
    if (!container || !dropdown || !trigger) return; // Guard against null elements

    if (!container.contains(e.target) && !dropdown.classList.contains('hidden')) {
        dropdown.classList.add('hidden');
        trigger.querySelector('i').classList.remove('rotate-180');
    }
});

function loadFromHistory(val) {
    if (!val) return;
    const inputs = document.querySelectorAll('.otp-input');
    val.split('').forEach((char, i) => {
        if (inputs[i]) inputs[i].value = char;
    });
    checkAndJoinBoard();
}

// ─── Leave / Delete Board ─────────────────────────────────────────────────────

/**
 * Returns to the landing page.
 * FIX #9 — uses history.pushState instead of setting hash='', which avoids
 * leaving a trailing '#' in the browser URL bar.
 */
function leaveBoard() {
    history.pushState('', document.title, window.location.pathname);
    window.location.reload();
}

async function deleteBoardAction() {
    if (!currentBoardId) return;

    showConfirm(
        'Supprimer définitivement ?',
        'Attention : Ce projet sera effacé pour tout le monde. Cette action est irréversible.',
        async () => {
            const { error } = await supabaseClient
                .from(TABLE_NAME)
                .delete()
                .eq('id', currentBoardId);

            if (error) {
                console.error('Erreur de suppression :', error);
                showToast('Erreur lors de la suppression.', 'red');
                return;
            }

            removeFromHistory(currentBoardId);
            showToast('Projet supprimé avec succès.', 'green');
            setTimeout(leaveBoard, 1000);
        },
        true // isDestructive
    );
}
