import { describe, expect, it } from 'vitest';
import { applyPickup } from '../src/game/model/pickup';

describe('pickup rules', () => {
  it('heals an injured actor but leaves a medkit for a healthy actor', () => {
    expect(applyPickup('med', { hp: 60, weapon: 'rifle', ammo: { magazine: 20, reserve: 40 } }))
      .toEqual({ kind: 'med', hp: 95, message: 'MEDKIT  +35' });
    expect(applyPickup('med', { hp: 90, weapon: 'rifle', ammo: { magazine: 20, reserve: 40 } })).toBeNull();
  });

  it('adds one magazine to reserve and keeps ammo available at the cap', () => {
    expect(applyPickup('ammo', { hp: 100, weapon: 'shotgun', ammo: { magazine: 2, reserve: 6 } }))
      .toEqual({ kind: 'ammo', ammo: { magazine: 2, reserve: 12 }, message: 'AMMO  +6' });
    expect(applyPickup('ammo', { hp: 100, weapon: 'shotgun', ammo: { magazine: 2, reserve: 18 } })).toBeNull();
  });
});
