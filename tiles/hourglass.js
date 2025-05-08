// tiles/hourglass.js
// -----------------------------------------------------------------------------
// Hourglass Tile 
// A mood-based tile for the vibes board.
//
//  • Shows a burned SVG icon on a beech wood background
//  • Uses wood-type based styling for consistent look across the beech wood set
//  • Carries keyword metadata for mood/atmosphere setting
// -----------------------------------------------------------------------------

export default {
    /** Unique identifier used by the board logic */
    id: 'hourglass',

    /** Human-readable label for tooltips and accessibility */
    label: 'Hourglass',

    /** Path to the SVG icon */
    image: './assets/img/hourglass.svg',

    /** Wood type that best complements this tile */
    wood: 'beech',

    /** Keywords for mood/atmosphere generation */
    keywords: [    'time',
    'urgency',
    'patience',
    'opportunity'],

    /**
     * Legacy create method - no longer used with the new SVG tile system
     * Keeping for backward compatibility
     */
    create() {
        console.warn('Legacy create() method called. Using built-in tile system instead.');
        return null;
    }
};
