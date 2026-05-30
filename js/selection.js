/**
 * SELECTION.JS
 * Card multi-select mode: toggle, bulk delete, and cancel.
 */

function toggleSelectMode() {
    if (!isSelectMode) {
        isSelectMode = true;
        showToast('Mode sélection activé', 'blue');
        updateSelectModeUI();
        renderBoard();
    } else {
        cancelSelection();
        showToast('Mode sélection désactivé', 'slate');
    }
}

function updateSelectModeUI() {
    const btn = document.getElementById('menu-select-btn');
    const icon = document.getElementById('menu-select-icon');
    const text = document.getElementById('menu-select-text');
    
    if (btn && icon && text) {
        if (isSelectMode) {
            btn.classList.remove('text-white', 'hover:bg-white/20');
            btn.classList.add('bg-blue-600', 'text-white', 'hover:bg-blue-700');
            icon.classList.remove('text-blue-500');
            icon.classList.add('text-white');
            text.innerText = 'Annuler la sélection';
        } else {
            btn.classList.remove('bg-blue-600', 'text-white', 'hover:bg-blue-700');
            btn.classList.add('text-white', 'hover:bg-white/20');
            icon.classList.remove('text-white');
            icon.classList.add('text-blue-500');
            text.innerText = 'Sélectionner';
        }
    }
}

function toggleCardSelection(cardId, colId) {
    const index = selectedCards.findIndex(s => s.cardId === cardId);
    if (index > -1) {
        selectedCards.splice(index, 1);
    } else {
        selectedCards.push({ cardId, colId });
    }
    updateBulkActionsBar();
    renderBoard();
}

function updateBulkActionsBar() {
    const bar      = document.getElementById('bulk-actions-bar');
    const countEl  = document.getElementById('selected-count');

    if (selectedCards.length > 0) {
        bar.classList.remove('translate-y-20', 'opacity-0');
        countEl.innerText = selectedCards.length;
        if (typeof renderBulkDropdowns === 'function') renderBulkDropdowns();
    } else {
        bar.classList.add('translate-y-20', 'opacity-0');
    }
}

function renderBulkDropdowns() {
    const memContainer = document.getElementById('bulk-members-dropdown');
    const labContainer = document.getElementById('bulk-labels-dropdown');
    if (!memContainer || !labContainer) return;

    // Calculate states for members and labels
    const memberCounts = {};
    const labelCounts = {};
    const totalSelected = selectedCards.length;

    selectedCards.forEach(selection => {
        const col = boardData.find(c => c.id === selection.colId);
        if (col) {
            const card = col.cards.find(c => c.id === selection.cardId);
            if (card) {
                if (card.members) {
                    card.members.forEach(mId => {
                        memberCounts[mId] = (memberCounts[mId] || 0) + 1;
                    });
                }
                if (card.labels) {
                    card.labels.forEach(lId => {
                        labelCounts[lId] = (labelCounts[lId] || 0) + 1;
                    });
                }
            }
        }
    });

    const getCheckboxIcon = (count) => {
        if (count === 0 || !count) return '<i class="ph ph-square text-slate-400 text-lg"></i>';
        if (count === totalSelected) return '<i class="ph-fill ph-check-square text-blue-500 text-lg"></i>';
        return '<i class="ph-fill ph-minus-square text-blue-500 text-lg"></i>';
    };

    // Members
    let memHtml = '';
    if (settings.members && settings.members.length > 0) {
        settings.members.forEach(m => {
            const count = memberCounts[m.id] || 0;
            const checkbox = getCheckboxIcon(count);
            const colorClass = AVATAR_COLORS[m.colorName] || AVATAR_COLORS['slate'];
            
            memHtml += `
                <button onclick="bulkToggleMember('${m.id}')" class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition flex items-center justify-between gap-2 mb-0.5 group">
                    <div class="flex items-center gap-2 overflow-hidden">
                        <div class="w-6 h-6 rounded-full ${colorClass} flex items-center justify-center text-[9px] text-white font-bold shrink-0">${escapeHtml(m.initials || '?')}</div>
                        <span class="truncate">${escapeHtml(m.name)}</span>
                    </div>
                    <div class="flex-shrink-0 group-hover:opacity-80 transition">${checkbox}</div>
                </button>`;
        });
    } else {
        memHtml = '<div class="text-sm text-slate-500 px-3 py-2 text-center">Aucun membre</div>';
    }
    memContainer.innerHTML = memHtml;

    // Labels
    let labHtml = '';
    if (settings.labels && settings.labels.length > 0) {
        settings.labels.forEach(l => {
            const count = labelCounts[l.id] || 0;
            const checkbox = getCheckboxIcon(count);
            
            labHtml += `
                <button onclick="bulkToggleLabel('${l.id}')" class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition flex items-center justify-between gap-2 mb-0.5 group">
                    <div class="flex items-center gap-2 overflow-hidden">
                        <div class="w-3 h-3 rounded-full shrink-0 ${(LABEL_COLOR_CONFIG[l.colorName] || LABEL_COLOR_CONFIG['gray']).dot}"></div>
                        <span class="truncate">${escapeHtml(l.name)}</span>
                    </div>
                    <div class="flex-shrink-0 group-hover:opacity-80 transition">${checkbox}</div>
                </button>`;
        });
    } else {
        labHtml = '<div class="text-sm text-slate-500 px-3 py-2 text-center">Aucune étiquette</div>';
    }
    labContainer.innerHTML = labHtml;
}

function bulkToggleMember(memberId) {
    if (selectedCards.length === 0) return;
    
    let allHaveIt = true;
    const cardsToUpdate = [];
    
    selectedCards.forEach(selection => {
        const col = boardData.find(c => c.id === selection.colId);
        if (col) {
            const card = col.cards.find(c => c.id === selection.cardId);
            if (card) {
                cardsToUpdate.push(card);
                if (!card.members || !card.members.includes(memberId)) {
                    allHaveIt = false;
                }
            }
        }
    });

    cardsToUpdate.forEach(card => {
        if (!card.members) card.members = [];
        if (allHaveIt) {
            card.members = card.members.filter(id => id !== memberId);
        } else {
            if (!card.members.includes(memberId)) card.members.push(memberId);
        }
    });

    saveToSupabase();
    renderBoard();
    renderBulkDropdowns();
    showToast(allHaveIt ? 'Membre retiré' : 'Membre assigné', 'blue');
}

function bulkToggleLabel(labelId) {
    if (selectedCards.length === 0) return;
    
    let allHaveIt = true;
    const cardsToUpdate = [];
    
    selectedCards.forEach(selection => {
        const col = boardData.find(c => c.id === selection.colId);
        if (col) {
            const card = col.cards.find(c => c.id === selection.cardId);
            if (card) {
                cardsToUpdate.push(card);
                if (!card.labels || !card.labels.includes(labelId)) {
                    allHaveIt = false;
                }
            }
        }
    });

    cardsToUpdate.forEach(card => {
        if (!card.labels) card.labels = [];
        if (allHaveIt) {
            card.labels = card.labels.filter(id => id !== labelId);
        } else {
            if (!card.labels.includes(labelId)) card.labels.push(labelId);
        }
    });

    saveToSupabase();
    renderBoard();
    renderBulkDropdowns();
    showToast(allHaveIt ? 'Étiquette retirée' : 'Étiquette assignée', 'indigo');
}

function cancelSelection() {
    selectedCards = [];
    isSelectMode = false;
    updateBulkActionsBar();
    updateSelectModeUI();
    renderBoard();
}

function bulkDeleteCards() {
    if (selectedCards.length === 0) return;

    showConfirm(
        `Supprimer ${selectedCards.length} carte(s) ?`,
        'Cette action supprimera définitivement toutes les cartes sélectionnées.',
        () => {
            selectedCards.forEach(selection => {
                const col = boardData.find(c => c.id === selection.colId);
                if (col) {
                    col.cards = col.cards.filter(card => card.id !== selection.cardId);
                }
            });
            selectedCards = [];
            updateBulkActionsBar();
            saveToSupabase();
            renderBoard();
            showToast('Cartes supprimées', 'green');
        }
    );
}
