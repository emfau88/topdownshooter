import { describe, expect, it } from 'vitest';
import { applyDamage, spendShot } from '../src/game/model/combat';

describe('combat rules', () => {
  it('spends one shell for a shotgun trigger pull regardless of pellet count', () => {
    expect(spendShot({ magazine: 6, reserve: 12 })).toEqual({ magazine: 5, reserve: 12 });
  });

  it('cannot fire a weapon with an empty magazine', () => {
    expect(spendShot({ magazine: 0, reserve: 12 })).toBeNull();
  });

  it('applies only 35% of incoming damage to armor and never underflows', () => {
    expect(applyDamage({ hp: 100, armor: 10 }, 40)).toEqual({
      hp: 70,
      armor: 0,
      absorbed: 10,
      dealtToHealth: 30,
      eliminated: false,
    });
  });

  it('marks an actor eliminated when damage exhausts health', () => {
    expect(applyDamage({ hp: 10, armor: 0 }, 20)).toMatchObject({ hp: 0, eliminated: true });
  });
});
