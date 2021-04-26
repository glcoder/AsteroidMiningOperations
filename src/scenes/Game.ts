import "phaser";
import * as Pathfinding from "pathfinding";
import { Player } from "../game/Player";
import { Lander } from "../game/Lander";
import { Drill } from "../game/Drill";
import { Miner } from "../game/Miner";

type KeyboardControls = { [id: string]: Phaser.Input.Keyboard.Key };

class TileProperties {
    health: number;
    destructable: boolean;

    constructor(health: number, destructable: boolean) {
        this.health = health;
        this.destructable = destructable;
    }
};

export default class Game extends Phaser.Scene {
    private controls: KeyboardControls = {};
    private uiText!: Phaser.GameObjects.Text;
    //private debugGraphics?: Phaser.GameObjects.Graphics;

    private tilemap!: Phaser.Tilemaps.Tilemap;
    private lander!: Lander;
    private drill!: Drill;
    private player!: Player;
    private miners: Array<Miner> = [];
    private rawOreQuantity: number = 0;

    constructor() {
        super('Game');
    }

    preload() {
        this.load.image('background', 'assets/background.png');
        this.load.image('tiles', 'assets/tiles.png');
        this.load.image('pipes', 'assets/pipes.png');
        this.load.image('player', 'assets/player.png');
        this.load.image('lander', 'assets/lander.png');
        this.load.image('drill', 'assets/drill.png');
        this.load.image('miner', 'assets/miner.png');
    }

    create() {
        this.controls = this.input.keyboard.addKeys({
            'up': Phaser.Input.Keyboard.KeyCodes.W,
            'left': Phaser.Input.Keyboard.KeyCodes.A,
            'down': Phaser.Input.Keyboard.KeyCodes.S,
            'right': Phaser.Input.Keyboard.KeyCodes.D,
            'use': Phaser.Input.Keyboard.KeyCodes.E,
            'hover': Phaser.Input.Keyboard.KeyCodes.Q,
        }) as KeyboardControls;

        this.uiText = this.add.text(10, 10, [], {
            fontFamily: 'Antonio',
            fontSize: '24px',
            stroke: '#000000',
            strokeThickness: 2,
        }).setDepth(200).setScrollFactor(0);

        this.tilemap = this.add.tilemap(undefined, 24, 24, 32, 128);
        this.lander = new Lander(this, 16 * 24, 16 * 24, 'lander');
        this.drill = new Drill(this, 16 * 24, 16 * 24, 'drill');
        this.player = new Player(this, 8 * 24, 16 * 24, 'player');

        this.physics.world.setBounds(0, 0, this.tilemap.width * 24, this.tilemap.height * 24);

        this.cameras.main.setBounds(0, 0, this.tilemap.width * 24, this.tilemap.height * 24);
        this.cameras.main.startFollow(this.player);

        this.lander.setDepth(101);
        this.add.existing(this.lander);
        this.physics.add.existing(this.lander);

        this.drill.setDepth(100);
        this.add.existing(this.drill);
        this.physics.add.existing(this.drill);

        this.player.setDepth(102);
        this.add.existing(this.player);
        this.physics.add.existing(this.player);

        const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
        playerBody.setAllowDrag(false);
        playerBody.setAllowRotation(false);

        const background = this.add.tileSprite(0, 0, 768, 768 * 2, 'background');
        background.setOrigin(0, 0);
        background.setScrollFactor(0.25);
        background.setDepth(0);

        const tiles = this.tilemap.addTilesetImage('tiles', undefined, 24, 24);
        const pipes = this.tilemap.addTilesetImage('pipes', undefined, 24, 24);

        // cave
        const caveLayer = this.tilemap.createBlankLayer('cave', tiles);
        caveLayer.setDepth(10);
        caveLayer.fill(3, 0, 28, this.tilemap.width, this.tilemap.height - 28);
        caveLayer.forEachTile(tile => tile.properties = new TileProperties(1, false));

        // pipes
        const pipesLayer = this.tilemap.createBlankLayer('pipes', pipes);
        pipesLayer.setDepth(20);

        // ore
        const oreLayer = this.tilemap.createBlankLayer('ore', tiles);
        oreLayer.setDepth(30);

        // guarnteed ore location
        const fixedOreLocationX = Phaser.Math.RND.real() > 0.5
            ? Phaser.Math.RND.integerInRange(0, 14)
            : Phaser.Math.RND.integerInRange(17, this.tilemap.width - 18);

        oreLayer.putTileAt(4, fixedOreLocationX, 29);

        // place random ore
        const weightedOre = [
            { index: -1, weight: 40 },
            { index: 4, weight: 1 },
        ];
        oreLayer.weightedRandomize(weightedOre, 0, 30, 15, this.tilemap.height - 30);
        oreLayer.weightedRandomize(weightedOre, 17, 30, 15, this.tilemap.height - 30);

        // tint ore
        oreLayer.forEachTile(tile => {
            tile.properties = new TileProperties(1, false);
            if (tile.index == 4) {
                tile.tint = Phaser.Display.Color.GetColor(223, 113, 38);
            }
        });

        const soilLayer = this.tilemap.createBlankLayer('soil', tiles);
        soilLayer.setDepth(40);
        soilLayer.fill(1, 0, 28, this.tilemap.width, 1);
        soilLayer.fill(2, 0, 29, this.tilemap.width, this.tilemap.height - 29);
        soilLayer.forEachTile(tile => tile.properties = new TileProperties(100, true));

        this.tilemap.setCollision([4], true, true, oreLayer);
        this.tilemap.setCollision([1, 2], true, true, soilLayer);

        //this.debugGraphics = this.add.graphics();

        this.lander.setCollideWorldBounds(true);
        this.physics.add.collider(this.lander, soilLayer);

        this.drill.setCollideWorldBounds(true);
        this.physics.add.collider(this.drill, soilLayer);

        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, soilLayer);
        const oreOverlap = this.physics.add.overlap(this.player, oreLayer);
        this.physics.add.overlap(this.player, this.lander);

        // oreOverlap.collideCallback = (p, t) => {
        //     const player = (p as Player);
        //     const tile = (t as unknown as Phaser.Tilemaps.Tile);
        // };

        this.input.keyboard.on('keydown-O', () => {
            soilLayer.visible = !soilLayer.visible;
        });

        // this.input.keyboard.on('keydown-Q', () => {
        //     this.player.hover = !this.player.hover;
        // });

        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.start('MainMenu');
        });
    }

    update(time: number, delta: number) {
        //this.debugGraphics?.clear();
        //this.gameState.tilemap.renderDebugFull(this.debugGraphics!);

        if (this.rawOreQuantity >= 1000.0) {
            this.scene.start('Win');
            return;
        }

        this.uiText?.setText([
            //`Player Energy: ${Math.max(0, this.player.energy).toFixed(2)}`,
            `Drill Energy: ${Math.max(0, this.drill.energy).toFixed(2)}`,
            `Raw Ore: ${this.rawOreQuantity.toFixed(2)}`,
        ]);

        if (this.player.target != null) {
            this.player.target.tint = Phaser.Display.Color.GetColor(255, 255, 255);
            //this.GameState.Player.Target.visible = true;
            this.player.target = null;
        }

        if (this.lander.body.blocked.down && !this.tilemap.hasTileAt(15, 27, 'pipes')) {
            this.tilemap.fill(1, 15, 27, 2, 1, false, 'pipes');
        }

        // const cursor = this.input.activePointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
        // if (Phaser.Math.Distance.BetweenPoints(cursor, playerBody.center) < 80) {
        //     const raycast = new Phaser.Geom.Line(playerBody.center.x, playerBody.center.y, cursor.x, cursor.y).getPoints(10);
        //     for (let index = 0; index < raycast.length; ++index) {
        //         const point = raycast[index];
        //         if ((player.target = tilemap.getTileAtWorldXY(point.x, point.y)) != null) {
        //             break;
        //         }
        //     }
        // }

        this.updateMining(delta);
        this.updateOreProcessing(delta);

        this.updatePlayer(delta);
        this.updateDrill(delta);

        this.updateConstruction(delta);
    }

    private updateMining(delta: number) {
        const mined = delta / 50.0;

        this.miners.filter(miner => miner.quantity > 0).forEach(miner => {
            const quantity = Math.max(0, miner.quantity - mined);
            this.rawOreQuantity += (miner.quantity - quantity);
            miner.quantity = quantity;
        });
    }

    private updateOreProcessing(delta: number) {
        let processed = this.processOre(delta / 100.0);

        //processed = Math.max(0, processed - this.player.addEnergy(processed));
        processed = Math.max(0, processed - this.drill.addEnergy(processed));

        this.rawOreQuantity += processed;
    }

    private processOre(processed: number): number {
        const actualProcessed = this.rawOreQuantity - Math.max(0, this.rawOreQuantity - processed);
        this.rawOreQuantity -= actualProcessed;
        return actualProcessed;
    }

    private updatePlayer(delta: number) {
        const playerBody = this.player.body as Phaser.Physics.Arcade.Body;

        if (this.player.hover && this.player.energy > 0) {
            playerBody.setVelocityY(0.0);
            playerBody.setAllowGravity(false);
            //this.player.energy -= delta / 100.0;
        } else {
            this.player.hover = false;
            playerBody.setAllowGravity(true);
        }

        if (this.player.energy > 0) {
            if (this.controls.up.isDown) {
                playerBody.setVelocityY(-100);
                //this.player.energy -= delta / 100.0;
            }
            else if (this.controls.down.isDown) {
                playerBody.setVelocityY(100);
                //this.player.energy -= delta / 100.0;
            }
        }

        if (this.controls.left.isDown) {
            playerBody.setVelocityX(-this.player.mvoeSpeed);
            this.player.setFlipX(false);
        }
        else if (this.controls.right.isDown) {
            playerBody.setVelocityX(this.player.mvoeSpeed);
            this.player.setFlipX(true);
        }
        else {
            playerBody.setVelocityX(0);
        }

        //if (playerBody.blocked.down || this.player.hover) {
            if (playerBody.blocked.left) {
                const position = { x: playerBody.left - 6, y: playerBody.top + 6 };
                this.player.target = this.tilemap.getTileAtWorldXY(position.x, position.y);
            }
            else if (playerBody.blocked.right) {
                const position = { x: playerBody.right + 6, y: playerBody.top + 6 };
                this.player.target = this.tilemap.getTileAtWorldXY(position.x, position.y);
            }
        //}

        const target = this.player.target;
        if (target != null && target.index == 2) {
            const properties = target.properties as TileProperties;
            target.tint = Phaser.Display.Color.GetColor(255, 200, 200);

            const drillActive = //this.input.manager.activePointer.isDown ||
                playerBody.blocked.left || playerBody.blocked.right;

            if (drillActive) {
                properties.health -= delta / 10.0;
                target.alpha = Phaser.Math.Linear(0.5, 1.0, properties.health / 100);
            }

            if (properties.health <= 0) {
                this.tilemap.removeTile(target);
                this.player.target = null;
            }
        }

        // if (this.player.flying) {
        //     if (this.player.energy <= 0.0) {
        //         this.player.flying = false;
        //     }
        // }
    }

    private updateDrill(delta: number) {
        const drillBody = this.drill.body as Phaser.Physics.Arcade.Body;
        if (!drillBody.blocked.down || this.drill.energy <= 0)
            return;

        const position = { x: drillBody.center.x, y: drillBody.bottom };
        this.drill.targets = this.tilemap.getTilesWithinWorldXY(position.x - 12, position.y, 24, 12);

        this.drill.targets.forEach(tile => {
            const properties = tile.properties as TileProperties;
            tile.tint = Phaser.Display.Color.GetColor(255, 200, 200);

            const deltaHealth = properties.health - Math.max(0, properties.health - delta / 10.0);
            properties.health -= deltaHealth;

            this.drill.energy = Math.max(0, this.drill.energy - deltaHealth / 8.0);

            if (properties.health <= 0) {
                this.addPipeTile(1, tile.x, tile.y);
                this.tilemap.removeTile(tile);
            } else {
                tile.alpha = Phaser.Math.Linear(0.5, 1.0, properties.health / 100);
            }
        });
    }

    private updateConstruction(delta: number) {
        const cursor = this.input.activePointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
        const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
        if (Phaser.Math.Distance.BetweenPoints(cursor, playerBody.center) > 128)
            return;

        const oreTile = this.tilemap.getTileAtWorldXY(cursor.x, cursor.y, false, this.cameras.main, 'ore');
        if (oreTile == null || oreTile.index != 4)
            return;

        // const caveTile = this.tilemap.getTileAt(oreTile.x, oreTile.y, false, 'cave');
        // if (caveTile != null) {
        //     caveTile.tint = Phaser.Display.Color.GetColor(120, 255, 120);
        // }

        if (!this.input.manager.activePointer.isDown)
            return;


        const path = this.getPath(oreTile);
        if (path == undefined)
            return;

        path.forEach(coords => {
            //this.tilemap.putTileAt(2, coords.x, coords.y, false, 'pipes');
            this.addPipeTile(2, coords.x, coords.y);
        });

        const miner = new Miner(oreTile, 'miner');
        this.miners.push(miner);

        this.add.existing(miner);
        this.tilemap.removeTile(oreTile);
    }

    private getPath(tile: Phaser.Tilemaps.Tile): Array<Phaser.Math.Vector2> | undefined {
        const path = new Array<Phaser.Math.Vector2>();

        const direction = Math.sign(16 - tile.x);
        for (let x = tile.x; x != 16; x += direction) {
            if (this.tilemap.hasTileAt(x, tile.y, 'soil')) {
                return undefined;
            }

            path.push(new Phaser.Math.Vector2(x, tile.y));
        }

        //path.push(new Phaser.Math.Vector2(15, tile.y));
        path.push(new Phaser.Math.Vector2(16, tile.y));

        return path;
    }

    private static pipeNeighborsOffsets: { x: number, y: number, index: number }[] = [
        { x: -1, y: 0, index: 8 },
        { x: 1, y: 0, index: 2 },
        { x: 0, y: -1, index: 1 },
        { x: 0, y: 1, index: 4 },
    ];

    private static neighbors2index: { [count: number]: number } = {
        0: 2,
        1: 1,
        2: 2,
        4: 1,
        8: 2,
        3: 4,
        5: 2,
        9: 5,
        6: 6,
        10: 2,
        12: 7,
        7: 11,
        11: 10,
        13: 9,
        14: 8,
        15: 3,
    };

    private addPipeTile(index: number, x: number, y: number) {
        this.tilemap.putTileAt(index, x, y, false, 'pipes');
        Game.pipeNeighborsOffsets.forEach(offset => {
            this.updatePipeTile(x + offset.x, y + offset.y);
        });
        this.updatePipeTile(x, y);
    }

    private getPipeNeighbors(x: number, y: number): number {
        let count = 0
        Game.pipeNeighborsOffsets.forEach(offset => {
            count += this.tilemap.hasTileAt(x + offset.x, y + offset.y, 'pipes') ? offset.index : 0;
        });
        return count;
    }

    private updatePipeTile(x: number, y: number) {
        if (!this.tilemap.hasTileAt(x, y, 'pipes'))
            return;

        const neighbors = this.getPipeNeighbors(x, y);
        this.tilemap.putTileAt(Game.neighbors2index[neighbors], x, y, false, 'pipes');
    }
}
