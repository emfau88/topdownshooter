import type { Point } from '../model/types';
import type { StickState } from '../entities/types';

export interface TouchState {
  moveStick: StickState;
  aimStick: StickState;
  smokePointerId: number | null;
  smokeTarget: Point | null;
  firePointers: Set<number>;
}

function emptyStick(): StickState {
  return { pointerId: null, active: false, x: 0, y: 0 };
}

/** Creates a fully neutral touch state; replace the old state rather than clearing individual pointers. */
export function createTouchState(): TouchState {
  return {
    moveStick: emptyStick(),
    aimStick: emptyStick(),
    smokePointerId: null,
    smokeTarget: null,
    firePointers: new Set<number>(),
  };
}
