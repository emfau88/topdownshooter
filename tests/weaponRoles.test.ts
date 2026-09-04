import { describe, expect, it } from 'vitest';
import { WEAPONS } from '../src/game/config';

describe('weapon role boundaries', () => {
  it('keeps intentional effective-range bands', () => {
    expect(WEAPONS.rifle.range).toBeGreaterThan(WEAPONS.smg.range);
    expect(WEAPONS.smg.range).toBeGreaterThan(WEAPONS.shotgun.range);
    expect(WEAPONS.rifle.preferredRange).toBeGreaterThan(WEAPONS.smg.preferredRange);
    expect(WEAPONS.smg.preferredRange).toBeGreaterThan(WEAPONS.shotgun.preferredRange);
  });

  it('keeps the intended firing identities distinct', () => {
    expect(WEAPONS.smg.fireIntervalMs).toBeLessThan(WEAPONS.rifle.fireIntervalMs);
    expect(WEAPONS.shotgun.pellets).toBeGreaterThan(1);
    expect(WEAPONS.rifle.pellets).toBe(1);
    expect(WEAPONS.smg.pellets).toBe(1);
  });
});
