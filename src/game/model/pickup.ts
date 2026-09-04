import { WEAPONS } from '../config';
import { grantAmmoMagazine } from './ammo';
import type { AmmoState, WeaponKey } from './types';

export type PickupKind = 'ammo' | 'med';

export interface PickupTarget {
  hp: number;
  weapon: WeaponKey;
  ammo: AmmoState;
}

export type PickupEffect =
  | { kind: 'med'; hp: number; message: string }
  | { kind: 'ammo'; ammo: AmmoState; message: string };

/** Returns null when the pickup should remain available to other actors. */
export function applyPickup(kind: PickupKind, target: PickupTarget): PickupEffect | null {
  if (kind === 'med') {
    if (target.hp >= 90) return null;
    return { kind, hp: Math.min(100, target.hp + 35), message: 'MEDKIT  +35' };
  }

  if (target.ammo.reserve >= WEAPONS[target.weapon].reserveCap) return null;
  return {
    kind,
    ammo: grantAmmoMagazine(target.weapon, target.ammo),
    message: `AMMO  +${WEAPONS[target.weapon].magazineSize}`,
  };
}
