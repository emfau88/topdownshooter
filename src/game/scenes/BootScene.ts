import Phaser from 'phaser';
import { ASSET_KEYS, registerAtlasFrames } from '../assets';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    const { width, height } = this.scale;
    const title = this.add.text(width / 2, height / 2 - 16, 'BREACHLINE', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#e4be60',
      letterSpacing: 4,
    }).setOrigin(0.5);
    const progress = this.add.rectangle(width / 2, height / 2 + 28, 260, 3, 0x34372e).setOrigin(0.5);
    const fill = this.add.rectangle(width / 2 - 130, height / 2 + 28, 0, 3, 0xe4be60).setOrigin(0, 0.5);
    this.load.on('progress', (value: number) => fill.setSize(260 * value, 3));
    this.load.on('complete', () => {
      title.destroy();
      progress.destroy();
      fill.destroy();
    });

    this.load.image(ASSET_KEYS.soldiers, 'assets/taktisches_soldaten_asset_sheet.png');
    this.load.image(ASSET_KEYS.environment, 'assets/top_down_spielasset_atlas.png');
    this.load.image(ASSET_KEYS.b0Character, 'assets/atlases/characters-b0-review.png');
    this.load.image(ASSET_KEYS.b0Environment, 'assets/atlases/environment-b0-review.png');
    this.load.image(ASSET_KEYS.b0Gameplay, 'assets/atlases/gameplay-b0-review.png');
  }

  create(): void {
    registerAtlasFrames(this.textures);
    const reviewMode = new URLSearchParams(window.location.search).has('art-review');
    this.scene.start(reviewMode ? 'art-review' : 'match');
  }
}
