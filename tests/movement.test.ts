import { describe, expect, it } from 'vitest';
import type { ActorState } from '../src/game/entities/types';
import { depenetrateActor, moveActor, separateActors } from '../src/game/systems/movement';

function actor(id: string, x: number, y: number): ActorState {
  return {
    id, name: id, team: 'blue', weapon: 'rifle', usesB0Character: false, ammo: { magazine: 20, reserve: 40 }, sprite: {} as ActorState['sprite'],
    x, y, alive: true, ai: true, hp: 100, armor: 0, angle: 0, speed: 175, aimOffset: 0, velocity: { x: 0, y: 0 },
    cooldownMs: 0, reloadMs: 0, grenades: 1, hitFlashMs: 0, reactionMs: 0, trackedEnemyId: null, lastSeen: null,
    path: [{ x: 1, y: 1 }], pathIndex: 1, repathMs: 0, burstShots: 0, burstPauseMs: 0, tacticalIndex: 0,
  };
}

describe('movement system', () => {
  it('slides against blocked axes without cancelling the free axis', () => {
    const unit = actor('a', 0, 0);
    moveActor(unit, 10, 8, 1, (x) => x > 5);
    expect(unit).toMatchObject({ x: 0, y: 8 });
  });

  it('moves a stuck actor to a valid nearby position and clears its route', () => {
    const unit = actor('a', 0, 0);
    const moved = depenetrateActor(unit, 1, (x, y) => Math.abs(x) < 3 && Math.abs(y) < 3);
    expect(moved).toBe(true);
    expect(Math.hypot(unit.x, unit.y)).toBeGreaterThanOrEqual(6);
    expect(unit.path).toEqual([]);
    expect(unit.pathIndex).toBe(0);
  });

  it('separates overlapping living actors', () => {
    const first = actor('a', 0, 0);
    const second = actor('b', 5, 0);
    separateActors([first, second], 10, () => false);
    expect(Math.hypot(second.x - first.x, second.y - first.y)).toBeCloseTo(20);
  });
});
