/**
 * UI.JS
 * Generic UI utilities: toast notifications, confirm dialog,
 * share modal, and pure helper functions (generateId, getInitials).
 *
 * Fixes applied:
 *  - showToast now handles 'blue' colour correctly (#5)
 *  - getInitials uses a safer implementation that never throws (#6)
 *  - showConfirm button labels are now in French (#1)
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Generates a random 6-character alphanumeric ID (uppercase).
 * @returns {string}
 */
function generateId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const randomArray = new Uint8Array(6);
    crypto.getRandomValues(randomArray);
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars[randomArray[i] % chars.length];
    }
    return result;
}

/**
 * Safely extracts initials from a full name.
 * Works for single words, double-barrelled names, etc.
 * @param {string} name
 * @returns {string} Up to 2 uppercase initials
 */
function getInitials(name) {
    if (!name || typeof name !== 'string') return '?';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Escapes unsafe HTML characters to prevent XSS attacks.
 * @param {string} unsafe
 * @returns {string}
 */
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// ─── Toast Notification ───────────────────────────────────────────────────────

/**
 * Shows a temporary toast message at the bottom of the screen.
 * @param {string} msg    Message text
 * @param {'green'|'red'|'blue'} color  Icon colour theme
 */
function showToast(msg, color = 'green') {
    const toast = document.getElementById('toast');
    const text  = document.getElementById('toast-message');
    const icon  = toast.querySelector('i');

    text.innerText = msg;

    if (color === 'red') {
        icon.className = 'ph-fill ph-warning-circle text-red-400';
    } else if (color === 'blue') {
        icon.className = 'ph-fill ph-info text-blue-400';
    } else if (color === 'indigo' || color === 'purple') {
        icon.className = 'ph-fill ph-tag text-indigo-400';
    } else if (color === 'pink' || color === 'rose') {
        icon.className = 'ph-fill ph-image text-pink-400';
    } else if (color === 'slate' || color === 'gray') {
        icon.className = 'ph-fill ph-info text-slate-400';
    } else {
        icon.className = 'ph-fill ph-check-circle text-green-400';
    }

    toast.classList.remove('opacity-0', 'translate-y-4');

    // Animate the progress bar
    const bar = document.getElementById('toast-progress');
    if (bar) {
        bar.style.animation = 'none';
        bar.offsetHeight; // reflow to restart
        bar.style.width = '100%';
        bar.style.animation = 'toastDrain 3s linear forwards';
    }

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-4');
    }, 3000);
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

/**
 * Shows a styled confirmation dialog.
 * @param {string}   title         Dialog title
 * @param {string}   message       Dialog body text
 * @param {Function} callback      Called when user confirms
 * @param {boolean}  isDestructive True = red "Supprimer" button, false = blue "Confirmer" button
 */
function showConfirm(title, message, callback, isDestructive = true) {
    document.getElementById('confirm-title').innerText   = title;
    document.getElementById('confirm-message').innerText = message;

    // Clone to remove stale event listeners
    const confirmBtn = document.getElementById('confirm-yes-btn');
    const newBtn     = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);

    newBtn.onclick = () => {
        callback();
        closeConfirmModal();
    };

    const iconContainer = document.getElementById('confirm-icon');

    if (isDestructive) {
        newBtn.className  = 'px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-500/30 transition w-full';
        newBtn.innerText  = 'Supprimer'; // FIX #1 — was English "Delete"
        iconContainer.className = 'w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-red-500/30';
        iconContainer.innerHTML = '<i class="ph-bold ph-warning text-2xl"></i>';
    } else {
        newBtn.className  = 'px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/30 transition w-full';
        newBtn.innerText  = 'Confirmer'; // FIX #1 — was English "Confirm"
        iconContainer.className = 'w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/30';
        iconContainer.innerHTML = '<i class="ph-bold ph-info text-2xl"></i>';
    }

    document.getElementById('confirm-modal').classList.remove('hidden');
}

function closeConfirmModal() {
    document.getElementById('confirm-modal').classList.add('hidden');
}

// ─── Share Modal ──────────────────────────────────────────────────────────────

function shareBoard() {
    if (!currentBoardId) return;
    document.getElementById('share-code-display').innerText = currentBoardId;
    document.getElementById('share-modal').classList.remove('hidden');
}

function closeShareModal(e, force) {
    if (force || (e && e.target.id === 'share-modal')) {
        document.getElementById('share-modal').classList.add('hidden');
    }
}

/**
 * Copies the full board URL (with hash) to the clipboard and shows a toast.
 */
function copyCodeAction() {
    const fullUrl = `${window.location.origin}${window.location.pathname}#${currentBoardId}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
        document.getElementById('share-modal').classList.add('hidden');
        showToast('Lien copié ! Envoyez-le à votre équipe.', 'green');
    }).catch(err => {
        console.error('Erreur copie :', err);
        showToast('Erreur lors de la copie', 'red');
    });
}

function toggleActivitySidebar() {
    const sidebar = document.getElementById('activity-sidebar');
    if (sidebar.classList.contains('translate-x-full')) {
        sidebar.classList.remove('translate-x-full');
        // Close others
        const chat = document.getElementById('chat-widget');
        if (chat && !chat.classList.contains('translate-y-[150%]')) {
            toggleChat();
        }
        if (typeof renderGlobalActivity === 'function') {
            renderGlobalActivity();
        }
    } else {
        sidebar.classList.add('translate-x-full');
    }
}

// ─── Global Identity System ───────────────────────────────────────────────────

function getIdentityKey() {
    return 'tralalero_identity_' + currentBoardId;
}

function getCurrentIdentity() {
    return localStorage.getItem(getIdentityKey()) || null;
}

function setIdentity(id) {
    localStorage.setItem(getIdentityKey(), id);
    closeIdentityModal();
    updateIdentityUI();
}

function checkAndPromptIdentity() {
    const current = getCurrentIdentity();
    if (!current) {
        // No identity set for this board, prompt!
        openIdentityModal();
    } else {
        // Validate if it still exists (unless anonymous)
        if (current !== 'anonymous') {
            const member = (settings.members || []).find(m => m.id === current);
            if (!member) {
                // Identity deleted by someone else?
                setIdentity('anonymous');
            }
        }
    }
    updateIdentityUI();
}

function updateIdentityUI() {
    const current = getCurrentIdentity() || 'anonymous';
    const avatarEl = document.getElementById('nav-identity-avatar');
    const nameEl = document.getElementById('nav-identity-name');
    
    if (!avatarEl || !nameEl) return;
    
    if (current === 'anonymous') {
        avatarEl.className = 'w-7 h-7 rounded-full bg-slate-500 text-white flex items-center justify-center text-xs font-bold shadow-inner';
        avatarEl.innerHTML = '<i class="ph-bold ph-user"></i>';
        nameEl.innerText = 'Anonyme';
    } else {
        const member = (settings.members || []).find(m => m.id === current);
        if (member) {
            const colorClass = (typeof AVATAR_COLORS !== 'undefined' && AVATAR_COLORS[member.colorName]) ? AVATAR_COLORS[member.colorName] : 'bg-slate-500';
            avatarEl.className = `w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold shadow-inner ${colorClass}`;
            avatarEl.innerText = member.initials || '?';
            nameEl.innerText = member.name;
        } else {
            setIdentity('anonymous');
        }
    }
}

function openIdentityModal() {
    const modal = document.getElementById('identity-modal');
    const content = document.getElementById('identity-modal-content');
    
    // Check if they are allowed to close it
    const canClose = getCurrentIdentity() !== null;
    document.getElementById('identity-close-btn').style.display = canClose ? 'flex' : 'none';
    
    renderIdentityModalMembers();
    renderIdentityColorPicker();
    
    modal.classList.remove('hidden');
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function closeIdentityModal() {
    // Only allow closing if they have an identity
    if (!getCurrentIdentity()) return;
    
    const modal = document.getElementById('identity-modal');
    const content = document.getElementById('identity-modal-content');
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 200);
}

function renderIdentityModalMembers() {
    const list = document.getElementById('identity-member-list');
    if (!list) return;
    
    const members = settings.members || [];
    if (members.length === 0) {
        list.innerHTML = '<div class="text-sm text-slate-400 italic col-span-2 text-center py-2">Aucun membre existant. Créez-en un nouveau ci-dessous.</div>';
        return;
    }
    
    const current = getCurrentIdentity();
    
    list.innerHTML = members.map(m => {
        const colorClass = (typeof AVATAR_COLORS !== 'undefined' && AVATAR_COLORS[m.colorName]) ? AVATAR_COLORS[m.colorName] : 'bg-slate-500';
        const isSelected = m.id === current;
        const ringClass = isSelected ? 'ring-2 ring-indigo-500 ring-offset-1' : '';
        const bgClass = isSelected ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30';
        
        return `
            <button onclick="setIdentity('${m.id}')" class="flex items-center gap-2 p-2 rounded-xl border transition text-left ${bgClass}">
                <div class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-sm ${colorClass} ${ringClass}">
                    ${m.initials || '?'}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="text-sm font-bold text-slate-700 truncate">${escapeHtml(m.name)}</div>
                </div>
            </button>
        `;
    }).join('');
}

let selectedIdentityColor = 'slate';

function renderIdentityColorPicker() {
    const container = document.getElementById('identity-color-picker');
    if (!container) return;
    
    if (typeof AVATAR_COLORS === 'undefined') return;
    
    container.innerHTML = Object.keys(AVATAR_COLORS).map(color => {
        const bg = AVATAR_COLORS[color];
        const isSelected = selectedIdentityColor === color;
        return `
            <button onclick="selectedIdentityColor='${color}'; renderIdentityColorPicker()" title="${color}" class="si-swatch ${bg} ${isSelected ? 'si-swatch--active' : ''}"></button>
        `;
    }).join('');
}

function createIdentity() {
    const nameInput = document.getElementById('identity-new-name');
    const name = nameInput.value.trim();
    if (!name) return;
    
    if (!settings.members) settings.members = [];
    
    const newMember = {
        id: 'mem-' + generateId(),
        name: name,
        initials: getInitials(name),
        colorName: selectedIdentityColor
    };
    
    settings.members.push(newMember);
    saveToSupabase();
    
    // Set as active
    setIdentity(newMember.id);
    nameInput.value = '';
    
    // Rerender settings list if it's open
    if (typeof renderSettingsList === 'function' && !document.getElementById('settings-modal').classList.contains('hidden')) {
        renderSettingsList();
    }
}

// ─── Global Keyboard Shortcuts ───────────────────────────────────────────────

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const confirmModal = document.getElementById('confirm-modal');
        if (confirmModal && !confirmModal.classList.contains('hidden')) {
            closeConfirmModal();
            return;
        }
        
        const identityModal = document.getElementById('identity-modal');
        if (identityModal && !identityModal.classList.contains('hidden') && getCurrentIdentity()) {
            closeIdentityModal();
            return;
        }
        
        const cardModal = document.getElementById('modal-overlay');
        if (cardModal && !cardModal.classList.contains('hidden')) {
            saveCardFromModal(true);
            return;
        }
        
        const settingsModal = document.getElementById('settings-modal');
        if (settingsModal && !settingsModal.classList.contains('hidden')) {
            if (typeof closeSettingsModal === 'function') closeSettingsModal(null, true);
            return;
        }
        
        const importModal = document.getElementById('import-modal');
        if (importModal && !importModal.classList.contains('hidden')) {
            if (typeof closeImportModal === 'function') closeImportModal(null, true);
            return;
        }
        
        const shareModal = document.getElementById('share-modal');
        if (shareModal && !shareModal.classList.contains('hidden')) {
            closeShareModal(null, true);
            return;
        }
    }
});

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const cardModal = document.getElementById('modal-overlay');
        if (cardModal && !cardModal.classList.contains('hidden')) {
            e.preventDefault();
            if (typeof saveCardFromModal === 'function') saveCardFromModal(true);
        }
    }
});
