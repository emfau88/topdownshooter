import type Phaser from 'phaser';
import type { AmmoState, Point, Team, WeaponKey } from '../model/types';

export interface ActorState extends Point {
  id: string;
  name: string;
  team: Team;
  weapon: WeaponKey;
  usesB0Character: boolean;
  ammo: AmmoState;
  sprite: Phaser.GameObjects.Image;
  alive: boolean;
  ai: boolean;
  hp: number;
  armor: number;
  angle: number;
  speed: number;
  velocity: Point;
  cooldownMs: number;
  reloadMs: number;
  grenades: number;
  hitFlashMs: number;
  reactionMs: number;
  trackedEnemyId: string | null;
  lastSeen: (Point & { remainingMs: number }) | null;
  path: Point[];
  pathIndex: number;
  repathMs: number;
  burstShots: number;
  burstPauseMs: number;
  tacticalIndex: number;
}

export interface PickupState extends Point {
  kind: 'ammo' | 'med';
  active: boolean;
  sprite: Phaser.GameObjects.Image;
}

export interface SmokeState extends Point {
  id: number;
  radius: number;
  remainingMs: number;
  ageMs: number;
}

export interface TracerState {
  start: Point;
  end: Point;
  team: Team;
  remainingMs: number;
}

export interface ImpactState extends Point {
  velocity: Point;
  remainingMs: number;
}

export interface Announcement {
  text: string;
  remainingMs: number;
  totalMs: number;
}

export interface ControlLayout {
  scale: number;
  move: { x: number; y: number; radius: number };
  aim: { x: number; y: number; radius: number };
  fire: { x: number; y: number; radius: number };
  smoke: { x: number; y: number; radius: number };
  reload: { x: number; y: number; radius: number };
}

export interface StickState {
  pointerId: number | null;
  active: boolean;
  x: number;
  y: number;
}
