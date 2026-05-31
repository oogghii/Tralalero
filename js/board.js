/**
 * BOARD.JS
 * Column and card CRUD operations, plus the board title update.
 * All mutations call saveToSupabase() and renderBoard() as needed.
 */

// ─── Board Title ──────────────────────────────────────────────────────────────

function updateBoardTitle(val) {
    const cleanVal = val.trim();
    if (cleanVal && settings.boardTitle !== cleanVal) {
        settings.boardTitle = cleanVal;
        document.title = `${cleanVal} - Tralalero`;
        saveToSupabase();
        addToHistory(currentBoardId);
    } else if (!cleanVal) {
        // Revert to last saved title if left empty
        document.getElementById('board-title-input').value = settings.boardTitle || 'Projet Sans Titre';
    }
}

// ─── Filters ──────────────────────────────────────────────────────────────────

let _filterDebounce = null;
function updateFilters() {
    const searchEl = document.getElementById('search-filter');
    if (searchEl) filterText = searchEl.value;
    clearTimeout(_filterDebounce);
    _filterDebounce = setTimeout(() => renderBoard(), 150);
}

let currentDropdown = null;

function toggleDropdown(id) {
    const el = document.getElementById(id);
    if (!el) return;
    
    if (el.classList.contains('hidden')) {
        if (currentDropdown) currentDropdown.classList.add('hidden');
        el.classList.remove('hidden');
        currentDropdown = el;
    } else {
        el.classList.add('hidden');
        currentDropdown = null;
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (currentDropdown) {
        // Ignore clicks on elements that were just removed from the DOM (e.g., during re-render)
        if (!document.body.contains(e.target)) return;

        const wrapper = currentDropdown.parentElement;
        if (wrapper && !wrapper.contains(e.target)) {
            currentDropdown.classList.add('hidden');
            currentDropdown = null;
        }
    }
});

function selectFilter(type, id) {
    if (type === 'member') {
        filterMemberId = id;
        let name = 'Tous les membres';
        if (id) {
            const m = (settings.members || []).find(x => x.id === id);
            if (m) name = m.name;
        }
        document.getElementById('member-filter-text').innerText = name;
        document.getElementById('member-dropdown').classList.add('hidden');
    } else if (type === 'label') {
        filterLabelId = id;
        let name = 'Toutes les étiquettes';
        if (id) {
            const l = (settings.labels || []).find(x => x.id === id);
            if (l) name = l.name;
        }
        document.getElementById('label-filter-text').innerText = name;
        document.getElementById('label-dropdown').classList.add('hidden');
    }
    currentDropdown = null;
    renderBoard();
}

// ─── Columns ──────────────────────────────────────────────────────────────────

function showAddColumnInput(btn) {
    btn.classList.add('hidden');
    document.getElementById('add-col-form').classList.remove('hidden');
    document.getElementById('new-col-title').focus();
}

function hideAddColumnInput() {
    document.getElementById('add-col-form').classList.add('hidden');
    document.getElementById('add-col-btn').classList.remove('hidden');
    document.getElementById('new-col-title').value = '';
}

function createColumn() {
    const title = document.getElementById('new-col-title').value.trim();
    if (!title) return;
    boardData.push({ id: 'col-' + generateId(), title, cards: [] });
    if (typeof logBoardActivity === 'function') logBoardActivity(`a ajouté la liste "${title}"`);
    renderBoard();
    saveToSupabase();
    hideAddColumnInput();
}

function deleteColumn(colId) {
    const col = boardData.find(c => c.id === colId);
    if (!col) return;
    const cardCount = col.cards.length;
    const message = cardCount > 0
        ? `Cette liste contient ${cardCount} carte(s). Elle sera définitivement supprimée.`
        : 'Cette liste vide sera définitivement supprimée.';
        
    showConfirm(
        'Supprimer la liste ?',
        message,
        () => {
            if (typeof logBoardActivity === 'function') logBoardActivity(`a supprimé la liste "${col.title}"`);
            boardData = boardData.filter(c => c.id !== colId);
            renderBoard();
            saveToSupabase();
        }
    );
}

function updateColumnTitle(colId, val) {
    const col = boardData.find(c => c.id === colId);
    if (!col) return;
    const cleanVal = val.trim();
    if (cleanVal && col.title !== cleanVal) {
        if (typeof logBoardActivity === 'function') logBoardActivity(`a renommé la liste "${col.title}" en "${cleanVal}"`);
        col.title = cleanVal;
        saveToSupabase();
    } else {
        renderBoard(); // Revert empty input
    }
}

// ─── Cards ────────────────────────────────────────────────────────────────────

function showAddCardInput(colId) {
    document.getElementById(`add-card-btn-${colId}`).classList.add('hidden');
    document.getElementById(`add-card-form-${colId}`).classList.remove('hidden');
    const input = document.getElementById(`input-card-${colId}`);
    input.focus();
    input.onkeydown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addCard(colId);
        }
    };
}

function hideAddCardInput(colId) {
    document.getElementById(`add-card-btn-${colId}`).classList.remove('hidden');
    document.getElementById(`add-card-form-${colId}`).classList.add('hidden');
    document.getElementById(`input-card-${colId}`).value = '';
}

function addCard(colId) {
    const val = document.getElementById(`input-card-${colId}`).value.trim();
    if (!val) return;
    const col = boardData.find(c => c.id === colId);
    if (!col) return;
    
    const newCard = {
        id:          'card-' + generateId(),
        content:     val,
        description: '',
        labels:      [],
        members:     [],
        checklists:  [],
        comments:    [],
        activity:    []
    };
    col.cards.push(newCard);
    
    // Attempt to figure out who created it if there's a global filter or just anonymous
    const authorId = typeof getCurrentIdentity === 'function' ? (getCurrentIdentity() || 'anonymous') : 'anonymous';
    
    newCard.activity.push({
        id: 'act-' + generateId(),
        action: 'a créé la carte',
        authorId,
        timestamp: new Date().toISOString()
    });

    lastNewCardId = newCard.id; // trigger pop-in animation
    renderBoard();
    saveToSupabase();
    hideAddCardInput(colId);
}

function logCardActivity(cardId, colId, actionDesc) {
    const col = boardData.find(c => c.id === colId);
    if (!col) return;
    const card = col.cards.find(c => c.id === cardId);
    if (!card) return;
    
    const authorId = typeof getCurrentIdentity === 'function' ? (getCurrentIdentity() || 'anonymous') : 'anonymous';

    if (!card.activity) card.activity = [];
    card.activity.unshift({
        id: 'act-' + generateId(),
        action: actionDesc,
        authorId,
        timestamp: new Date().toISOString()
    });
    
    saveToSupabase();
}

// ─── Chat ───────────────────────────────────────────────────────────────────

let localClientId = localStorage.getItem('tralalero_client_id');
if (!localClientId) {
    localClientId = 'client-' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('tralalero_client_id', localClientId);
}

let isChatOpen = false;

function updateChatBadge() {
    if (!settings || !settings.chat) return;
    const badge = document.getElementById('chat-badge');
    if (!badge) return;
    
    if (isChatOpen) {
        localStorage.setItem(`tralalero_chat_read_${currentBoardId}`, settings.chat.length);
        badge.classList.add('hidden');
    } else {
        const lastRead = parseInt(localStorage.getItem(`tralalero_chat_read_${currentBoardId}`) || '0', 10);
        const unread = settings.chat.length - lastRead;
        if (unread > 0) {
            badge.innerText = unread > 9 ? '9+' : unread;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

function toggleChat() {
    const widget = document.getElementById('chat-widget');
    if (!widget) return;
    
    // Ensure all messages are marked as read right before closing or toggling
    if (settings && settings.chat) {
        localStorage.setItem(`tralalero_chat_read_${currentBoardId}`, settings.chat.length);
    }
    
    isChatOpen = !isChatOpen;
    if (isChatOpen) {
        widget.classList.remove('translate-y-[150%]', 'opacity-0', 'pointer-events-none');
        widget.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');
        
        // Populate the chat author select based on current settings
        
        
        if (typeof renderChat === 'function') renderChat();
        
        updateChatBadge();
        
        // Scroll to bottom and focus
        setTimeout(() => {
            const msgs = document.getElementById('chat-messages');
            if (msgs) msgs.scrollTop = msgs.scrollHeight;
            document.getElementById('chat-input').focus();
        }, 300);
    } else {
        widget.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
        widget.classList.add('translate-y-[150%]', 'opacity-0', 'pointer-events-none');
        updateChatBadge();
    }
}

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;
    
    const authorId = typeof getCurrentIdentity === 'function' ? getCurrentIdentity() : 'anonymous';
    
    if (!settings.chat) settings.chat = [];
    
    settings.chat.push({
        id: generateId(),
        text: text,
        authorId: authorId,
        clientId: localClientId,
        timestamp: new Date().toISOString()
    });
    
    input.value = '';
    
    if (typeof renderChat === 'function') renderChat();
    
    // Scroll to bottom
    const msgs = document.getElementById('chat-messages');
    if (msgs) {
        setTimeout(() => msgs.scrollTop = msgs.scrollHeight, 50);
    }
    
    saveToSupabase();
}


// ─── Global Activity Audit Trail ──────────────────────────────────────────────

function logBoardActivity(actionDesc, cardId = null, colId = null) {
    if (!settings.activityLog) settings.activityLog = [];
    
    const authorId = typeof getCurrentIdentity === 'function' ? getCurrentIdentity() : 'anonymous';

    const activity = {
        id: 'act-' + generateId(),
        action: actionDesc,
        authorId,
        timestamp: new Date().toISOString()
    };
    
    if (cardId) activity.cardId = cardId;
    if (colId) activity.colId = colId;

    settings.activityLog.unshift(activity);
    
    if (settings.activityLog.length > 100) {
        settings.activityLog = settings.activityLog.slice(0, 100);
    }
    
    saveToSupabase();
    
    const sidebar = document.getElementById('activity-sidebar');
    if (sidebar && !sidebar.classList.contains('translate-x-full')) {
        renderGlobalActivity();
    }
}

function renderGlobalActivity() {
    const container = document.getElementById('global-activity-container');
    if (!container) return;
    
    if (!settings.activityLog || settings.activityLog.length === 0) {
        container.innerHTML = `
            <div class="text-center text-xs font-medium text-white/50 my-auto bg-white/5 p-4 rounded-2xl border border-white/10 shadow-sm backdrop-blur-sm">
                <i class="ph ph-activity text-3xl mb-2 opacity-70 text-teal-500"></i><br>
                Aucune activité récente.
            </div>
        `;
        return;
    }
    
    container.innerHTML = settings.activityLog.map(act => {
        let authorName = 'Anonyme';
        let authorColor = 'bg-slate-500';
        let authorInitials = '?';
        
        if (act.authorId !== 'anonymous') {
            const member = (settings.members || []).find(m => m.id === act.authorId);
            if (member) {
                authorName = member.name;
                if (typeof AVATAR_COLORS !== 'undefined') {
                    authorColor = AVATAR_COLORS[member.colorName] || 'bg-slate-500';
                }
                authorInitials = member.initials || '?';
            }
        }
        
        const dateStr = new Date(act.timestamp).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        
        return `
            <div class="bg-white/10 border border-white/10 rounded-xl p-3 flex gap-3 animate-pop-in backdrop-blur-sm">
                <div class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white ${authorColor} shadow-sm border border-white/20">
                    ${escapeHtml(authorInitials)}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm text-white/90 leading-snug">
                        <span class="font-bold text-white">${escapeHtml(authorName)}</span> 
                        ${escapeHtml(act.action)}
                    </p>
                    <p class="text-[10px] text-white/50 mt-1 uppercase tracking-wider font-medium">${dateStr}</p>
                </div>
            </div>
        `;
    }).join('');
}

