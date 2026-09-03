import Phaser from 'phaser';
import './styles.css';
import { BootScene } from './game/scenes/BootScene';
import { MatchScene } from './game/scenes/MatchScene';
import { AssetReviewScene } from './game/scenes/AssetReviewScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#161914',
  pixelArt: false,
  antialias: true,
  roundPixels: true,
  render: {
    powerPreference: 'high-performance',
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  input: {
    activePointers: 5,
  },
  scene: [BootScene, MatchScene, AssetReviewScene],
});

window.addEventListener('pagehide', () => game.destroy(true));
