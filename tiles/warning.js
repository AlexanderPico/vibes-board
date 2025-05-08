// tiles/warning.js
// -----------------------------------------------------------------------------
// Warning Tile 
// A mood-based tile for the vibes board.
//
//  • Shows a burned SVG icon on a walnut wood background
//  • Uses wood-type based styling for consistent look across the walnut wood set
//  • Carries keyword metadata for mood/atmosphere setting
// -----------------------------------------------------------------------------

export default {
    /** Unique identifier used by the board logic */
    id: 'warning',

    /** Human-readable label for tooltips and accessibility */
    label: 'Warning',

    /** Path to the SVG icon */
    image: './assets/img/warning.svg',

    /** Wood type that best complements this tile */
    wood: 'walnut',

    /** Keywords for mood/atmosphere generation */
    keywords: [    'caution',
    'alert',
    'attention',
    'readiness'],

    /**
     * Legacy create method - no longer used with the new SVG tile system
     * Keeping for backward compatibility
     */
    create() {
        console.warn('Legacy create() method called. Using built-in tile system instead.');
        return null;
    }
};
