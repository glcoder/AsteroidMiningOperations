import "phaser";

import MainMenu from "./scenes/MainMenu";
import Game from "./scenes/Game";
import Win from "./scenes/Win";

const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: 768,
    height: 768,
    scene: [MainMenu, Game, Win],
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
});
