import Phaser from 'phaser';

export default class PuzzleGameScene extends Phaser.Scene {
    constructor() {
        super('PuzzleGameScene');
    }

    init() {
        this.previewSize = 120;
        this.previewX = 100;
        this.previewY = 150;
        this.previewGap = 5; // Gap between blocks in the preview
    
        this.blockSize = 200;
        this.blockX = 600; // Position the puzzle grid to the right of the preview
        this.blockY = 100;
        this.blockGap = 5; // Gap between blocks in the actual puzzle
    
        this.previewGroup = undefined;
        this.puzzleGroup = undefined;
        this.puzzleTiles = [];
        this.emptyBlockIndex = -1;
    }
    

    preload() {
        // Load images for the 7 colors with their variants
        for (var color = 1; color <= 7; color++) {
            for (var variant = 1; variant <= 8; variant++) {
                var key = 'color_' + color + '_variant_' + variant;
                this.load.image(key, 'assets/' + key + '.png');
            }
        }
    }
    
    create() {
        // Add start button
        this.add.text(300, 600, 'Start', {
            fontSize: '128px',
            color: '#ffffff',
            backgroundColor: '#000000'
        }).setOrigin(0.5).setInteractive().on('pointerdown', () => {
            this.startGame(); // Start the game and change the color
        });
    
        // Initially, we set up the preview with a random color
        this.startGame();
    }
    
    startGame() {
        // Set a random color for the puzzle and preview
        this.puzzleColor = Phaser.Math.Between(1, 7);
    
        // Clear previous preview and puzzle if they exist
        if (this.previewGroup) {
            this.previewGroup.clear(true, true);  // Remove all preview images
        }
        if (this.puzzleGroup) {
            this.puzzleGroup.clear(true, true);  // Remove all puzzle tiles
        }
    
        // Create the new preview and puzzle with the selected color
        this.createPreview();
        this.setupPuzzle();
    }
    
    createPreview() {
        this.previewGroup = this.add.group();
    
        for (var i = 0; i < 8; i++) {
            var key = 'color_' + this.puzzleColor + '_variant_' + (i + 1); // Correct variant for preview
            var x = this.previewX + (i % 3) * (this.previewSize + this.previewGap);
            var y = this.previewY + Math.floor(i / 3) * (this.previewSize + this.previewGap);
    
            this.previewGroup.add(
                this.add.image(x, y, key).setDisplaySize(this.previewSize, this.previewSize).setOrigin(0)
            );
        }
    }

    setupPuzzle() {
        var startX = this.blockX;
        var startY = this.blockY;
        var blockSize = this.blockSize;
    
        // Generate the puzzle keys for the selected color
        var puzzleKeys = [];
        for (var variant = 1; variant <= 8; variant++) {
            puzzleKeys.push('color_' + this.puzzleColor + '_variant_' + variant);
        }
    
        // Shuffle keys and add the empty block
        Phaser.Utils.Array.Shuffle(puzzleKeys);
        var positions = puzzleKeys.concat(null); // Add null for the empty block
        Phaser.Utils.Array.Shuffle(positions); // Shuffle again for randomness
    
        // Reset the puzzle group and tiles
        this.puzzleGroup = this.add.group();
        this.puzzleTiles = Array(9).fill(null);
    
        // Place the tiles and initialize the empty block
        for (var i = 0; i < 9; i++) {
            if (positions[i]) {
                var key = positions[i];
                var x = startX + (i % 3) * (blockSize + this.blockGap);
                var y = startY + Math.floor(i / 3) * (blockSize + this.blockGap);
    
                var tile = this.add.image(x, y, key).setDisplaySize(blockSize, blockSize).setOrigin(0).setInteractive();
                this.puzzleTiles[i] = { tile: tile, index: i };
    
                this.puzzleGroup.add(tile);
    
                ((tileIndex) => {
                    tile.on('pointerdown', () => {
                        this.moveTile(tileIndex);
                    });
                })(i);
            } else {
                this.emptyBlockIndex = i; // Initial empty block position
            }
        }
    
        // Debugging: Log the initial state
        console.log("Puzzle initialized. Empty block index:", this.emptyBlockIndex);
        console.log("Initial puzzle tiles:", this.puzzleTiles.map(t => (t ? t.index : "empty")));
    }    
    
    generateShuffledKeys() {
        var keys = [];
        
        // Generate keys in the specific color-variant order
        for (var color = 1; color <= 7; color++) {
            for (var variant = 1; variant <= 8; variant++) {
                var key = 'color_' + color + '_variant_' + variant;
                keys.push(key);
            }
        }
    
        // Shuffle the keys using Fisher-Yates algorithm to randomize the puzzle
        for (var i = keys.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            [keys[i], keys[j]] = [keys[j], keys[i]]; // Swap
        }
    
        return keys;
    }
    
    moveTile(tileIndex) {
        var emptyRow = Math.floor(this.emptyBlockIndex / 3);
        var emptyCol = this.emptyBlockIndex % 3;
        var tileRow = Math.floor(tileIndex / 3);
        var tileCol = tileIndex % 3;

        // Check if the tile is adjacent to the empty block
        var dx = Math.abs(tileCol - emptyCol);
        var dy = Math.abs(tileRow - emptyRow);

        if (dx + dy === 1) { // Adjacent tiles only
            var tileData = this.puzzleTiles[tileIndex];

            if (!tileData || !tileData.tile) {
                console.error(`Error: Tile data missing at index ${tileIndex}`);
                return;
            }

            // Swap tiles in the array
            this.puzzleTiles[this.emptyBlockIndex] = tileData;
            this.puzzleTiles[tileIndex] = null;

            // Update the tile's index
            var oldEmptyIndex = this.emptyBlockIndex;
            tileData.index = oldEmptyIndex;

            // Update the empty block index
            this.emptyBlockIndex = tileIndex;

            // Move the tile visually
            tileData.tile.x = this.blockX + (oldEmptyIndex % 3) * (this.blockSize + this.blockGap);
            tileData.tile.y = this.blockY + Math.floor(oldEmptyIndex / 3) * (this.blockSize + this.blockGap);

            // Debugging: Log the state after movement
            console.log("Moved tile from index", tileIndex, "to empty index", oldEmptyIndex);
            console.log("Updated emptyBlockIndex:", this.emptyBlockIndex);
            console.log("Puzzle tiles state:", this.puzzleTiles.map(t => (t ? t.index : "empty")));
        } else {
            console.log("Moved tile from index", tileIndex)
            console.log("Tile not adjacent; no movement.");
        }
    }

}
