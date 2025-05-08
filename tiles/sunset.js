// tiles/sunset.js
// -----------------------------------------------------------------------------
// Sunset Tile 
// A mood-based tile for the vibes board.
//
//  • Shows a burned SVG icon on a cherry wood background
//  • Uses wood-type based styling for consistent look across the cherry wood set
//  • Carries keyword metadata for mood/atmosphere setting
// -----------------------------------------------------------------------------

export default {
    /** Unique identifier used by the board logic */
    id: 'sunset',

    /** Human-readable label for tooltips and accessibility */
    label: 'Sunset',

    /** Path to the SVG icon */
    image: './assets/img/sunset.svg',

    /** Wood type that best complements this tile */
    wood: 'cherry',

    /** Keywords for mood/atmosphere generation */
    keywords: [    'reflection',
    'closure',
    'warmth',
    'peace'],

    /**
     * Legacy create method - no longer used with the new SVG tile system
     * Keeping for backward compatibility
     */
    create() {
        console.warn('Legacy create() method called. Using built-in tile system instead.');
        return null;
    }
};
