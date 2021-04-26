import "phaser";

export class Miner extends Phaser.GameObjects.Sprite {
    quantity: number = 150;

    constructor(targetTile: Phaser.Tilemaps.Tile, texture: string | Phaser.Textures.Texture, frame?: string | number) {
        super(targetTile.tilemap.scene, targetTile.getCenterX(), targetTile.getCenterY(), texture, frame);

        this.setDepth(targetTile.layer.tilemapLayer.depth + 1);
    }
};
