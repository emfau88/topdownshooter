import type Phaser from 'phaser';
import { ASSET_KEYS } from '../assets';
import { createAmmoState } from '../model/ammo';
import type { Point, Team, WeaponKey } from '../model/types';
import type { ActorState } from './types';

export interface ActorSpawnSpec {
  team: Team;
  spawn: Point;
  name: string;
  weapon: WeaponKey;
  ai: boolean;
  tacticalIndex: number;
}

export function createActor(scene: Phaser.Scene, spec: ActorSpawnSpec): ActorState {
  const angle = spec.team === 'blue' ? -Math.PI / 2 : Math.PI / 2;
  const usesB0Character = spec.team === 'blue' && spec.weapon === 'rifle' && spec.tacticalIndex === 0;
  const sprite = scene.add.image(
    spec.spawn.x,
    spec.spawn.y,
    usesB0Character ? ASSET_KEYS.b0Character : ASSET_KEYS.soldiers,
    usesB0Character ? undefined : `${spec.team}-${spec.weapon}`,
  )
    // B0 has a deliberately generous transparent safety margin in its atlas.
    // Give it a larger canvas footprint so its visible body matches the tightly
    // cropped legacy sprites instead of making the controlled soldier tiny.
    .setDisplaySize(usesB0Character ? 140 : 70, usesB0Character ? 140 : 70)
    .setRotation(angle + 0.06)
    .setDepth(spec.spawn.y);

  return {
    id: `${spec.team}-${spec.tacticalIndex}`,
    name: spec.name,
    team: spec.team,
    weapon: spec.weapon,
    usesB0Character,
    ammo: createAmmoState(spec.weapon),
    sprite,
    x: spec.spawn.x,
    y: spec.spawn.y,
    alive: true,
    ai: spec.ai,
    hp: 100,
    armor: 35,
    angle,
    speed: 175,
    velocity: { x: 0, y: 0 },
    cooldownMs: 0,
    reloadMs: 0,
    grenades: 1,
    hitFlashMs: 0,
    reactionMs: 0,
    trackedEnemyId: null,
    lastSeen: null,
    path: [],
    pathIndex: 0,
    repathMs: 0,
    burstShots: 0,
    burstPauseMs: 0,
    tacticalIndex: spec.tacticalIndex,
  };
}
