import "phaser";

export default class MainMenu extends Phaser.Scene {
    private background!: Phaser.GameObjects.TileSprite;
    private startText!: Phaser.GameObjects.Text;

    constructor() {
        super('MainMenu');
    }

    preload() {
        this.load.image('background', 'assets/background.png');
    }

    create() {
        this.background = this.add.tileSprite(0, 0, 768, 768, 'background');
        this.background.setOrigin(0, 0);

        const title = this.add.text(0, 0, ["Asteroid", "Mining", "Operations"], {
            fontFamily: 'AstroSpace',
            fontSize: '18px',
            align: 'center',
            stroke: '#0069C2',
            strokeThickness: 3,
        });

        title.setScale(4.0);

        const titleBounds = title.getBounds();
        title.setPosition(384 - titleBounds.centerX, 50);

        this.startText = this.add.text(0, 0, ["collect 1000 raw ore", "press SPACE to begin"], {
            fontFamily: 'Antonio',
            fontSize: '20px',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 2,
        });

        this.startText.setScale(2.0);

        const startTextBounds = this.startText.getBounds();
        this.startText.setPosition(384 - startTextBounds.centerX, 400 - startTextBounds.centerY);

        const help = this.add.text(0, 0, ["W/A/S/D - move", "Click - build miner", "Esc - restart"], {
            fontFamily: 'Antonio',
            fontSize: '16px',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 2,
        });

        help.setScale(2.0);

        const helpBounds = help.getBounds();
        help.setPosition(384 - helpBounds.centerX, this.startText.y + startTextBounds.bottom + 100);

        this.tweens.add({
            targets: [this.startText],
            scaleY: 2.5,
            duration: 1000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('Game');
        });

        this.input.keyboard.on('keydown-O', () => {
            this.scene.start('Win');
        });
    }

    update(time: number, delta: number) {
        this.background.tilePositionY += delta / 50;
    }
}
