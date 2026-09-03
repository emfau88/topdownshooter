import Phaser from 'phaser';
import type { ActorState, SmokeState } from '../entities/types';
import type { MapRectangle } from '../map';

export class DebugOverlay {
  private enabled = false;
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setDepth(9000);
    this.label = scene.add.text(12, 78, '', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#d6ff97',
      backgroundColor: '#0a0c09bb',
      padding: { x: 6, y: 4 },
    }).setScrollFactor(0).setDepth(9001).setVisible(false);
  }

  toggle(): void {
    this.enabled = !this.enabled;
    this.label.setVisible(this.enabled);
    if (!this.enabled) this.graphics.clear();
  }

  render(
    colliders: readonly MapRectangle[],
    actors: readonly ActorState[],
    smokes: readonly SmokeState[],
    fps: number,
  ): void {
    if (!this.enabled) return;
    this.graphics.clear();
    this.graphics.lineStyle(1, 0xffdd5a, 0.9);
    for (const collider of colliders) this.graphics.strokeRect(collider.x, collider.y, collider.width, collider.height);
    this.graphics.lineStyle(1, 0x65f0ff, 0.9);
    for (const smoke of smokes) this.graphics.strokeCircle(smoke.x, smoke.y, smoke.radius * 0.72);
    for (const actor of actors) {
      this.graphics.lineStyle(2, actor.team === 'blue' ? 0x43b5ff : 0xff6357, actor.alive ? 0.9 : 0.3);
      this.graphics.strokeCircle(actor.x, actor.y, 17);
      this.graphics.lineBetween(actor.x, actor.y, actor.x + Math.cos(actor.angle) * 34, actor.y + Math.sin(actor.angle) * 34);
      const waypoint = actor.path[actor.pathIndex];
      if (waypoint) {
        this.graphics.lineStyle(1, 0xafff7a, 0.65);
        this.graphics.lineBetween(actor.x, actor.y, waypoint.x, waypoint.y);
      }
    }
    this.label.setText(`DEBUG  ${Math.round(fps)} FPS\nF3: toggle collision / vision / paths\nActors: ${actors.filter((actor) => actor.alive).length}  Smoke: ${smokes.length}`);
  }

  destroy(): void {
    this.graphics.destroy();
    this.label.destroy();
  }
}
