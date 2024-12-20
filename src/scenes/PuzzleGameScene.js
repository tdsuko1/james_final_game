import Phaser from 'phaser';

export default class PuzzleGameScene extends Phaser.Scene {
    constructor() {
        super('PuzzleGameScene');
    }

    init() {
        // Define grid and tile properties
        this.gridSize = 3;
        this.tileSize = 200; // Actual tile size (200x200 pixels)
        this.tileSpacing = 5; // Space between tiles
        this.tiles = [];
        this.emptyPosition = this.gridSize * this.gridSize - 1; // Empty tile at the last position (index 8 for a 3x3 grid)
        this.selectedColor = Phaser.Math.Between(1, 7); // Randomly select color
        this.previewScale = 0.6; // Scale for the preview on the left side
        this.previewXOffset = 200; // Space from the left edge for the preview
        this.previewYOffset = 200; // Space from the left edge for the preview

        // PuzzleGrid Width and Height Calculation
        this.gridWidth = this.tileSize * this.gridSize + this.tileSpacing * (this.gridSize - 1); // Total width of the puzzle grid
        this.gridHeight = this.tileSize * this.gridSize + this.tileSpacing * (this.gridSize - 1); // Total height of the puzzle grid

        // Center PuzzleGrid horizontally on screen (1280 x 864)
        this.gridXOffset = 600; // Centering horizontally
        this.gridYOffset = 100; // Set Y position for the grid (with some space from the top)
    }

    preload() {
        // Preload the images for the puzzle tiles (7 colors, 8 variants)
        for (var color = 1; color <= 7; color++) {
            for (var variant = 1; variant <= 8; variant++) {
                this.load.image('color_' + color + '_variant_' + variant, 'assets/color_' + color + '_variant_' + variant + '.png');
            }
        }
    }

    create() {
        // Create puzzle preview on the left side (smaller)
        this.createPuzzlePreview();

        // Create the actual puzzle grid starting from the middle
        this.createPuzzleGrid();

        // Create the start button
        this.createStartButton();

        // Shuffle the puzzle
        this.shufflePuzzle();
    }

    createPuzzlePreview() {
        var variantIndex = 1;
        var previewIndex = 1;
        for (var row = 0; row < this.gridSize; row++) {
            for (var col = 0; col < this.gridSize; col++) {
                // Only show 8 colored blocks and 1 empty block
                if (previewIndex === 9) {
                    break;
                }

                var x = this.previewXOffset + col * (this.tileSize * this.previewScale + this.tileSpacing);
                var y = this.previewYOffset + row * (this.tileSize * this.previewScale + this.tileSpacing);

                // Create the preview tiles (scaled down version)
                var previewTile = this.add.image(x, y, 'color_' + this.selectedColor + '_variant_' + variantIndex).setScale(this.previewScale); // Scale the preview tile down

                variantIndex = (variantIndex % 8) + 1;
                previewIndex++;
            }
        }
    }

    createPuzzleGrid() {
        var variantIndex = 1;
        // Initialize the 1D tiles array to hold 9 elements
        for (var i = 0; i < this.gridSize * this.gridSize; i++) {
            var row = Math.floor(i / this.gridSize); // Calculate row from index
            var col = i % this.gridSize; // Calculate column from index

            var tile = this.add.image(
                this.gridXOffset + col * (this.tileSize + this.tileSpacing),
                this.gridYOffset + row * (this.tileSize + this.tileSpacing),
                'color_' + this.selectedColor + '_variant_' + variantIndex
            ).setOrigin(0);

            tile.setData({ "index": i }); // Store the index of the tile in the array
            tile.setInteractive(); // Make the tile interactive
            
            // Add event listener for click
            tile.on('pointerdown', (pointer) => {
                this.handleTileClick(pointer, tile); // Pass the pointer and clicked tile
            });

            this.tiles[i] = tile; // Store the tile in the 1D array

            variantIndex = (variantIndex % 8) + 1;
        }
        console.log(this.tiles)
    }

    createStartButton() {
        var startButton = this.add.text(
            120, 600,
            'Start',
            { fontSize: '128px', color: '#fff', backgroundColor: '#000', padding: { x: 10, y: 5 } }
        )
        .setInteractive() // Make the text interactive
        .on('pointerdown', function() {
            // Start the game (or reset the puzzle)
            this.scene.restart();
        }, this);
    }

    shufflePuzzle() {
        for (var i = 0; i < 100; i++) {
            var neighbors = this.getValidMoves();
            var randomMove = Phaser.Utils.Array.GetRandom(neighbors);
            this.swapTiles(randomMove.y, randomMove.x, this.emptyPosition);
            this.emptyPosition = randomMove.y * this.gridSize + randomMove.x;
        }
    }

    handleTileClick(pointer, tile) {
        var clickedIndex = tile.getData("index");
        console.log(clickedIndex)
        // Only allow swap if the clicked tile is adjacent to the empty slot
        var emptyRow = Math.floor(this.emptyPosition / this.gridSize);
        var emptyCol = this.emptyPosition % this.gridSize;
        console.log(emptyCol + " - " + emptyRow)
        var clickedRow = Math.floor(clickedIndex / this.gridSize);
        var clickedCol = clickedIndex % this.gridSize;
        console.log(clickedCol + " - " + clickedRow)
        if (this.isAdjacent(clickedRow, clickedCol, emptyRow, emptyCol)) {
            this.swapTiles(clickedRow, clickedCol, emptyRow, emptyCol);
            this.emptyPosition = clickedIndex;

            // Check if the puzzle is solved after the move
            if (this.isSolved()) {
                this.scene.restart(); // Restart the game when solved
            }
        }
    }

    swapTiles(row1, col1, row2, col2) {
        var index1 = row1 * this.gridSize + col1;
        var index2 = row2 * this.gridSize + col2;

        var tile1 = this.tiles[index1];
        var tile2 = this.tiles[index2];

        // Swap the tiles in the array
        this.tiles[index1] = tile2;
        this.tiles[index2] = tile1;

        // Update tile positions
        if (tile2) {
            tile2.setPosition(
                this.gridXOffset + col1 * (this.tileSize + this.tileSpacing),
                this.gridYOffset + row1 * (this.tileSize + this.tileSpacing)
            );
            tile2.setData({ index: index1 });
        }

        if (tile1) {
            tile1.setPosition(
                this.gridXOffset + col2 * (this.tileSize + this.tileSpacing),
                this.gridYOffset + row2 * (this.tileSize + this.tileSpacing)
            );
            tile1.setData({ index: index2 });
        }
    }

    isAdjacent(row1, col1, row2, col2) {
        return (Math.abs(row1 - row2) === 1 && col1 === col2) || 
               (Math.abs(col1 - col2) === 1 && row1 === row2);
    }

    getValidMoves() {
        var x = this.emptyPosition % this.gridSize;
        var y = Math.floor(this.emptyPosition / this.gridSize);
        var neighbors = [];
        if (x > 0) neighbors.push({ x: x - 1, y: y });
        if (x < this.gridSize - 1) neighbors.push({ x: x + 1, y: y });
        if (y > 0) neighbors.push({ x: x, y: y - 1 });
        if (y < this.gridSize - 1) neighbors.push({ x: x, y: y + 1 });
        return neighbors;
    }

    isSolved() {
        var correct = true;
        var variantIndex = 1;

        // Check if the current puzzle grid matches the preview (8 colored blocks)
        for (var i = 0; i < this.tiles.length; i++) {
            var tile = this.tiles[i];

            // Skip the empty position (last tile)
            if (tile === null) {
                continue;
            }

            // Check if the tile color matches the preview color
            var row = Math.floor(i / this.gridSize);
            var col = i % this.gridSize;

            if (tile.texture.key !== 'color_' + this.selectedColor + '_variant_' + variantIndex) {
                correct = false;
                break;
            }

            variantIndex = (variantIndex % 8) + 1;
        }

        return correct;
    }
}
