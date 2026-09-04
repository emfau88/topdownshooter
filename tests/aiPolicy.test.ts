import { describe, expect, it } from 'vitest';
import { chooseIdleGoal, nearestAiTarget } from '../src/game/systems/aiPolicy';

describe('AI policy', () => {
  it('chooses the nearest already-visible enemy', () => {
    expect(nearestAiTarget({ x: 0, y: 0 }, [{ id: 'far', x: 100, y: 0 }, { id: 'near', x: 30, y: 0 }]))
      .toMatchObject({ id: 'near' });
  });

  it('prioritizes last known positions, then pressure zone, then rally points', () => {
    const base = { team: 'blue' as const, tacticalIndex: 1, blueRally: [{ x: 1, y: 2 }, { x: 3, y: 4 }], redRally: [], zoneCenter: { x: 50, y: 50 } };
    expect(chooseIdleGoal({ ...base, pressureActive: true, lastSeen: { x: 9, y: 8, remainingMs: 400 } })).toMatchObject({ x: 9, y: 8 });
    expect(chooseIdleGoal({ ...base, pressureActive: true, lastSeen: null })).toEqual({ x: -5, y: 50 });
    expect(chooseIdleGoal({ ...base, pressureActive: false, lastSeen: null })).toEqual({ x: 3, y: 4 });
  });
});
