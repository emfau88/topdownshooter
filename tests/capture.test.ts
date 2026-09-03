import { describe, expect, it } from 'vitest';
import { CAPTURE_SECONDS } from '../src/game/config';
import { updateCapture } from '../src/game/model/capture';

describe('pressure-zone capture', () => {
  it('wins after exactly six seconds of uncontested control', () => {
    let state = { activeTeam: null, progressSeconds: 0 } as const;
    const first = updateCapture(state, { blue: 1, red: 0 }, CAPTURE_SECONDS - 0.1);
    expect(first.winner).toBeNull();
    const final = updateCapture(first.state, { blue: 2, red: 0 }, 0.1);
    expect(final.winner).toBe('blue');
    expect(final.state.progressSeconds).toBe(CAPTURE_SECONDS);
  });

  it('does not advance while contested and decays existing progress', () => {
    const result = updateCapture(
      { activeTeam: 'red', progressSeconds: 3 },
      { blue: 1, red: 1 },
      1,
    );
    expect(result.contested).toBe(true);
    expect(result.winner).toBeNull();
    expect(result.state.progressSeconds).toBeCloseTo(2.2);
  });

  it('starts from zero when control changes teams', () => {
    const result = updateCapture(
      { activeTeam: 'blue', progressSeconds: 5 },
      { blue: 0, red: 1 },
      0.25,
    );
    expect(result.state).toEqual({ activeTeam: 'red', progressSeconds: 0.25 });
  });
});
