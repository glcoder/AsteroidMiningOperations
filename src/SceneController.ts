import "phaser";

import MainMenu from "./scenes/MainMenu";
import Game from "./scenes/Game";

export default class SceneController extends Phaser.Scene {
    constructor() {
        super('SceneController');
    }

    create()
    {
        this.scene.add('MainMenu', MainMenu);
        this.scene.add('Level', Game);

        this.scene.launch('MainMenu');
    }
}
