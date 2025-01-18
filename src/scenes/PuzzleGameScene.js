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
        this.puzzleGrid = []; // 2D array to store puzzle tiles
        this.emptyBlockPosition = { row: -1, col: -1 }; // Position of the empty block
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
        var emptyIndex = Phaser.Math.Between(0, 8); // Random index for the empty block
        var positions = [];
    
        for (var i = 0; i < 9; i++) {
            if (i === emptyIndex) {
                positions.push(null); // Add null for the empty block
            } else {
                positions.push(puzzleKeys.pop()); // Add shuffled puzzle key
            }
        }
    
        // Reset the puzzle group and the grid
        this.puzzleGroup = this.add.group();
        this.puzzleGrid = Array(3).fill().map(() => Array(3).fill(null)); // 2D array for 3x3 grid
    
        // Place the tiles and initialize the empty block
        for (var row = 0; row < 3; row++) {
            for (var col = 0; col < 3; col++) {
                var index = row * 3 + col;
                var key = positions[index];
    
                if (key !== null) {
                    var x = startX + col * (blockSize + this.blockGap);
                    var y = startY + row * (blockSize + this.blockGap);
    
                    var tile = this.add.image(x, y, key).setDisplaySize(blockSize, blockSize).setOrigin(0).setInteractive();
                    this.puzzleGrid[row][col] = { tile: tile, key: key };
    
                    this.puzzleGroup.add(tile);
    
                    ((r, c) => {
                        tile.on('pointerdown', () => {
                            this.moveTile(r, c);
                        });
                    })(row, col);
                } else {
                    this.emptyBlockPosition = { row, col }; // Initial empty block position
                }
            }
        }
    
        // Debugging: Log the initial state
        console.log("Puzzle initialized. Empty block at:", this.emptyBlockPosition);
    }
        

    moveTile(row, col) {
        // Check if the clicked tile is adjacent to the empty block
        const emptyRow = this.emptyBlockPosition.row;
        const emptyCol = this.emptyBlockPosition.col;
        
        const dx = Math.abs(col - emptyCol);
        const dy = Math.abs(row - emptyRow);
        
        // Check if the tile clicked is adjacent to the empty block
        if (dx + dy === 1) { // Adjacent tiles only
            const tileData = this.puzzleGrid[row][col];
            const emptyTileData = this.puzzleGrid[emptyRow][emptyCol];
    
            // Swap the clicked tile with the empty block
            if (tileData && !emptyTileData) {
                // Update the empty block position
                this.emptyBlockPosition = { row, col };
    
                // Move the tiles visually
                tileData.tile.x = this.blockX + emptyCol * (this.blockSize + this.blockGap);
                tileData.tile.y = this.blockY + emptyRow * (this.blockSize + this.blockGap);
    
                // emptyTileData.tile.x = this.blockX + col * (this.blockSize + this.blockGap);
                // emptyTileData.tile.y = this.blockY + row * (this.blockSize + this.blockGap);

                tileData.tile.removeAllListeners('pointerdown');
                tileData.tile.setInteractive().on('pointerdown', () => {
                    this.moveTile(emptyRow, emptyCol);  // Move the empty block to this tile's position
                });
    
                // emptyTileData.tile.removeAllListeners('pointerdown');
                // emptyTileData.tile.setInteractive().on('pointerdown', () => {
                //     this.moveTile(row, col);  // Move this tile to the empty space
                // });

                this.puzzleGrid[emptyRow][emptyCol] = tileData; // Move clicked tile to empty space
                this.puzzleGrid[row][col] = emptyTileData; // Move empty tile to clicked tile's position
    
                // Debugging: Log the state after movement
                console.log("Moved tile at position", row, col, "to empty space at", emptyRow, emptyCol);
                console.log("Puzzle grid state:", this.puzzleGrid);

                // Check if puzzle is solved after each move
                if (this.isPuzzleSolved()) {
                    console.log("Congratulations! Puzzle solved.");
                }
            }
        } else {
            console.log("Tile at", row, col, "is not adjacent to empty space.");
        }
    }   
    
    isPuzzleSolved() {
        // Check if each tile is in the correct position
        var variant = 1;
        for (var row = 0; row < 3; row++) {
            for (var col = 0; col < 3; col++) {
                if (this.puzzleGrid[row][col]) {
                    var key = 'color_' + this.puzzleColor + '_variant_' + variant;
                    if (this.puzzleGrid[row][col].key !== key) {
                        return false; // Puzzle not solved
                    }
                    variant++;
                }
            }
        }
        return true; // Puzzle solved
    }
}
