import "phaser";

export default class Win extends Phaser.Scene {
    private background!: Phaser.GameObjects.TileSprite;

    constructor() {
        super('Win');
    }

    preload() {
        this.load.image('background', 'assets/background.png');
    }

    create() {
        this.background = this.add.tileSprite(0, 0, 768, 768, 'background');
        this.background.setOrigin(0, 0);

        const title = this.add.text(0, 0, ["CONGRATURATION", "", "A WINRAR", "IS YOU"], {
            fontFamily: 'AstroSpace',
            fontSize: '18px',
            align: 'center',
            stroke: '#00C269',
            strokeThickness: 3,
        });

        title.setScale(4.0);

        const titleBounds = title.getBounds();
        title.setPosition(384 - titleBounds.centerX, 384 - titleBounds.centerY);

        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.start('MainMenu');
        });
    }

    update(time: number, delta: number) {
        this.background.tilePositionY -= delta / 50;
    }
}
