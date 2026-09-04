import { SMOKE_DURATION_MS, SMOKE_RADIUS } from '../config';
import type { SmokeState } from '../entities/types';
import type { Point } from './types';

export function createSmoke(id: number, position: Point): SmokeState {
  return { id, x: position.x, y: position.y, radius: SMOKE_RADIUS, remainingMs: SMOKE_DURATION_MS, ageMs: 0 };
}

export function tickSmokes(smokes: readonly SmokeState[], deltaMs: number): SmokeState[] {
  const safeDelta = Math.max(0, deltaMs);
  return smokes
    .map((smoke) => ({ ...smoke, remainingMs: smoke.remainingMs - safeDelta, ageMs: smoke.ageMs + safeDelta }))
    .filter((smoke) => smoke.remainingMs > 0);
}
