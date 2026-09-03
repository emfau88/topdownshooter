import Phaser from 'phaser';

const REVIEW_ASSETS = [
  { key: 'review-character', label: 'BLUE RIFLE SOLDIER', path: 'assets/review/character_blue_rifle_idle_v01.png', width: 126 },
  { key: 'review-wall', label: 'STRAIGHT WALL', path: 'assets/review/environment_wall_straight_v01.png', width: 260 },
  { key: 'review-crate', label: 'STANDARD CRATE', path: 'assets/review/prop_crate_standard_v01.png', width: 122 },
  { key: 'review-medkit', label: 'MEDKIT', path: 'assets/review/pickup_medkit_idle_v01.png', width: 104 },
] as const;

/** Development-only B0 review surface. Open with ?art-review. */
export class AssetReviewScene extends Phaser.Scene {
  constructor() {
    super('art-review');
  }

  preload(): void {
    for (const asset of REVIEW_ASSETS) this.load.image(asset.key, asset.path);
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#151812');
    const reviewScale = Phaser.Math.Clamp((this.scale.width - 32) / 900, 0.7, 1);
    this.add.text(24, 18, 'B0 STYLE ANCHERS', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#e4be60',
      letterSpacing: 2,
    });
    this.add.text(24, 46, 'CANDIDATES — TRUE 90° TOP-DOWN / NOT YET RELEASE ASSETS', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
      color: '#aaa99a',
    });

    const positions = [
      { x: 135, y: 180 },
      { x: 390, y: 180 },
      { x: 635, y: 180 },
      { x: 815, y: 180 },
    ];
    for (const [index, asset] of REVIEW_ASSETS.entries()) {
      const position = positions[index];
      if (!position) continue;
      const image = this.add.image(position.x * reviewScale, position.y * reviewScale + 42, asset.key)
        .setDisplaySize(asset.width * reviewScale, asset.width * reviewScale);
      image.setScale(1, asset.key === 'review-wall' ? 0.34 : 1);
      this.add.text(position.x * reviewScale, 300 * reviewScale + 42, asset.label, {
        fontFamily: 'system-ui, sans-serif', fontSize: '10px', color: '#d7d5c7', align: 'center',
      }).setOrigin(0.5);
    }
    this.add.text(24, this.scale.height - 22, 'Return to gameplay: remove ?art-review from the address.', {
      fontFamily: 'system-ui, sans-serif', fontSize: '11px', color: '#77776c',
    });
  }
}
