/**
 * STATE.JS
 * All shared mutable application state lives here.
 * Modules import these by reference — mutations are visible everywhere.
 */

// ─── Supabase Client ─────────────────────────────────────────────────────────
const { createClient } = window.supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Board State ─────────────────────────────────────────────────────────────
let currentBoardId   = null;
let boardData        = [];
let settings         = {};
let realtimeChannel  = null;
let lastMutationId   = null;
let recentMutations  = new Set();

// ─── Selection State ─────────────────────────────────────────────────────────
let isSelectMode  = false;
let selectedCards = []; // [{ cardId, colId }]

// ─── Filter State ────────────────────────────────────────────────────────────
let filterText     = '';
let filterMemberId = '';
let filterLabelId  = '';

// ─── Modal / Card Edit State ─────────────────────────────────────────────────
let currentEditCardId = null;
let currentEditColId  = null;
let tempLabels        = [];
let tempMembers       = [];
let tempChecklists    = [];
let tempComments      = [];
let tempActivities    = [];

// ─── Drag & Drop State ───────────────────────────────────────────────────────
let draggedCardId = null;
let draggedColId  = null;
let draggedType   = null; // 'CARD' | 'COL'
let sourceColId   = null;
