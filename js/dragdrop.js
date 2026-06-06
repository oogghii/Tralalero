/**
 * DRAGDROP.JS
 * Drag & drop handlers for both cards and columns using SortableJS.
 */

let boardSortable = null;
let colSortables = [];

function initSortable() {
    // 1. Destroy existing instances
    if (boardSortable) {
        boardSortable.destroy();
        boardSortable = null;
    }
    colSortables.forEach(s => s.destroy());
    colSortables = [];

    const isSelect = typeof isSelectMode !== 'undefined' ? isSelectMode : false;
    if (isSelect) return; // Disable drag and drop entirely in select mode

    // 2. Initialize Column Dragging (Board)
    const boardEl = document.getElementById('board');
    if (boardEl) {
        boardSortable = new Sortable(boardEl, {
            animation: 250,
            easing: "cubic-bezier(0.2, 0, 0, 1)",
            filter: 'button, textarea, input, .no-drag', // Prevent dragging from input elements
            preventOnFilter: false,
            draggable: '[data-col-id]', // Ensure we only drag columns, not the "Add Column" button
            ghostClass: 'opacity-40',
            dragClass: 'rotate-1',
            onEnd: function (evt) {
                // Re-order boardData
                if (evt.oldIndex === evt.newIndex) return;
                
                const allCols = Array.from(boardEl.children).filter(el => el.hasAttribute('data-col-id'));
                
                const newBoardData = [];
                allCols.forEach(colEl => {
                    const colId = colEl.getAttribute('data-col-id');
                    const colData = boardData.find(c => c.id === colId);
                    if (colData) newBoardData.push(colData);
                });
                
                if (typeof logBoardActivity === 'function') {
                    const colName = evt.item.querySelector('textarea') ? evt.item.querySelector('textarea').value : 'une liste';
                    logBoardActivity(`a réorganisé la liste "${colName}"`);
                }
                
                boardData = newBoardData;
                saveToSupabase();
            }
        });
    }

    // 3. Initialize Card Dragging (Lists)
    const cardContainers = document.querySelectorAll('div[id^="cards-"]');
    cardContainers.forEach(container => {
        const s = new Sortable(container, {
            group: 'shared',
            animation: 350,
            easing: "cubic-bezier(0.25, 1, 0.5, 1)",
            ghostClass: 'opacity-40',
            dragClass: 'rotate-2',
            filter: '.col-empty-state',
            preventOnFilter: true,
            delay: 50,
            delayOnTouchOnly: true,
            onEnd: function (evt) {
                const itemEl = evt.item;  // dragged HTMLElement
                const cardId = itemEl.getAttribute('data-card-id');
                const sourceColId = evt.from.closest('[data-col-id]').getAttribute('data-col-id');
                const destColId = evt.to.closest('[data-col-id]').getAttribute('data-col-id');
                
                if (sourceColId === destColId && evt.oldIndex === evt.newIndex) return;

                const sCol = boardData.find(c => c.id === sourceColId);
                const dCol = boardData.find(c => c.id === destColId);
                if (!sCol || !dCol) return;

                const cardIndex = sCol.cards.findIndex(c => c.id === cardId);
                if (cardIndex === -1) return;
                
                const [card] = sCol.cards.splice(cardIndex, 1);
                
                // Add to destination
                dCol.cards.splice(evt.newIndex, 0, card);

                // Activity log if moved between columns
                if (sourceColId !== destColId) {
                    const authorId = getAuthorId();

                    if (!card.activity) card.activity = [];
                    card.activity.unshift({
                        id: 'act-' + generateId(),
                        action: `a déplacé la carte vers "${dCol.title}"`,
                        authorId,
                        timestamp: new Date().toISOString()
                    });
                    if (card.activity.length > 50) card.activity = card.activity.slice(0, 50);
                    
                    if (typeof logBoardActivity === 'function') {
                        logBoardActivity(`a déplacé la carte "${card.content}" de "${sCol.title}" vers "${dCol.title}"`, card.id, dCol.id);
                    }

                    // Confetti when dropped into a "done" type column
                    const doneKeywords = /\b(fait|done|termin[eé]|fini|compl[eé]t[eé]|completed|finished|achev[eé])\b/i;
                    if (doneKeywords.test(dCol.title) && typeof confetti === 'function') {
                        confetti({
                            particleCount: 120,
                            spread: 70,
                            origin: { y: 0.6 },
                            colors: ['#3b82f6', '#8b5cf6', '#22c55e', '#f97316', '#ec4899']
                        });
                    }
                } else if (evt.oldIndex !== evt.newIndex) {
                    if (typeof logBoardActivity === 'function') {
                        logBoardActivity(`a réorganisé la carte "${card.content}" dans la liste "${dCol.title}"`, card.id, dCol.id);
                    }
                }

                saveToSupabase();
                // We re-render silently after the animation to ensure DOM stays 100% in sync with virtual state
                setTimeout(() => renderBoard(), 10);
            }
        });
        colSortables.push(s);
    });
}

