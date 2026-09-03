import { describe, expect, it } from 'vitest';
import { PRESSURE_ZONE_AT_SECONDS, ROUND_SECONDS } from '../src/game/config';
import { createRoundClock, tickRoundClock } from '../src/game/model/round';

describe('round clock', () => {
  it('activates the pressure phase exactly at twenty seconds remaining', () => {
    const initial = createRoundClock();
    const beforePressure = tickRoundClock(initial, (ROUND_SECONDS - PRESSURE_ZONE_AT_SECONDS) * 1000 - 1);
    expect(beforePressure.enteredPressure).toBe(false);
    const atPressure = tickRoundClock(beforePressure.state, 1);
    expect(atPressure.enteredPressure).toBe(true);
    expect(atPressure.state.pressureActive).toBe(true);
    expect(atPressure.state.remainingMs).toBe(PRESSURE_ZONE_AT_SECONDS * 1000);
  });

  it('enters sudden death once at zero and never advances the regular timer again', () => {
    const atZero = tickRoundClock(createRoundClock(), ROUND_SECONDS * 1000);
    expect(atZero.enteredSuddenDeath).toBe(true);
    expect(atZero.state.remainingMs).toBe(0);
    const afterward = tickRoundClock(atZero.state, 1000);
    expect(afterward.enteredSuddenDeath).toBe(false);
    expect(afterward.state).toEqual(atZero.state);
  });
});
