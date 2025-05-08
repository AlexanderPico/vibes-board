// tiles/bird.js
// -----------------------------------------------------------------------------
// Bird Tile 
// A mood-based tile for the vibes board.
//
//  • Shows a burned SVG icon on a bamboo wood background
//  • Uses wood-type based styling for consistent look across the bamboo wood set
//  • Carries keyword metadata for mood/atmosphere setting
// -----------------------------------------------------------------------------

export default {
    /** Unique identifier used by the board logic */
    id: 'bird',

    /** Human-readable label for tooltips and accessibility */
    label: 'Bird',

    /** Path to the SVG icon */
    image: './assets/img/bird.svg',

    /** Wood type that best complements this tile */
    wood: 'bamboo',

    /** Keywords for mood/atmosphere generation */
    keywords: [    'freedom',
    'flight',
    'lightness',
    'song'],

    /**
     * Legacy create method - no longer used with the new SVG tile system
     * Keeping for backward compatibility
     */
    create() {
        console.warn('Legacy create() method called. Using built-in tile system instead.');
        return null;
    }
};
