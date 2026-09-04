import type { AmmoState } from './types';

export interface DamageState {
  hp: number;
  armor: number;
}

export interface DamageResult extends DamageState {
  absorbed: number;
  dealtToHealth: number;
  eliminated: boolean;
}

/** Spends exactly one round for every weapon trigger pull, including shotguns. */
export function spendShot(ammo: AmmoState): AmmoState | null {
  if (ammo.magazine <= 0) return null;
  return { ...ammo, magazine: ammo.magazine - 1 };
}

/** Applies the production armor rule without involving a Phaser actor or presentation. */
export function applyDamage(state: DamageState, amount: number): DamageResult {
  const safeAmount = Math.max(0, amount);
  const absorbed = Math.min(Math.max(0, state.armor), safeAmount * 0.35);
  const dealtToHealth = safeAmount - absorbed;
  const hp = Math.max(0, state.hp - dealtToHealth);
  return {
    hp,
    armor: Math.max(0, state.armor - absorbed),
    absorbed,
    dealtToHealth,
    eliminated: hp === 0,
  };
}
