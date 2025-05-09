/**
 * Tiles System - Core tile management for Vibes Board
 * Includes wood texture handling and drag-and-drop functionality
 */

// Import all generated tiles
import allModules from './tiles/all-tiles.js';

// ===== WOOD TEXTURE HANDLING =====

// Simple noise implementation for procedural wood textures
class SimpleNoise {
    constructor() {
        this.seed = Math.random() * 10000;
    }
    
    // Simple 2D noise function - works for basic wood texture
    noise2D(x, y) {
        // Use a simple algorithm that gives decent random noise
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const value = Math.sin(X * 12.9898 + Y * 78.233 + this.seed) * 43758.5453;
        return (value - Math.floor(value)) * 2 - 1;
    }
}

const TEXTURE_PATH = 'assets/wood/';

// Set wood texture and save preference
export function setWood(species = 'oak') {
    document.documentElement.style.setProperty(
        '--wood-url',
        `url(${TEXTURE_PATH}${species}.jpg)`
    );
    localStorage.setItem(`vibes-woodSpecies`, species);
}

// Generate procedural wood texture as fallback
export function genWood(seedHue = 32) {
    const noise = new SimpleNoise();
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(512, 512);

    for (let y = 0; y < 512; y++) {
        for (let x = 0; x < 512; x++) {
            const v = noise.noise2D(x / 64, y / 8);          // grain stretch
            const tone = 140 + v * 50;                       // 140‑190
            const idx = (y * 512 + x) * 4;
            img.data.set([tone, tone * 0.8, tone * 0.6, 255], idx);
        }
    }
    ctx.putImageData(img, 0, 0);
    document.documentElement.style.setProperty('--wood-url', `url(${c.toDataURL()})`);
}

// Initialize wood texture from localStorage or generate procedural one
const savedWoodSpecies = localStorage.getItem(`vibes-woodSpecies`);
if (savedWoodSpecies) {
    setWood(savedWoodSpecies);
} else {
    genWood();
}

// Expose wood functions globally
window.getCurrentWoodType = () => savedWoodSpecies || 'procedural';
window.getCurrentWoodPath = () => savedWoodSpecies ? `${TEXTURE_PATH}${savedWoodSpecies}.jpg` : '';

// ===== AUDIO SYSTEM =====

let audioContext = null;
let audioInitialized = false;

// Initialize audio when user first interacts with the page
export function initAudio() {
    if (audioInitialized) return;
    
    try {
        // Create audio context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioInitialized = true;
        console.log("Audio initialized successfully");
    } catch (e) {
        console.warn('Web Audio API not supported:', e);
    }
}

// Play a wooden sound with the given parameters
export function playWoodSound(frequency, duration) {
    if (!audioContext) return;
    
    try {
        // Create oscillator
        const oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency; // Hz
        
        // Create gain node for volume control
        const gainNode = audioContext.createGain();
        
        // Set initial gain
        gainNode.gain.value = 0.3;
        
        // Exponential ramp down to create the wooden sound decay
        gainNode.gain.exponentialRampToValueAtTime(
            0.001, audioContext.currentTime + duration
        );
        
        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Start and stop
        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
        console.warn('Error playing audio:', e);
    }
}

// Specific sound functions
export function playPlaceSound() {
    // Lower frequency "thunk" sound for placement
    playWoodSound(180, 0.15);
}

export function playRemoveSound() {
    // Higher frequency "knock" sound for removal
    playWoodSound(240, 0.1);
}

// Initialize audio on first user interaction
document.addEventListener('click', initAudio, {once: true});
document.addEventListener('keydown', initAudio, {once: true});
document.addEventListener('mousedown', initAudio, {once: true});

// ===== UTILITY FUNCTIONS =====

// Apply wood texture to an element
export const applyWoodTexture = (element) => {
    if (window.getCurrentWoodPath) {
        element.style.backgroundImage = `url(${window.getCurrentWoodPath()})`;
    }
};

// Apply wood texture to multiple elements
export function applyCurrentWoodTexture(elements) {
    if (window.getCurrentWoodPath) {
        const woodPath = window.getCurrentWoodPath();
        elements.forEach(el => {
            if (el) el.style.backgroundImage = `url(${woodPath})`;
        });
    }
}

// Storage helpers with prefixed keys
export const load = (key, def) => { 
    try { 
        return JSON.parse(localStorage.getItem(`vibes-${key}`)) || def;
    } catch { 
        return def; 
    } 
};

export const save = (key, val) => { 
    localStorage.setItem(`vibes-${key}`, JSON.stringify(val)); 
};

// Export common utilities for use by tiles
export const utils = {
    pad: n => n.toString().padStart(2, '0'),
    yyyymm: d => `${d.getFullYear()}-${utils.pad(d.getMonth() + 1)}`,
    randId: () => `${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
    applyWoodTexture
};

// ===== SVG LOADING UTILITIES =====

// Function to load and apply SVG to a tile or widget
async function loadSvgForElement(element, svgPath) {
    if (!svgPath || !svgPath.endsWith('.svg')) return;
    
    try {
        // Fetch the SVG content
        const response = await fetch(svgPath);
        const svgContent = await response.text();
        
        // Create SVG element from the content
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
        const svgElement = svgDoc.documentElement;
        
        // Set attributes for styling
        svgElement.setAttribute('width', '80%');
        svgElement.setAttribute('height', '80%');
        svgElement.setAttribute('class', 'burned-svg');
        
        // Append SVG directly to element
        element.appendChild(svgElement);
        
        // Add the has-svg class to ensure proper styling
        element.classList.add('has-svg');
    } catch (error) {
        console.error('Error loading SVG:', error);
    }
}

// ===== DRAG & DROP UTILITIES =====

// Helper function to find a tile by type
function findTile(type) {
    return document.querySelector(`.tile[data-tile="${type}"]`);
}

// Helper function to check if a slot is empty
function slotIsEmpty(slot) {
    return !slot.firstElementChild;
}

    // Make an element draggable
    function makeDraggable(node, type) {
        node.draggable = true;
        
        // Standard drag events for desktop
        node.addEventListener('dragstart', e => {
            e.dataTransfer.setData('widgetId', node.id);   // present for existing widgets
            e.dataTransfer.setData('tile', type);      // always present
            
            // Add visual feedback during drag
            setTimeout(() => {
                node.classList.add('dragging');
            }, 0);
        });
        
        node.addEventListener('dragend', e => {
            // Immediately remove the dragging class to end the tilt effect
            node.classList.remove('dragging');
            
            // Only affect widgets, not tiles
            if (node.classList.contains('widget')) {
                // Force a style reset after a short delay to ensure transitions complete
                setTimeout(() => {
                    // Additional safety check to ensure dragging class is gone
                node.classList.remove('dragging');
                    
                    // Only reset if not in any special state
                    if (!node.classList.contains('dragging') && !node.classList.contains('lifting')) {
                        // Clear any inline transform styles that might be lingering
                        if (node.style.transform && node.style.transform !== 'none') {
                            node.style.transform = 'none';
                        }
                    }
                }, 50);
            }
        });
        
        // Touch events for mobile
        let touchStartX, touchStartY;
        let targetSlot = null;
        
        node.addEventListener('touchstart', e => {
            // Store initial touch position
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            
            console.log('Touch start on:', node.className, 'type:', type);
            
            // Add dragging class for visual feedback
            setTimeout(() => {
                node.classList.add('dragging');
                // Add class to body to prevent scrolling on mobile
                document.body.classList.add('is-dragging');
                
                // Add additional visual feedback for tiles
                if (node.classList.contains('tile')) {
                    // Scale slightly to indicate selection
                    node.style.transform = 'scale(1.05)';
                    node.style.zIndex = '100';
                }
            }, 0);
            
            // Initialize audio if it's the first interaction
            initAudio();
            
            // Prevent default to avoid scrolling while dragging
            e.preventDefault();
        }, { passive: false });
        
        node.addEventListener('touchmove', e => {
            if (!node.classList.contains('dragging')) return;
            
            // Get current touch position
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            
            // Move the node with the touch using transform
            // This helps user with visual feedback on where the tile will be placed
            if (node.classList.contains('tile')) {
                // For tiles, just add a visual effect
                node.style.opacity = '0.7';
            }
            
            // Find slot elements under the touch point
            const elementsUnderTouch = document.elementsFromPoint(touchX, touchY);
            const slotUnderTouch = elementsUnderTouch.find(el => el.classList.contains('slot'));
            
            // Check if there's a slot under the touch position
            if (slotUnderTouch) {
                const isEmpty = slotIsEmpty(slotUnderTouch);
                
                // Update the target slot
                if (slotUnderTouch !== targetSlot) {
                    // Remove highlighting from previous target slot
                    if (targetSlot) {
                        targetSlot.classList.remove('drag-over');
                    }
                    
                    // Add highlighting to new target slot if it's empty or can accept the widget
                    if (isEmpty) {
                        slotUnderTouch.classList.add('drag-over');
                    }
                    
                    targetSlot = slotUnderTouch;
                }
            } else if (targetSlot) {
                // No slot under touch now, remove highlight from previous target
                targetSlot.classList.remove('drag-over');
                targetSlot = null;
            }
            
            // Prevent default to avoid scrolling while dragging
            e.preventDefault();
        }, { passive: false });
        
        node.addEventListener('touchend', e => {
            // Remove dragging class
            node.classList.remove('dragging');
            // Remove scrolling prevention
            document.body.classList.remove('is-dragging');
            
            // Reset appearance for tiles
            if (node.classList.contains('tile')) {
                node.style.opacity = '';
                node.style.transform = '';
                node.style.zIndex = '';
            }
            
            // Get touch position at the end
            const touchX = e.changedTouches[0].clientX;
            const touchY = e.changedTouches[0].clientY;
            
            // Find elements under the touch point
            const elementsUnderTouch = document.elementsFromPoint(touchX, touchY);
            
            // Log for debugging
            console.log("Touch end - Elements under touch:", 
                elementsUnderTouch.map(el => el.tagName + (el.className ? '.' + el.className.replace(/ /g, '.') : '')));
            
            // First check if we're over a slot
            const slotUnderTouch = elementsUnderTouch.find(el => el.classList.contains('slot'));
            
            if (slotUnderTouch) {
                console.log("Found slot under touch:", slotUnderTouch.dataset.slot);
                
                if (targetSlot) {
                    targetSlot.classList.remove('drag-over');
                }
                
                // Create a proper drop event
                const simulatedEvent = new CustomEvent('drop', {
                    bubbles: true,
                    cancelable: true
                });
                
                // Add preventDefault method
                simulatedEvent.preventDefault = () => {};
                
                // Create a proper dataTransfer object
                simulatedEvent.dataTransfer = {
                    data: {},
                    setData: function(key, value) { this.data[key] = value; },
                    getData: function(key) { return this.data[key]; }
                };
                
                // Set the data
                simulatedEvent.dataTransfer.setData('widgetId', node.id);
                simulatedEvent.dataTransfer.setData('tile', type);
                
                // Dispatch directly on the slot
                console.log("Dispatching drop event on slot", slotUnderTouch.dataset.slot);
                handleSlotDrop(simulatedEvent, slotUnderTouch);
            }
            // Check if we're over the palette (for removing tiles)
            else {
                const isPaletteUnderTouch = elementsUnderTouch.some(el => 
                    el.id === 'palette' || el.closest('#palette')
                );
                
                if (isPaletteUnderTouch && node.classList.contains('widget')) {
                    console.log("Found palette under touch - removing widget");
                    
                    // Create a proper drop event
                    const simulatedEvent = new CustomEvent('drop', {
                        bubbles: true,
                        cancelable: true
                    });
                    
                    // Add preventDefault method
                    simulatedEvent.preventDefault = () => {};
                    
                    // Create a proper dataTransfer object
                    simulatedEvent.dataTransfer = {
                        data: {},
                        setData: function(key, value) { this.data[key] = value; },
                        getData: function(key) { return this.data[key]; }
                    };
                    
                    // Set the data
                    simulatedEvent.dataTransfer.setData('widgetId', node.id);
                    simulatedEvent.dataTransfer.setData('tile', type);
                    
                    // Get the palette element and handle the drop
                    const palette = document.getElementById('palette');
                    palette.dispatchEvent(simulatedEvent);
                }
            }
            
            // Clear target slot
            targetSlot = null;
            
            // Reset any lingering styles on mobile
            if (node.classList.contains('widget')) {
                setTimeout(() => {
                    if (!node.classList.contains('dragging') && !node.classList.contains('lifting')) {
                        if (node.style.transform && node.style.transform !== 'none') {
                            node.style.transform = 'none';
                        }
                    }
                }, 50);
            }
        }, { passive: true });
    }

// ===== LAYOUT PERSISTENCE =====

// Save the current layout to localStorage
function saveLayout() {
    const slots = [...document.querySelectorAll('.slot')];
    const layout = slots.map(sl => {
        if (slotIsEmpty(sl)) return null;
        
        const widget = sl.firstElementChild;
        return { 
            slot: sl.dataset.slot, 
            type: widget.dataset.tile,
            wood: widget.dataset.wood
        };
    });
    localStorage.setItem(`vibes-layout-v1`, JSON.stringify(layout));
}

// Load saved layout from localStorage
async function loadLayout(slots) {
    const layout = JSON.parse(localStorage.getItem(`vibes-layout-v1`) || '[]');
    
    // Process each item in the layout
    for (const item of layout) {
        if (!item) continue;
        
        const slot = document.querySelector(`.slot[data-slot="${item.slot}"]`);
        const tile = findTile(item.type);
        if (!slot || !tile || !slotIsEmpty(slot)) continue;

        // Deep clone to preserve all elements
        const widget = tile.cloneNode(true);
        widget.classList.remove('tile');
        widget.classList.add('widget');
        
        // Preserve wood type from layout data
        if (item.wood) {
            widget.dataset.wood = item.wood;
        }
        
        // Get the module for this tile type to check if it has an SVG
        const tileModule = modules[item.type];
        const hasSvgImage = tileModule?.image?.endsWith('.svg');
        
        // Handle SVG content specifically for both refresh and initial load cases
        if (hasSvgImage) {
            widget.classList.add('has-svg');
            
            // Always load a fresh SVG for the widget during layout restoration
            // This ensures it will appear correctly after page refresh
            await loadSvgForElement(widget, tileModule.image);
        }
        
        // Keep exact background image from original tile
        widget.style.backgroundImage = tile.style.backgroundImage;
        widget.id = `w-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        makeDraggable(widget, item.type);

        // Add the widget to the slot
        slot.appendChild(widget);
        
        // Hide the tile in the palette to maintain tile state
        tile.style.display = 'none';
    }
}

// ===== WOOD INFORMATION =====

// Define wood types with tone and keywords - will be used for generating whispers
const woodInfo = [
    {
        wood: "maple",
        tone: "Motivational—upbeat and forward‑looking",
        keywords: ["warmth", "clarity", "uplift", "freshness", "positivity"]
    },
    {
        wood: "oak",
        tone: "Stoic—steady, authoritative, classical rhetoric",
        keywords: ["strength", "steadfastness", "tradition", "endurance", "reliability"]
    },
    {
        wood: "walnut",
        tone: "Introspective—deep, contemplative, quietly powerful",
        keywords: ["depth", "contemplation", "wisdom", "resilience", "mystery"]
    },
    {
        wood: "beech",
        tone: "Mindful—calm, balanced, reflective, gentle guidance",
        keywords: ["calm", "neutrality", "reflection", "acceptance", "balance"]
    },
    {
        wood: "bamboo",
        tone: "Eastern‑philosophical—Confucian/Taoist simplicity and harmony, haiku-like",
        keywords: ["flexibility", "growth", "adaptability", "serenity", "lightness"]
    },
    {
        wood: "cherry",
        tone: "Poetic—warm, affectionate, lightly lyrical",
        keywords: ["warmth", "affection", "renewal", "harmony", "gentleness"]
    }
];

// Function to get wood info by type
function getWoodInfo(woodType) {
    return woodInfo.find(info => info.wood === woodType) || woodInfo[1]; // Default to oak
}

// ===== DRAG & DROP INITIALIZATION =====

// Initialize drag and drop functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // DOM refs
    const palette = document.getElementById('palette');
    const paletteContainer = document.getElementById('palette-tiles');
    const slots = [...document.querySelectorAll('.slot')];
    const messageArea = document.getElementById('message-area');

    // findTile and slotIsEmpty are now defined globally above
    
    // Create the palette tiles based on the modules registry
    function createPaletteTiles() {
        // Clear existing tiles
        paletteContainer.innerHTML = '';
        
        // Convert module entries to array, then sort by label
        const sortedTiles = Object.entries(modules)
            .map(([key, tileModule]) => ({ key, ...tileModule }))
            .sort((a, b) => (a.label || a.key).localeCompare(b.label || b.key));
        
        // For each registered tile type (now sorted)
        sortedTiles.forEach(tileModule => {
            const key = tileModule.key;
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.dataset.tile = key;
            
            // Create the grain div for wood texture overlay
            const grain = document.createElement('div');
            grain.className = 'grain';
            tile.appendChild(grain);
            
            // Apply wood type if specified
            if (tileModule.wood) {
                const woodPath = `./assets/wood/${tileModule.wood}.jpg`;
                tile.dataset.wood = tileModule.wood;
                tile.style.backgroundImage = `url(${woodPath})`;
                
                // Handle SVG images - using the new wood-type based styling
                if (tileModule.image && tileModule.image.endsWith('.svg')) {
                    // Load SVG asynchronously
                    loadSvgForElement(tile, tileModule.image);
                }
                // Apply image if available but not SVG
                else if (tileModule.image) {
                    tile.dataset.image = tileModule.image;
                    // Layer image over wood
                    tile.style.backgroundImage = `url(${tileModule.image}), url(${woodPath})`;
                }
            } else if (tileModule.image) {
                // Just image, no wood
                tile.dataset.image = tileModule.image;
                tile.style.backgroundImage = `url(${tileModule.image})`;
            }
            
            // Make it draggable
            makeDraggable(tile, key);
            
            // Add to palette
            paletteContainer.appendChild(tile);
        });
    }

    // Create initial palette tiles
    createPaletteTiles();
    
    // Load previous layout - important to wait for this to complete 
    // before proceeding with other initializations
    await loadLayout(slots);

    // Handle dropping a widget onto a slot
    function handleSlotDrop(e, slot) {
        e.preventDefault();
        // For both standard and simulated events
        const type = e.dataTransfer?.getData('tile');
        const widId = e.dataTransfer?.getData('widgetId');

        // Check if the slot is already occupied
        const existingWidget = slot.firstElementChild;
        const isSlotOccupied = !!existingWidget;

        /* --- move an existing widget -------------------------------- */
        if (widId) {
            const w = document.getElementById(widId);
            if (!w || slot === w.parentElement) return;

            // If slot is occupied, perform a swap
            if (isSlotOccupied) {
                const existingType = existingWidget.dataset.tile;
                const sourceSlot = w.parentElement;
                
                // Temporarily remove the widgets from their slots
                if (sourceSlot) sourceSlot.removeChild(w);
                slot.removeChild(existingWidget);
                
                // Place them in their new positions
                slot.appendChild(w);
                if (sourceSlot) sourceSlot.appendChild(existingWidget);
                
                // Ensure dragging classes are removed
                setTimeout(() => {
                    w.classList.remove('dragging');
                    existingWidget.classList.remove('dragging');
                }, 10);
            } else {
                // Standard move to empty slot
            /* update palette */
            const oldTile = findTile(w.dataset.tile);
            oldTile && (oldTile.style.display = ''); // Make the tile visible again

                // Move the widget to the new slot
                slot.appendChild(w);
                
                // Ensure dragging class is removed AFTER the widget is moved to new slot
                setTimeout(() => {
                    w.classList.remove('dragging');
                }, 10);
                
                const newTile = findTile(type);
                newTile && (newTile.style.display = 'none'); // Hide the tile
            }

            // Add background highlight to slot
            slot.classList.add('receiving');
            setTimeout(() => slot.classList.remove('receiving'), 300);
            
            // Play "thunk" sound
            playPlaceSound();
            
            saveLayout();
            return;
        }

        /* --- place a fresh tile from palette ----------------------------- */
        if (!type) return;
        const srcTile = findTile(type);
        if (!srcTile) return;

        // Handle swap if slot is already occupied
        if (isSlotOccupied) {
            const existingType = existingWidget.dataset.tile;
            
            // If we're dropping a tile from the palette, return the existing widget to palette
            // and place the new one in the slot
            
            // First make the existing widget's tile visible again in the palette
            const existingTile = findTile(existingType);
            if (existingTile) {
                existingTile.style.display = '';
            }
            
            // Remove the existing widget
            slot.removeChild(existingWidget);
            
            // Build and place the new widget from the palette
            const widget = createWidgetFromTile(srcTile, type);
            slot.appendChild(widget);
            
            // Hide the source tile in the palette
            srcTile.style.display = 'none';
            
            // Animation and sound
            slot.classList.add('receiving');
            setTimeout(() => slot.classList.remove('receiving'), 300);
            playPlaceSound();
            
            saveLayout();
            return;
        }
        
        // Standard case - empty slot
        /* build widget */
        const widget = createWidgetFromTile(srcTile, type);

        // Only add background highlight to slot
        slot.classList.add('receiving');
        setTimeout(() => slot.classList.remove('receiving'), 300);
        
        // Play "thunk" sound
        playPlaceSound();

        // Append the widget
        slot.appendChild(widget);
        
        // Force an immediate reset of transform after appending to ensure no tilt
        setTimeout(() => {
            widget.classList.remove('dragging');
            widget.style.transform = 'none';
        }, 0);
        
        srcTile.style.display = 'none'; // Hide the tile completely
        saveLayout();

        // Check if all slots are filled after drop
        setTimeout(checkAllSlotsFilled, 300);
    }
    
    // Helper function to create a widget from a tile
    function createWidgetFromTile(srcTile, type) {
        // Deep clone to preserve all elements including SVG
        const widget = srcTile.cloneNode(true);
        widget.classList.remove('tile');
        widget.classList.add('widget');
        
        // Ensure the dragging class is removed
        widget.classList.remove('dragging');
        
        // Preserve classes for SVG handling
        if (srcTile.classList.contains('has-svg')) {
            widget.classList.add('has-svg');
        }
        
        // Preserve exact background image and wood type
        widget.style.backgroundImage = srcTile.style.backgroundImage;
        if (srcTile.dataset.wood) {
            widget.dataset.wood = srcTile.dataset.wood;
        }
        widget.id = `w-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        
        // Clear any styles that might have been applied during dragging
        widget.style.opacity = '';
        widget.style.transform = 'none';
        widget.style.zIndex = '';
        
        // Make the widget draggable
        makeDraggable(widget, type);
        
        return widget;
    }

    // Apply lifting animation to a widget before removing it
    function applyLiftingAnimation(widget, callback) {
        // Add the lifting class to trigger the animation
        widget.classList.add('lifting');
        widget.classList.remove('dragging'); // Ensure no conflict with dragging
        
        // Remove the widget after animation completes
        widget.addEventListener('animationend', () => {
            widget.classList.remove('lifting');
            if (callback) callback();
        }, { once: true });
    }

    // Setup slots as drop targets
    slots.forEach(slot => {
        slot.addEventListener('dragover', e => {
            e.preventDefault();
            if (slotIsEmpty(slot)) {
                slot.classList.add('drag-over');
            }
        });
        
        slot.addEventListener('dragleave', () => {
            slot.classList.remove('drag-over');
        });
        
        slot.addEventListener('drop', e => {
            slot.classList.remove('drag-over');
            handleSlotDrop(e, slot);
        });
    });

    // Handle dropping widgets back to palette (removing)
    palette.addEventListener('dragover', e => e.preventDefault());
    palette.addEventListener('drop', e => {
        e.preventDefault();
        // For both standard and simulated events
        const widId = e.dataTransfer?.getData('widgetId');
        if (!widId) return;

        const w = document.getElementById(widId);
        const type = w?.dataset.tile;
        if (!w || !type) return;

        // Add return animation
        palette.classList.add('receiving');
        setTimeout(() => palette.classList.remove('receiving'), 300);

        // Play "knock" sound
        playRemoveSound();

        // Get the parent slot before removing the widget
        const parentSlot = w.parentElement;
        
        // Apply lifting animation before removing
        applyLiftingAnimation(w, () => {
            // Clear the slot after animation completes
            if (parentSlot) {
                parentSlot.innerHTML = '';
            }
            
            // Make the tile visible again
            const tile = findTile(type);
            if (tile) {
                tile.style.display = '';
            }
            
            // Save the layout
            saveLayout();
        });

        // Check if all slots are filled after removal
        setTimeout(checkAllSlotsFilled, 500);
    });

    // No need to apply wood texture to tiles
    document.addEventListener('woodSelectorReady', () => {
        // Only apply wood to the board
        const panel = document.getElementById('panel');
        if (panel) {
            const woodType = window.getCurrentWoodType ? window.getCurrentWoodType() : 'oak';
            panel.style.backgroundImage = `url(./assets/wood/${woodType}.jpg)`;
        }
    });

    // Check if all slots are filled and reveal message if true
    function checkAllSlotsFilled() {
        const allFilled = slots.every(slot => !slotIsEmpty(slot));
        
        if (allFilled) {
            revealWhisperMessage();
        } else {
            hideWhisperMessage();
        }
    }
    
    // Reveal the whisper message with animation
    function revealWhisperMessage() {
        if (!messageArea.classList.contains('revealed')) {
            // Reset all special classes and make sure the message has the right content and structure
            messageArea.classList.remove('long-quote', 'very-long-quote', 'error-message');
            
            if (!messageArea.querySelector('span')) {
                messageArea.innerHTML = '<span>Whisper into the wind...</span>';
            }
            
            messageArea.classList.add('revealed');
            
            // Add click handler if not already added
            if (!messageArea.dataset.listenerAdded) {
                messageArea.addEventListener('click', handleWhisperClick);
                messageArea.dataset.listenerAdded = 'true';
            }
        }
    }
    
    // Hide the whisper message
    function hideWhisperMessage() {
        messageArea.classList.remove('revealed', 'long-quote', 'very-long-quote', 'error-message');
        
        // Keep the content structure intact but hide it
        if (!messageArea.querySelector('span')) {
            messageArea.innerHTML = '<span>Whisper into the wind...</span>';
        }
    }
    
    // Add this function before handleWhisperClick
    function applyQuoteFormatting(element, text) {
        // Reset classes first
        element.classList.remove('long-quote', 'very-long-quote');
        
        // Apply appropriate class based on length
        if (text.length > 70 && text.length <= 100) {
            element.classList.add('long-quote');
        } else if (text.length > 100) {
            element.classList.add('very-long-quote');
        }
        
        return element;
    }
    
    // Handle click on the whisper message
    function handleWhisperClick() {
        // Get the current wood type
        const currentWoodType = window.getCurrentWoodType ? window.getCurrentWoodType() : 'oak';
        const woodData = getWoodInfo(currentWoodType);
        
        // Structure to hold the keywords for each section
        const sectionKeywords = {
            beginning: [],
            middle: [],
            end: []
        };
        
        // Function to get random items from an array
        function getRandomItems(array, count) {
            const shuffled = [...array].sort(() => Math.random() - 0.5);
            return shuffled.slice(0, Math.min(count, shuffled.length));
        }
        
        // Process each slot to collect keywords by position
        slots.forEach(slot => {
            if (!slotIsEmpty(slot)) {
                const widget = slot.firstElementChild;
                const tileType = widget.dataset.tile;
                const tileModule = modules[tileType];
                const slotNumber = parseInt(slot.dataset.slot);
                
                // Get all keywords from this tile module
                const tileKeywords = (tileModule && tileModule.keywords) ? [...tileModule.keywords] : [];
                
                // Assign keywords to sections based on slot position
                if (slotNumber === 1) {
                    sectionKeywords.beginning.push(...tileKeywords);
                } else if (slotNumber === 2) {
                    sectionKeywords.middle.push(...tileKeywords);
                } else if (slotNumber === 3) {
                    sectionKeywords.end.push(...tileKeywords);
                }
            }
        });
        
        // Add wood keywords to each section if needed to ensure we have content
        if (woodData && woodData.keywords) {
            const woodKeywords = [...woodData.keywords];
            
            // If any section is empty, add wood keywords to it
            if (sectionKeywords.beginning.length === 0) sectionKeywords.beginning.push(...woodKeywords);
            if (sectionKeywords.middle.length === 0) sectionKeywords.middle.push(...woodKeywords);
            if (sectionKeywords.end.length === 0) sectionKeywords.end.push(...woodKeywords);
        }
        
        // Get 2 random keywords from each section
        const selectedKeywords = {
            beginning: getRandomItems(sectionKeywords.beginning, 2),
            middle: getRandomItems(sectionKeywords.middle, 2),
            end: getRandomItems(sectionKeywords.end, 2)
        };
        
        // Format keywords as comma-separated strings for each section
        const beginningStr = selectedKeywords.beginning.join(" and ");
        const middleStr = selectedKeywords.middle.join(" and ");
        const endStr = selectedKeywords.end.join(" and ");
        
        // Create the human-readable instruction for the LLM prompt
        const userContent = `In a ${woodData.tone || "balanced and reflective"} tone, provide an inspirational quote for someone experiencing a journey from ${beginningStr} through ${middleStr} to ${endStr}.`;
        
        // Create the complete LLM request payload
        const whisperData = {
            "model": "llama3-70b-8192",
            "messages": [
                {
                    "role": "system",
                    "content": "You author short, uplifting quotes relevant to the user's journey. Each response must be one self‑contained sentence or poem, ≤80 characters, with no prefatory text or styling."
                },
                {
                    "role": "user",
                    "content": userContent
                }
            ],
            "temperature": 0.9,
            "max_tokens": 60,
            "top_p": 0.85,
            "presence_penalty": 0.2
        };
        
        // Show loading state
        const originalText = messageArea.querySelector('span').textContent;
        messageArea.innerHTML = '<span>Listening for a response...</span>';
        
        // Send the whisper data to our Netlify function
        async function sendWhisperToGroq() {
            try {
                // In development, use the relative path to the Netlify function
                // In production on Netlify, the /.netlify/functions/ path will be used
                const endpoint = window.location.hostname === 'localhost' 
                    ? '/.netlify/functions/whisper' 
                    : '/.netlify/functions/whisper';
                
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(whisperData)
                });
                
                if (!response.ok) {
                    throw new Error(`Error: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                // Display the quote in the message area
                if (data.quote) {
                    // Apply formatting based on quote length
                    applyQuoteFormatting(messageArea, data.quote);
                    
                    messageArea.innerHTML = `<span>${data.quote}</span>`;
                    
                    // After displaying quote, add click handler to reset
                    messageArea.addEventListener('click', () => {
                        // Reset classes when going back to original message
                        messageArea.classList.remove('long-quote', 'very-long-quote');
                        messageArea.innerHTML = `<span>${originalText}</span>`;
                    }, { once: true });
                } else {
                    // Fallback if no quote is returned
                    messageArea.classList.remove('long-quote', 'very-long-quote');
                    messageArea.innerHTML = `<span>${originalText}</span>`;
                }
            } catch (error) {
                console.error('Error sending whisper:', error);
                // Apply the error-message class for better error message display
                messageArea.classList.remove('long-quote', 'very-long-quote');
                messageArea.classList.add('error-message');
                messageArea.innerHTML = `<span>Your whisper echoed into silence...<br>(try again later)</span>`;
                
                // Reset after a delay
                setTimeout(() => {
                    messageArea.classList.remove('error-message');
                    messageArea.innerHTML = `<span>${originalText}</span>`;
                }, 6000);
            }
        }
        
        // Execute the async function
        sendWhisperToGroq();
        
        // Log the whisper data to console for debugging
        console.log('Whisper Data:', whisperData);
        
        // Dispatch a custom event that other parts of the app can listen for
        document.dispatchEvent(new CustomEvent('whisperGenerated', {
            detail: whisperData
        }));
    }
    
    // Check initial state after loading
    setTimeout(checkAllSlotsFilled, 1000);
});

// ===== TILE MODULES =====
// Update once we come to that part of the file

// Collection of tile modules
export const modules = {
    // Include all imported modules
    ...allModules,
    
    // Sunrise is a special case tile
    sunrise: {
        id: 'sunrise',
        label: 'Sunrise',
        image: './assets/img/sunrise.svg',
        wood: 'maple',
        keywords: ['beginnings', 'hope', 'renewal', 'awakening', 'dawn'],
        create() {
            console.warn('Legacy create() method called for sunrise. Using SVG tile instead.');
            return null;
        }
    }
};

// Listen for wood type changes - only apply to board, not tiles
document.addEventListener('woodTypeChanged', (e) => {
    // Update only the panel with the new wood texture
    const woodPath = `./assets/wood/${e.detail.woodType}.jpg`;
    
    // Update just the panel background
    const panel = document.getElementById('panel');
    if (panel) {
        panel.style.backgroundImage = `url(${woodPath})`;
    }
});

// Create a global Vibes object for API access
window.Vibes = {
    modules,
    wood: {
        getCurrentType: () => window.getCurrentWoodType ? window.getCurrentWoodType() : 'oak',
        setWood,
        getInfo: getWoodInfo
    },
    audio: {
        init: initAudio,
        playSound: playWoodSound
    }
};

// Legacy compatibility
window.WoodenPlanner = window.Vibes; 