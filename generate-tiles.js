/**
 * Generate Tile JS Files
 * 
 * This script reads the gen-tiles.json file and generates individual JavaScript
 * module files for each tile entry. It follows the structure template of the
 * existing tiles and ensures proper paths are used.
 */

const fs = require('fs');
const path = require('path');

// Read the gen-tiles.json file
console.log('Reading gen-tiles.json...');
const tilesData = JSON.parse(fs.readFileSync('gen-tiles.json', 'utf8'));

// Create the tiles directory if it doesn't exist
const tilesDir = 'tiles';
if (!fs.existsSync(tilesDir)) {
    console.log('Creating tiles directory...');
    fs.mkdirSync(tilesDir);
}

// Generate tile module files
console.log('Generating tile module files...');
tilesData.forEach(tile => {
    const fileName = `${tilesDir}/${tile.id}.js`;
    
    // Create module content based on template
    const moduleContent = `// tiles/${tile.id}.js
// -----------------------------------------------------------------------------
// ${tile.label} Tile 
// A mood-based tile for the vibes board.
//
//  • Shows a burned SVG icon on a ${tile.wood} wood background
//  • Uses wood-type based styling for consistent look across the ${tile.wood} wood set
//  • Carries keyword metadata for mood/atmosphere setting
// -----------------------------------------------------------------------------

export default {
    /** Unique identifier used by the board logic */
    id: '${tile.id}',

    /** Human-readable label for tooltips and accessibility */
    label: '${tile.label}',

    /** Path to the SVG icon */
    image: '${tile.image}',

    /** Wood type that best complements this tile */
    wood: '${tile.wood}',

    /** Keywords for mood/atmosphere generation */
    keywords: ${JSON.stringify(tile.keywords, null, 4).replace(/"/g, "'").replace(/\[\n/g, '[').replace(/\n\s*\]/g, ']')},

    /**
     * Legacy create method - no longer used with the new SVG tile system
     * Keeping for backward compatibility
     */
    create() {
        console.warn('Legacy create() method called. Using built-in tile system instead.');
        return null;
    }
};
`;

    // Write the module file
    fs.writeFileSync(fileName, moduleContent);
    console.log(`Generated ${fileName}`);
});

console.log('All tiles generated successfully!');

// Generate a modules import file
const modulesFile = `tiles/all-tiles.js`;
const importLines = tilesData.map(tile => `import ${tile.id} from './${tile.id}.js';`).join('\n');
const exportObject = `export default {\n    ${tilesData.map(tile => tile.id).join(',\n    ')}\n};`;

const modulesContent = `/**
 * All Tiles
 * Generated from gen-tiles.json
 */

${importLines}

${exportObject}
`;

fs.writeFileSync(modulesFile, modulesContent);
console.log(`Generated ${modulesFile}`);

console.log('Done!'); 