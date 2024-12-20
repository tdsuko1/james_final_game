import Phaser from 'phaser'

import PuzzleGameScene from './scenes/PuzzleGameScene'

const config = {
	type: Phaser.AUTO,
	parent: 'app',
	width: 1280,
	height: 864,
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 200 },
		},
	},
	scene: [PuzzleGameScene],
}

export default new Phaser.Game(config)
