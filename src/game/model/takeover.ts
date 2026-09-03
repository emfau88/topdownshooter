import type { Point, TakeoverCandidate } from './types';

function squaredDistance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function chooseTakeoverCandidate(
  deathPosition: Point,
  candidates: readonly TakeoverCandidate[],
): string | null {
  const living = candidates.filter((candidate) => candidate.alive);
  if (living.length === 0) return null;

  const sheltered = living.filter((candidate) => !candidate.exposed);
  const pool = sheltered.length > 0 ? sheltered : living;
  const ordered = [...pool].sort((a, b) => {
    const distanceDelta = squaredDistance(a.position, deathPosition) - squaredDistance(b.position, deathPosition);
    return distanceDelta === 0 ? a.id.localeCompare(b.id) : distanceDelta;
  });
  return ordered[0]?.id ?? null;
}
