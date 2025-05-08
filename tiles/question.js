// tiles/question.js
// -----------------------------------------------------------------------------
// Question Tile 
// A mood-based tile for the vibes board.
//
//  • Shows a burned SVG icon on a beech wood background
//  • Uses wood-type based styling for consistent look across the beech wood set
//  • Carries keyword metadata for mood/atmosphere setting
// -----------------------------------------------------------------------------

export default {
    /** Unique identifier used by the board logic */
    id: 'question',

    /** Human-readable label for tooltips and accessibility */
    label: 'Question',

    /** Path to the SVG icon */
    image: './assets/img/question.svg',

    /** Wood type that best complements this tile */
    wood: 'beech',

    /** Keywords for mood/atmosphere generation */
    keywords: [    'curiosity',
    'wonder',
    'exploration',
    'learning'],

    /**
     * Legacy create method - no longer used with the new SVG tile system
     * Keeping for backward compatibility
     */
    create() {
        console.warn('Legacy create() method called. Using built-in tile system instead.');
        return null;
    }
};
