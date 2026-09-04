import type { Point, WeaponDefinition, WeaponKey } from './model/types';

export const WORLD_WIDTH = 1600;
export const WORLD_HEIGHT = 960;
export const ROUND_SECONDS = 75;
export const PRESSURE_ZONE_AT_SECONDS = 20;
export const CAPTURE_SECONDS = 6;
export const ROUND_WINS_TO_MATCH = 3;
export const ACTOR_RADIUS = 17;
export const SMOKE_RADIUS = 100;
export const SMOKE_DURATION_MS = 7500;

export const COLORS = {
  blue: 0x2697ff,
  red: 0xef493d,
  gold: 0xe0b957,
  ivory: 0xeee8d6,
  muted: 0x969586,
  panel: 0x151812,
  panelLight: 0x252820,
  charcoal: 0x0b0d0a,
  health: 0x69c95f,
  armor: 0x4aa6e8,
} as const;

export const WEAPONS: Record<WeaponKey, WeaponDefinition> = {
  rifle: {
    key: 'rifle',
    label: 'RIFLE',
    subtitle: 'CONTROLLED / MID RANGE',
    damage: 31,
    fireIntervalMs: 160,
    magazineSize: 20,
    reserveCap: 60,
    startingReserve: 40,
    range: 680,
    spread: 0.024,
    movingSpreadMultiplier: 1.65,
    reloadMs: 1550,
    preferredRange: 350,
    pellets: 1,
  },
  smg: {
    key: 'smg',
    label: 'SMG',
    subtitle: 'FAST / CLOSE RANGE',
    damage: 18,
    fireIntervalMs: 85,
    magazineSize: 28,
    reserveCap: 84,
    startingReserve: 56,
    range: 480,
    spread: 0.055,
    movingSpreadMultiplier: 1.65,
    reloadMs: 1350,
    preferredRange: 255,
    pellets: 1,
  },
  shotgun: {
    key: 'shotgun',
    label: 'SHOTGUN',
    subtitle: 'HEAVY / ENTRY RANGE',
    damage: 13,
    fireIntervalMs: 620,
    magazineSize: 6,
    reserveCap: 18,
    startingReserve: 12,
    range: 325,
    spread: 0.15,
    movingSpreadMultiplier: 1.35,
    reloadMs: 1800,
    preferredRange: 180,
    pellets: 7,
  },
};

/** Presentation values stay separate from weapon damage and ammo rules. */
export const WEAPON_FEEL: Record<WeaponKey, {
  cameraKick: number;
  muzzleSize: number;
  tracerWidth: number;
  tracerLifetimeMs: number;
}> = {
  rifle: { cameraKick: 1.8, muzzleSize: 15, tracerWidth: 2.4, tracerLifetimeMs: 88 },
  smg: { cameraKick: 0.7, muzzleSize: 10, tracerWidth: 1.6, tracerLifetimeMs: 54 },
  shotgun: { cameraKick: 4.2, muzzleSize: 24, tracerWidth: 2.1, tracerLifetimeMs: 72 },
};

export const BLUE_SPAWNS: readonly Point[] = [
  { x: 165, y: 250 },
  { x: 165, y: 480 },
  { x: 165, y: 710 },
];

export const RED_SPAWNS: readonly Point[] = [
  { x: 1435, y: 250 },
  { x: 1435, y: 480 },
  { x: 1435, y: 710 },
];

export const BLUE_RALLY: readonly Point[] = [
  { x: 520, y: 250 },
  { x: 525, y: 480 },
  { x: 520, y: 710 },
];

export const RED_RALLY: readonly Point[] = [
  { x: 1080, y: 250 },
  { x: 1075, y: 480 },
  { x: 1080, y: 710 },
];
