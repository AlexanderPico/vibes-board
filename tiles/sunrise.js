// tiles/sunrise.js
// -----------------------------------------------------------------------------
// Sunrise Tile 
// A mood-based tile for the vibes board.
//
//  • Shows a burned SVG icon on a maple wood background
//  • Uses wood-type based styling for consistent look across the maple wood set
//  • Carries keyword metadata for mood/atmosphere setting
// -----------------------------------------------------------------------------

export default {
    /** Unique identifier used by the board logic */
    id: 'sunrise',

    /** Human-readable label for tooltips and accessibility */
    label: 'Sunrise',

    /** Path to the SVG icon */
    image: './assets/img/sunrise.svg',

    /** Wood type that best complements this tile */
    wood: 'maple',

    /** Keywords for mood/atmosphere generation */
    keywords: ['hope', 'renewal', 'new beginnings', 'optimism'],

    /**
     * Legacy create method - no longer used with the new SVG tile system
     * Keeping for backward compatibility
     */
    create() {
        console.warn('Legacy create() method called. Using built-in tile system instead.');
        return null;
    }
};
