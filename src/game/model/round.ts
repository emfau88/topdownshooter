import { PRESSURE_ZONE_AT_SECONDS, ROUND_SECONDS } from '../config';

export interface RoundClockState {
  remainingMs: number;
  pressureActive: boolean;
  suddenDeath: boolean;
}

export interface RoundClockTick {
  state: RoundClockState;
  enteredPressure: boolean;
  enteredSuddenDeath: boolean;
}

export function createRoundClock(): RoundClockState {
  return {
    remainingMs: ROUND_SECONDS * 1000,
    pressureActive: false,
    suddenDeath: false,
  };
}

export function tickRoundClock(state: RoundClockState, deltaMs: number): RoundClockTick {
  if (state.suddenDeath) {
    return { state, enteredPressure: false, enteredSuddenDeath: false };
  }

  const remainingMs = Math.max(0, state.remainingMs - Math.max(0, deltaMs));
  const pressureActive = state.pressureActive || remainingMs <= PRESSURE_ZONE_AT_SECONDS * 1000;
  const suddenDeath = remainingMs === 0;
  return {
    state: { remainingMs, pressureActive, suddenDeath },
    enteredPressure: !state.pressureActive && pressureActive,
    enteredSuddenDeath: !state.suddenDeath && suddenDeath,
  };
}
