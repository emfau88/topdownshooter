import { segmentIntersectsCircle, segmentIntersectsRectangle } from '../map';
import type { Point } from './types';

export interface VisionBlocker {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface VisionSmoke extends Point {
  radius: number;
  remainingMs: number;
}

/** Smoke is intentionally considered only for sight; hitscan projectiles do not call this rule. */
export function hasLineOfSight(
  start: Point,
  end: Point,
  blockers: readonly VisionBlocker[],
  smokes: readonly VisionSmoke[],
  maxDistance = 720,
): boolean {
  if (Math.hypot(end.x - start.x, end.y - start.y) > maxDistance) return false;
  if (blockers.some((blocker) => segmentIntersectsRectangle(start, end, blocker))) return false;
  return !smokes.some(
    (smoke) => smoke.remainingMs > 400 && segmentIntersectsCircle(start, end, smoke, smoke.radius * 0.72),
  );
}
