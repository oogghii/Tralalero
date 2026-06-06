/**
 * IMPORT.JS
 * JSON card import feature: open/close modal and process imported data.
 *
 * Supported card fields:
 *   content / title / text            — card title
 *   description / desc                — card body (supports markdown)
 *   dueDate / date / deadline         — ISO date string
 *   list / column / status            — target column title
 *   labels / tags                     — string[] — auto-created if missing
 *   members / users                   — string[] — auto-created if missing
 *   coverColor / color / cardColor    — hex (#rrggbb) or color name (fr/en)
 *   coverImage / image / thumbnail / imageUrl — http(s) URL
 *   listAccentColor / columnColor     — accent color for the target column
 *   checklists                        — { text, completed/done/checked }[]
 *   comments / activity               — passed through as-is
 *
 * Board-level format (alternative to flat card array):
 *   { columns: [{ title, accentColor, cards: [...] }] }
 */

// ─── Color helpers ────────────────────────────────────────────────────────────

const COLOR_NAME_MAP = {
    red:     '#ef4444', rouge:    '#ef4444',
    orange:  '#f97316',
    yellow:  '#eab308', jaune:    '#eab308',
    lime:    '#84cc16', citron:   '#84cc16',
    green:   '#22c55e', vert:     '#22c55e',
    emerald: '#10b981', emeraude: '#10b981',
    teal:    '#14b8a6', sarcelle: '#14b8a6',
    cyan:    '#06b6d4',
    blue:    '#3b82f6', bleu:     '#3b82f6',
    indigo:  '#6366f1',
    purple:  '#8b5cf6', violet:   '#8b5cf6',
    pink:    '#ec4899', rose:     '#ec4899',
    gray:    '#64748b', grey:     '#64748b', gris: '#64748b',
    white:   '#ffffff', blanc:    '#ffffff',
    black:   '#0f172a', noir:     '#0f172a',
};

function resolveColor(val) {
    if (!val) return null;
    const s = String(val).trim();
    const lower = s.toLowerCase();
    if (COLOR_NAME_MAP[lower]) return COLOR_NAME_MAP[lower];
    if (/^#[0-9a-f]{3,8}$/i.test(s)) return s;
    if (/^rgb\(/.test(s)) return s;
    return null;
}

function resolveImage(val) {
    if (!val) return null;
    const s = String(val).trim();
    return s.startsWith('http') ? s : null;
}

function normalizeChecklist(items) {
    if (!Array.isArray(items)) return [];
    return items
        .map(item => ({
            id:        item.id || ('chk-' + generateId()),
            text:      item.text || item.name || item.title || '',
            completed: !!(item.completed || item.done || item.checked || item.complete),
        }))
        .filter(item => item.text);
}

// ─── AI Prompt builder ────────────────────────────────────────────────────────

function copyImportPrompt() {
    const SKIP_CARD = 'salut !';

    // Build board context — omit if only default empty board
    const colContext = boardData.map(col => ({
        title: col.title,
        cards: col.cards.filter(c => c.content.toLowerCase().trim() !== SKIP_CARD),
    }));
    const totalRealCards = colContext.reduce((s, c) => s + c.cards.length, 0);
    const isDefaultBoard = totalRealCards === 0 && boardData.length <= 2;

    const hasLabels  = settings.labels  && settings.labels.length  > 0;
    const hasMembers = settings.members && settings.members.length > 0;

    let boardContext = '';
    if (!isDefaultBoard || hasLabels || hasMembers) {
        boardContext += '\n---\n\n**Current board state** — use these exact names when assigning columns, labels, and members so existing ones are reused instead of duplicated.\n\n';

        if (!isDefaultBoard) {
            boardContext += 'Columns (with existing cards):\n';
            colContext.forEach(col => {
                boardContext += `- "${col.title}"`;
                if (col.cards.length > 0) {
                    const preview = col.cards.slice(0, 5).map(c => `"${c.content}"`).join(', ');
                    boardContext += ` — ${col.cards.length} card(s): ${preview}`;
                    if (col.cards.length > 5) boardContext += ` (+${col.cards.length - 5} more)`;
                } else {
                    boardContext += ' (empty)';
                }
                boardContext += '\n';
            });
            boardContext += '\n';
        }

        if (hasLabels)  boardContext += `Existing labels: ${settings.labels.map(l => `"${l.name}"`).join(', ')}\n`;
        if (hasMembers) boardContext += `Existing members: ${settings.members.map(m => `"${m.name}"`).join(', ')}\n`;
    }

    const prompt =
`You are a Kanban board assistant. Your task is to convert a work distribution or task list into a JSON format ready to import into a Kanban board.

Work in two phases — do NOT skip Phase 1. Respond in the same language as the user's input.

---

## Phase 1 · Interview

Before writing any JSON, read what the user gives you and identify everything that is missing or ambiguous. Ask ALL your questions in a SINGLE message. Do not generate JSON until you have complete answers.

Always check for:
- Member names: if people are referred to by role ("the dev", "Alice"), nickname, or initials only, ask for their full name as it should appear on the board.
- Column assignment: if it is unclear which list (e.g. "To Do", "In Progress", "Done") a task belongs to, ask.
- Due dates: if a deadline is vague ("next week", "ASAP", "by Friday"), ask for the exact date in YYYY-MM-DD format.
- Task granularity: if a task is broad, ask whether it should be one card with a checklist of subtasks, or multiple separate cards.
- Labels / categories: if tasks have implicit categories (bug, feature, design, urgent…), ask what label names to use.
- Colors: if priority levels or task types should be color-coded, ask which color maps to which category. Available colors: red, orange, yellow, green, teal, blue, purple, pink, gray (or any hex code).

Only ask about what is genuinely missing or ambiguous. Do not ask unnecessary questions about things you can reasonably infer. If the input is fully unambiguous and complete, skip Phase 1 and go directly to Phase 2.

---

## Phase 2 · Generate JSON

Once you have all answers, output ONLY the raw JSON — no explanation, no markdown code fences, no surrounding text whatsoever. The user will paste it directly into an import field.

Supported fields per card:
- content          → card title (required; also accepted: title, text)
- list             → target column name (string)
- description      → body text (markdown supported)
- dueDate          → "YYYY-MM-DDTHH:MM:00"
- labels           → ["Label name", ...]
- members          → ["Full Name", ...]
- coverColor       → color name ("red", "blue", "green", "purple"...) or hex ("#8b5cf6")
- coverImage       → image URL (must start with http; also accepted: image, thumbnail, imageUrl)
- listAccentColor  → accent color for the column top border
- checklists       → [{ "text": "Subtask", "done": false }, ...]

To remove existing items, add a "remove" key at the root level. This can be combined with additions:
{
  "remove": {
    "cards":   ["Exact card title", ...],
    "members": ["Member name", ...],
    "labels":  ["Label name", ...],
    "columns": ["Column title", ...]
  },
  "cards": [...]
}
Matching is case-insensitive. Removing a column also removes all its cards. Removed members and labels are automatically detached from all cards. Use this to clean up defaults (e.g. the default "Salut !" card, "Par Défaut" member, "Fait !" column) before adding real content.

Format selection rule: use the board-level format when columns need distinct accent colors or when the input is naturally organized by column. Use the flat card array otherwise.

Flat array format: [{ "content": "Card title", "list": "Column name", ... }, ...]
Board-level format: { "columns": [{ "title": "Column name", "accentColor": "blue", "cards": [...] }] }
${boardContext}
---

Now ask the user to share their work distribution or task list.`;

    navigator.clipboard.writeText(prompt).then(() => {
        showToast('Prompt copié dans le presse-papiers !', 'blue');
    }).catch(() => {
        showToast('Erreur lors de la copie', 'red');
    });
}

// ─── AI tip popup ─────────────────────────────────────────────────────────────

function showAiTip() {
    if (localStorage.getItem('tralalero_ai_tip_seen_' + currentBoardId)) return;
    const boardId = currentBoardId;
    const show = () => {
        if (currentBoardId !== boardId) return;
        const tip = document.getElementById('ai-tip');
        const content = document.getElementById('ai-tip-content');
        if (!tip || !content) return;
        tip.classList.remove('hidden');
        requestAnimationFrame(() => {
            content.classList.remove('scale-95', 'opacity-0');
            content.classList.add('scale-100', 'opacity-100');
        });
    };
    const identityModal = document.getElementById('identity-modal');
    if (identityModal && !identityModal.classList.contains('hidden')) {
        const observer = new MutationObserver(() => {
            if (identityModal.classList.contains('hidden')) {
                observer.disconnect();
                show();
            }
        });
        observer.observe(identityModal, { attributes: true, attributeFilter: ['class'] });
    } else {
        show();
    }
}

function dismissAiTip() {
    localStorage.setItem('tralalero_ai_tip_seen_' + currentBoardId, '1');
    const tip = document.getElementById('ai-tip');
    const content = document.getElementById('ai-tip-content');
    if (!tip || !content) return;
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => tip.classList.add('hidden'), 200);
}

function tryAiImport() {
    dismissAiTip();
    openImportModal();
}

// ─── Modal open / close ───────────────────────────────────────────────────────

function openImportModal() {
    document.getElementById('import-json-input').value = '';
    document.getElementById('import-modal').classList.remove('hidden');
}

function closeImportModal(e, force) {
    if (force || (e && e.target.id === 'import-modal')) {
        document.getElementById('import-modal').classList.add('hidden');
    }
}

// ─── Dry-run plan ─────────────────────────────────────────────────────────────

function analyzeRemovals(spec) {
    if (!spec) return { cards: 0, members: 0, labels: 0, columns: 0 };

    const cardTitles  = [].concat(spec.cards   || []).map(s => String(s).toLowerCase());
    const memberNames = [].concat(spec.members  || []).map(s => String(s).toLowerCase());
    const labelNames  = [].concat(spec.labels   || []).map(s => String(s).toLowerCase());
    const colTitles   = [].concat(spec.columns  || spec.lists || []).map(s => String(s).toLowerCase());

    let cards = 0;
    boardData.forEach(col => {
        if (colTitles.includes(col.title.toLowerCase())) {
            cards += col.cards.length;
        } else {
            cards += col.cards.filter(c => cardTitles.includes(c.content.toLowerCase())).length;
        }
    });

    return {
        cards,
        members: (settings.members || []).filter(m => memberNames.includes(m.name.toLowerCase())).length,
        labels:  (settings.labels  || []).filter(l => labelNames.includes(l.name.toLowerCase())).length,
        columns: boardData.filter(c => colTitles.includes(c.title.toLowerCase())).length,
    };
}

/**
 * Parses the imported JSON into a structured plan without mutating any state.
 * Returns { columns, totalCards, newLabelCount, newMemberCount, removeSpec, removeAnalysis }.
 */
function buildImportPlan(importedData) {
    // Extract optional remove spec and normalize the additions payload
    let removeSpec = null;
    let addData    = importedData;

    if (importedData && !Array.isArray(importedData) && importedData.remove) {
        removeSpec = importedData.remove;
        if (Array.isArray(importedData.cards))          addData = importedData.cards;
        else if (Array.isArray(importedData.columns))   addData = { columns: importedData.columns };
        else                                             addData = [];
    }

    const removeAnalysis = analyzeRemovals(removeSpec);

    let columnSpecs;

    if (addData && !Array.isArray(addData) && Array.isArray(addData.columns)) {
        // Board-level format: { columns: [{ title, accentColor, cards }] }
        columnSpecs = addData.columns.map(col => ({
            title:       String(col.title || col.name || 'Importations'),
            accentColor: resolveColor(col.accentColor || col.color || col.accent),
            rawCards:    col.cards || [],
        }));
    } else {
        // Flat card array — group by target column, preserving insertion order
        const cards = Array.isArray(addData) ? addData : (addData ? [addData] : []);
        const colMap = new Map();
        cards.forEach(card => {
            const colTitle = String(
                card.list || card.column || card.status ||
                (boardData[0] ? boardData[0].title : 'Importations')
            );
            if (!colMap.has(colTitle)) {
                colMap.set(colTitle, { title: colTitle, accentColor: null, rawCards: [] });
            }
            const spec = colMap.get(colTitle);
            const accent = resolveColor(card.listAccentColor || card.columnColor);
            if (accent) spec.accentColor = accent; // last card with an accent wins
            spec.rawCards.push(card);
        });
        columnSpecs = Array.from(colMap.values());
    }

    // Count new labels/members using Set snapshots (no mutation)
    const knownLabels  = new Set((settings.labels  || []).map(l => l.name.toLowerCase()));
    const knownMembers = new Set((settings.members || []).map(m => m.name.toLowerCase()));
    let newLabelCount  = 0;
    let newMemberCount = 0;

    const columns = columnSpecs.map(spec => {
        const existing   = boardData.find(c => c.title.toLowerCase() === spec.title.toLowerCase());
        const validCards = spec.rawCards.filter(c => c.content || c.title || c.text);

        validCards.forEach(card => {
            [].concat(card.labels || card.tags   || []).forEach(n => {
                if (!n) return;
                const key = String(n).toLowerCase();
                if (!knownLabels.has(key)) { knownLabels.add(key); newLabelCount++; }
            });
            [].concat(card.members || card.users || []).forEach(n => {
                if (!n) return;
                const key = String(n).toLowerCase();
                if (!knownMembers.has(key)) { knownMembers.add(key); newMemberCount++; }
            });
        });

        return { ...spec, existing, isNew: !existing, validCards };
    });

    return {
        columns,
        totalCards:    columns.reduce((s, c) => s + c.validCards.length, 0),
        newLabelCount,
        newMemberCount,
        removeSpec,
        removeAnalysis,
    };
}

// ─── Execution ────────────────────────────────────────────────────────────────

function executeImport(plan) {
    // Process removals first
    if (plan.removeSpec) {
        const spec = plan.removeSpec;

        const cardTitles  = [].concat(spec.cards   || []).map(s => String(s).toLowerCase());
        const memberNames = [].concat(spec.members  || []).map(s => String(s).toLowerCase());
        const labelNames  = [].concat(spec.labels   || []).map(s => String(s).toLowerCase());
        const colTitles   = [].concat(spec.columns  || spec.lists || []).map(s => String(s).toLowerCase());

        // Remove columns (and implicitly all their cards)
        if (colTitles.length > 0) {
            boardData = boardData.filter(col => !colTitles.includes(col.title.toLowerCase()));
        }
        // Remove individual cards from remaining columns
        if (cardTitles.length > 0) {
            boardData.forEach(col => {
                col.cards = col.cards.filter(c => !cardTitles.includes(c.content.toLowerCase()));
            });
        }
        // Remove members and unassign them from all cards
        if (memberNames.length > 0) {
            const removedIds = new Set(
                (settings.members || []).filter(m => memberNames.includes(m.name.toLowerCase())).map(m => m.id)
            );
            settings.members = (settings.members || []).filter(m => !removedIds.has(m.id));
            boardData.forEach(col => col.cards.forEach(card => {
                card.members = (card.members || []).filter(id => !removedIds.has(id));
            }));
            // If the current user's member was deleted, fall back to anonymous
            const currentIdentity = getCurrentIdentity();
            if (currentIdentity && currentIdentity !== 'anonymous' && removedIds.has(currentIdentity)) {
                setIdentity('anonymous');
            }
        }
        // Remove labels and detach them from all cards
        if (labelNames.length > 0) {
            const removedIds = new Set(
                (settings.labels || []).filter(l => labelNames.includes(l.name.toLowerCase())).map(l => l.id)
            );
            settings.labels = (settings.labels || []).filter(l => !removedIds.has(l.id));
            boardData.forEach(col => col.cards.forEach(card => {
                card.labels = (card.labels || []).filter(id => !removedIds.has(id));
            }));
        }
    }

    plan.columns.forEach(spec => {
        let targetCol = boardData.find(c => c.title.toLowerCase() === spec.title.toLowerCase());
        if (!targetCol) {
            targetCol = { id: 'col-' + generateId(), title: spec.title, cards: [] };
            boardData.push(targetCol);
        }
        if (spec.accentColor) targetCol.accentColor = spec.accentColor;

        spec.validCards.forEach(item => {
            const content    = item.content || item.title || item.text || 'Sans titre';
            const desc       = item.description || item.desc || '';
            const dueDate    = item.dueDate  || item.date  || item.deadline || '';
            const coverColor = resolveColor(item.coverColor || item.color || item.cardColor);
            const coverImage = resolveImage(item.coverImage || item.image || item.thumbnail || item.imageUrl);

            // Resolve / create labels
            const cardLabelIds = [];
            [].concat(item.labels || item.tags || []).forEach(lName => {
                if (!lName) return;
                let label = (settings.labels || []).find(l => l.name.toLowerCase() === String(lName).toLowerCase());
                if (!label) {
                    const colorKeys = Object.keys(LABEL_COLORS);
                    label = { id: 'l-' + generateId(), name: String(lName), colorName: colorKeys[Math.floor(Math.random() * colorKeys.length)] };
                    if (!settings.labels) settings.labels = [];
                    settings.labels.push(label);
                }
                cardLabelIds.push(label.id);
            });

            // Resolve / create members
            const cardMemberIds = [];
            [].concat(item.members || item.users || []).forEach(mName => {
                if (!mName) return;
                let member = (settings.members || []).find(m => m.name.toLowerCase() === String(mName).toLowerCase());
                if (!member) {
                    const avatarKeys = Object.keys(AVATAR_COLORS);
                    member = {
                        id:        'm-' + generateId(),
                        name:      String(mName),
                        initials:  getInitials(String(mName)),
                        colorName: avatarKeys[Math.floor(Math.random() * avatarKeys.length)],
                    };
                    if (!settings.members) settings.members = [];
                    settings.members.push(member);
                }
                cardMemberIds.push(member.id);
            });

            const newCard = {
                id:          'card-' + generateId(),
                content,
                description: desc,
                dueDate,
                labels:      cardLabelIds,
                members:     cardMemberIds,
                checklists:  normalizeChecklist(item.checklists),
                comments:    item.comments || [],
                activity:    item.activity || [],
            };

            if (coverImage)      { newCard.coverImage = coverImage; newCard.coverColor = null; }
            else if (coverColor) { newCard.coverColor = coverColor; }

            targetCol.cards.push(newCard);
        });
    });

    saveToSupabase();
    renderBoard();
    closeImportModal(null, true);

    // Summary toast
    const ra      = plan.removeAnalysis;
    const removed = ra ? (ra.cards + ra.members + ra.labels + ra.columns) : 0;
    const newCols = plan.columns.filter(c => c.isNew).length;

    const removeParts = [];
    if (ra && ra.columns > 0) removeParts.push(`${ra.columns} liste(s)`);
    if (ra && ra.cards   > 0) removeParts.push(`${ra.cards} carte(s)`);
    if (ra && ra.members > 0) removeParts.push(`${ra.members} membre(s)`);
    if (ra && ra.labels  > 0) removeParts.push(`${ra.labels} étiquette(s)`);

    const addParts = [];
    if (plan.totalCards    > 0) addParts.push(`${plan.totalCards} carte(s) ajoutée(s)`);
    if (newCols            > 0) addParts.push(`${newCols} liste(s) créée(s)`);
    if (plan.newLabelCount > 0) addParts.push(`${plan.newLabelCount} étiquette(s)`);
    if (plan.newMemberCount> 0) addParts.push(`${plan.newMemberCount} membre(s)`);

    const parts = [];
    if (removeParts.length > 0) parts.push(`Supprimé : ${removeParts.join(', ')}`);
    if (addParts.length    > 0) parts.push(addParts.join(' · '));
    if (parts.length === 0)     parts.push('Aucune modification');

    showToast(parts.join(' · '), removed > 0 ? 'blue' : 'green');
}

// ─── Entry point ──────────────────────────────────────────────────────────────

function processImport() {
    const jsonText = document.getElementById('import-json-input').value.trim();
    if (!jsonText) {
        showToast('Veuillez coller du JSON', 'red');
        return;
    }

    let importedData;
    try {
        importedData = JSON.parse(jsonText);
    } catch {
        showToast('JSON invalide. Vérifiez le format.', 'red');
        return;
    }

    let plan;
    try {
        plan = buildImportPlan(importedData);
    } catch (e) {
        console.error('Import plan error:', e);
        showToast("Erreur lors de l'analyse du JSON.", 'red');
        return;
    }

    if (plan.totalCards === 0) {
        showToast('Aucune carte trouvée dans le JSON.', 'red');
        return;
    }

    executeImport(plan);
}
