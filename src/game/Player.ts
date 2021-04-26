import "phaser";

export class Player extends Phaser.Physics.Arcade.Sprite {
    target: Phaser.Tilemaps.Tile | null = null;
    mvoeSpeed: number = 100;
    energy: number = 100;
    maxEnergy: number = 100;
    hover: boolean = false;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string | Phaser.Textures.Texture, frame?: string | number) {
        super(scene, x, y, texture, frame);

        // this.setDataEnabled();
        // this.data.set('target', this.target);
        // this.data.set('mvoeSpeed', this.mvoeSpeed);
        // this.data.set('fuel', this.fuel);
    }

    addEnergy(energy: number) {
        const actualEnergy = Math.min(this.energy + energy, this.maxEnergy);
        const consumedEnergy = actualEnergy - this.energy;
        this.energy = actualEnergy;
        return consumedEnergy;
    }
};
