/**
 * CHAT-DRAG.JS
 * Makes the chat widget fully draggable and 8-way resizable.
 */
document.addEventListener('DOMContentLoaded', () => {
    const chatWidget = document.getElementById('chat-widget');
    const chatHeader = document.getElementById('chat-header');

    if (!chatWidget || !chatHeader) return;

    // --- DRAGGING LOGIC ---
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    function ensureAbsolute() {
        if (!chatWidget.style.left) {
            const rect = chatWidget.getBoundingClientRect();
            chatWidget.classList.remove('bottom-6', 'right-6');
            chatWidget.style.left = rect.left + 'px';
            chatWidget.style.top = rect.top + 'px';
            chatWidget.style.bottom = 'auto';
            chatWidget.style.right = 'auto';
            chatWidget.style.margin = '0';
        }
    }

    chatHeader.addEventListener('mousedown', (e) => {
        if (e.target.closest('button')) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        
        ensureAbsolute();
        chatWidget.style.transition = 'none';

        initialLeft = parseFloat(chatWidget.style.left);
        initialTop = parseFloat(chatWidget.style.top);
        chatHeader.style.cursor = 'grabbing';
    });


    chatHeader.style.cursor = 'grab';

    // --- RESIZING LOGIC ---
    const handles = [
        { class: 'top-0 left-0 w-4 h-4 cursor-nwse-resize', type: 'tl' },
        { class: 'top-0 right-0 w-4 h-4 cursor-nesw-resize', type: 'tr' },
        { class: 'bottom-0 left-0 w-4 h-4 cursor-nesw-resize', type: 'bl' },
        { class: 'bottom-0 right-0 w-4 h-4 cursor-nwse-resize', type: 'br' },
        { class: 'top-0 left-4 right-4 h-2 cursor-ns-resize', type: 't' },
        { class: 'bottom-0 left-4 right-4 h-2 cursor-ns-resize', type: 'b' },
        { class: 'left-0 top-4 bottom-4 w-2 cursor-ew-resize', type: 'l' },
        { class: 'right-0 top-4 bottom-4 w-2 cursor-ew-resize', type: 'r' }
    ];

    let isResizing = false;
    let currentHandle = null;
    let initialWidth, initialHeight;

    handles.forEach(h => {
        const handleDiv = document.createElement('div');
        handleDiv.className = `absolute z-[100] ${h.class}`;
        chatWidget.appendChild(handleDiv);

        handleDiv.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isResizing = true;
            currentHandle = h.type;
            startX = e.clientX;
            startY = e.clientY;
            
            ensureAbsolute();
            chatWidget.style.transition = 'none';

            initialLeft = parseFloat(chatWidget.style.left);
            initialTop = parseFloat(chatWidget.style.top);
            initialWidth = chatWidget.offsetWidth;
            initialHeight = chatWidget.offsetHeight;
        });
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            e.preventDefault();
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            let newLeft = initialLeft + dx;
            let newTop  = initialTop  + dy;
            const maxLeft = window.innerWidth  - chatWidget.offsetWidth;
            const maxTop  = window.innerHeight - chatWidget.offsetHeight;
            if (newLeft < 0) newLeft = 0;
            if (newTop  < 0) newTop  = 0;
            if (newLeft > maxLeft) newLeft = maxLeft;
            if (newTop  > maxTop)  newTop  = maxTop;
            chatWidget.style.left = newLeft + 'px';
            chatWidget.style.top  = newTop  + 'px';
        } else if (isResizing) {
            e.preventDefault();
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            let newWidth  = initialWidth;
            let newHeight = initialHeight;
            let newLeft   = initialLeft;
            let newTop    = initialTop;
            const minWidth = 280, minHeight = 350;
            if (currentHandle.includes('r')) newWidth = initialWidth + dx;
            if (currentHandle.includes('l')) { newWidth = initialWidth - dx; newLeft = initialLeft + dx; }
            if (currentHandle.includes('b')) newHeight = initialHeight + dy;
            if (currentHandle.includes('t')) { newHeight = initialHeight - dy; newTop = initialTop + dy; }
            if (newWidth < minWidth) {
                if (currentHandle.includes('l')) newLeft = initialLeft + (initialWidth - minWidth);
                newWidth = minWidth;
            }
            if (newHeight < minHeight) {
                if (currentHandle.includes('t')) newTop = initialTop + (initialHeight - minHeight);
                newHeight = minHeight;
            }
            chatWidget.style.width  = newWidth  + 'px';
            chatWidget.style.height = newHeight + 'px';
            chatWidget.style.left   = newLeft   + 'px';
            chatWidget.style.top    = newTop    + 'px';
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            chatHeader.style.cursor = 'grab';
            chatWidget.style.transition = 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out';
        } else if (isResizing) {
            isResizing = false;
            currentHandle = null;
            chatWidget.style.transition = 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out';
        }
    });
});
