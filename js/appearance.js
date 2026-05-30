/**
 * APPEARANCE.JS
 * Manages client-side appearance settings (like wallpaper) stored in localStorage.
 */

const PREDEFINED_WALLPAPERS = [
    { id: 'default', name: 'Vagues colorées', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop' },
    { id: 'mountains', name: 'Montagnes', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2564&auto=format&fit=crop' },
    { id: 'gradient', name: 'Dégradé', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2564&auto=format&fit=crop' },
    { id: 'dark', name: 'Sombre minimaliste', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2564&auto=format&fit=crop' },
    { id: 'nature', name: 'Forêt tropicale', url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2564&auto=format&fit=crop' },
    { id: 'space', name: 'Espace cosmique', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2564&auto=format&fit=crop' }
];

function initWallpaper() {
    const savedUrl = localStorage.getItem('tralalero_wallpaper');
    if (savedUrl) {
        document.body.style.backgroundImage = `url('${savedUrl}')`;
    }
}

// Initialiser le fond d'écran dès le chargement de ce fichier
initWallpaper();

function openAppearanceModal() {
    renderWallpaperGrid();
    document.getElementById('appearance-modal').classList.remove('hidden');
}

function closeAppearanceModal(e, force) {
    if (force || (e && e.target.id === 'appearance-modal')) {
        document.getElementById('appearance-modal').classList.add('hidden');
    }
}

function renderWallpaperGrid() {
    const grid = document.getElementById('wallpaper-grid');
    if (!grid) return;

    const currentUrl = localStorage.getItem('tralalero_wallpaper') || PREDEFINED_WALLPAPERS[0].url;

    grid.innerHTML = PREDEFINED_WALLPAPERS.map(wp => {
        const isSelected = currentUrl === wp.url;
        return `
            <div onclick="selectWallpaper('${wp.url}')" class="group relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-200 ${isSelected ? 'border-pink-500 shadow-lg shadow-pink-500/30 scale-105 z-10' : 'border-transparent hover:border-slate-300 hover:shadow-md'} h-24 bg-slate-100">
                <img src="${wp.url}" class="w-full h-full object-cover" alt="${wp.name}">
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px] ${isSelected ? 'opacity-100 bg-black/20' : ''}">
                    ${isSelected 
                        ? '<i class="ph-fill ph-check-circle text-pink-500 text-3xl drop-shadow-md bg-white rounded-full leading-none"></i>'
                        : '<span class="text-white text-xs font-bold tracking-wider uppercase drop-shadow-md">Choisir</span>'
                    }
                </div>
                <div class="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent">
                    <p class="text-white text-[10px] font-bold truncate text-center">${wp.name}</p>
                </div>
            </div>
        `;
    }).join('');
}

function selectWallpaper(url) {
    localStorage.setItem('tralalero_wallpaper', url);
    document.body.style.backgroundImage = `url('${url}')`;
    renderWallpaperGrid(); // Mettre à jour l'état de sélection
    
    if (typeof showToast === 'function') {
        showToast("Fond d'écran mis à jour !", 'pink');
    }
}

function setCustomWallpaper() {
    const input = document.getElementById('custom-wallpaper-url');
    if (!input) return;
    
    const url = input.value.trim();
    if (!url) return;
    
    if (!url.startsWith('http')) {
        alert("L'URL doit commencer par http:// ou https://");
        return;
    }
    
    selectWallpaper(url);
    input.value = '';
}
