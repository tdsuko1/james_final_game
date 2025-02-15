import Phaser from 'phaser';

export default class PuzzleGameScene extends Phaser.Scene {
    constructor() {
        super('puzzle-game-scene');
    }

    init() {
        this.previewSize = 120;
        this.previewX = 100;
        this.previewY = 150;
        this.previewGap = 5; 

        this.blockSize = 200;
        this.blockX = 600; 
        this.blockY = 100;
        this.blockGap = 5; 

        this.previewGroup = undefined;
        this.puzzleGroup = undefined;
        this.puzzleGrid = []; 
        this.emptyBlockPosition = { row: -1, col: -1 }; 
    }

    preload() {
        for (var color = 1; color <= 7; color++) {
            for (var variant = 1; variant <= 8; variant++) {
                var key = 'color_' + color + '_variant_' + variant;
                this.load.image(key, 'assets/' + key + '.png');
            }
        }
        this.load.image('confetti', 'assets/confetti.png'); 
    }

    create() {
        this.add.text(300, 600, 'Start', {
            fontSize: '128px',
            color: '#ffffff',
            backgroundColor: '#000000'})
        .setOrigin(0.5).setInteractive()
        .on('pointerdown', () => {
            this.startGame(); 
        });

        this.moveLabel = this.add.text(10, 10, "Moves: 0", {
            fontSize: "50px",
            color: "white",
            backgroundColor: "black",
        }).setDepth(1)

        this.startGame();

        // Create a particle manager
        this.confettiParticles = this.add.particles('confetti');

        // Create an emitter with proper settings
        this.confettiEmitter = this.confettiParticles.createEmitter({
            // x: this.blockX + this.blockSize, // Center it around the puzzle
            // y: this.blockY + this.blockSize,
            x: this.scale.width / 2,
            y: this.scale.height / 2,
            speed: { min: 200, max: 400 },
            angle: { min: 0, max: 360 },
            scale: { start: 5, end: 0 }, // Bigger pixels for visibility
            lifespan: 1000,
            gravityY: 300,
            blendMode: 'ADD',
            tint: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff] // Random colors
        });
        
        this.confettiEmitter.stop();  // Hide confetti initially
    }

    startGame() {
        this.puzzleColor = Phaser.Math.Between(1, 7);

        if (this.previewGroup) {
            this.previewGroup.clear(true, true);  
        }
        if (this.puzzleGroup) {
            this.puzzleGroup.clear(true, true);  
        }

        this.moves = 0
		this.moveLabel.setText(`Moves: ${this.moves}`)

        this.createPreview();
        this.setupPuzzle();
    }

    createPreview() {
        this.previewGroup = this.add.group();
        this.previewGrid = Array(3).fill().map(() => Array(3).fill(null)); // 2D array for 3x3 preview grid
    
        var index = 0;
        for (var row = 0; row < 3; row++) {
            for (var col = 0; col < 3; col++) {
                if (index < 8) { 
                    var key = 'color_' + this.puzzleColor + '_variant_' + (index + 1);
                    var x = this.previewX + col * (this.previewSize + this.previewGap);
                    var y = this.previewY + row * (this.previewSize + this.previewGap);
    
                    var tile = this.add.image(x, y, key)
                        .setDisplaySize(this.previewSize, this.previewSize)
                        .setOrigin(0);
    
                    this.previewGrid[row][col] = { tile: tile, key: key };
                    this.previewGroup.add(tile);
                } else {
                    this.previewGrid[row][col] = null; 
                }
                index++;
            }
        }
    }    
    
    setupPuzzle() {
        var startX = this.blockX;
        var startY = this.blockY;
        var blockSize = this.blockSize;
    
        var basePuzzleKeys = [];
        for (var variant = 1; variant <= 8; variant++) {
            basePuzzleKeys.push('color_' + this.puzzleColor + '_variant_' + variant);
        }
    
        var isSolvable = false;
        var positions;
    
        while (!isSolvable) {
            var puzzleKeys = [...basePuzzleKeys];
            Phaser.Utils.Array.Shuffle(puzzleKeys);
            
            var emptyIndex = Phaser.Math.Between(0, 8);
            positions = [];
    
            for (var i = 0; i < 9; i++) {
                if (i === emptyIndex) {
                    positions.push(null); 
                } else {
                    positions.push(puzzleKeys.pop()); 
                }
            }
    
            isSolvable = this.isSolvable(positions);
        }
    
        this.puzzleGroup = this.add.group();
        this.puzzleGrid = Array(3).fill().map(() => Array(3).fill(null));
    
        for (var row = 0; row < 3; row++) {
            for (var col = 0; col < 3; col++) {
                var index = row * 3 + col;
                var key = positions[index];
    
                if (key !== null) {
                    var x = startX + col * (blockSize + this.blockGap);
                    var y = startY + row * (blockSize + this.blockGap);
    
                    var tile = this.add.image(x, y, key)
                        .setDisplaySize(blockSize, blockSize)
                        .setOrigin(0).setInteractive();
                    this.puzzleGrid[row][col] = { tile: tile, key: key };
    
                    this.puzzleGroup.add(tile);
    
                    ((r, c) => {
                        tile.on('pointerdown', () => {
                            this.moveTile(r, c);
                        });
                    })(row, col);
                } else {
                    this.emptyBlockPosition = { row, col };
                }
            }
        }
    
        console.log("Puzzle initialized. Empty block at:", this.emptyBlockPosition);
    }
    
    isSolvable(positions) {
        var flatPositions = positions.filter(key => key !== null);

        var inversions = 0;
        for (var i = 0; i < flatPositions.length; i++) {
            for (var j = i + 1; j < flatPositions.length; j++) {
                if (flatPositions[i] > flatPositions[j]) {
                    inversions++;
                }
            }
        }
        console.log("Inversions:", inversions);
        // For 3x3 puzzle (odd grid width), solvability depends only on inversions being even
        return inversions % 2 === 0;
    }    

    moveTile(row, col) {
        const emptyRow = this.emptyBlockPosition.row;
        const emptyCol = this.emptyBlockPosition.col;
        
        const dx = Math.abs(col - emptyCol);
        const dy = Math.abs(row - emptyRow);
        
        if (dx + dy === 1) { 
            const tileData = this.puzzleGrid[row][col];
            const emptyTileData = this.puzzleGrid[emptyRow][emptyCol];
    
            if (tileData && !emptyTileData) {
                this.emptyBlockPosition = { row, col };

                tileData.tile.x = this.blockX + emptyCol * (this.blockSize + this.blockGap);
                tileData.tile.y = this.blockY + emptyRow * (this.blockSize + this.blockGap);
    
                tileData.tile.removeAllListeners('pointerdown');
                tileData.tile.setInteractive().on('pointerdown', () => {
                    this.moveTile(emptyRow, emptyCol);  
                });

                this.puzzleGrid[emptyRow][emptyCol] = tileData; 
                this.puzzleGrid[row][col] = emptyTileData; 
    
                console.log("Moved tile at position", row, col, "to empty space at", emptyRow, emptyCol);
                console.log("Puzzle grid state:", this.puzzleGrid);
                this.moves += 1
				this.moveLabel.setText(`Moves: ${this.moves}`)

                if (this.isPuzzleSolved()) {
                    console.log("Congratulations! Puzzle solved.");
                    // this.time.delayedCall(
                    //     3000,
                    //     function () {
                    //       return this.scene.start("win-scene", { moves: this.moves })
                    //     }, [], this
                    // )

                    this.confettiEmitter.start();  // Show confetti
                    this.time.delayedCall(2000, () => {
                        this.confettiEmitter.stop();  // Stop confetti after 2 sec
                        this.scene.start("win-scene", { moves: this.moves });
                    });
                }
            }
        } else {
            console.log("Tile at", row, col, "is not adjacent to empty space.");
        }
    }   

    isPuzzleSolved() {
        for (var row = 0; row < 3; row++) {
            for (var col = 0; col < 3; col++) {
                var previewTile = this.previewGrid[row][col];
                var puzzleTile = this.puzzleGrid[row][col];
    
                if (previewTile) {
                    if (!puzzleTile || puzzleTile.key !== previewTile.key) {
                        return false; 
                    }
                } else {
                    if (puzzleTile) {
                        return false; 
                    }
                }
            }
        }
        return true; 
    }
    
}
