/**
 * SETTINGS.JS
 * Label and member management.
 *
 * Interaction model (clean):
 *  - Labels  : click the dot → colour picker expands below | click ✏ → inline rename
 *  - Members : click the avatar → panel with colour swatches + initials input | click ✏ → name rename
 */

// ─── UI state ────────────────────────────────────────────────────────────────

let openLabelPickerId  = null;   // ID of label whose colour picker is expanded
let openMemberPanelId  = null;   // ID of member whose edit panel is expanded
let renamingLabelId    = null;   // ID of label currently being renamed
let renamingMemberId   = null;   // ID of member currently being renamed

// ─── Open / Close ────────────────────────────────────────────────────────────

function openSettingsModal() {
    openLabelPickerId = null;
    openMemberPanelId = null;
    renamingLabelId   = null;
    renamingMemberId  = null;

    renderSettingsList();
    renderNewMemberColorPicker();
    document.getElementById('settings-modal').classList.remove('hidden');
}

function closeSettingsModal(e, force) {
    if (force || (e && e.target.id === 'settings-modal')) {
        document.getElementById('settings-modal').classList.add('hidden');
    }
}

// ─── Label: colour ────────────────────────────────────────────────────────────

function toggleLabelColorPicker(labelId) {
    openLabelPickerId = openLabelPickerId === labelId ? null : labelId;
    renamingLabelId   = null;
    renderSettingsList();
}

function changeLabelColor(labelId, colorName) {
    const label = (settings.labels || []).find(l => l.id === labelId);
    if (!label) return;
    label.colorName   = colorName;
    openLabelPickerId = null;
    saveToSupabase();
    renderSettingsList();
    renderBoard();
}

// ─── Label: rename ────────────────────────────────────────────────────────────

function startRenameLabel(labelId) {
    renamingLabelId   = labelId;
    openLabelPickerId = null;
    renderSettingsList();
    requestAnimationFrame(() => {
        const input = document.getElementById(`rename-label-${labelId}`);
        if (input) { input.focus(); input.select(); }
    });
}

function confirmRenameLabel(labelId) {
    if (renamingLabelId !== labelId) return;
    const input   = document.getElementById(`rename-label-${labelId}`);
    if (!input) return;
    const newName = input.value.trim();
    const label   = (settings.labels || []).find(l => l.id === labelId);
    if (label && newName && newName !== label.name) {
        label.name = newName;
        saveToSupabase();
        renderBoard();
    }
    renamingLabelId = null;
    renderSettingsList();
}

function cancelRenameLabel() {
    renamingLabelId = null;
    renderSettingsList();
}

// ─── Label: add new (form colour picker) ──────────────────────────────────────

function selectLabelColor(color) {
    document.getElementById('selected-label-color').value = color;
    renderSettingsList();
}

function addNewLabel() {
    const nameInput = document.getElementById('new-label-name');
    const name      = nameInput.value.trim();
    const color     = document.getElementById('selected-label-color').value || 'blue';
    if (!name) { nameInput.focus(); return; }

    if (!settings.labels) settings.labels = [];
    settings.labels.push({ id: 'l-' + generateId(), name, colorName: color });
    nameInput.value = '';
    saveToSupabase();
    renderSettingsList();
}

function removeLabel(id) {
    showConfirm(
        "Supprimer l'étiquette ?",
        'Cette étiquette sera retirée de toutes les cartes.',
        () => {
            settings.labels = (settings.labels || []).filter(l => l.id !== id);
            boardData.forEach(col => col.cards.forEach(card => {
                card.labels = (card.labels || []).filter(lId => lId !== id);
            }));
            saveToSupabase();
            renderSettingsList();
            renderBoard();
        }
    );
}

// ─── Member: avatar panel (colour + initials) ─────────────────────────────────

function toggleMemberEdit(memberId) {
    if (openMemberPanelId === memberId || renamingMemberId === memberId) {
        openMemberPanelId = null;
        renamingMemberId  = null;
    } else {
        openMemberPanelId = memberId;
        renamingMemberId  = memberId;
        requestAnimationFrame(() => {
            const input = document.getElementById(`rename-member-${memberId}`);
            if (input) { input.focus(); input.select(); }
        });
    }
    renderSettingsList();
}

function changeMemberColor(memberId, colorName) {
    const member = (settings.members || []).find(m => m.id === memberId);
    if (!member) return;
    member.colorName  = colorName;
    // Keep panel open so user can also change initials right after
    saveToSupabase();
    renderSettingsList();
    renderBoard();
}

/**
 * Save custom initials for a member (max 2 chars, uppercased).
 * Called onblur / Enter from the initials input inside the member panel.
 */
function saveMemberInitials(memberId) {
    const input   = document.getElementById(`initials-${memberId}`);
    if (!input) return;
    const raw     = input.value.replace(/\s/g, '').toUpperCase().slice(0, 2);
    const member  = (settings.members || []).find(m => m.id === memberId);
    if (!member) return;
    if (raw && raw !== member.initials) {
        member.initials = raw;
        saveToSupabase();
        renderBoard();
    }
    // Reflect the cleaned value back
    input.value = member.initials;
    // Update the avatar button live
    const avatarBtn = document.getElementById(`avatar-btn-${memberId}`);
    if (avatarBtn) avatarBtn.textContent = member.initials;
}

// ─── Member: rename ───────────────────────────────────────────────────────────

// toggleMemberEdit replaces startRenameMember

function confirmRenameMember(memberId) {
    if (renamingMemberId !== memberId) return;
    const input   = document.getElementById(`rename-member-${memberId}`);
    if (!input) return;
    const newName = input.value.trim();
    const member  = (settings.members || []).find(m => m.id === memberId);
    if (member && newName && newName !== member.name) {
        member.name = newName;
        if (member.initials === getInitials(member.name) || !member.initials) {
            member.initials = getInitials(newName);
        }
        saveToSupabase();
        renderBoard();
    }
    // Don't close everything automatically here, let closeMemberEdit handle it
}

function closeMemberEdit(memberId) {
    confirmRenameMember(memberId);
    renamingMemberId  = null;
    openMemberPanelId = null;
    renderSettingsList();
}

// ─── Member: add / remove ─────────────────────────────────────────────────────

function renderNewMemberColorPicker() {
    const pickerEl = document.getElementById('member-color-picker');
    if (!pickerEl) return;
    const selected = document.getElementById('selected-member-color').value || 'blue';
    pickerEl.innerHTML = Object.entries(AVATAR_COLOR_CONFIG).map(([key, cfg]) => {
        const active = selected === key;
        return `<button type="button" onclick="selectNewMemberColor('${key}')"
            title="${cfg.name}"
            class="si-swatch ${cfg.bg} ${active ? 'si-swatch--active' : ''}">
        </button>`;
    }).join('');
}

function selectNewMemberColor(color) {
    document.getElementById('selected-member-color').value = color;
    renderNewMemberColorPicker();
    updateMemberPreview(document.getElementById('new-member-name').value);
}

function updateMemberPreview(name) {
    const preview  = document.getElementById('new-member-avatar-preview');
    if (!preview) return;
    const colorKey = document.getElementById('selected-member-color').value || 'blue';
    const cfg      = AVATAR_COLOR_CONFIG[colorKey] || AVATAR_COLOR_CONFIG['blue'];

    preview.className = preview.className.replace(/bg-\S+/g, '').trim();
    preview.classList.add(cfg.bg);
    preview.textContent = name ? getInitials(name) : '?';
}

function addNewMember() {
    const nameInput = document.getElementById('new-member-name');
    const name      = nameInput.value.trim();
    if (!name) { nameInput.focus(); return; }

    const chosen    = document.getElementById('selected-member-color').value;
    const colorKeys = Object.keys(AVATAR_COLOR_CONFIG);
    const colorName = colorKeys.includes(chosen)
        ? chosen
        : colorKeys[Math.floor(Math.random() * colorKeys.length)];

    if (!settings.members) settings.members = [];
    settings.members.push({
        id:       'm-' + generateId(),
        name,
        initials: getInitials(name),
        colorName
    });
    nameInput.value = '';
    updateMemberPreview('');
    saveToSupabase();
    renderSettingsList();
}

function removeMember(id) {
    showConfirm(
        'Retirer le membre ?',
        'Ce membre sera retiré de toutes les tâches.',
        () => {
            settings.members = (settings.members || []).filter(m => m.id !== id);
            boardData.forEach(col => col.cards.forEach(card => {
                card.members = (card.members || []).filter(mId => mId !== id);
            }));
            saveToSupabase();
            renderSettingsList();
            renderBoard();
        }
    );
}
