import { describe, expect, it } from 'vitest';
import { WEAPONS } from '../src/game/config';
import { createAmmoState, grantAmmoMagazine, reloadAmmo } from '../src/game/model/ammo';

describe('deterministic ammunition', () => {
  it('starts with a full magazine and a fixed reserve', () => {
    expect(createAmmoState('rifle')).toEqual({ magazine: 20, reserve: 40 });
  });

  it('moves rounds from reserve into the magazine without creating ammunition', () => {
    const before = { magazine: 7, reserve: 9 };
    const after = reloadAmmo('rifle', before);
    expect(after).toEqual({ magazine: 16, reserve: 0 });
    expect(after.magazine + after.reserve).toBe(before.magazine + before.reserve);
  });

  it('adds exactly one magazine and respects the reserve cap', () => {
    expect(grantAmmoMagazine('smg', { magazine: 11, reserve: 50 })).toEqual({ magazine: 11, reserve: 78 });
    expect(grantAmmoMagazine('smg', { magazine: 11, reserve: 80 })).toEqual({
      magazine: 11,
      reserve: WEAPONS.smg.reserveCap,
    });
  });
});
