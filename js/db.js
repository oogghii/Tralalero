/**
 * DB.JS
 * All Supabase database operations:
 *   - connectToBoard  : fetch board + subscribe to realtime changes
 *   - initializeNewBoard : insert a new empty board row
 *   - saveToSupabase  : upsert current boardData & settings
 *
 * Fixes applied:
 *  - Renamed saveToFirebase → saveToSupabase (#3)
 *  - connectToBoard called after createNewBoardAction no longer
 *    clobbers the already-rendered optimistic UI (#7)
 */

/**
 * Fetches a board from Supabase and subscribes to realtime updates.
 * @param {string}  boardId
 * @param {boolean} skipInitialRender  Pass true when board was just created
 *                                     with optimistic UI already rendered.
 */
async function connectToBoard(boardId, skipInitialRender = false) {
    // Tear down existing realtime channel if any
    if (realtimeChannel) {
        try {
            if (typeof supabaseClient.removeChannel === 'function') {
                supabaseClient.removeChannel(realtimeChannel);
            } else if (typeof realtimeChannel.unsubscribe === 'function') {
                realtimeChannel.unsubscribe();
            }
        } catch (e) { console.warn('Channel teardown error:', e); }
        realtimeChannel = null;
    }

    if (!skipInitialRender) {
        try {
            const { data, error } = await supabaseClient
                .from(TABLE_NAME)
                .select('board_data,settings,created_at')
                .eq('id', boardId)
                .single();

            document.getElementById('loading-spinner').classList.add('hidden');
            document.getElementById('add-col-container').classList.remove('hidden');

            if (data) {
                boardData = data.board_data || [];
                settings  = data.settings  || defaultSettings;
                renderBoard();
                addToHistory(boardId);

                if (!document.getElementById('settings-modal').classList.contains('hidden')) {
                    renderSettingsList();
                }
                if (currentEditCardId && !document.getElementById('modal-overlay').classList.contains('hidden')) {
                    renderModalSidebars();
                }
            } else {
                // Board not found → create it
                boardData = JSON.parse(JSON.stringify(defaultBoardData));
                settings  = JSON.parse(JSON.stringify(defaultSettings));
                await initializeNewBoard(boardId);
                renderBoard();
            }
        } catch (err) {
            console.error('Error fetching board:', err);
            showToast('Erreur de connexion au serveur', 'red');
        }
    }

    // Always prompt for identity (new board or joined board)
    if (typeof checkAndPromptIdentity === 'function') checkAndPromptIdentity();

    // ─── Subscribe to realtime changes ───────────────────────────────────────
    try {
        realtimeChannel = supabaseClient
            .channel('public:boards:' + boardId)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: TABLE_NAME, filter: `id=eq.${boardId}` },
                (payload) => {
                    const { eventType, new: newRow } = payload;

                    if (eventType === 'INSERT' || eventType === 'UPDATE') {
                        if (!newRow) return;

                        // Echo suppression — skip updates we ourselves triggered
                        const serverMutationId = newRow.settings ? newRow.settings.lastMutationId : null;
                        if (serverMutationId && (serverMutationId === lastMutationId || recentMutations.has(serverMutationId))) return;

                        boardData = newRow.board_data || [];
                        settings  = newRow.settings  || defaultSettings;
                        renderBoard();

                        if (!document.getElementById('settings-modal').classList.contains('hidden')) {
                            renderSettingsList();
                        }
                        if (currentEditCardId && !document.getElementById('modal-overlay').classList.contains('hidden')) {
                            renderModalSidebars();
                            const col = boardData.find(c => c.id === currentEditColId);
                            const updatedCard = col ? col.cards.find(c => c.id === currentEditCardId) : null;
                            if (updatedCard) {
                                if (typeof showToast === 'function') showToast('Cette carte a été modifiée par un autre utilisateur', 'blue');
                            }
                        }
                    } else if (eventType === 'DELETE') {
                        boardData = JSON.parse(JSON.stringify(defaultBoardData));
                        settings  = JSON.parse(JSON.stringify(defaultSettings));
                        renderBoard();
                    }
                }
            )
            .subscribe();
    } catch (e) {
        console.warn('Realtime subscribe error:', e);
    }
}

/**
 * Inserts a new board row into Supabase.
 * @param {string} boardId
 */
async function initializeNewBoard(boardId) {
    try {
        const row = {
            id:         boardId,
            app_id:     appId,
            board_data: boardData,
            settings:   settings,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        await supabaseClient.from(TABLE_NAME).insert([row]).select().single();
        console.log('New board initialised:', boardId);
    } catch (err) {
        console.error('Error inserting new board:', err);
    }
}

function performNaiveMerge(remoteBoard, localBoard) {
    if (!remoteBoard || !Array.isArray(remoteBoard)) return localBoard;
    
    const mergedBoard = JSON.parse(JSON.stringify(localBoard));
    
    // Create a map of local cards for quick lookup
    const localCards = {};
    mergedBoard.forEach(col => col.cards.forEach(c => localCards[c.id] = c));
    
    // Create a map of remote cards
    const remoteCards = {};
    remoteBoard.forEach(col => col.cards.forEach(c => remoteCards[c.id] = c));
    
    // 1. Merge properties for cards that exist in both
    for (const id in localCards) {
        if (remoteCards[id]) {
            // If remote has more comments, merge them
            const rComments = remoteCards[id].comments || [];
            const lComments = localCards[id].comments || [];
            if (rComments.length > lComments.length) {
                // simple append
                const lIds = new Set(lComments.map(c => c.id));
                rComments.forEach(rc => {
                    if (!lIds.has(rc.id)) lComments.push(rc);
                });
                localCards[id].comments = lComments;
            }
        }
    }
    
    return mergedBoard;
}

let isSaving = false;
let pendingSave = false;

async function saveToSupabase() {
    if (!supabaseClient || !currentBoardId) return;

    if (isSaving) {
        pendingSave = true;
        return;
    }

    isSaving = true;
    document.getElementById('sync-status').classList.remove('hidden');

    // Stamp this mutation so we can suppress the echo from realtime
    const mutationId = generateId();
    lastMutationId = mutationId;
    recentMutations.add(mutationId);
    setTimeout(() => recentMutations.delete(mutationId), 10000);

    if (!settings) settings = {};
    settings.lastMutationId = mutationId;

    try {
        // Fetch remote first to prevent complete overwrites
        const { data: remoteData } = await supabaseClient
            .from(TABLE_NAME)
            .select('board_data, settings')
            .eq('id', currentBoardId)
            .single();
            
        let payloadBoard = boardData;
        let payloadSettings = settings;

        if (remoteData && remoteData.settings && remoteData.settings.lastMutationId !== lastMutationId && !recentMutations.has(remoteData.settings.lastMutationId)) {
            payloadBoard = performNaiveMerge(remoteData.board_data, boardData);
            // Merge settings
            payloadSettings = { ...remoteData.settings, ...settings };
            payloadSettings.lastMutationId = mutationId; // Keep our new mutation ID
        }

        const payload = {
            id:         currentBoardId,
            app_id:     appId,
            board_data: payloadBoard,
            settings:   payloadSettings,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabaseClient
            .from(TABLE_NAME)
            .upsert(payload, { returning: 'minimal' });

        if (error) {
            console.error('Save failed:', error);
            showToast('Échec de la sauvegarde', 'red');
        } else {
            setTimeout(() => {
                document.getElementById('sync-status').classList.add('hidden');
            }, 500);
        }
    } catch (err) {
        console.error('Save error:', err);
        showToast('Échec de la sauvegarde', 'red');
    } finally {
        isSaving = false;
        if (pendingSave) {
            pendingSave = false;
            saveToSupabase();
        }
    }
}
