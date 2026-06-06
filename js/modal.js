/**
 * MODAL.JS
 * Card-edit modal: open, close, save, delete, and label/member toggles.
 */

// ─── Open / Close ─────────────────────────────────────────────────────────────

function _getEditCard() {
    if (!currentEditCardId || !currentEditColId) return null;
    const col = boardData.find(c => c.id === currentEditColId);
    return col ? col.cards.find(c => c.id === currentEditCardId) : null;
}

function openEditModal(cardId, colId) {
    const col  = boardData.find(c => c.id === colId);
    if (!col) return;
    const card = col.cards.find(c => c.id === cardId);
    if (!card) return;

    currentEditCardId = cardId;
    currentEditColId  = colId;
    tempLabels        = [...(card.labels  || [])];
    tempMembers       = [...(card.members || [])];
    tempChecklists    = JSON.parse(JSON.stringify(card.checklists || []));
    tempComments      = JSON.parse(JSON.stringify(card.comments || []));
    tempActivities    = JSON.parse(JSON.stringify(card.activity || []));

    document.getElementById('modal-title-input').value = card.content;
    document.getElementById('modal-desc-input').value  = card.description || '';
    document.getElementById('modal-date-input').value  = card.dueDate     || '';
    document.getElementById('modal-list-name').innerText = col.title;

    // Reset description mode to edit
    if (typeof toggleDescriptionMode === 'function') toggleDescriptionMode('edit');

    renderModalSidebars();
    renderChecklists();
    
    renderComments();
    renderActivityLog();
    
    document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal(e, force) {
    if (force || (e && e.target.id === 'modal-overlay')) {
        // Auto-save if clicking outside the modal
        if (e && e.target.id === 'modal-overlay') {
            saveCardFromModal();
            return;
        }
        
        document.getElementById('modal-overlay').classList.add('hidden');
        currentEditCardId = null;
        currentEditColId  = null;
    }
}

// ─── Save / Delete ────────────────────────────────────────────────────────────

function saveCardFromModal(close = true) {
    const card = _getEditCard();
    if (!card) return;

    card.content     = document.getElementById('modal-title-input').value.trim() || 'Sans titre';
    card.description = document.getElementById('modal-desc-input').value.trim();
    card.dueDate     = document.getElementById('modal-date-input').value;
    card.labels      = tempLabels;
    card.members     = tempMembers;
    card.checklists  = tempChecklists;
    card.comments    = tempComments;
    card.activity    = tempActivities;

    saveToSupabase();
    if (close) {
        closeModal(null, true);
    }
    renderBoard();
}

function deleteCardFromModal() {
    if (!currentEditCardId) return;
    showConfirm(
        'Supprimer la carte ?',
        'Cette carte sera définitivement supprimée.',
        () => {
            const col = boardData.find(c => c.id === currentEditColId);
            if (col) col.cards = col.cards.filter(c => c.id !== currentEditCardId);
            saveToSupabase();
            closeModal(null, true);
            renderBoard();
        }
    );
}

function toggleLabel(id) {
    const isAdding = !tempLabels.includes(id);
    tempLabels = isAdding
        ? [...tempLabels, id]
        : tempLabels.filter(l => l !== id);
        
    const labelObj = (settings.labels || []).find(l => l.id === id);
    const labelName = labelObj ? labelObj.name : 'une étiquette';
    logActivity(isAdding ? `a ajouté l'étiquette "${labelName}"` : `a retiré l'étiquette "${labelName}"`);
    
    renderModalSidebars();
}

function toggleMember(id) {
    const isAdding = !tempMembers.includes(id);
    tempMembers = isAdding
        ? [...tempMembers, id]
        : tempMembers.filter(m => m !== id);
        
    const memberObj = (settings.members || []).find(m => m.id === id);
    const memberName = memberObj ? memberObj.name : 'un membre';
    logActivity(isAdding ? `a assigné ${memberName}` : `a désassigné ${memberName}`);
    
    renderModalSidebars();
}

// ─── Markdown Preview ────────────────────────────────────────────────────────
function toggleDescriptionMode(mode) {
    const editBtn = document.getElementById('desc-edit-btn');
    const previewBtn = document.getElementById('desc-preview-btn');
    const input = document.getElementById('modal-desc-input');
    const preview = document.getElementById('modal-desc-preview');

    if (mode === 'edit') {
        editBtn.className = 'px-2 py-1 rounded bg-slate-200 font-medium text-slate-700 transition';
        previewBtn.className = 'px-2 py-1 rounded text-slate-500 hover:bg-slate-100 font-medium transition';
        input.classList.remove('hidden');
        preview.classList.add('hidden');
    } else {
        previewBtn.className = 'px-2 py-1 rounded bg-slate-200 font-medium text-slate-700 transition';
        editBtn.className = 'px-2 py-1 rounded text-slate-500 hover:bg-slate-100 font-medium transition';
        input.classList.add('hidden');
        preview.classList.remove('hidden');
        
        let rawDesc = input.value.trim();
        if (rawDesc === '') {
            preview.innerHTML = '<em class="text-slate-400">Aucune description...</em>';
        } else {
            preview.innerHTML = typeof DOMPurify !== 'undefined' 
                ? DOMPurify.sanitize(typeof marked !== 'undefined' ? marked.parse(rawDesc) : rawDesc) 
                : escapeHtml(rawDesc);
        }
    }
}

// ─── Checklists ──────────────────────────────────────────────────────────────
function renderChecklists() {
    const container = document.getElementById('modal-checklists-container');
    container.innerHTML = tempChecklists.map(c => `
        <div class="flex items-center gap-3 group p-1.5 hover:bg-slate-50 rounded transition">
            <button type="button" onclick="toggleChecklistItem('${c.id}')" class="flex items-center justify-center w-5 h-5 outline-none transition transform hover:scale-110">
                <i class="text-xl ${c.completed ? 'ph-fill ph-check-square text-blue-500' : 'ph ph-square text-slate-300 hover:text-blue-400'}"></i>
            </button>
            <span class="flex-1 text-sm font-medium ${c.completed ? 'line-through text-slate-400' : 'text-slate-700'} cursor-pointer" onclick="toggleChecklistItem('${c.id}')">${escapeHtml(c.text)}</span>
            <button onclick="removeChecklistItem('${c.id}')" class="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-1"><i class="ph ph-trash text-lg"></i></button>
        </div>
    `).join('');
}

function addChecklistItem() {
    const input = document.getElementById('new-checklist-input');
    const text = input.value.trim();
    if (!text) return;
    tempChecklists.push({ id: 'chk-' + generateId(), text, completed: false });
    input.value = '';
    
    logActivity('a ajouté une sous-tâche');
    renderChecklists();
}

function toggleChecklistItem(id) {
    const item = tempChecklists.find(c => c.id === id);
    if (item) {
        item.completed = !item.completed;
        logActivity(item.completed ? 'a coché une sous-tâche' : 'a décoché une sous-tâche');
        renderChecklists();
    }
}

function removeChecklistItem(id) {
    tempChecklists = tempChecklists.filter(c => c.id !== id);
    logActivity('a supprimé une sous-tâche');
    renderChecklists();
}

// ─── Comments ────────────────────────────────────────────────────────────────
function renderComments() {
    const container = document.getElementById('modal-comments-container');
    container.innerHTML = tempComments.map(c => {
        let authorName = 'Anonyme';
        let colorClass = 'bg-slate-300';
        let initials = '?';
        
        if (c.authorId !== 'anonymous') {
            const member = (settings.members || []).find(m => m.id === c.authorId);
            if (member) {
                authorName = member.name;
                initials = member.initials;
                colorClass = AVATAR_COLORS[member.colorName] || 'bg-slate-500';
            }
        } else {
            initials = 'AN';
        }

        const dateStr = new Date(c.timestamp).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        
        return `
            <div class="flex gap-3 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                <div class="w-8 h-8 rounded-full ${colorClass} flex items-center justify-center text-white text-xs font-bold flex-shrink-0">${initials}</div>
                <div class="flex-1">
                    <div class="flex justify-between items-baseline mb-1">
                        <span class="font-bold text-sm text-slate-700">${authorName}</span>
                        <span class="text-[10px] text-slate-400 font-medium">${dateStr}</span>
                    </div>
                    <div class="text-sm text-slate-600 whitespace-pre-wrap">${escapeHtml(c.text)}</div>
                </div>
                <button onclick="removeComment('${c.id}')" class="text-slate-300 hover:text-red-500 transition h-fit"><i class="ph ph-trash"></i></button>
            </div>
        `;
    }).join('');
}

function addComment() {
    const input = document.getElementById('new-comment-input');
    const text = input.value.trim();
    if (!text) return;
    
    const authorId = getAuthorId();
    
    const comment = {
        id: 'cmt-' + generateId(),
        text: text,
        authorId: authorId,
        timestamp: new Date().toISOString()
    };
    
    tempComments.push(comment);
    input.value = '';
    renderComments();
    logActivity('a ajouté un commentaire');
    saveCardFromModal(false);
}

function removeComment(id) {
    if (typeof showConfirm === 'function') {
        showConfirm(
            'Supprimer le commentaire',
            'Êtes-vous sûr de vouloir supprimer ce commentaire ? Cette action est irréversible.',
            () => {
                tempComments = tempComments.filter(c => c.id !== id);
                renderComments();
            },
            true // isDestructive
        );
    } else {
        tempComments = tempComments.filter(c => c.id !== id);
        renderComments();
    }
}

// ─── Activity Log ────────────────────────────────────────────────────────────
function logActivity(actionDesc) {
    const authorId = getAuthorId();
    
    if (typeof tempActivities === 'undefined') tempActivities = [];
    
    tempActivities.unshift({
        id: 'act-' + generateId(),
        action: actionDesc,
        authorId,
        timestamp: new Date().toISOString()
    });
    
    if (typeof logBoardActivity === 'function' && currentEditCardId) {
        const card = _getEditCard();
        const cardTitle = card ? card.content : 'une carte';
        logBoardActivity(`${actionDesc} pour la carte "${cardTitle}"`, currentEditCardId, currentEditColId);
    }
    
    renderActivityLog();
}

function renderActivityLog() {
    const container = document.getElementById('modal-activity-container');
    if (!container) return;
    if (!tempActivities || tempActivities.length === 0) {
        container.innerHTML = '<em class="text-slate-400">Aucune activité...</em>';
        return;
    }
    
    container.innerHTML = tempActivities.map(act => {
        let authorName = 'Anonyme';
        if (act.authorId !== 'anonymous') {
            const member = (settings.members || []).find(m => m.id === act.authorId);
            if (member) authorName = member.name;
        }
        
        const dateStr = new Date(act.timestamp).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        
        return `
            <div class="flex flex-col gap-0.5 mb-2">
                <span class="text-slate-700"><span class="font-bold">${authorName}</span> ${act.action}</span>
                <span class="text-[10px] text-slate-400">${dateStr}</span>
            </div>
        `;
    }).join('');
}

// ─── Couverture (Card Covers) ────────────────────────────────────────────────
function setCardCover(color) {
    const card = _getEditCard();
    if (!card) return;
    card.coverColor = color;
    card.coverImage = null; 
    document.getElementById('modal-cover-url').value = '';
    saveCardFromModal(false);
}

function setCardCoverUrl() {
    const card = _getEditCard();
    if (!card) return;
    const url = document.getElementById('modal-cover-url').value.trim();
    card.coverImage = url || null;
    if (url) card.coverColor = null;
    saveCardFromModal(false);
}

async function uploadCardCover(input) {
    const card = _getEditCard();
    if (!card) return;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    
    const fileName = card.id + '_' + Date.now() + '_' + file.name;
    
    document.getElementById('upload-label').innerHTML = '<i class="ph ph-spinner animate-spin"></i> Upload...';
    
    try {
        const { data, error } = await supabaseClient.storage.from('attachments').upload('public/' + fileName, file, { cacheControl: '3600', upsert: false });
        
        if (error) {
            console.error('Storage error:', error);
            alert("Erreur lors de l'upload. Avez-vous créé le bucket 'attachments' dans Supabase Storage en accès public ?\n\nErreur: " + error.message);
            return;
        }
        
        const { data: urlData } = supabaseClient.storage.from('attachments').getPublicUrl('public/' + fileName);
        
        card.coverImage = urlData.publicUrl;
        card.coverColor = null;
        document.getElementById('modal-cover-url').value = urlData.publicUrl;
        
        saveCardFromModal(false);
} catch (e) {
        alert("Erreur de connexion au stockage. Veuillez vérifier la configuration de votre bucket 'attachments'.");
    } finally {
        input.value = '';
        document.getElementById('upload-label').innerHTML = '<i class="ph-bold ph-upload-simple"></i> <span>Uploader une image</span> <input type="file" id="modal-cover-upload" accept="image/*" class="hidden" onchange="uploadCardCover(this)">';
    }
}



