import "phaser";

export class Drill extends Phaser.Physics.Arcade.Sprite {
    targets: Phaser.Tilemaps.Tile[] = [];
    energy: number = 100;
    maxEnergy: number = 100;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string | Phaser.Textures.Texture, frame?: string | number) {
        super(scene, x, y, texture, frame);
    }

    addEnergy(energy: number) {
        const actualEnergy = Math.min(this.energy + energy, this.maxEnergy);
        const consumedEnergy = actualEnergy - this.energy;
        this.energy = actualEnergy;
        return consumedEnergy;
    }
};
