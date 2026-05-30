/**
 * RENDER.JS
 * All DOM-rendering functions:
 *   - renderBoard           : full board re-render (columns + cards)
 *   - renderSettingsList    : labels & members in settings modal
 *   - renderModalSidebars   : labels & members in card-edit modal
 *   - renderHistoryUI       : recent boards in landing dropdown
 */

// â”€â”€â”€ Board â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function renderBoard() {
    renderFilters();
    if (typeof updateChatBadge === 'function') updateChatBadge();
    if (typeof isChatOpen !== 'undefined' && isChatOpen) {
        if (typeof renderChat === 'function') renderChat();
    }

    // Sync board title input (only if not focused)
    const titleInput   = document.getElementById('board-title-input');
    const currentTitle = settings.boardTitle || 'Projet Sans Titre';
    if (document.activeElement !== titleInput) {
        titleInput.value = currentTitle;
        document.title   = `${currentTitle} - Tralalero`;
    }

    const boardEl       = document.getElementById('board');
    const addBtnContainer = document.getElementById('add-col-container');

    // Remove existing column elements before re-rendering
    boardEl.querySelectorAll('[data-col-id]').forEach(el => el.remove());

    boardData.forEach((col) => {
        const colEl = document.createElement('div');
        colEl.className = 'flex-shrink-0 w-72 flex flex-col max-h-full transition-transform duration-200';
        colEl.setAttribute('data-col-id', col.id);

        // Drag & Drop â€” columns

        colEl.innerHTML = `
            <div class="group bg-white/20 backdrop-blur-md rounded-xl shadow-lg flex flex-col max-h-full border border-white/40 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
                <div class="p-3 flex justify-between items-start gap-2 ${isSelectMode ? '' : 'cursor-grab active:cursor-grabbing'}">
                    <textarea
                        onblur="updateColumnTitle('${col.id}', this.value)"
                        onkeydown="if(event.key === 'Enter') { this.blur(); event.preventDefault(); }"
                        oninput="this.value = this.value.replace(/[\r\n]/g, ' ')"
                        class="bg-transparent font-bold text-slate-700 w-full resize-none h-7 overflow-hidden focus:bg-white focus:px-1 focus:ring-2 focus:ring-blue-500 rounded text-sm truncate leading-7 transition-colors"
                        rows="1"
                        ${isSelectMode ? 'disabled' : ''}
                    >${escapeHtml(col.title)}</textarea>
                    <button onclick="deleteColumn('${col.id}')" class="text-slate-500 hover:text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg flex-shrink-0 ${isSelectMode ? 'hidden' : ''}">
                        <i class="ph ph-trash text-lg"></i>
                    </button>
                </div>
                <div class="flex-1 overflow-y-auto p-3 pb-[60px] min-h-[100px] custom-scrollbar" id="cards-${col.id}"></div>
                <div class="-mt-[56px] p-2 relative z-10 ${isSelectMode ? 'hidden' : ''}">
                    <div id="add-card-btn-${col.id}">
                        <button onclick="showAddCardInput('${col.id}')" class="w-full text-left text-slate-600 hover:bg-white/60 hover:text-slate-900 p-2 rounded-lg transition flex items-center gap-2 text-sm font-medium">
                            <i class="ph ph-plus"></i> Ajouter une carte
                        </button>
                    </div>
                    <div id="add-card-form-${col.id}" class="hidden">
                        <textarea id="input-card-${col.id}"
                            class="w-full p-2 rounded shadow-sm border border-slate-300 mb-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                            placeholder="Titre de la carte..." rows="2"></textarea>
                        <div class="flex items-center gap-2">
                            <button onclick="addCard('${col.id}')" class="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700">Ajouter</button>
                            <button onclick="hideAddCardInput('${col.id}')" class="text-slate-500 hover:text-slate-700 p-1"><i class="ph ph-x text-lg"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        boardEl.insertBefore(colEl, addBtnContainer);

        // ─── Render Cards ────────────────────────────────────────────────────────────────
        const cardsContainer = colEl.querySelector(`#cards-${col.id}`);

        const filterTextLower = filterText.toLowerCase();

        col.cards.forEach(card => {
            // Apply Filters
            if (filterTextLower && !card.content.toLowerCase().includes(filterTextLower) && !(card.description || '').toLowerCase().includes(filterTextLower)) {
                return;
            }
            if (filterMemberId && !(card.members || []).includes(filterMemberId)) {
                return;
            }
            if (filterLabelId && !(card.labels || []).includes(filterLabelId)) {
                return;
            }

            const isSelected = selectedCards.some(s => s.cardId === card.id);
            const cardEl     = document.createElement('div');

            cardEl.className = [
                'group relative bg-white p-3 rounded-xl shadow-sm border border-slate-200',
                'mb-2 transition-shadow transition-colors duration-300 text-sm text-slate-700 select-none hover:-translate-y-1 hover:shadow-md hover:border-blue-200',
                isSelectMode ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing',
                isSelected   ? 'card-selected'  : ''
            ].join(' ');
            cardEl.setAttribute('data-card-id', card.id);
            cardEl.setAttribute('data-col-id',  col.id);

            cardEl.onclick = () => {
                if (isSelectMode) toggleCardSelection(card.id, col.id);
            };

            // Labels HTML
            let labelsHtml = '';
            if (card.labels && card.labels.length > 0) {
                labelsHtml = '<div class="flex flex-wrap gap-1 mb-2">';
                card.labels.forEach(lId => {
                    const labelObj = (settings.labels || []).find(l => l.id === lId);
                    if (labelObj) {
                        const colorClass = LABEL_COLORS[labelObj.colorName] || LABEL_COLORS['gray'];
                        labelsHtml += `<span class="${colorClass} border px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide">${labelObj.name}</span>`;
                    }
                });
                labelsHtml += '</div>';
            }

            // Members HTML
            let membersHtml = '';
            if (card.members && card.members.length > 0) {
                membersHtml = '<div class="flex -space-x-1.5 mt-2">';
                card.members.forEach(mId => {
                    const memObj = (settings.members || []).find(m => m.id === mId);
                    if (memObj) {
                        const colorClass = AVATAR_COLORS[memObj.colorName] || AVATAR_COLORS['slate'];
                        membersHtml += `<div class="w-6 h-6 rounded-full ${colorClass} flex items-center justify-center text-[9px] text-white font-bold ring-2 ring-white" title="${memObj.name}">${memObj.initials}</div>`;
                    }
                });
                membersHtml += '</div>';
            }

            // Due date badge
            let dateHtml = '';
            if (card.dueDate) {
                const dateObj    = new Date(card.dueDate);
                const isOverdue  = dateObj < new Date();
                const dateString = dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                const timeString = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                const colorClass = isOverdue
                    ? 'bg-red-50 text-red-600 border-red-100'
                    : 'bg-slate-50 text-slate-500 border-slate-100';
                dateHtml = `
                    <div class="flex items-center gap-1.5 px-2 py-0.5 rounded border ${colorClass} text-[10px] font-bold">
                        <i class="ph ph-calendar-blank"></i> ${dateString}, ${timeString}
                    </div>`;
            }

            // Checklist indicator
            let checklistHtml = '';
            if (card.checklists && card.checklists.length > 0) {
                const total = card.checklists.length;
                const completed = card.checklists.filter(c => c.completed).length;
                const colorClass = completed === total ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-50 text-slate-500 border-slate-100';
                checklistHtml = `
                    <div class="flex items-center gap-1.5 px-2 py-0.5 rounded border ${colorClass} text-[10px] font-bold" title="Sous-tâches">
                        <i class="ph-bold ph-check-square-offset"></i> ${completed}/${total}
                    </div>`;
            }

            const descIndicator    = card.description
                ? '<i class="ph-bold ph-text-align-left text-slate-400" title="A une description"></i>'
                : '';
            
            const commentIndicator = (card.comments && card.comments.length > 0)
                ? `<div class="flex items-center gap-1 text-slate-400 text-xs font-bold" title="Commentaires"><i class="ph-fill ph-chat-circle"></i> ${card.comments.length}</div>`
                : '';

            const selectionCheckbox = isSelected
                ? '<div class="selection-checkbox"><i class="ph-bold ph-check"></i></div>'
                : '';

            let coverHtml = '';
            if (card.coverImage) {
                coverHtml = `<div class="-mt-3 -mx-3 mb-3 h-28 rounded-t-xl overflow-hidden bg-slate-100 border-b border-slate-200/50"><img src="${escapeHtml(card.coverImage)}" class="w-full h-full object-cover"></div>`;
            } else if (card.coverColor) {
                let bgClass = '';
                let styleAttr = `style="background-color: ${card.coverColor};"`;
                coverHtml = `<div class="-mt-3 -mx-3 mb-3 h-10 rounded-t-xl overflow-hidden ${bgClass} border-b border-slate-200/50" ${styleAttr}></div>`;
            }

            cardEl.innerHTML = `
                ${coverHtml}
                ${selectionCheckbox}
                ${labelsHtml}
                <div class="whitespace-pre-wrap break-words pr-6 font-medium text-slate-800">${escapeHtml(card.content)}</div>
                <div class="flex items-center justify-between mt-2">
                    <div class="flex items-center gap-2 flex-wrap">
                        ${dateHtml}
                        ${checklistHtml}
                        ${descIndicator}
                        ${commentIndicator}
                    </div>
                    ${membersHtml}
                </div>
                <button onclick="event.stopPropagation(); openEditModal('${card.id}', '${col.id}')"
                    class="absolute top-2 right-2 text-slate-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 bg-white/80 rounded-full p-1 transition ${isSelectMode ? 'hidden' : ''}">
                    <i class="ph ph-pencil-simple"></i>
                </button>
            `;
            cardsContainer.appendChild(cardEl);
        });
    });

    if (typeof initSortable === 'function') {
        initSortable();
    }
}

// ─── Settings Modal & Filters ─────────────────────────────────────────────────

function renderFilters() {
    const memberDropdown = document.getElementById('member-dropdown');
    const labelDropdown = document.getElementById('label-dropdown');
    if (!memberDropdown || !labelDropdown) return;

    let memberHtml = `<button class="w-full text-left px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition flex items-center justify-between" onclick="selectFilter('member', '')">
        <span>Tous les membres</span>
        ${!filterMemberId ? '<i class="ph-bold ph-check text-blue-500"></i>' : ''}
    </button>`;
    memberHtml += (settings.members || []).map(m => {
        const isSelected = filterMemberId === m.id;
        return `<button class="w-full text-left px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition flex items-center gap-2" onclick="selectFilter('member', '${m.id}')">
            <div class="w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold text-white flex-shrink-0 ${AVATAR_COLORS[m.colorName] || 'bg-slate-500'}">${escapeHtml(m.initials || '?')}</div>
            <span class="truncate flex-1">${escapeHtml(m.name)}</span>
            ${isSelected ? '<i class="ph-bold ph-check text-blue-500 ml-auto"></i>' : ''}
        </button>`;
    }).join('');
    memberDropdown.innerHTML = memberHtml;

    let labelHtml = `<button class="w-full text-left px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition flex items-center justify-between" onclick="selectFilter('label', '')">
        <span>Toutes les étiquettes</span>
        ${!filterLabelId ? '<i class="ph-bold ph-check text-blue-500"></i>' : ''}
    </button>`;
    labelHtml += (settings.labels || []).map(l => {
        const isSelected = filterLabelId === l.id;
        return `<button class="w-full text-left px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition flex items-center gap-2" onclick="selectFilter('label', '${l.id}')">
            <div class="w-3 h-3 rounded-full flex-shrink-0 ${(LABEL_COLOR_CONFIG[l.colorName] || LABEL_COLOR_CONFIG['gray']).dot}"></div>
            <span class="truncate flex-1">${escapeHtml(l.name)}</span>
            ${isSelected ? '<i class="ph-bold ph-check text-blue-500 ml-auto"></i>' : ''}
        </button>`;
    }).join('');
    labelDropdown.innerHTML = labelHtml;

    // Ensure selected text defaults back if an item was deleted from settings
    if (filterMemberId && !(settings.members || []).find(m => m.id === filterMemberId)) {
        filterMemberId = '';
        document.getElementById('member-filter-text').innerText = 'Tous les membres';
    }
    if (filterLabelId && !(settings.labels || []).find(l => l.id === filterLabelId)) {
        filterLabelId = '';
        document.getElementById('label-filter-text').innerText = 'Toutes les étiquettes';
    }


}

/** Count how many cards on the board use a given label ID. */
function countLabelUsage(labelId) {
    let count = 0;
    boardData.forEach(col => col.cards.forEach(card => {
        if ((card.labels || []).includes(labelId)) count++;
    }));
    return count;
}

/** Count how many cards on the board have a given member ID assigned. */
function countMemberUsage(memberId) {
    let count = 0;
    boardData.forEach(col => col.cards.forEach(card => {
        if ((card.members || []).includes(memberId)) count++;
    }));
    return count;
}



function renderSettingsList() {

    // â”€â”€ LABELS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const labels      = settings.labels || [];
    const labelListEl = document.getElementById('settings-labels-list');

    labelListEl.innerHTML = labels.length === 0
        ? `<p class="si-empty">Aucune Ã©tiquette â€” crÃ©ez-en une ci-dessous !</p>`
        : labels.map(l => {
            const cfg        = LABEL_COLOR_CONFIG[l.colorName] || LABEL_COLOR_CONFIG['gray'];
            const count      = countLabelUsage(l.id);
            const pickerOpen = openLabelPickerId === l.id;
            const renaming   = renamingLabelId   === l.id;

            const nameHtml = renaming
                ? `<input id="rename-label-${l.id}" type="text"
                       value="${l.name.replace(/"/g, '&quot;')}"
                       maxlength="40"
                       class="si-rename-input"
                       placeholder="Nom..."
                       onkeydown="if(event.key==='Enter'){event.preventDefault();confirmRenameLabel('${l.id}');}if(event.key==='Escape')cancelRenameLabel();"
                       onblur="confirmRenameLabel('${l.id}')">`
                : `<span class="si-badge ${cfg.classes}">${escapeHtml(l.name)}</span>`;

            const pickerHtml = pickerOpen ? `
                <div class="si-panel">
                    <p class="si-panel-label">Couleur</p>
                    <div class="si-swatches">
                        ${Object.entries(LABEL_COLOR_CONFIG).map(([key, c]) => `
                            <button type="button" title="${c.name}" onclick="changeLabelColor('${l.id}','${key}')"
                                class="si-swatch ${c.dot} ${l.colorName === key ? 'si-swatch--active' : ''}">
                            </button>`).join('')}
                    </div>
                </div>` : '';

            return `
            <div class="si-card ${pickerOpen ? 'si-card--open' : ''}">
                <div class="si-row">
                    <button class="si-dot ${cfg.dot} ${pickerOpen ? 'si-dot--active' : ''}"
                            onclick="toggleLabelColorPicker('${l.id}')"
                            title="Changer la couleur">
                    </button>
                    ${nameHtml}
                    <span class="si-count">${count}</span>
                    <button class="si-btn ${renaming ? 'si-btn--active' : ''}"
                            onclick="${renaming ? `cancelRenameLabel()` : `startRenameLabel('${l.id}')`}"
                            title="${renaming ? 'Annuler' : 'Renommer'}">
                        <i class="ph ${renaming ? 'ph-x' : 'ph-pencil-simple'}"></i>
                    </button>
                    <button class="si-btn si-btn--danger" onclick="removeLabel('${l.id}')" title="Supprimer">
                        <i class="ph ph-trash"></i>
                    </button>
                </div>
                ${pickerHtml}
            </div>`;
        }).join('');

    // New-label colour picker
    const selectedLabelColor = document.getElementById('selected-label-color').value;
    document.getElementById('label-color-picker').innerHTML =
        Object.entries(LABEL_COLOR_CONFIG).map(([key, cfg]) => `
            <button type="button" title="${cfg.name}" onclick="selectLabelColor('${key}')"
                class="si-swatch ${cfg.dot} ${selectedLabelColor === key ? 'si-swatch--active' : ''}">
            </button>`).join('');

    // â”€â”€ MEMBERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const members      = settings.members || [];
    const memberListEl = document.getElementById('settings-members-list');

    memberListEl.innerHTML = members.length === 0
        ? `<p class="si-empty">Aucun membre â€” ajoutez-en un ci-dessous !</p>`
        : members.map(m => {
            const cfg        = AVATAR_COLOR_CONFIG[m.colorName] || AVATAR_COLOR_CONFIG['slate'];
            const count      = countMemberUsage(m.id);
            const panelOpen  = openMemberPanelId === m.id;
            const renaming   = renamingMemberId  === m.id;

            const nameHtml = renaming
                ? `<input id="rename-member-${m.id}" type="text"
                       value="${m.name.replace(/"/g, '&quot;')}"
                       maxlength="40"
                       class="si-rename-input"
                       placeholder="Nom..."
                       onkeydown="if(event.key==='Enter'||event.key==='Escape'){event.preventDefault();closeMemberEdit('${m.id}');}">`
                : `<span class="si-name">${escapeHtml(m.name)}</span>`;

            const panelHtml = panelOpen ? `
                <div class="si-panel">
                    <div class="si-panel-grid">
                        <div>
                            <p class="si-panel-label">Initiales</p>
                            <input id="initials-${m.id}" type="text"
                                value="${escapeHtml(m.initials || '')}"
                                maxlength="2"
                                class="si-initials-input ${cfg.bg}"
                                placeholder="AB"
                                onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur();}"
                                oninput="this.value=this.value.toUpperCase().replace(/[^A-ZÃ€-Ã–0-9]/gi,'').slice(0,2)"
                                onblur="saveMemberInitials('${m.id}')">
                        </div>
                        <div>
                            <p class="si-panel-label">Couleur</p>
                            <div class="si-swatches">
                                ${Object.entries(AVATAR_COLOR_CONFIG).map(([key, c]) => `
                                    <button type="button" title="${c.name}" onclick="changeMemberColor('${m.id}','${key}')"
                                        class="si-swatch ${c.bg} ${m.colorName === key ? 'si-swatch--active' : ''}">
                                    </button>`).join('')}
                            </div>
                        </div>
                    </div>
                </div>` : '';

            return `
            <div class="si-card ${panelOpen ? 'si-card--open' : ''}">
                <div class="si-row">
                    <button id="avatar-btn-${m.id}"
                            class="si-avatar ${cfg.bg} ${panelOpen ? 'si-avatar--active' : ''}"
                            onclick="toggleMemberEdit('${m.id}')"
                            title="Modifier la couleur et les initiales">
                        ${escapeHtml(m.initials || '?')}
                    </button>
                    ${nameHtml}
                    <span class="si-count">${count}</span>
                    <button class="si-btn ${renaming ? 'si-btn--active !bg-blue-100 !text-blue-600' : ''}"
                            onmousedown="${renaming ? `event.preventDefault();closeMemberEdit('${m.id}')` : `toggleMemberEdit('${m.id}')`}"
                            title="${renaming ? 'Valider' : 'Modifier'}">
                        <i class="ph ${renaming ? 'ph-check' : 'ph-pencil-simple'} text-lg"></i>
                    </button>
                    <button class="si-btn si-btn--danger" onclick="removeMember('${m.id}')" title="Supprimer">
                        <i class="ph ph-trash"></i>
                    </button>
                </div>
                ${panelHtml}
            </div>`;
        }).join('');
}




// â”€â”€â”€ Card Edit Modal Sidebars â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function renderModalSidebars() {
    // Labels
    document.getElementById('modal-labels-container').innerHTML = (settings.labels || []).map(label => {
        const isSelected = tempLabels.includes(label.id);
        const colorClass = LABEL_COLORS[label.colorName] || LABEL_COLORS['gray'];
        return `<button onclick="toggleLabel('${label.id}')"
            class="h-7 px-2.5 rounded text-xs font-bold transition flex items-center gap-2 border ${colorClass}
                   ${isSelected ? 'ring-2 ring-offset-1 ring-blue-400 opacity-100' : 'opacity-60 hover:opacity-100'}">
             ${isSelected ? '<i class="ph-bold ph-check"></i>' : ''} ${escapeHtml(label.name)}
        </button>`;
    }).join('');

    // Members
    document.getElementById('modal-members-container').innerHTML = (settings.members || []).map(mem => {
        const isSelected = tempMembers.includes(mem.id);
        const colorClass = AVATAR_COLORS[mem.colorName] || AVATAR_COLORS['slate'];
        return `<button onclick="toggleMember('${mem.id}')"
            class="w-full flex items-center gap-3 p-1.5 rounded-lg transition ${isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100 text-slate-600'}">
            <div class="w-6 h-6 rounded-full ${colorClass} flex items-center justify-center text-[10px] text-white font-bold">${escapeHtml(mem.initials || '?')}</div>
            <span class="text-sm font-medium flex-1 text-left">${escapeHtml(mem.name)}</span>
            ${isSelected ? '<i class="ph-bold ph-check text-blue-600"></i>' : ''}
        </button>`;
    }).join('');
}

// â”€â”€â”€ Landing History â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function renderHistoryUI() {
    const history              = JSON.parse(localStorage.getItem('tralalero_history') || '[]');
    const container            = document.getElementById('history-container');
    const listItemsContainer   = document.getElementById('history-list-items');

    if (!container || !listItemsContainer) return;

    if (history.length === 0) {
        container.classList.add('hidden');
        return;
    }

    container.classList.remove('hidden');
    listItemsContainer.innerHTML = '';

    history.forEach(item => {
        const displayTitle = item.title ? item.title : `Code : ${item.id}`;
        const el = document.createElement('button');
        el.className = 'w-full text-left px-3 py-3 rounded-xl text-slate-700 hover:bg-slate-50 transition flex items-center gap-3 group mb-1';
        el.onclick   = () => selectHistoryItem(item.id);
        el.innerHTML = `
            <div class="w-8 h-8 rounded-full border border-slate-200 bg-white overflow-hidden shrink-0 flex items-center justify-center p-0.5 shadow-sm">
                <img src="logo.png" alt="Logo" class="w-full h-full object-cover rounded-full">
            </div>
            <div class="flex-1 min-w-0">
                <div class="font-bold text-sm text-slate-800 truncate">${escapeHtml(displayTitle)}</div>
                <div class="text-[10px] text-slate-400 font-mono tracking-wider">CODE : ${escapeHtml(item.id)} • ${escapeHtml(item.date)}</div>
            </div>
            <i class="ph-bold ph-arrow-right opacity-0 -translate-x-2 text-indigo-400 group-hover:opacity-100 group-hover:translate-x-0 transition shrink-0"></i>
        `;
        listItemsContainer.appendChild(el);
    });
}

// ─── Chat ───────────────────────────────────────────────────────────────────

function renderChat() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    
    if (!settings.chat || settings.chat.length === 0) {
        container.innerHTML = `
            <div class="text-center text-xs font-medium text-slate-400 my-auto">
                <i class="ph ph-chat-centered-text text-3xl mb-2 opacity-50"></i><br>
                Aucun message pour le moment.
            </div>
        `;
        return;
    }
    
    let html = '';
    let prevAuthorId = null;
    let prevClientId = null;
    const currentClientId = localStorage.getItem('tralalero_client_id');
    
    settings.chat.forEach(msg => {
        const isSameAuthor = msg.clientId ? (msg.clientId === prevClientId) : (msg.authorId === prevAuthorId);
        const author = msg.authorId === 'anonymous' ? null : (settings.members || []).find(m => m.id === msg.authorId);
        
        let isMyMessage = false;
        if (msg.clientId) {
            isMyMessage = msg.clientId === currentClientId;
        } else {
            isMyMessage = (msg.authorId === (typeof getCurrentIdentity === 'function' ? getCurrentIdentity() : null) && msg.authorId !== 'anonymous');
        }
        
        let headerHtml = '';
        if (!isSameAuthor) {
            let authorHtml;
            if (author) {
                authorHtml = `
                    <div class="w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold text-white flex-shrink-0 ${AVATAR_COLORS[author.colorName] || 'bg-slate-500'}">
                        ${author.initials || '?'}
                    </div>
                    <div class="font-bold text-xs text-slate-700">${author.name}</div>
                `;
            } else {
                authorHtml = `
                    <div class="w-6 h-6 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 flex-shrink-0">
                        <i class="ph-fill ph-user text-xs"></i>
                    </div>
                    <div class="font-bold text-xs text-slate-500">Anonyme</div>
                `;
            }
            headerHtml = `
                <div class="flex items-center gap-2 ${isMyMessage ? 'flex-row-reverse' : ''} mb-1">
                    ${authorHtml}
                    <div class="text-[9px] text-slate-400 uppercase font-medium tracking-wider">${new Date(msg.timestamp).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
            `;
        }
        
        html += `
            <div class="flex flex-col ${isMyMessage ? 'items-end' : 'items-start'} ${isSameAuthor ? 'mt-1' : 'mt-4'} animate-pop-in">
                ${headerHtml}
                <div class="px-3 py-2 text-sm rounded-2xl max-w-[85%] break-words shadow-sm ${isMyMessage ? 'bg-green-500 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'}">
                    ${escapeHtml(msg.text).replace(/\n/g, '<br>')}
                </div>
            </div>
        `;
        
        prevAuthorId = msg.authorId;
        prevClientId = msg.clientId;
    });
    
    container.innerHTML = html;
    
    // Auto-scroll to bottom when new messages are rendered
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 50);
}




