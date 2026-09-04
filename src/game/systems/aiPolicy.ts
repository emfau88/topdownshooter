import type { Point, Team } from '../model/types';

export interface AiTarget extends Point {
  id: string;
}

export interface IdleGoalInput {
  team: Team;
  tacticalIndex: number;
  pressureActive: boolean;
  lastSeen: (Point & { remainingMs: number }) | null;
  blueRally: readonly Point[];
  redRally: readonly Point[];
  zoneCenter: Point;
}

export function nearestAiTarget(origin: Point, candidates: readonly AiTarget[]): AiTarget | null {
  let closest: AiTarget | null = null;
  let closestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of candidates) {
    const distanceSquared = (candidate.x - origin.x) ** 2 + (candidate.y - origin.y) ** 2;
    if (distanceSquared < closestDistance) {
      closest = candidate;
      closestDistance = distanceSquared;
    }
  }
  return closest;
}

export function chooseIdleGoal(input: IdleGoalInput): Point {
  if (input.lastSeen) return input.lastSeen;
  if (input.pressureActive) {
    return {
      x: input.zoneCenter.x + (input.team === 'blue' ? -55 : 55),
      y: input.zoneCenter.y + (input.tacticalIndex - 1) * 42,
    };
  }
  const rally = input.team === 'blue' ? input.blueRally : input.redRally;
  return rally[input.tacticalIndex % rally.length] ?? input.zoneCenter;
}
