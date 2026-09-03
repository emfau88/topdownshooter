export type Team = 'blue' | 'red';
export type WeaponKey = 'rifle' | 'smg' | 'shotgun';
export type MatchPhase = 'loadout' | 'countdown' | 'combat' | 'round-over' | 'match-over';

export interface Point {
  x: number;
  y: number;
}

export interface WeaponDefinition {
  key: WeaponKey;
  label: string;
  subtitle: string;
  damage: number;
  fireIntervalMs: number;
  magazineSize: number;
  reserveCap: number;
  startingReserve: number;
  range: number;
  spread: number;
  movingSpreadMultiplier: number;
  reloadMs: number;
  preferredRange: number;
  pellets: number;
}

export interface AmmoState {
  magazine: number;
  reserve: number;
}

export interface CaptureState {
  activeTeam: Team | null;
  progressSeconds: number;
}

export interface CaptureOccupancy {
  blue: number;
  red: number;
}

export interface TakeoverCandidate {
  id: string;
  alive: boolean;
  exposed: boolean;
  position: Point;
}
