/**
 * IMPORT.JS
 * JSON card import feature: open/close modal and process imported data.
 */

function openImportModal() {
    document.getElementById('import-json-input').value = '';
    document.getElementById('import-modal').classList.remove('hidden');
}

function closeImportModal(e, force) {
    if (force || (e && e.target.id === 'import-modal')) {
        document.getElementById('import-modal').classList.add('hidden');
    }
}

function processImport() {
    const jsonText = document.getElementById('import-json-input').value.trim();
    if (!jsonText) {
        showToast('Veuillez coller du JSON', 'red');
        return;
    }

    try {
        const importedData  = JSON.parse(jsonText);
        const cardsToImport = Array.isArray(importedData) ? importedData : [importedData];

        if (cardsToImport.length === 0) {
            showToast('Aucune carte trouvée', 'red');
            return;
        }

        let newLabelsCreated  = 0;
        let newMembersCreated = 0;
        let newColsCreated    = 0;

        cardsToImport.forEach(item => {
            const content  = item.content  || item.title   || item.text     || 'Sans titre';
            const desc     = item.description || item.desc || '';
            const dueDate  = item.dueDate  || item.date    || item.deadline  || '';

            // ─── Resolve / create column ──────────────────────────────────────
            const colTitle  = item.list || item.column || item.status
                || (boardData[0] ? boardData[0].title : 'Importations');
            let targetCol   = boardData.find(
                c => c.title.toLowerCase() === colTitle.toString().toLowerCase()
            );
            if (!targetCol) {
                targetCol = { id: 'col-' + generateId(), title: colTitle.toString(), cards: [] };
                boardData.push(targetCol);
                newColsCreated++;
            }

            // ─── Resolve / create labels ──────────────────────────────────────
            const labelNames  = item.labels || item.tags || [];
            const cardLabelIds = [];
            (Array.isArray(labelNames) ? labelNames : [labelNames]).forEach(lName => {
                if (!lName) return;
                let label = (settings.labels || []).find(
                    l => l.name.toLowerCase() === lName.toString().toLowerCase()
                );
                if (!label) {
                    const colorKeys   = Object.keys(LABEL_COLORS);
                    const randomColor = colorKeys[Math.floor(Math.random() * colorKeys.length)];
                    label = { id: 'l-' + generateId(), name: lName.toString(), colorName: randomColor };
                    if (!settings.labels) settings.labels = [];
                    settings.labels.push(label);
                    newLabelsCreated++;
                }
                cardLabelIds.push(label.id);
            });

            // ─── Resolve / create members ─────────────────────────────────────
            const memberNames  = item.members || item.users || [];
            const cardMemberIds = [];
            (Array.isArray(memberNames) ? memberNames : [memberNames]).forEach(mName => {
                if (!mName) return;
                let member = (settings.members || []).find(
                    m => m.name.toLowerCase() === mName.toString().toLowerCase()
                );
                if (!member) {
                    const avatarKeys  = Object.keys(AVATAR_COLORS);
                    const randomColor = avatarKeys[Math.floor(Math.random() * avatarKeys.length)];
                    member = {
                        id:        'm-' + generateId(),
                        name:      mName.toString(),
                        initials:  getInitials(mName.toString()),
                        colorName: randomColor
                    };
                    if (!settings.members) settings.members = [];
                    settings.members.push(member);
                    newMembersCreated++;
                }
                cardMemberIds.push(member.id);
            });

            targetCol.cards.push({
                id:          'card-' + generateId(),
                content,
                description: desc,
                dueDate,
                labels:      cardLabelIds,
                members:     cardMemberIds,
                checklists:  item.checklists || [],
                comments:    item.comments || [],
                activity:    item.activity || []
            });
        });

        saveToSupabase();
        renderBoard();
        closeImportModal(null, true);

        // Build summary toast message
        let msg         = `${cardsToImport.length} carte(s) importée(s) !`;
        const extras    = [];
        if (newColsCreated    > 0) extras.push(`${newColsCreated} liste(s)`);
        if (newLabelsCreated  > 0) extras.push(`${newLabelsCreated} étiquette(s)`);
        if (newMembersCreated > 0) extras.push(`${newMembersCreated} membre(s)`);
        if (extras.length > 0)    msg += ` (${extras.join(', ')} créé(s))`;

        showToast(msg, 'green');

    } catch (e) {
        console.error('Import error:', e);
        showToast('JSON invalide. Vérifiez le format.', 'red');
    }
}
