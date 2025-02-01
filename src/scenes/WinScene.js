import Phaser from "phaser"

export default class WinScene extends Phaser.Scene {
	constructor() {
		super("win-scene")
	}

	init(data) {
		this.winLabel = undefined
		this.moves = data.moves
		this.moveLabel = undefined
        if (this.moves == undefined) {
            this.moves = 0
        }
	}

	preload() {}

	create() {
        this.gameWidth = this.scale.width * 0.5
        this.gameHeight = this.scale.height * 0.5
		this.winLabel = this.add.text(this.gameWidth/2, this.gameHeight/2 , "You Win!", {
            fontSize: "128px",
            color: "white",
            backgroundColor: "black",
        }).setDepth(1).setVisible(true)

		this.moveLabel = this.add.text(this.gameWidth/2, this.gameHeight/2 + 200, "Moves:" + this.moves, {
            fontSize: "128px",
            color: "white",
            backgroundColor: "black",
        }).setDepth(1).setVisible(true)

        this.add.text(this.gameWidth/2, this.gameHeight/2 + 400, 'Start', {
            fontSize: '128px',
            color: '#ffffff',
            backgroundColor: '#000000'
        }).setInteractive().on('pointerdown', () => {
            this.scene.start("puzzle-game-scene")
        });
	}

	update() {}
}
