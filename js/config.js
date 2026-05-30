/**
 * CONFIG.JS
 * Supabase credentials, app constants, default data, and color palettes.
 * Nothing here should be mutable — these are read-only references.
 */

const SUPABASE_URL = (typeof __supabase_url !== 'undefined')
    ? __supabase_url
    : 'https://emanyobeiadjfpnwrzku.supabase.co';

const SUPABASE_KEY = (typeof __supabase_key !== 'undefined')
    ? __supabase_key
    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtYW55b2JlaWFkamZwbndyemt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMzI4OTEsImV4cCI6MjA3OTcwODg5MX0.CDRCDpbuscHFPx4XD-HT73btAZAazugZWePegTRv6iM';

const appId = (typeof __app_id !== 'undefined') ? __app_id : 'default-app-id';

const TABLE_NAME = 'boards';

// ─── Default Data ────────────────────────────────────────────────────────────

const defaultBoardData = [
    {
        id: 'col-1',
        title: 'À faire !',
        cards: [
            {
                id: 'card-1',
                content: 'Salut ! 👋',
                description: 'Clique sur partager pour travailler à plusieurs sur ce "Tralalero".',
                labels: ['l1'],
                members: ['m1']
            },
        ]
    },
    { id: 'col-2', title: 'Fait !', cards: [] },
];

const defaultSettings = {
    boardTitle: 'Mon Nouveau Tralalero',
    labels: [
        { id: 'l1', colorName: 'red',     name: 'Urgent' },
        { id: 'l2', colorName: 'blue',    name: 'Dev'    },
        { id: 'l3', colorName: 'emerald', name: 'Design' },
    ],
    members: [
        { id: 'm1', name: 'Par Défaut', initials: 'D', colorName: 'blue' },
    ]
};

// ─── Label Color System ──────────────────────────────────────────────────────
//
// LABEL_COLOR_CONFIG  — full rich config used by the settings panel
// LABEL_COLORS        — derived backward-compatible map used by render.js cards

const LABEL_COLOR_CONFIG = {
    'red':      { classes: 'bg-red-100 text-red-700 border-red-200',             dot: 'bg-red-400',      name: 'Rouge'      },
    'orange':   { classes: 'bg-orange-100 text-orange-700 border-orange-200',    dot: 'bg-orange-400',   name: 'Orange'     },
    'amber':    { classes: 'bg-amber-100 text-amber-700 border-amber-200',       dot: 'bg-amber-400',    name: 'Ambre'      },
    'yellow':   { classes: 'bg-yellow-100 text-yellow-700 border-yellow-200',    dot: 'bg-yellow-400',   name: 'Jaune'      },
    'lime':     { classes: 'bg-lime-100 text-lime-700 border-lime-200',          dot: 'bg-lime-500',     name: 'Citron'     },
    'green':    { classes: 'bg-green-100 text-green-700 border-green-200',       dot: 'bg-green-500',    name: 'Vert'       },
    'emerald':  { classes: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500',  name: 'Émeraude'   },
    'teal':     { classes: 'bg-teal-100 text-teal-700 border-teal-200',          dot: 'bg-teal-500',     name: 'Sarcelle'   },
    'cyan':     { classes: 'bg-cyan-100 text-cyan-700 border-cyan-200',          dot: 'bg-cyan-500',     name: 'Cyan'       },
    'sky':      { classes: 'bg-sky-100 text-sky-700 border-sky-200',             dot: 'bg-sky-500',      name: 'Ciel'       },
    'blue':     { classes: 'bg-blue-100 text-blue-700 border-blue-200',          dot: 'bg-blue-500',     name: 'Bleu'       },
    'indigo':   { classes: 'bg-indigo-100 text-indigo-700 border-indigo-200',    dot: 'bg-indigo-500',   name: 'Indigo'     },
    'violet':   { classes: 'bg-violet-100 text-violet-700 border-violet-200',    dot: 'bg-violet-500',   name: 'Violet'     },
    'purple':   { classes: 'bg-purple-100 text-purple-700 border-purple-200',    dot: 'bg-purple-500',   name: 'Mauve'      },
    'pink':     { classes: 'bg-pink-100 text-pink-700 border-pink-200',          dot: 'bg-pink-400',     name: 'Rose'       },
    'rose':     { classes: 'bg-rose-100 text-rose-700 border-rose-200',          dot: 'bg-rose-400',     name: 'Framboise'  },
    'gray':     { classes: 'bg-slate-100 text-slate-600 border-slate-200',       dot: 'bg-slate-400',    name: 'Gris'       },
};

/** Backward-compatible map: colorName → CSS classes string (used by card badges) */
const LABEL_COLORS = Object.fromEntries(
    Object.entries(LABEL_COLOR_CONFIG).map(([k, v]) => [k, v.classes])
);

// ─── Avatar Color System ──────────────────────────────────────────────────────
//
// AVATAR_COLOR_CONFIG — full config used by the settings panel
// AVATAR_COLORS       — derived backward-compatible map used by render.js cards

const AVATAR_COLOR_CONFIG = {
    'blue':    { bg: 'bg-blue-500',    name: 'Bleu'       },
    'emerald': { bg: 'bg-emerald-500', name: 'Émeraude'   },
    'violet':  { bg: 'bg-violet-500',  name: 'Violet'     },
    'amber':   { bg: 'bg-amber-500',   name: 'Ambre'      },
    'rose':    { bg: 'bg-rose-500',    name: 'Framboise'  },
    'cyan':    { bg: 'bg-cyan-500',    name: 'Cyan'       },
    'slate':   { bg: 'bg-slate-500',   name: 'Ardoise'    },
    'orange':  { bg: 'bg-orange-500',  name: 'Orange'     },
    'teal':    { bg: 'bg-teal-500',    name: 'Sarcelle'   },
    'pink':    { bg: 'bg-pink-500',    name: 'Rose vif'   },
    'indigo':  { bg: 'bg-indigo-500',  name: 'Indigo'     },
    'lime':    { bg: 'bg-lime-500',    name: 'Citron'     },
    'red':     { bg: 'bg-red-500',     name: 'Rouge'      },
    'sky':     { bg: 'bg-sky-500',     name: 'Ciel'       },
};

/** Backward-compatible map: colorName → bg class string (used by avatars) */
const AVATAR_COLORS = Object.fromEntries(
    Object.entries(AVATAR_COLOR_CONFIG).map(([k, v]) => [k, v.bg])
);
