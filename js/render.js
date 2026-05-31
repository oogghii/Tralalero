/**
 * RENDER.JS
 * All DOM-rendering functions:
 *   - renderBoard           : full board re-render (columns + cards)
 *   - renderSettingsList    : labels & members in settings modal
 *   - renderModalSidebars   : labels & members in card-edit modal
 *   - renderHistoryUI       : recent boards in landing dropdown
 *   - renderFilterChips     : active filter chips in the header
 */

// --- Board -------------------------------------------------------------------

function renderBoard() {
    renderFilters();
    renderFilterChips();
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

    const boardEl         = document.getElementById('board');
    const addBtnContainer = document.getElementById('add-col-container');

    // Remove existing column elements before re-rendering
    boardEl.querySelectorAll('[data-col-id]').forEach(el => el.remove());

    // Accent colours available for columns
    const ACCENT_COLORS = [
        { color: '#ef4444', label: 'Rouge'    },
        { color: '#f97316', label: 'Orange'   },
        { color: '#eab308', label: 'Jaune'    },
        { color: '#22c55e', label: 'Vert'     },
        { color: '#14b8a6', label: 'Sarcelle' },
        { color: '#3b82f6', label: 'Bleu'     },
        { color: '#8b5cf6', label: 'Violet'   },
        { color: '#ec4899', label: 'Rose'     },
        { color: '#64748b', label: 'Gris'     },
        { color: '',        label: 'Aucune'   },
    ];

    boardData.forEach((col) => {
        const isCollapsed = collapsedCols.has(col.id);
        const colEl       = document.createElement('div');

        // Collapsed columns are narrower
        colEl.className = isCollapsed
            ? 'flex-shrink-0 w-14 flex flex-col transition-all duration-300'
            : 'flex-shrink-0 w-72 flex flex-col max-h-full transition-all duration-300';
        colEl.setAttribute('data-col-id', col.id);

        // Column accent top-border
        const accentBorder = col.accentColor
            ? `border-top: 3px solid ${col.accentColor};`
            : '';

        // Accent picker html
        const accentPickerHtml = ACCENT_COLORS.map(({ color, label }) => {
            const isActive = col.accentColor === color;
            const bg = color ? `background:${color}` : 'background:#e2e8f0';
            return `<button onclick="event.stopPropagation();setColumnAccent('${col.id}','${color}')"
                title="${label}"
                class="w-4 h-4 rounded-full flex-shrink-0 transition-transform hover:scale-125 ${isActive ? 'ring-2 ring-offset-1 ring-blue-500' : ''}"
                style="${bg}"></button>`;
        }).join('');

        // Card count badge
        const cardCount  = col.cards.length;
        const countBadge = `<span class="text-[10px] font-bold bg-black/10 text-slate-700 px-1.5 py-0.5 rounded-full ml-1 flex-shrink-0">${cardCount}</span>`;

        if (isCollapsed) {
            // Collapsed view: vertical column strip
            colEl.innerHTML = `
                <div class="bg-white/20 backdrop-blur-md rounded-xl shadow-lg border border-white/40 flex flex-col items-center py-3 gap-2 h-full cursor-pointer hover:bg-white/30 transition-all duration-300" style="${accentBorder}" onclick="toggleColCollapse('${col.id}')">
                    <i class="ph-bold ph-caret-right text-slate-500 text-xs"></i>
                    <div class="flex-1 flex items-center justify-center">
                        <span class="text-slate-700 font-bold text-xs" style="writing-mode:vertical-rl; text-orientation:mixed; transform:rotate(180deg); white-space:nowrap; max-height:160px; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(col.title)}</span>
                    </div>
                    <span class="text-[10px] font-bold bg-black/10 text-slate-600 px-1 py-0.5 rounded-full">${cardCount}</span>
                </div>
            `;
            boardEl.insertBefore(colEl, addBtnContainer);
            return; // skip card rendering for collapsed columns
        }

        colEl.innerHTML = `
            <div class="group bg-white/20 backdrop-blur-md rounded-xl shadow-lg flex flex-col max-h-full border border-white/40 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 overflow-hidden" style="${accentBorder}">
                <!-- Column header -->
                <div class="p-3 flex justify-between items-center gap-1 ${isSelectMode ? '' : 'cursor-grab active:cursor-grabbing'}">
                    <div class="flex items-center gap-1 flex-1 min-w-0">
                        <!-- Collapse toggle -->
                        <button onclick="event.stopPropagation();toggleColCollapse('${col.id}')"
                            class="text-slate-400 hover:text-slate-700 transition p-0.5 flex-shrink-0" title="Replier">
                            <i class="ph-bold ph-caret-down text-xs"></i>
                        </button>
                        <textarea
                            onblur="updateColumnTitle('${col.id}', this.value)"
                            onkeydown="if(event.key === 'Enter') { this.blur(); event.preventDefault(); }"
                            oninput="this.value = this.value.replace(/[\r\n]/g, ' ')"
                            class="bg-transparent font-bold text-slate-700 w-full resize-none h-7 overflow-hidden focus:bg-white focus:px-1 focus:ring-2 focus:ring-blue-500 rounded text-sm truncate leading-7 transition-colors"
                            rows="1"
                            ${isSelectMode ? 'disabled' : ''}
                        >${escapeHtml(col.title)}</textarea>
                        ${countBadge}
                    </div>
                    <div class="flex items-center gap-0.5 flex-shrink-0">
                        <!-- Quick-add from header -->
                        <button onclick="event.stopPropagation();showAddCardInput('${col.id}')"
                            class="text-slate-400 hover:text-blue-600 hover:bg-white/70 opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg ${isSelectMode ? 'hidden' : ''}"
                            title="Ajouter une carte">
                            <i class="ph-bold ph-plus text-sm"></i>
                        </button>
                        <!-- Column accent colour picker -->
                        <div class="relative ${isSelectMode ? 'hidden' : ''}">
                            <button onclick="event.stopPropagation();toggleDropdown('accent-picker-${col.id}')"
                                class="text-slate-400 hover:text-slate-700 hover:bg-white/70 opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg"
                                title="Couleur de liste">
                                <i class="ph ph-palette text-sm"></i>
                            </button>
                            <div id="accent-picker-${col.id}" class="hidden absolute top-full right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 p-2.5 z-50 min-w-max">
                                <p class="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Couleur de liste</p>
                                <div class="flex gap-1.5 flex-wrap">${accentPickerHtml}</div>
                            </div>
                        </div>
                        <!-- Delete column -->
                        <button onclick="deleteColumn('${col.id}')"
                            class="text-slate-400 hover:text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg flex-shrink-0 ${isSelectMode ? 'hidden' : ''}">
                            <i class="ph ph-trash text-lg"></i>
                        </button>
                    </div>
                </div>
                <!-- Cards container -->
                <div class="flex-1 overflow-y-auto p-3 pb-[60px] min-h-[100px] custom-scrollbar" id="cards-${col.id}"></div>
                <!-- Add card form (bottom) -->
                <div class="-mt-[56px] p-2 relative z-10 ${isSelectMode ? 'hidden' : ''}">
                    <div id="add-card-btn-${col.id}">
                        <button onclick="showAddCardInput('${col.id}')"
                            class="w-full text-left text-slate-600 hover:bg-white/60 hover:text-slate-900 p-2 rounded-lg transition flex items-center gap-2 text-sm font-medium">
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

        // --- Render Cards ----------------------------------------------------
        const cardsContainer  = colEl.querySelector(`#cards-${col.id}`);
        const filterTextLower = filterText.toLowerCase();
        let renderedCount     = 0;

        col.cards.forEach(card => {
            // Apply Filters
            if (filterTextLower && !card.content.toLowerCase().includes(filterTextLower) && !(card.description || '').toLowerCase().includes(filterTextLower)) return;
            if (filterMemberId && !(card.members || []).includes(filterMemberId)) return;
            if (filterLabelId  && !(card.labels  || []).includes(filterLabelId))  return;

            renderedCount++;
            const isSelected = selectedCards.some(s => s.cardId === card.id);
            const isNew      = card.id === lastNewCardId;
            const cardEl     = document.createElement('div');

            cardEl.className = [
                'group relative bg-white p-3 rounded-xl shadow-sm border border-slate-200',
                'mb-2 text-sm text-slate-700 select-none hover:-translate-y-1 hover:shadow-md hover:border-blue-200',
                'transition-all duration-200',
                isSelectMode ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing',
                isSelected   ? 'card-selected'  : '',
                isNew        ? 'animate-pop-in'  : '',
            ].join(' ');
            cardEl.setAttribute('data-card-id', card.id);
            cardEl.setAttribute('data-col-id',  col.id);
            cardEl.onclick = () => { if (isSelectMode) toggleCardSelection(card.id, col.id); };

            // Labels
            let labelsHtml = '';
            if (card.labels && card.labels.length > 0) {
                labelsHtml = '<div class="flex flex-wrap gap-1 mb-2">';
                card.labels.forEach(lId => {
                    const labelObj = (settings.labels || []).find(l => l.id === lId);
                    if (labelObj) {
                        const cc = LABEL_COLORS[labelObj.colorName] || LABEL_COLORS['slate'];
                        labelsHtml += `<span class="${cc} border px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide">${escapeHtml(labelObj.name)}</span>`;
                    }
                });
                labelsHtml += '</div>';
            }

            // Members
            let membersHtml = '';
            if (card.members && card.members.length > 0) {
                membersHtml = '<div class="flex -space-x-1.5 mt-2">';
                card.members.forEach(mId => {
                    const m = (settings.members || []).find(x => x.id === mId);
                    if (m) {
                        const cc = AVATAR_COLORS[m.colorName] || 'bg-slate-500';
                        membersHtml += `<div class="w-6 h-6 rounded-full ${cc} flex items-center justify-center text-[9px] text-white font-bold ring-2 ring-white" title="${escapeHtml(m.name)}">${escapeHtml(m.initials)}</div>`;
                    }
                });
                membersHtml += '</div>';
            }

            // Due date
            let dateHtml = '';
            if (card.dueDate) {
                const d          = new Date(card.dueDate);
                const isOverdue  = d < new Date();
                const cc         = isOverdue ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-500 border-slate-100';
                const dateString = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                const timeString = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                dateHtml = `<div class="flex items-center gap-1.5 px-2 py-0.5 rounded border ${cc} text-[10px] font-bold"><i class="ph ph-calendar-blank"></i> ${dateString}, ${timeString}</div>`;
            }

            // Checklist progress bar
            let checklistHtml = '';
            if (card.checklists && card.checklists.length > 0) {
                const total     = card.checklists.length;
                const completed = card.checklists.filter(c => c.completed).length;
                const pct       = Math.round((completed / total) * 100);
                const barColor  = completed === total ? 'bg-green-500' : 'bg-blue-500';
                const txtColor  = completed === total ? 'text-green-600' : 'text-slate-500';
                checklistHtml = `
                    <div class="mt-2">
                        <div class="flex items-center justify-between mb-0.5">
                            <span class="text-[10px] font-bold ${txtColor} flex items-center gap-1">
                                <i class="ph-bold ph-check-square-offset"></i> ${completed}/${total}
                            </span>
                            <span class="text-[10px] text-slate-400 font-medium">${pct}%</span>
                        </div>
                        <div class="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div class="h-full ${barColor} rounded-full transition-all duration-500" style="width:${pct}%"></div>
                        </div>
                    </div>`;
            }

            const descIndicator    = card.description ? '<i class="ph-bold ph-text-align-left text-slate-400" title="A une description"></i>' : '';
            const commentIndicator = (card.comments && card.comments.length > 0)
                ? `<div class="flex items-center gap-1 text-slate-400 text-xs font-bold"><i class="ph-fill ph-chat-circle"></i> ${card.comments.length}</div>`
                : '';
            const selectionCheckbox = isSelected ? '<div class="selection-checkbox"><i class="ph-bold ph-check"></i></div>' : '';

            let coverHtml = '';
            if (card.coverImage) {
                coverHtml = `<div class="-mt-3 -mx-3 mb-3 h-28 rounded-t-xl overflow-hidden bg-slate-100 border-b border-slate-200/50"><img src="${escapeHtml(card.coverImage)}" class="w-full h-full object-cover"></div>`;
            } else if (card.coverColor) {
                coverHtml = `<div class="-mt-3 -mx-3 mb-3 h-10 rounded-t-xl overflow-hidden border-b border-slate-200/50" style="background-color:${card.coverColor};"></div>`;
            }

            cardEl.innerHTML = `
                ${coverHtml}
                ${selectionCheckbox}
                ${labelsHtml}
                <div class="whitespace-pre-wrap break-words pr-6 font-medium text-slate-800">${escapeHtml(card.content)}</div>
                <div class="flex items-center justify-between mt-2">
                    <div class="flex items-center gap-2 flex-wrap">
                        ${dateHtml}
                        ${descIndicator}
                        ${commentIndicator}
                    </div>
                    ${membersHtml}
                </div>
                ${checklistHtml}
                <button onclick="event.stopPropagation(); openEditModal('${card.id}', '${col.id}')"
                    class="absolute top-2 right-2 text-slate-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 bg-white/80 rounded-full p-1 transition ${isSelectMode ? 'hidden' : ''}">
                    <i class="ph ph-pencil-simple"></i>
                </button>
            `;
            cardsContainer.appendChild(cardEl);
        });

        // Empty column state
        if (renderedCount === 0) {
            const isEmpty    = !filterTextLower && !filterMemberId && !filterLabelId;
            const emptyEl    = document.createElement('div');
            emptyEl.className = 'col-empty-state' + (isEmpty ? ' cursor-pointer' : '');
            if (isEmpty) emptyEl.onclick = () => showAddCardInput(col.id);
            emptyEl.innerHTML = isEmpty
                ? `<i class="ph ph-tray text-2xl mb-2 opacity-30"></i><p>Aucune carte ici...</p><p class="text-[10px] mt-0.5 opacity-60">Cliquez pour en ajouter une</p>`
                : `<i class="ph ph-funnel-x text-2xl mb-2 opacity-30"></i><p>Aucun résultat</p>`;
            cardsContainer.appendChild(emptyEl);
        }
    });

    // Clear pop-in marker after one render cycle
    if (lastNewCardId) setTimeout(() => { lastNewCardId = null; }, 700);

    if (typeof initSortable === 'function') initSortable();
}

// --- Column helpers ----------------------------------------------------------

function toggleColCollapse(colId) {
    if (collapsedCols.has(colId)) {
        collapsedCols.delete(colId);
    } else {
        collapsedCols.add(colId);
    }
    renderBoard();
}

function setColumnAccent(colId, color) {
    const col = boardData.find(c => c.id === colId);
    if (!col) return;
    col.accentColor = color || null;
    // Close the picker dropdown
    const picker = document.getElementById(`accent-picker-${colId}`);
    if (picker) picker.classList.add('hidden');
    saveToSupabase();
    renderBoard();
}

// --- Settings Modal & Filters ------------------------------------------------

function renderFilters() {
    const memberDropdown = document.getElementById('member-dropdown');
    const labelDropdown  = document.getElementById('label-dropdown');
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
            <div class="w-3 h-3 rounded-full flex-shrink-0 ${(LABEL_COLOR_CONFIG[l.colorName] || LABEL_COLOR_CONFIG['slate']).dot}"></div>
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

// --- Active filter chips -----------------------------------------------------

function renderFilterChips() {
    const container = document.getElementById('active-filter-chips');
    if (!container) return;

    const chips = [];

    if (filterMemberId) {
        const m = (settings.members || []).find(x => x.id === filterMemberId);
        if (m) {
            const cc = AVATAR_COLORS[m.colorName] || 'bg-slate-500';
            chips.push(`
                <div class="filter-chip">
                    <div class="w-4 h-4 rounded-full ${cc} flex items-center justify-center text-[8px] text-white font-bold flex-shrink-0">${escapeHtml(m.initials || '?')}</div>
                    <span>${escapeHtml(m.name)}</span>
                    <button onclick="selectFilter('member','')" title="Retirer le filtre"><i class="ph-bold ph-x text-[10px]"></i></button>
                </div>`);
        }
    }

    if (filterLabelId) {
        const l = (settings.labels || []).find(x => x.id === filterLabelId);
        if (l) {
            const dot = (LABEL_COLOR_CONFIG[l.colorName] || LABEL_COLOR_CONFIG['slate']).dot;
            chips.push(`
                <div class="filter-chip">
                    <div class="w-2.5 h-2.5 rounded-full ${dot} flex-shrink-0"></div>
                    <span>${escapeHtml(l.name)}</span>
                    <button onclick="selectFilter('label','')" title="Retirer le filtre"><i class="ph-bold ph-x text-[10px]"></i></button>
                </div>`);
        }
    }

    if (filterText) {
        chips.push(`
            <div class="filter-chip">
                <i class="ph ph-magnifying-glass text-[11px]"></i>
                <span>"${escapeHtml(filterText)}"</span>
                <button onclick="document.getElementById('search-filter').value='';filterText='';renderBoard();" title="Effacer"><i class="ph-bold ph-x text-[10px]"></i></button>
            </div>`);
    }

    container.innerHTML = chips.join('');
    container.classList.toggle('hidden', chips.length === 0);
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

    // -- LABELS ---------------------------------------------------------------

    const labels      = settings.labels || [];
    const labelListEl = document.getElementById('settings-labels-list');

    labelListEl.innerHTML = labels.length === 0
        ? `<p class="si-empty">Aucune étiquette — créez-en une ci-dessous !</p>`
        : labels.map(l => {
            const cfg        = LABEL_COLOR_CONFIG[l.colorName] || LABEL_COLOR_CONFIG['slate'];
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

    // -- MEMBERS --------------------------------------------------------------

    const members      = settings.members || [];
    const memberListEl = document.getElementById('settings-members-list');

    memberListEl.innerHTML = members.length === 0
        ? `<p class="si-empty">Aucun membre — ajoutez-en un ci-dessous !</p>`
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
                                oninput="this.value=this.value.toUpperCase().replace(/[^A-ZÀ-Ö0-9]/gi,'').slice(0,2)"
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

// --- Card Edit Modal Sidebars ------------------------------------------------

function renderModalSidebars() {
    // Labels
    document.getElementById('modal-labels-container').innerHTML = (settings.labels || []).map(label => {
        const isSelected = tempLabels.includes(label.id);
        const colorClass = LABEL_COLORS[label.colorName] || LABEL_COLORS['slate'];
        return `<button onclick="toggleLabel('${label.id}')"
            class="h-7 px-2.5 rounded text-xs font-bold transition flex items-center gap-2 border ${colorClass}
                   ${isSelected ? 'ring-2 ring-offset-1 ring-blue-400 opacity-100' : 'opacity-60 hover:opacity-100'}">
             ${isSelected ? '<i class="ph-bold ph-check"></i>' : ''} ${escapeHtml(label.name)}
        </button>`;
    }).join('');

    // Members
    document.getElementById('modal-members-container').innerHTML = (settings.members || []).map(mem => {
        const isSelected = tempMembers.includes(mem.id);
        const colorClass = AVATAR_COLORS[mem.colorName] || 'bg-slate-500';
        return `<button onclick="toggleMember('${mem.id}')"
            class="w-full flex items-center gap-3 p-1.5 rounded-lg transition ${isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100 text-slate-600'}">
            <div class="w-6 h-6 rounded-full ${colorClass} flex items-center justify-center text-[10px] text-white font-bold">${escapeHtml(mem.initials || '?')}</div>
            <span class="text-sm font-medium flex-1 text-left">${escapeHtml(mem.name)}</span>
            ${isSelected ? '<i class="ph-bold ph-check text-blue-600"></i>' : ''}
        </button>`;
    }).join('');
}

// --- Landing History ---------------------------------------------------------

function renderHistoryUI() {
    const history            = JSON.parse(localStorage.getItem('tralalero_history') || '[]');
    const container          = document.getElementById('history-container');
    const listItemsContainer = document.getElementById('history-list-items');

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

// --- Chat -------------------------------------------------------------------

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
                    <div class="font-bold text-xs text-slate-700">${escapeHtml(author.name)}</div>
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
