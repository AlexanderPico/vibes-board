// tiles/sunrise.js
// -----------------------------------------------------------------------------
// Sunrise Tile 
// A mood-based tile for the vibes board.
//
//  • Shows a sunrise photo over a maple-wood background
//  • Carries keyword metadata for the quote-generator
//  • Exposes a create() factory the board calls when the tile is dropped
// -----------------------------------------------------------------------------

export default {
    /** Unique identifier used by the board logic */
    id: 'sunrise',

    /** Human-readable label (can be shown in tooltips, etc.) */
    label: 'Sunrise',

    /** Path to the tile's overlay image */
    image: './assets/img/sunrise.svg',

    /** Wood grain that best matches the mood (maple = light & warm) */
    wood: 'maple',

    /** Words fed into the AI prompt when this tile is active */
    keywords: ['hope', 'renewal', 'new beginnings', 'optimism'],

    /**
     * Create the DOM element representing this tile.
     * The board will insert it into a slot, and CSS handles sizing.
     */
    create() {
        // Outer wrapper
        const el = document.createElement('div');
        el.className = 'widget sunrise';

        // Apply the wood grain as a CSS variable so the global stylesheet
        // can reuse it for carved-text shadows, etc.
        el.style.setProperty('--wood-url', 'url("./assets/wood/maple.jpg")');

        // Layer the photo over the wood (photo first for object-fit behavior,
        // wood underneath so edges show through slightly)
        el.style.backgroundImage = `url(${this.image}), var(--wood-url)`;
        el.style.backgroundSize = 'cover';

        // Optional carved heading to give each tile a "branded" feel
        const header = document.createElement('header');
        header.textContent = this.label;
        el.appendChild(header);

        // Expose metadata on the element for quick lookup (drag-and-drop, etc.)
        el.dataset.tileId = this.id;
        el.dataset.keywords = this.keywords.join(',');

        return el;
    }
};
