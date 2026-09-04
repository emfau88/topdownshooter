import { describe, expect, it } from 'vitest';
import { WEAPON_FEEL } from '../src/game/config';

describe('weapon presentation roles', () => {
  it('keeps shotgun feedback heaviest and SMG feedback lightest', () => {
    expect(WEAPON_FEEL.shotgun.cameraKick).toBeGreaterThan(WEAPON_FEEL.rifle.cameraKick);
    expect(WEAPON_FEEL.rifle.cameraKick).toBeGreaterThan(WEAPON_FEEL.smg.cameraKick);
    expect(WEAPON_FEEL.shotgun.muzzleSize).toBeGreaterThan(WEAPON_FEEL.rifle.muzzleSize);
  });

  it('keeps SMG tracers shortest for its high fire rate', () => {
    expect(WEAPON_FEEL.smg.tracerLifetimeMs).toBeLessThan(WEAPON_FEEL.rifle.tracerLifetimeMs);
    expect(WEAPON_FEEL.smg.tracerWidth).toBeLessThan(WEAPON_FEEL.rifle.tracerWidth);
  });
});
