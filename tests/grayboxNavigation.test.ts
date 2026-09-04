import { describe, expect, it } from 'vitest';
import { BLUE_SPAWNS, RED_SPAWNS } from '../src/game/config';
import { isBlocked } from '../src/game/map';
import { findPath } from '../src/game/navigation';

const lanes = [
  { name: 'upper', point: { x: 800, y: 115 } },
  { name: 'middle', point: { x: 800, y: 480 } },
  { name: 'lower', point: { x: 800, y: 845 } },
] as const;

describe('Crossline Depot graybox navigation', () => {
  it('keeps every named lane target walkable', () => {
    for (const lane of lanes) expect(isBlocked(lane.point.x, lane.point.y, 18), lane.name).toBe(false);
  });

  it('connects each blue and red spawn to every tactical lane', () => {
    for (const spawn of [...BLUE_SPAWNS, ...RED_SPAWNS]) {
      for (const lane of lanes) {
        const path = findPath(spawn, lane.point);
        expect(path.length, `${spawn.x},${spawn.y} → ${lane.name}`).toBeGreaterThan(0);
      }
    }
  });
});
