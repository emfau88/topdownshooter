import Phaser from 'phaser';
import { ASSET_KEYS } from '../assets';
import { SoundSynth } from '../audio/SoundSynth';
import {
  ACTOR_RADIUS,
  BLUE_RALLY,
  BLUE_SPAWNS,
  CAPTURE_SECONDS,
  COLORS,
  PRESSURE_ZONE_AT_SECONDS,
  RED_RALLY,
  RED_SPAWNS,
  WEAPONS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../config';
import { DebugOverlay } from '../rendering/DebugOverlay';
import { MatchEvents } from '../systems/MatchEvents';
import { moveActor, separateActors } from '../systems/movement';
import { createTouchState } from '../systems/touchState';
import { createActor } from '../entities/createActor';
import type {
  ActorState,
  Announcement,
  ControlLayout,
  ImpactState,
  PickupState,
  SmokeState,
  TracerState,
} from '../entities/types';
import { COLLIDERS, PICKUP_POSITIONS, PROPS, STATIC_WALLS, isBlocked } from '../map';
import { reloadAmmo } from '../model/ammo';
import { applyDamage, spendShot } from '../model/combat';
import { updateCapture } from '../model/capture';
import { SeededRandom } from '../model/random';
import { recordRoundWin } from '../model/match';
import { createRoundClock, tickRoundClock } from '../model/round';
import type { RoundClockState } from '../model/round';
import { createSmoke, tickSmokes } from '../model/smoke';
import { applyPickup } from '../model/pickup';
import { chooseTakeoverCandidate } from '../model/takeover';
import { hasLineOfSight } from '../model/visibility';
import type { CaptureState, MatchPhase, Point, Team, WeaponKey } from '../model/types';
import { findPath } from '../navigation';

const ZONE_CENTER = { x: 800, y: 480 } as const;
const ZONE_RADIUS = 92;

function teamColor(team: Team): number {
  return team === 'blue' ? COLORS.blue : COLORS.red;
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function angleDelta(from: number, to: number): number {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

function moveAngleToward(current: number, target: number, factor: number): number {
  return current + angleDelta(current, target) * Phaser.Math.Clamp(factor, 0, 1);
}

export class MatchScene extends Phaser.Scene {
  private actors: ActorState[] = [];
  private controlled: ActorState | null = null;
  private pickups: PickupState[] = [];
  private smokes: SmokeState[] = [];
  private tracers: TracerState[] = [];
  private impacts: ImpactState[] = [];
  private dynamicObjects: Phaser.GameObjects.GameObject[] = [];

  private phase: MatchPhase = 'loadout';
  private selectedWeapon: WeaponKey = 'rifle';
  private roundNumber = 1;
  private roundClock: RoundClockState = createRoundClock();
  private roundRemainingMs = this.roundClock.remainingMs;
  private roundTransitionMs = 0;
  private suddenDeath = false;
  private pressureZoneActive = false;
  private captureState: CaptureState = { activeTeam: null, progressSeconds: 0 };
  private score: Record<Team, number> = { blue: 0, red: 0 };

  private touchState = createTouchState();
  private keys!: Record<'up' | 'down' | 'left' | 'right' | 'fire' | 'reload' | 'smoke', Phaser.Input.Keyboard.Key>;

  private zoneGraphics!: Phaser.GameObjects.Graphics;
  private effectGraphics!: Phaser.GameObjects.Graphics;
  private statusGraphics!: Phaser.GameObjects.Graphics;
  private hudGraphics!: Phaser.GameObjects.Graphics;
  private hudText!: Phaser.GameObjects.Text;
  private objectiveText!: Phaser.GameObjects.Text;
  private playerText!: Phaser.GameObjects.Text;
  private announcementText!: Phaser.GameObjects.Text;
  private bannerText!: Phaser.GameObjects.Text;
  private fireButtonText!: Phaser.GameObjects.Text;
  private smokeButtonText!: Phaser.GameObjects.Text;
  private reloadButtonText!: Phaser.GameObjects.Text;
  private loadoutUi: Phaser.GameObjects.Container | null = null;
  private announcement: Announcement | null = null;
  private soundSynth = new SoundSynth();
  private readonly matchEvents = new MatchEvents();
  private random = new SeededRandom(0x42524541);
  private debugOverlay!: DebugOverlay;
  private debugKey!: Phaser.Input.Keyboard.Key;
  private smokeSequence = 0;
  private hitMarkerMs = 0;
  private killMarkerMs = 0;
  private cameraShake = 0;

  constructor() {
    super('match');
  }

  create(): void {
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor('#171a14');
    this.createMap();
    this.zoneGraphics = this.add.graphics().setDepth(4);
    this.effectGraphics = this.add.graphics().setDepth(3000);
    this.statusGraphics = this.add.graphics().setDepth(3100);
    this.hudGraphics = this.add.graphics().setScrollFactor(0).setDepth(5000);
    this.debugOverlay = new DebugOverlay(this);

    const fixedTextStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#eee8d6',
      stroke: '#080908',
      strokeThickness: 3,
    };
    this.hudText = this.add.text(0, 0, '', { ...fixedTextStyle, fontSize: '16px', fontStyle: 'bold' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(5001);
    this.objectiveText = this.add.text(0, 0, '', { ...fixedTextStyle, fontSize: '11px', fontStyle: 'bold' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(5001);
    this.playerText = this.add.text(0, 0, '', { ...fixedTextStyle, fontSize: '11px', fontStyle: 'bold' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(5001);
    this.announcementText = this.add.text(0, 0, '', { ...fixedTextStyle, fontSize: '13px', fontStyle: 'bold' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(5002);
    this.bannerText = this.add.text(0, 0, '', { ...fixedTextStyle, fontSize: '42px', fontStyle: 'bold', align: 'center' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(5100);
    this.fireButtonText = this.createFixedButtonText();
    this.smokeButtonText = this.createFixedButtonText();
    this.reloadButtonText = this.createFixedButtonText();

    this.configureInput();
    this.prepareRound();
    this.enterLoadout();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
      this.debugKey.off(Phaser.Input.Keyboard.Events.DOWN);
      this.debugOverlay.destroy();
      this.matchEvents.destroy();
    });
  }

  update(_time: number, delta: number): void {
    const deltaMs = Math.min(delta, 34);
    this.updateTransientState(deltaMs);

    if (this.phase === 'countdown') {
      this.roundTransitionMs -= deltaMs;
      this.bannerText.setText(String(Math.max(1, Math.ceil(this.roundTransitionMs / 1000))));
      if (this.roundTransitionMs <= 0) {
        this.phase = 'combat';
        this.bannerText.setText('');
        this.announce('FIGHT', 750);
      }
    } else if (this.phase === 'combat') {
      this.updateCombat(deltaMs);
    } else if (this.phase === 'round-over') {
      this.roundTransitionMs -= deltaMs;
      if (this.roundTransitionMs <= 0) {
        this.roundNumber += 1;
        this.prepareRound();
        this.enterLoadout();
      }
    }

    this.updateVisibility();
    this.syncActors();
    this.drawWorldEffects();
    this.drawHud();
    this.debugOverlay.render(COLLIDERS, this.actors, this.smokes, this.game.loop.actualFps);
  }

  private createMap(): void {
    const tileSize = 150;
    for (let y = 0; y < WORLD_HEIGHT + tileSize; y += tileSize) {
      for (let x = 0; x < WORLD_WIDTH + tileSize; x += tileSize) {
        const central = x > 520 && x < 1060 && y > 220 && y < 760;
        const frame = central ? 'floor-concrete' : ((x / tileSize + y / tileSize) % 5 === 0 ? 'floor-stain' : 'floor-olive');
        this.add.image(x, y, ASSET_KEYS.environment, frame)
          .setOrigin(0)
          .setDisplaySize(tileSize + 1, tileSize + 1)
          .setAlpha(central ? 0.86 : 0.92)
          .setDepth(-100);
      }
    }

    const boundaryGraphics = this.add.graphics().setDepth(8);
    boundaryGraphics.fillStyle(0x252820, 1);
    boundaryGraphics.lineStyle(3, 0x11130f, 1);
    for (const wall of STATIC_WALLS) {
      boundaryGraphics.fillRect(wall.x, wall.y, wall.width, wall.height);
      boundaryGraphics.strokeRect(wall.x, wall.y, wall.width, wall.height);
      boundaryGraphics.fillStyle(0x8c7136, 0.55);
      if (wall.width >= wall.height) boundaryGraphics.fillRect(wall.x + 3, wall.y + 3, Math.max(0, wall.width - 6), 4);
      else boundaryGraphics.fillRect(wall.x + 3, wall.y + 3, 4, Math.max(0, wall.height - 6));
      boundaryGraphics.fillStyle(0x252820, 1);
    }

    for (const prop of PROPS) {
      this.add.image(prop.x + prop.width / 2, prop.y + prop.height / 2, ASSET_KEYS.environment, prop.kind)
        .setDisplaySize(prop.width, prop.height)
        .setDepth(prop.y + prop.height / 2 + (prop.solid ? 40 : -5));
    }

    const floorDetails = this.add.graphics().setDepth(-5);
    floorDetails.lineStyle(2, 0xc89f44, 0.22);
    floorDetails.strokeRect(578, 283, 444, 394);
    floorDetails.lineStyle(1, 0xffffff, 0.045);
    for (let x = 70; x < WORLD_WIDTH; x += 120) floorDetails.lineBetween(x, 45, x, WORLD_HEIGHT - 45);
    for (let y = 70; y < WORLD_HEIGHT; y += 120) floorDetails.lineBetween(45, y, WORLD_WIDTH - 45, y);
  }

  private configureInput(): void {
    if (!this.input.keyboard) throw new Error('Keyboard input is unavailable.');
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      fire: Phaser.Input.Keyboard.KeyCodes.SPACE,
      reload: Phaser.Input.Keyboard.KeyCodes.R,
      smoke: Phaser.Input.Keyboard.KeyCodes.G,
    }) as typeof this.keys;
    this.debugKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F3);
    this.debugKey.on(Phaser.Input.Keyboard.Events.DOWN, () => this.debugOverlay.toggle());

    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this);
    this.input.on(Phaser.Input.Events.POINTER_MOVE, this.handlePointerMove, this);
    this.input.on(Phaser.Input.Events.POINTER_UP, this.handlePointerUp, this);
    this.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.handlePointerUp, this);
    this.input.mouse?.disableContextMenu();
  }

  private handleResize(): void {
    if (this.phase === 'loadout') this.buildLoadoutUi();
  }

  private prepareRound(): void {
    for (const object of this.dynamicObjects) object.destroy();
    this.dynamicObjects = [];
    this.actors = [];
    this.pickups = [];
    this.smokes = [];
    this.tracers = [];
    this.impacts = [];
    this.controlled = null;
    this.pressureZoneActive = false;
    this.suddenDeath = false;
    this.captureState = { activeTeam: null, progressSeconds: 0 };
    this.roundClock = createRoundClock();
    this.roundRemainingMs = this.roundClock.remainingMs;
    this.random = new SeededRandom(0x42524541 + this.roundNumber * 7919 + this.score.blue * 101 + this.score.red * 503);
    this.clearInputState();
    this.matchEvents.emit('round:started', { round: this.roundNumber });

    const blueWeapons: WeaponKey[] = [this.selectedWeapon, 'smg', 'shotgun'];
    const redWeapons: WeaponKey[] = ['rifle', 'smg', 'shotgun'];
    const blueNames = ['NOMAD', 'MASON', 'VEGA'];
    const redNames = ['RUNE', 'SABLE', 'VEX'];
    BLUE_SPAWNS.forEach((spawn, index) => {
      const weapon = blueWeapons[index] ?? 'rifle';
      const actor = createActor(this, { team: 'blue', spawn, name: blueNames[index] ?? `BLUE ${index + 1}`, weapon, ai: index !== 0, tacticalIndex: index });
      this.actors.push(actor);
      this.dynamicObjects.push(actor.sprite);
      if (index === 0) this.takeControl(actor, false);
    });
    RED_SPAWNS.forEach((spawn, index) => {
      const weapon = redWeapons[index] ?? 'rifle';
      const actor = createActor(this, { team: 'red', spawn, name: redNames[index] ?? `RED ${index + 1}`, weapon, ai: true, tacticalIndex: index });
      this.actors.push(actor);
      this.dynamicObjects.push(actor.sprite);
    });

    for (const definition of PICKUP_POSITIONS) {
      const sprite = this.add.image(
        definition.x,
        definition.y,
        ASSET_KEYS.soldiers,
        definition.kind === 'med' ? 'pickup-med' : 'pickup-ammo',
      ).setDisplaySize(58, 58).setDepth(definition.y + 5);
      const pickup: PickupState = { ...definition, active: true, sprite };
      this.pickups.push(pickup);
      this.dynamicObjects.push(sprite);
    }

    const openingSpawn = BLUE_SPAWNS[0];
    if (openingSpawn) this.cameras.main.centerOn(openingSpawn.x, openingSpawn.y);
  }

  private enterLoadout(): void {
    this.phase = 'loadout';
    this.bannerText.setColor('#eee8d6').setText('');
    this.buildLoadoutUi();
  }

  private buildLoadoutUi(): void {
    this.loadoutUi?.destroy(true);
    const { width, height } = this.scale;
    const scale = Phaser.Math.Clamp(height / 520, 0.72, 1.05);
    const container = this.add.container(0, 0).setScrollFactor(0).setDepth(6000);
    const backdrop = this.add.rectangle(width / 2, height / 2, width, height, 0x080a08, 0.86);
    container.add(backdrop);

    const title = this.add.text(width / 2, height / 2 - 178 * scale, 'SELECT PRIMARY', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: `${30 * scale}px`,
      fontStyle: 'bold',
      color: '#e4be60',
      letterSpacing: 4,
    }).setOrigin(0.5);
    const subtitle = this.add.text(width / 2, height / 2 - 142 * scale, `ROUND ${this.roundNumber}  ·  LOADOUT LOCKS ON DEPLOY`, {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: `${10 * scale}px`,
      fontStyle: 'bold',
      color: '#aaa792',
      letterSpacing: 2,
    }).setOrigin(0.5);
    container.add([title, subtitle]);

    const cardWidth = 190 * scale;
    const cardHeight = 118 * scale;
    const gap = 16 * scale;
    const totalWidth = cardWidth * 3 + gap * 2;
    (Object.keys(WEAPONS) as WeaponKey[]).forEach((weapon, index) => {
      const definition = WEAPONS[weapon];
      const x = width / 2 - totalWidth / 2 + cardWidth / 2 + index * (cardWidth + gap);
      const y = height / 2 - 30 * scale;
      const selected = weapon === this.selectedWeapon;
      const card = this.add.rectangle(
        x,
        y,
        cardWidth,
        cardHeight,
        selected ? 0x4c4025 : 0x1c1f19,
        0.98,
      ).setStrokeStyle(selected ? 3 : 1, selected ? COLORS.gold : 0x55584d, 1)
        .setInteractive({ useHandCursor: true });
      card.on(Phaser.Input.Events.POINTER_DOWN, () => {
        this.selectedWeapon = weapon;
        this.prepareRound();
        this.buildLoadoutUi();
      });
      const label = this.add.text(x, y - 29 * scale, definition.label, {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: `${18 * scale}px`,
        fontStyle: 'bold',
        color: selected ? '#f3d985' : '#eee8d6',
      }).setOrigin(0.5);
      const detail = this.add.text(
        x,
        y + 2 * scale,
        `${definition.damage}${definition.pellets > 1 ? ` × ${definition.pellets}` : ''} DMG  ·  ${definition.magazineSize} MAG`,
        {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: `${9 * scale}px`,
          fontStyle: 'bold',
          color: '#c0bdac',
        },
      ).setOrigin(0.5);
      const role = this.add.text(x, y + 31 * scale, definition.subtitle, {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: `${8 * scale}px`,
        color: '#888a7d',
      }).setOrigin(0.5);
      container.add([card, label, detail, role]);
    });

    const deploy = this.add.rectangle(width / 2, height / 2 + 103 * scale, 230 * scale, 48 * scale, COLORS.gold, 1)
      .setStrokeStyle(2, 0xf2d990, 1)
      .setInteractive({ useHandCursor: true });
    deploy.on(Phaser.Input.Events.POINTER_DOWN, () => this.deploy());
    const deployLabel = this.add.text(width / 2, height / 2 + 103 * scale, 'DEPLOY', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: `${15 * scale}px`,
      fontStyle: 'bold',
      color: '#17150e',
      letterSpacing: 3,
    }).setOrigin(0.5);
    const hint = this.add.text(width / 2, height / 2 + 153 * scale, 'WASD / LEFT STICK MOVE   ·   AIM LOCKS ON RELEASE   ·   HOLD FIRE', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: `${9 * scale}px`,
      fontStyle: 'bold',
      color: '#8f9184',
    }).setOrigin(0.5);
    container.add([deploy, deployLabel, hint]);
    this.loadoutUi = container;
  }

  private deploy(): void {
    if (this.phase !== 'loadout') return;
    this.loadoutUi?.destroy(true);
    this.loadoutUi = null;
    this.phase = 'countdown';
    this.roundTransitionMs = 2800;
    this.bannerText.setText('3');
    this.soundSynth.play('deploy');
    const element = document.documentElement;
    if (!document.fullscreenElement && element.requestFullscreen) void element.requestFullscreen().catch(() => undefined);
  }

  private updateCombat(deltaMs: number): void {
    const clockTick = tickRoundClock(this.roundClock, deltaMs);
    this.roundClock = clockTick.state;
    this.roundRemainingMs = this.roundClock.remainingMs;
    if (clockTick.enteredPressure) {
      this.pressureZoneActive = true;
      this.announce('PRESSURE ZONE ACTIVE', 1400);
    }
    if (clockTick.enteredSuddenDeath) {
      this.suddenDeath = true;
      this.pressureZoneActive = true;
      this.announce('SUDDEN DEATH', 1800);
    }

    if (this.controlled?.alive) this.updatePlayer(this.controlled, deltaMs);
    for (const actor of this.actors) {
      if (actor.ai && actor.alive) this.updateAi(actor, deltaMs);
    }
    separateActors(this.actors, ACTOR_RADIUS, isBlocked);
    this.updatePickups();
    this.updatePressureZone(deltaMs);

    const blueAlive = this.actors.some((actor) => actor.team === 'blue' && actor.alive);
    const redAlive = this.actors.some((actor) => actor.team === 'red' && actor.alive);
    if (!blueAlive) this.endRound('red', 'BLUE ELIMINATED');
    else if (!redAlive) this.endRound('blue', 'RED ELIMINATED');
  }

  private updateTransientState(deltaMs: number): void {
    this.hitMarkerMs = Math.max(0, this.hitMarkerMs - deltaMs);
    this.killMarkerMs = Math.max(0, this.killMarkerMs - deltaMs);
    this.cameraShake *= Math.pow(0.02, deltaMs / 1000);
    if (this.cameraShake > 0.1) this.cameras.main.shake(30, this.cameraShake / 500);

    for (const actor of this.actors) {
      actor.cooldownMs = Math.max(0, actor.cooldownMs - deltaMs);
      actor.hitFlashMs = Math.max(0, actor.hitFlashMs - deltaMs);
      actor.burstPauseMs = Math.max(0, actor.burstPauseMs - deltaMs);
      if (actor.reloadMs > 0) {
        actor.reloadMs -= deltaMs;
        if (actor.reloadMs <= 0) {
          actor.reloadMs = 0;
          actor.ammo = reloadAmmo(actor.weapon, actor.ammo);
        }
      }
      if (actor.lastSeen) {
        actor.lastSeen.remainingMs -= deltaMs;
        if (actor.lastSeen.remainingMs <= 0) actor.lastSeen = null;
      }
    }

    this.smokes = tickSmokes(this.smokes, deltaMs);
    for (const tracer of this.tracers) tracer.remainingMs -= deltaMs;
    this.tracers = this.tracers.filter((tracer) => tracer.remainingMs > 0);
    for (const impact of this.impacts) {
      impact.remainingMs -= deltaMs;
      impact.x += impact.velocity.x * deltaMs / 1000;
      impact.y += impact.velocity.y * deltaMs / 1000;
      impact.velocity.x *= 0.88;
      impact.velocity.y *= 0.88;
    }
    this.impacts = this.impacts.filter((impact) => impact.remainingMs > 0);

    if (this.announcement) {
      this.announcement.remainingMs -= deltaMs;
      if (this.announcement.remainingMs <= 0) this.announcement = null;
    }
  }

  private updatePlayer(actor: ActorState, deltaMs: number): void {
    const layout = this.getControlLayout();
    let moveX = 0;
    let moveY = 0;
    if (this.touchState.moveStick.active) {
      const dx = this.touchState.moveStick.x - layout.move.x;
      const dy = this.touchState.moveStick.y - layout.move.y;
      const magnitude = Math.hypot(dx, dy) || 1;
      const power = Phaser.Math.Clamp(magnitude / layout.move.radius, 0, 1);
      moveX = dx / magnitude * power;
      moveY = dy / magnitude * power;
    } else {
      moveX = Number(this.keys.right.isDown) - Number(this.keys.left.isDown);
      moveY = Number(this.keys.down.isDown) - Number(this.keys.up.isDown);
      const magnitude = Math.hypot(moveX, moveY);
      if (magnitude > 1) {
        moveX /= magnitude;
        moveY /= magnitude;
      }
    }

    actor.velocity.x = moveX * actor.speed;
    actor.velocity.y = moveY * actor.speed;
    moveActor(actor, actor.velocity.x * deltaMs / 1000, actor.velocity.y * deltaMs / 1000, ACTOR_RADIUS, isBlocked);

    const activePointer = this.input.activePointer;
    if (activePointer.id === 0 && !this.touchState.aimStick.active) {
      const world = this.cameras.main.getWorldPoint(activePointer.x, activePointer.y);
      if (distance(actor, world) > 16) actor.angle = Math.atan2(world.y - actor.y, world.x - actor.x);
    }

    if (this.touchState.firePointers.size > 0 || this.keys.fire.isDown) this.fire(actor);
    if (Phaser.Input.Keyboard.JustDown(this.keys.reload)) this.startReload(actor);
    if (Phaser.Input.Keyboard.JustDown(this.keys.smoke)) {
      this.throwSmoke(actor, {
        x: actor.x + Math.cos(actor.angle) * 220,
        y: actor.y + Math.sin(actor.angle) * 220,
      });
    }
    if (actor.ammo.magazine <= 0) this.startReload(actor);
  }

  private updateAi(actor: ActorState, deltaMs: number): void {
    const enemies = this.actors.filter((candidate) => candidate.team !== actor.team && candidate.alive && this.canSee(actor, candidate));
    enemies.sort((a, b) => distance(actor, a) - distance(actor, b));
    const target = enemies[0] ?? null;

    if (target) {
      if (actor.trackedEnemyId !== target.id) {
        actor.trackedEnemyId = target.id;
        actor.reactionMs = 210 + actor.tacticalIndex * 55;
        actor.burstShots = 0;
      }
      actor.lastSeen = { x: target.x, y: target.y, remainingMs: 1500 };
    } else {
      actor.trackedEnemyId = null;
      actor.reactionMs = 0;
    }
    actor.reactionMs = Math.max(0, actor.reactionMs - deltaMs);

    if (target) {
      const targetAngle = Math.atan2(target.y - actor.y, target.x - actor.x);
      actor.angle = moveAngleToward(actor.angle, targetAngle, deltaMs / 110);
      const separation = distance(actor, target);
      const preferred = WEAPONS[actor.weapon].preferredRange;
      if (separation > preferred + 55) {
        this.moveToward(actor, target, deltaMs);
      } else if (separation < preferred - 80) {
        actor.velocity.x = -Math.cos(targetAngle) * actor.speed * 0.62;
        actor.velocity.y = -Math.sin(targetAngle) * actor.speed * 0.62;
        moveActor(actor, actor.velocity.x * deltaMs / 1000, actor.velocity.y * deltaMs / 1000, ACTOR_RADIUS, isBlocked);
      } else {
        const side = actor.tacticalIndex % 2 === 0 ? 1 : -1;
        const strafeAngle = targetAngle + side * Math.PI / 2;
        actor.velocity.x = Math.cos(strafeAngle) * 56;
        actor.velocity.y = Math.sin(strafeAngle) * 56;
        moveActor(actor, actor.velocity.x * deltaMs / 1000, actor.velocity.y * deltaMs / 1000, ACTOR_RADIUS, isBlocked);
      }

      const weapon = WEAPONS[actor.weapon];
      if (
        actor.reactionMs <= 0 &&
        Math.abs(angleDelta(actor.angle, targetAngle)) < 0.11 &&
        separation < weapon.range &&
        actor.burstPauseMs <= 0
      ) {
        this.fire(actor);
        actor.burstShots += 1;
        const maxBurst = actor.weapon === 'smg' ? 5 : actor.weapon === 'rifle' ? 3 : 1;
        if (actor.burstShots >= maxBurst) {
          actor.burstShots = 0;
          actor.burstPauseMs = 280 + actor.tacticalIndex * 70;
        }
      }

      if (actor.grenades > 0 && separation > 250 && actor.reactionMs <= 0 && actor.tacticalIndex === 1 && this.random.next() < deltaMs * 0.000025) {
        this.throwSmoke(actor, target);
      }
    } else {
      const rally = actor.team === 'blue' ? BLUE_RALLY : RED_RALLY;
      const defaultGoal = rally[actor.tacticalIndex % rally.length] ?? ZONE_CENTER;
      const goal = actor.lastSeen ?? (this.pressureZoneActive ? {
        x: ZONE_CENTER.x + (actor.team === 'blue' ? -55 : 55),
        y: ZONE_CENTER.y + (actor.tacticalIndex - 1) * 42,
      } : defaultGoal);
      this.moveToward(actor, goal, deltaMs);
    }

    if (actor.ammo.magazine <= 0) this.startReload(actor);
  }

  private moveToward(actor: ActorState, goal: Point, deltaMs: number): void {
    actor.repathMs -= deltaMs;
    if (actor.repathMs <= 0 || actor.path.length === 0 || actor.pathIndex >= actor.path.length) {
      actor.path = findPath(actor, goal);
      actor.pathIndex = 0;
      actor.repathMs = 480 + actor.tacticalIndex * 85;
    }
    let waypoint = actor.path[actor.pathIndex];
    if (!waypoint) {
      actor.velocity = { x: 0, y: 0 };
      return;
    }
    if (distance(actor, waypoint) < 26) {
      actor.pathIndex += 1;
      waypoint = actor.path[actor.pathIndex];
      if (!waypoint) return;
    }
    const angle = Math.atan2(waypoint.y - actor.y, waypoint.x - actor.x);
    actor.velocity.x = Math.cos(angle) * actor.speed;
    actor.velocity.y = Math.sin(angle) * actor.speed;
    moveActor(actor, actor.velocity.x * deltaMs / 1000, actor.velocity.y * deltaMs / 1000, ACTOR_RADIUS, isBlocked);
    if (!actor.lastSeen) actor.angle = moveAngleToward(actor.angle, angle, deltaMs / 240);
  }

  private fire(actor: ActorState): void {
    if (!actor.alive || actor.cooldownMs > 0 || actor.reloadMs > 0) return;
    if (actor.ammo.magazine <= 0) {
      this.startReload(actor);
      return;
    }
    const weapon = WEAPONS[actor.weapon];
    const spentAmmo = spendShot(actor.ammo);
    if (!spentAmmo) {
      this.startReload(actor);
      return;
    }
    actor.ammo = spentAmmo;
    actor.cooldownMs = weapon.fireIntervalMs;
    const moving = Math.hypot(actor.velocity.x, actor.velocity.y) > 55;
    const spread = weapon.spread * (moving ? weapon.movingSpreadMultiplier : 1);
    for (let pellet = 0; pellet < weapon.pellets; pellet += 1) {
      const offset = weapon.pellets === 1 ? this.random.between(-spread, spread) :
        Phaser.Math.Linear(-spread, spread, pellet / Math.max(1, weapon.pellets - 1)) + this.random.between(-spread * 0.08, spread * 0.08);
      this.performHitscan(actor, actor.angle + offset, weapon.range, weapon.damage);
    }
    this.cameraShake = Math.min(5, this.cameraShake + (actor === this.controlled ? 2.3 : 0.5));
    if (actor === this.controlled) this.soundSynth.play('shot');
  }

  private performHitscan(actor: ActorState, angle: number, range: number, damage: number): void {
    const direction = { x: Math.cos(angle), y: Math.sin(angle) };
    let closest = this.wallDistance(actor, direction, range);
    let target: ActorState | null = null;
    for (const candidate of this.actors) {
      if (!candidate.alive || candidate.team === actor.team) continue;
      const dx = candidate.x - actor.x;
      const dy = candidate.y - actor.y;
      const projection = dx * direction.x + dy * direction.y;
      if (projection < 0 || projection > closest) continue;
      const perpendicularX = actor.x + direction.x * projection - candidate.x;
      const perpendicularY = actor.y + direction.y * projection - candidate.y;
      if (perpendicularX * perpendicularX + perpendicularY * perpendicularY <= (ACTOR_RADIUS + 5) ** 2) {
        closest = projection;
        target = candidate;
      }
    }
    const end = { x: actor.x + direction.x * closest, y: actor.y + direction.y * closest };
    this.tracers.push({
      start: { x: actor.x + direction.x * 20, y: actor.y + direction.y * 20 },
      end,
      team: actor.team,
      remainingMs: 75,
    });
    if (target) this.damageActor(target, damage, actor);
    else if (closest < range - 2) this.spawnImpacts(end, 3);
  }

  private wallDistance(origin: Point, direction: Point, maxDistance: number): number {
    let closest = maxDistance;
    for (const rectangle of COLLIDERS) {
      const distanceToWall = this.rayRectangleDistance(origin, direction, rectangle, maxDistance);
      if (distanceToWall !== null) closest = Math.min(closest, distanceToWall);
    }
    return closest;
  }

  private rayRectangleDistance(
    origin: Point,
    direction: Point,
    rectangle: { x: number; y: number; width: number; height: number },
    maxDistance: number,
  ): number | null {
    let near = 0;
    let far = maxDistance;
    const axes = [
      [origin.x, direction.x, rectangle.x, rectangle.x + rectangle.width],
      [origin.y, direction.y, rectangle.y, rectangle.y + rectangle.height],
    ] as const;
    for (const [position, velocity, minimum, maximum] of axes) {
      if (Math.abs(velocity) < 0.00001) {
        if (position < minimum || position > maximum) return null;
        continue;
      }
      const first = (minimum - position) / velocity;
      const second = (maximum - position) / velocity;
      near = Math.max(near, Math.min(first, second));
      far = Math.min(far, Math.max(first, second));
      if (near > far) return null;
    }
    return near >= 0 && near <= maxDistance ? near : null;
  }

  private damageActor(target: ActorState, amount: number, source: ActorState): void {
    if (!target.alive) return;
    const result = applyDamage(target, amount);
    target.armor = result.armor;
    target.hp = result.hp;
    target.hitFlashMs = 120;
    this.matchEvents.emit('actor:damaged', { targetId: target.id, sourceId: source.id, amount });
    this.spawnImpacts(target, 5);
    if (source === this.controlled) {
      this.hitMarkerMs = 130;
      this.soundSynth.play('hit');
    }
    if (target.hp > 0) return;

    target.hp = 0;
    target.alive = false;
    this.matchEvents.emit('actor:killed', { targetId: target.id, sourceId: source.id });
    target.velocity = { x: 0, y: 0 };
    target.sprite.setFrame(`${target.team}-dead`).setDisplaySize(80, 80).setRotation(0).setAlpha(0.94);
    const stain = this.add.image(target.x, target.y, ASSET_KEYS.environment, 'floor-stain')
      .setDisplaySize(105, 105)
      .setAlpha(0.62)
      .setRotation(this.random.between(0, Math.PI * 2))
      .setDepth(target.y - 1);
    this.dynamicObjects.push(stain);
    target.sprite.setDepth(target.y + 1);
    this.announce(`${source.name}  ›  ${target.name}`, 900);
    if (source === this.controlled) {
      this.hitMarkerMs = 0;
      this.killMarkerMs = 350;
      this.soundSynth.play('kill');
    }
    if (target === this.controlled) this.performTakeover(target);
  }

  private performTakeover(deadActor: ActorState): void {
    const allies = this.actors.filter((actor) => actor.team === deadActor.team && actor.id !== deadActor.id);
    const selectedId = chooseTakeoverCandidate(deadActor, allies.map((actor) => ({
      id: actor.id,
      alive: actor.alive,
      exposed: this.actors.some((enemy) => enemy.team !== actor.team && enemy.alive && this.canSee(enemy, actor)),
      position: actor,
    })));
    const selected = allies.find((actor) => actor.id === selectedId);
    if (!selected) {
      this.controlled = null;
      return;
    }
    this.takeControl(selected, true);
  }

  private takeControl(actor: ActorState, announce: boolean): void {
    if (this.controlled && this.controlled !== actor && this.controlled.alive) this.controlled.ai = true;
    actor.ai = false;
    actor.path = [];
    actor.pathIndex = 0;
    this.controlled = actor;
    this.cameras.main.startFollow(actor.sprite, true, 0.09, 0.09);
    this.cameras.main.setDeadzone(80, 55);
    if (announce) this.matchEvents.emit('takeover:completed', { actorId: actor.id });
    if (announce) this.announce(`CONTROL TRANSFER  ·  ${actor.name}`, 1400);
  }

  private startReload(actor: ActorState): void {
    const weapon = WEAPONS[actor.weapon];
    if (actor.reloadMs > 0 || actor.ammo.magazine >= weapon.magazineSize || actor.ammo.reserve <= 0) return;
    actor.reloadMs = weapon.reloadMs;
  }

  private throwSmoke(actor: ActorState, target: Point): void {
    if (!actor.alive || actor.grenades <= 0) return;
    let dx = target.x - actor.x;
    let dy = target.y - actor.y;
    const magnitude = Math.hypot(dx, dy) || 1;
    const maximum = 320;
    if (magnitude > maximum) {
      dx = dx / magnitude * maximum;
      dy = dy / magnitude * maximum;
    }
    let x = actor.x + dx;
    let y = actor.y + dy;
    for (let attempt = 0; attempt < 12 && isBlocked(x, y, 8); attempt += 1) {
      x = Phaser.Math.Linear(x, actor.x, 0.12);
      y = Phaser.Math.Linear(y, actor.y, 0.12);
    }
    actor.grenades -= 1;
    this.smokes.push(createSmoke(this.smokeSequence += 1, { x, y }));
    if (actor === this.controlled) this.announce('SMOKE OUT', 700);
  }

  private updatePickups(): void {
    for (const pickup of this.pickups) {
      if (!pickup.active) continue;
      const pulse = 1 + Math.sin(this.time.now / 220 + pickup.x) * 0.04;
      pickup.sprite.setDisplaySize(58 * pulse, 58 * pulse);
      for (const actor of this.actors) {
        if (!actor.alive || distance(actor, pickup) >= 38) continue;
        const effect = applyPickup(pickup.kind, actor);
        if (!effect) continue;
        if (effect.kind === 'med') actor.hp = effect.hp;
        else actor.ammo = effect.ammo;
        this.collectPickup(pickup, actor, effect.message);
        break;
      }
    }
  }

  private collectPickup(pickup: PickupState, actor: ActorState, message: string): void {
    pickup.active = false;
    pickup.sprite.setVisible(false);
    this.matchEvents.emit('pickup:collected', { actorId: actor.id, kind: pickup.kind });
    if (actor === this.controlled) {
      this.announce(message, 800);
      this.soundSynth.play('pickup');
    }
  }

  private updatePressureZone(deltaMs: number): void {
    if (!this.pressureZoneActive) return;
    const occupancy = { blue: 0, red: 0 };
    for (const actor of this.actors) {
      if (!actor.alive || distance(actor, ZONE_CENTER) >= ZONE_RADIUS) continue;
      occupancy[actor.team] += 1;
    }
    const update = updateCapture(this.captureState, occupancy, deltaMs / 1000);
    this.captureState = update.state;
    if (update.winner) {
      this.matchEvents.emit('zone:captured', { team: update.winner });
      this.endRound(update.winner, 'ZONE SECURED');
    }
  }

  private endRound(team: Team, reason: string): void {
    if (this.phase !== 'combat') return;
    const result = recordRoundWin(this.score, team);
    this.score = result.score;
    this.clearInputState();
    if (result.matchWinner) {
      this.phase = 'match-over';
      this.bannerText.setText(`${team.toUpperCase()} TAKES THE MATCH\n${this.score.blue} — ${this.score.red}\n\nTAP TO RESTART`)
        .setColor(team === 'blue' ? '#42a7ff' : '#ef5448');
      return;
    }
    this.phase = 'round-over';
    this.roundTransitionMs = 2800;
    this.bannerText.setText(`${team.toUpperCase()} WINS\n${reason}`)
      .setColor(team === 'blue' ? '#42a7ff' : '#ef5448');
  }

  private resetMatch(): void {
    this.score = { blue: 0, red: 0 };
    this.roundNumber = 1;
    this.selectedWeapon = 'rifle';
    this.bannerText.setColor('#eee8d6').setText('');
    this.prepareRound();
    this.enterLoadout();
  }

  private canSee(observer: ActorState, target: ActorState): boolean {
    return observer.alive && target.alive && hasLineOfSight(observer, target, COLLIDERS, this.smokes);
  }

  private updateVisibility(): void {
    for (const actor of this.actors) {
      const visible = actor.team === 'blue' || !actor.alive || this.actors.some(
        (blue) => blue.team === 'blue' && blue.alive && this.canSee(blue, actor),
      );
      actor.sprite.setVisible(visible);
    }
  }

  private syncActors(): void {
    for (const actor of this.actors) {
      actor.sprite.setPosition(actor.x, actor.y);
      if (actor.alive) {
        actor.sprite
          .setRotation(actor.angle + 0.06)
          .setDepth(actor.y)
          .setTint(actor.hitFlashMs > 0 ? 0xffb8a5 : 0xffffff);
      }
    }
  }

  private spawnImpacts(point: Point, count: number): void {
    for (let index = 0; index < count; index += 1) {
      this.impacts.push({
        x: point.x + this.random.between(-7, 7),
        y: point.y + this.random.between(-7, 7),
        velocity: { x: this.random.between(-85, 85), y: this.random.between(-85, 85) },
        remainingMs: 250,
      });
    }
  }

  private announce(text: string, durationMs: number): void {
    this.announcement = { text, remainingMs: durationMs, totalMs: durationMs };
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.phase === 'match-over') {
      this.resetMatch();
      return;
    }
    if (this.phase !== 'combat' && this.phase !== 'countdown') return;
    const layout = this.getControlLayout();
    if (this.inside(pointer, layout.fire)) {
      this.touchState.firePointers.add(pointer.id);
      return;
    }
    if (this.inside(pointer, layout.reload)) {
      if (this.controlled) this.startReload(this.controlled);
      return;
    }
    if (this.inside(pointer, layout.smoke) && this.controlled && this.controlled.grenades > 0) {
      this.touchState.smokePointerId = pointer.id;
      this.touchState.smokeTarget = { x: this.controlled.x, y: this.controlled.y };
      return;
    }
    if (this.inside(pointer, layout.move)) {
      this.touchState.moveStick = { pointerId: pointer.id, active: true, x: pointer.x, y: pointer.y };
      return;
    }
    if (this.inside(pointer, layout.aim)) {
      this.touchState.aimStick = { pointerId: pointer.id, active: true, x: pointer.x, y: pointer.y };
      this.updateAimFromPointer(pointer, layout);
    }
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    const layout = this.getControlLayout();
    if (this.touchState.moveStick.pointerId === pointer.id) {
      this.touchState.moveStick.x = pointer.x;
      this.touchState.moveStick.y = pointer.y;
    }
    if (this.touchState.aimStick.pointerId === pointer.id) {
      this.touchState.aimStick.x = pointer.x;
      this.touchState.aimStick.y = pointer.y;
      this.updateAimFromPointer(pointer, layout);
    }
    if (this.touchState.smokePointerId === pointer.id && this.controlled) {
      const dx = pointer.x - layout.smoke.x;
      const dy = pointer.y - layout.smoke.y;
      const magnitude = Math.hypot(dx, dy);
      const angle = magnitude > 8 ? Math.atan2(dy, dx) : this.controlled.angle;
      const power = Phaser.Math.Clamp(magnitude / (150 * layout.scale), 0.22, 1);
      this.touchState.smokeTarget = {
        x: this.controlled.x + Math.cos(angle) * (90 + 230 * power),
        y: this.controlled.y + Math.sin(angle) * (90 + 230 * power),
      };
    }
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    if (this.touchState.moveStick.pointerId === pointer.id) this.touchState.moveStick = { pointerId: null, active: false, x: 0, y: 0 };
    if (this.touchState.aimStick.pointerId === pointer.id) this.touchState.aimStick = { pointerId: null, active: false, x: 0, y: 0 };
    if (this.touchState.smokePointerId === pointer.id) {
      if (this.controlled && this.touchState.smokeTarget) this.throwSmoke(this.controlled, this.touchState.smokeTarget);
      this.touchState.smokePointerId = null;
      this.touchState.smokeTarget = null;
    }
    this.touchState.firePointers.delete(pointer.id);
  }

  private updateAimFromPointer(pointer: Phaser.Input.Pointer, layout: ControlLayout): void {
    if (!this.controlled) return;
    const dx = pointer.x - layout.aim.x;
    const dy = pointer.y - layout.aim.y;
    if (Math.hypot(dx, dy) > 8) this.controlled.angle = Math.atan2(dy, dx);
  }

  private clearInputState(): void {
    this.touchState = createTouchState();
  }

  private getControlLayout(): ControlLayout {
    const { width, height } = this.scale;
    const scale = Phaser.Math.Clamp(height / 430, 0.72, 1.15);
    return {
      scale,
      move: { x: 105 * scale, y: height - 100 * scale, radius: 62 * scale },
      aim: { x: width - 205 * scale, y: height - 102 * scale, radius: 58 * scale },
      fire: { x: width - 72 * scale, y: height - 94 * scale, radius: 48 * scale },
      smoke: { x: width - 70 * scale, y: height - 205 * scale, radius: 34 * scale },
      reload: { x: width - 142 * scale, y: height - 198 * scale, radius: 28 * scale },
    };
  }

  private inside(pointer: Phaser.Input.Pointer, circle: { x: number; y: number; radius: number }): boolean {
    return Math.hypot(pointer.x - circle.x, pointer.y - circle.y) <= circle.radius * 1.2;
  }

  private drawWorldEffects(): void {
    const now = this.time.now;
    this.zoneGraphics.clear();
    if (this.pressureZoneActive) {
      const pulse = 0.5 + Math.sin(now / 230) * 0.5;
      const color = this.captureState.activeTeam ? teamColor(this.captureState.activeTeam) : COLORS.gold;
      this.zoneGraphics.fillStyle(color, 0.07 + pulse * 0.04);
      this.zoneGraphics.fillCircle(ZONE_CENTER.x, ZONE_CENTER.y, ZONE_RADIUS);
      this.zoneGraphics.lineStyle(3, color, 0.85);
      this.zoneGraphics.strokeCircle(ZONE_CENTER.x, ZONE_CENTER.y, ZONE_RADIUS);
      for (let index = 0; index < 16; index += 2) {
        const first = index / 16 * Math.PI * 2;
        const second = (index + 1) / 16 * Math.PI * 2;
        this.zoneGraphics.lineBetween(
          ZONE_CENTER.x + Math.cos(first) * (ZONE_RADIUS + 8),
          ZONE_CENTER.y + Math.sin(first) * (ZONE_RADIUS + 8),
          ZONE_CENTER.x + Math.cos(second) * (ZONE_RADIUS + 8),
          ZONE_CENTER.y + Math.sin(second) * (ZONE_RADIUS + 8),
        );
      }
    }

    this.effectGraphics.clear();
    for (const tracer of this.tracers) {
      this.effectGraphics.lineStyle(2, tracer.team === 'blue' ? 0xffdc65 : 0xff7858, tracer.remainingMs / 75);
      this.effectGraphics.lineBetween(tracer.start.x, tracer.start.y, tracer.end.x, tracer.end.y);
    }
    for (const impact of this.impacts) {
      this.effectGraphics.fillStyle(0xffd862, Phaser.Math.Clamp(impact.remainingMs / 250, 0, 1));
      this.effectGraphics.fillCircle(impact.x, impact.y, 2.5);
    }
    for (const smoke of this.smokes) {
      const fade = Phaser.Math.Clamp(Math.min(smoke.ageMs / 550, smoke.remainingMs / 650), 0, 1);
      for (let index = 0; index < 13; index += 1) {
        const seed = smoke.id * 91 + index * 47;
        const angle = seed * 0.31 + now * 0.00005 * (index % 2 ? 1 : -1);
        const radial = (seed % 71) / 71 * smoke.radius * 0.58;
        const radius = smoke.radius * (0.28 + (seed % 31) / 100);
        this.effectGraphics.fillStyle(index % 3 === 0 ? 0x74766f : 0x95978e, fade * 0.18);
        this.effectGraphics.fillCircle(
          smoke.x + Math.cos(angle) * radial,
          smoke.y + Math.sin(angle) * radial * 0.7,
          radius,
        );
      }
    }

    this.statusGraphics.clear();
    for (const actor of this.actors) {
      if (!actor.alive || !actor.sprite.visible) continue;
      const color = teamColor(actor.team);
      this.statusGraphics.lineStyle(actor === this.controlled ? 3 : 2, color, 0.95);
      this.statusGraphics.strokeCircle(actor.x, actor.y, actor === this.controlled ? 23 : 20);
      if (actor === this.controlled) {
        this.statusGraphics.fillStyle(0xfff0b8, 1);
        this.statusGraphics.fillTriangle(actor.x, actor.y - 34, actor.x - 6, actor.y - 25, actor.x + 6, actor.y - 25);
      }
      this.statusGraphics.fillStyle(0x090a08, 0.8);
      this.statusGraphics.fillRect(actor.x - 23, actor.y - 32, 46, 5);
      this.statusGraphics.fillStyle(color, 1);
      this.statusGraphics.fillRect(actor.x - 23, actor.y - 32, 46 * actor.hp / 100, 5);
    }

    if (this.touchState.smokeTarget && this.controlled) {
      this.statusGraphics.lineStyle(2, 0xe9dfbe, 0.7);
      this.statusGraphics.lineBetween(this.controlled.x, this.controlled.y, this.touchState.smokeTarget.x, this.touchState.smokeTarget.y);
      this.statusGraphics.fillStyle(0xded8c1, 0.1);
      this.statusGraphics.fillCircle(this.touchState.smokeTarget.x, this.touchState.smokeTarget.y, 30);
      this.statusGraphics.strokeCircle(this.touchState.smokeTarget.x, this.touchState.smokeTarget.y, 30);
    }
  }

  private drawHud(): void {
    const { width, height } = this.scale;
    const layout = this.getControlLayout();
    const uiScale = layout.scale;
    this.hudGraphics.clear();
    this.hudGraphics.fillStyle(COLORS.charcoal, 0.9);
    this.hudGraphics.fillRect(0, 0, width, 64 * uiScale);
    this.hudGraphics.lineStyle(1, 0x8a7440, 0.45);
    this.hudGraphics.lineBetween(0, 64 * uiScale, width, 64 * uiScale);

    const timeSeconds = Math.max(0, Math.ceil(this.roundRemainingMs / 1000));
    const minutes = Math.floor(timeSeconds / 60);
    const seconds = String(timeSeconds % 60).padStart(2, '0');
    this.hudText
      .setPosition(width / 2, 25 * uiScale)
      .setFontSize(18 * uiScale)
      .setText(`${this.score.blue}     ${minutes}:${seconds}     ${this.score.red}`);
    const objective = this.suddenDeath
      ? 'SUDDEN DEATH  ·  ELIMINATE OR CAPTURE'
      : this.pressureZoneActive
        ? `PRESSURE ZONE  ·  ${this.zoneStatusText()}`
        : `ROUND ${this.roundNumber}  ·  ZONE IN ${Math.max(0, Math.ceil(this.roundRemainingMs / 1000 - PRESSURE_ZONE_AT_SECONDS))}`;
    this.objectiveText
      .setPosition(width / 2, 48 * uiScale)
      .setFontSize(9 * uiScale)
      .setColor(this.suddenDeath ? '#e55a47' : this.pressureZoneActive ? '#e2bd61' : '#a5a493')
      .setText(objective);

    const pipY = 28 * uiScale;
    for (const team of ['blue', 'red'] as Team[]) {
      const allies = this.actors.filter((actor) => actor.team === team);
      const baseX = width / 2 + (team === 'blue' ? -125 : 125) * uiScale;
      allies.forEach((actor, index) => {
        this.hudGraphics.fillStyle(actor.alive ? teamColor(team) : 0x3f423b, 1);
        this.hudGraphics.fillCircle(baseX + (team === 'blue' ? -index : index) * 13 * uiScale, pipY, 4 * uiScale);
      });
    }

    if (this.pressureZoneActive) {
      const barWidth = 180 * uiScale;
      const progress = this.captureState.progressSeconds / CAPTURE_SECONDS;
      this.hudGraphics.fillStyle(0x20231d, 0.9);
      this.hudGraphics.fillRect(width / 2 - barWidth / 2, 68 * uiScale, barWidth, 5 * uiScale);
      if (this.captureState.activeTeam) {
        this.hudGraphics.fillStyle(teamColor(this.captureState.activeTeam), 1);
        this.hudGraphics.fillRect(width / 2 - barWidth / 2, 68 * uiScale, barWidth * progress, 5 * uiScale);
      }
    }

    if (this.controlled) {
      const actor = this.controlled;
      const panelWidth = 265 * uiScale;
      const panelX = width / 2 - panelWidth / 2;
      const panelY = height - 38 * uiScale;
      this.hudGraphics.fillStyle(0x11130f, 0.9);
      this.hudGraphics.fillRect(panelX, panelY, panelWidth, 29 * uiScale);
      this.hudGraphics.fillStyle(COLORS.health, 1);
      this.hudGraphics.fillRect(panelX + 8 * uiScale, panelY + 6 * uiScale, 105 * uiScale * actor.hp / 100, 6 * uiScale);
      this.hudGraphics.fillStyle(COLORS.armor, 1);
      this.hudGraphics.fillRect(panelX + 8 * uiScale, panelY + 18 * uiScale, 105 * uiScale * actor.armor / 100, 5 * uiScale);
      this.playerText
        .setVisible(true)
        .setPosition(width / 2 + 56 * uiScale, panelY + 15 * uiScale)
        .setFontSize(10 * uiScale)
        .setText(`${WEAPONS[actor.weapon].label}  ${actor.ammo.magazine}/${actor.ammo.reserve}   ·   ${Math.ceil(actor.hp)} HP`);
      if (actor.reloadMs > 0) {
        const definition = WEAPONS[actor.weapon];
        const progress = 1 - actor.reloadMs / definition.reloadMs;
        this.hudGraphics.fillStyle(0x11130f, 0.94);
        this.hudGraphics.fillRect(width / 2 - 72 * uiScale, height - 70 * uiScale, 144 * uiScale, 20 * uiScale);
        this.hudGraphics.fillStyle(COLORS.gold, 1);
        this.hudGraphics.fillRect(width / 2 - 64 * uiScale, height - 55 * uiScale, 128 * uiScale * progress, 3 * uiScale);
      }
    } else {
      this.playerText.setVisible(false);
    }

    const controlsVisible = this.phase === 'combat' || this.phase === 'countdown';
    this.fireButtonText.setVisible(controlsVisible);
    this.smokeButtonText.setVisible(controlsVisible);
    this.reloadButtonText.setVisible(controlsVisible);
    if (controlsVisible) this.drawTouchControls(layout);
    this.drawCombatMarker(width, height, uiScale);

    if (this.announcement) {
      const fade = Phaser.Math.Clamp(Math.min(
        this.announcement.remainingMs / 160,
        (this.announcement.totalMs - this.announcement.remainingMs) / 120,
      ), 0, 1);
      this.hudGraphics.fillStyle(0x10120e, 0.84 * fade);
      this.hudGraphics.fillRect(width / 2 - 160 * uiScale, 87 * uiScale, 320 * uiScale, 30 * uiScale);
      this.announcementText
        .setVisible(true)
        .setAlpha(fade)
        .setPosition(width / 2, 102 * uiScale)
        .setFontSize(11 * uiScale)
        .setText(this.announcement.text);
    } else {
      this.announcementText.setVisible(false);
    }

    this.bannerText.setPosition(width / 2, height / 2).setFontSize(Phaser.Math.Clamp(height / 10, 28, 58));
  }

  private zoneStatusText(): string {
    if (!this.captureState.activeTeam || this.captureState.progressSeconds <= 0) return 'HOLD 6.0s UNCONTESTED';
    const remaining = Math.max(0, CAPTURE_SECONDS - this.captureState.progressSeconds).toFixed(1);
    return `${this.captureState.activeTeam.toUpperCase()} CAPTURING  ·  ${remaining}s`;
  }

  private drawTouchControls(layout: ControlLayout): void {
    const circles = [layout.move, layout.aim];
    for (const circle of circles) {
      this.hudGraphics.fillStyle(0x11130f, 0.23);
      this.hudGraphics.fillCircle(circle.x, circle.y, circle.radius);
      this.hudGraphics.lineStyle(2, 0xe8e3d1, 0.45);
      this.hudGraphics.strokeCircle(circle.x, circle.y, circle.radius);
    }

    let moveKnob = { x: layout.move.x, y: layout.move.y };
    if (this.touchState.moveStick.active) {
      const dx = this.touchState.moveStick.x - layout.move.x;
      const dy = this.touchState.moveStick.y - layout.move.y;
      const magnitude = Math.hypot(dx, dy) || 1;
      const length = Math.min(layout.move.radius * 0.55, magnitude);
      moveKnob = { x: layout.move.x + dx / magnitude * length, y: layout.move.y + dy / magnitude * length };
    }
    this.hudGraphics.fillStyle(0xeee9d8, 0.72);
    this.hudGraphics.fillCircle(moveKnob.x, moveKnob.y, 20 * layout.scale);
    const aimAngle = this.controlled?.angle ?? 0;
    this.hudGraphics.fillCircle(
      layout.aim.x + Math.cos(aimAngle) * layout.aim.radius * 0.48,
      layout.aim.y + Math.sin(aimAngle) * layout.aim.radius * 0.48,
      16 * layout.scale,
    );

    this.hudGraphics.fillStyle(this.touchState.firePointers.size > 0 ? 0xd54832 : 0x6f3026, 0.92);
    this.hudGraphics.fillCircle(layout.fire.x, layout.fire.y, layout.fire.radius);
    this.hudGraphics.lineStyle(3, 0xf1d17c, 0.9);
    this.hudGraphics.strokeCircle(layout.fire.x, layout.fire.y, layout.fire.radius);
    this.positionButtonText(this.fireButtonText, layout.fire.x, layout.fire.y, 'FIRE', 11 * layout.scale);

    this.hudGraphics.fillStyle(this.touchState.smokePointerId !== null ? 0x6e6750 : 0x252821, 0.94);
    this.hudGraphics.fillCircle(layout.smoke.x, layout.smoke.y, layout.smoke.radius);
    this.hudGraphics.lineStyle(2, 0xc8c2aa, 0.8);
    this.hudGraphics.strokeCircle(layout.smoke.x, layout.smoke.y, layout.smoke.radius);
    this.positionButtonText(this.smokeButtonText, layout.smoke.x, layout.smoke.y, `SMK ${this.controlled?.grenades ?? 0}`, 8 * layout.scale);

    this.hudGraphics.fillStyle(0x252821, 0.9);
    this.hudGraphics.fillCircle(layout.reload.x, layout.reload.y, layout.reload.radius);
    this.hudGraphics.lineStyle(1, 0xa8a58f, 0.8);
    this.hudGraphics.strokeCircle(layout.reload.x, layout.reload.y, layout.reload.radius);
    this.positionButtonText(this.reloadButtonText, layout.reload.x, layout.reload.y, 'RLD', 8 * layout.scale);
  }

  private createFixedButtonText(): Phaser.GameObjects.Text {
    return this.add.text(0, 0, '', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#fff2cc',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(5001);
  }

  private positionButtonText(
    label: Phaser.GameObjects.Text,
    x: number,
    y: number,
    text: string,
    size: number,
  ): void {
    label.setPosition(x, y).setFontSize(size).setText(text);
  }

  private drawCombatMarker(width: number, height: number, scale: number): void {
    if ((this.hitMarkerMs <= 0 && this.killMarkerMs <= 0) || !this.controlled?.alive) return;
    const x = width / 2 + Math.cos(this.controlled.angle) * 72 * scale;
    const y = height / 2 + Math.sin(this.controlled.angle) * 72 * scale;
    const kill = this.killMarkerMs > 0;
    const radius = (kill ? 11 : 8) * scale;
    this.hudGraphics.lineStyle(kill ? 4 : 3, kill ? 0xff5b45 : 0xfff1b8, 1);
    this.hudGraphics.lineBetween(x - radius, y - radius, x + radius, y + radius);
    this.hudGraphics.lineBetween(x + radius, y - radius, x - radius, y + radius);
    if (kill) this.hudGraphics.strokeCircle(x, y, 17 * scale);
  }
}
