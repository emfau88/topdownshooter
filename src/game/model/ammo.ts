import { WEAPONS } from '../config';
import type { AmmoState, WeaponKey } from './types';

export function createAmmoState(weapon: WeaponKey): AmmoState {
  const definition = WEAPONS[weapon];
  return {
    magazine: definition.magazineSize,
    reserve: definition.startingReserve,
  };
}

export function reloadAmmo(weapon: WeaponKey, ammo: AmmoState): AmmoState {
  const definition = WEAPONS[weapon];
  const missing = definition.magazineSize - ammo.magazine;
  const moved = Math.min(Math.max(missing, 0), ammo.reserve);
  return {
    magazine: ammo.magazine + moved,
    reserve: ammo.reserve - moved,
  };
}

export function grantAmmoMagazine(weapon: WeaponKey, ammo: AmmoState): AmmoState {
  const definition = WEAPONS[weapon];
  return {
    magazine: ammo.magazine,
    reserve: Math.min(definition.reserveCap, ammo.reserve + definition.magazineSize),
  };
}
