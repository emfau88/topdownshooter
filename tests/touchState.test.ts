import { describe, expect, it } from 'vitest';
import { createTouchState } from '../src/game/systems/touchState';

describe('touch control state', () => {
  it('creates a full neutral state for round start and takeover', () => {
    const state = createTouchState();
    expect(state.moveStick).toEqual({ pointerId: null, active: false, x: 0, y: 0 });
    expect(state.aimStick).toEqual({ pointerId: null, active: false, x: 0, y: 0 });
    expect(state.smokePointerId).toBeNull();
    expect(state.smokeTarget).toBeNull();
    expect(state.firePointers.size).toBe(0);
  });
});
