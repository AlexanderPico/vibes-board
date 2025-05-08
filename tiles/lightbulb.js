// tiles/lightbulb.js
// -----------------------------------------------------------------------------
// Light‑bulb Tile 
// A mood-based tile for the vibes board.
//
//  • Shows a burned SVG icon on a oak wood background
//  • Uses wood-type based styling for consistent look across the oak wood set
//  • Carries keyword metadata for mood/atmosphere setting
// -----------------------------------------------------------------------------

export default {
    /** Unique identifier used by the board logic */
    id: 'lightbulb',

    /** Human-readable label for tooltips and accessibility */
    label: 'Light‑bulb',

    /** Path to the SVG icon */
    image: './assets/img/lightbulb.svg',

    /** Wood type that best complements this tile */
    wood: 'oak',

    /** Keywords for mood/atmosphere generation */
    keywords: [    'idea',
    'innovation',
    'insight',
    'creativity'],

    /**
     * Legacy create method - no longer used with the new SVG tile system
     * Keeping for backward compatibility
     */
    create() {
        console.warn('Legacy create() method called. Using built-in tile system instead.');
        return null;
    }
};
