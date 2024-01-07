import Phaser from 'phaser';
import Game from "./scenes/game"

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    scene: [Game],
};

const game = new Phaser.Game(config);