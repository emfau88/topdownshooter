import { describe, expect, it } from 'vitest';
import { hasLineOfSight } from '../src/game/model/visibility';

describe('visibility', () => {
  const start = { x: 0, y: 0 };
  const end = { x: 200, y: 0 };

  it('lets an unobstructed observer see a target', () => {
    expect(hasLineOfSight(start, end, [], [])).toBe(true);
  });

  it('blocks sight through active smoke but expires before its final fade', () => {
    expect(hasLineOfSight(start, end, [], [{ x: 100, y: 0, radius: 100, remainingMs: 1000 }])).toBe(false);
    expect(hasLineOfSight(start, end, [], [{ x: 100, y: 0, radius: 100, remainingMs: 400 }])).toBe(true);
  });

  it('blocks sight through solid map geometry', () => {
    expect(hasLineOfSight(start, end, [{ x: 90, y: -20, width: 20, height: 40 }], [])).toBe(false);
  });
});
