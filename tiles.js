/**
 * Tiles System - Core tile management for Vibes Board
 * Includes wood texture handling and drag-and-drop functionality
 */

// Import individual modules
import sunrise from './tiles/sunrise.js';
import bird from './tiles/bird.js';
import mountains from './tiles/mountains.js';
import smile from './tiles/smile.js';
// Import all generated modules
import allModules from './tiles/all-modules.js';

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

// Export common utilities for use by modules
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

// ===== DRAG & DROP INITIALIZATION =====

// Initialize drag and drop functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // DOM refs
    const palette = document.getElementById('palette');
    const paletteContainer = document.getElementById('palette-tiles');
    const slots = [...document.querySelectorAll('.slot')];

    // findTile and slotIsEmpty are now defined globally above
    
    // Create the palette tiles based on the modules registry
    function createPaletteTiles() {
        // Clear existing tiles
        paletteContainer.innerHTML = '';
        
        // For each registered tile type
        Object.entries(modules).forEach(([key, tileModule]) => {
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
        const type = e.dataTransfer.getData('tile');
        const widId = e.dataTransfer.getData('widgetId');

        /* --- move an existing widget -------------------------------- */
        if (widId) {
            const w = document.getElementById(widId);
            if (!w || slot === w.parentElement || !slotIsEmpty(slot)) return;

            /* update palette */
            const oldTile = findTile(w.dataset.tile);
            oldTile && (oldTile.style.display = ''); // Make the tile visible again

            // Only add background highlight to slot, not animation to widget
            slot.classList.add('receiving');
            setTimeout(() => slot.classList.remove('receiving'), 300);
            
            // Play "thunk" sound
            playPlaceSound();
            
            // Move the widget to the new slot
            slot.appendChild(w);
            
            // Ensure dragging class is removed AFTER the widget is moved to new slot
            setTimeout(() => {
                w.classList.remove('dragging');
            }, 10);
            
            const newTile = findTile(type);
            newTile && (newTile.style.display = 'none'); // Hide the tile
            saveLayout();
            return;
        }

        /* --- place a fresh tile ----------------------------------- */
        if (!type || !slotIsEmpty(slot)) return;
        const srcTile = findTile(type);
        if (!srcTile || !slotIsEmpty(slot)) return;

        /* build widget */
        // Deep clone to preserve all elements including SVG
        const widget = srcTile.cloneNode(true);
        widget.classList.remove('tile');
        widget.classList.add('widget');
        
        // Preserve classes for SVG handling
        if (srcTile.classList.contains('has-svg')) {
            widget.classList.add('has-svg');
        }
        
        // Preserve exact background image and wood type
        widget.style.backgroundImage = srcTile.style.backgroundImage;
        widget.id = `w-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        makeDraggable(widget, type);

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
        const widId = e.dataTransfer.getData('widgetId');
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
});

// Create and export module registry
export const modules = {
    // Include the manually imported tiles
    sunrise,
    bird,
    mountains,
    smile,
    // Include all generated modules
    ...allModules
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
        setWood
    },
    audio: {
        init: initAudio,
        playSound: playWoodSound
    }
};

// Legacy compatibility
window.WoodenPlanner = window.Vibes; 