import { describe, expect, it } from 'vitest';
import { resolveRoundEnd } from '../src/game/model/roundOutcome';

describe('round outcome', () => {
  it('records a combat result once and enters the transition phase', () => {
    const result = resolveRoundEnd({ phase: 'combat', score: { blue: 1, red: 0 } }, 'blue');
    expect(result).toEqual({ phase: 'round-over', score: { blue: 2, red: 0 }, matchWinner: null });
    expect(resolveRoundEnd(result as NonNullable<typeof result>, 'blue')).toBeNull();
  });

  it('enters match-over at the third win', () => {
    expect(resolveRoundEnd({ phase: 'combat', score: { blue: 2, red: 1 } }, 'blue'))
      .toEqual({ phase: 'match-over', score: { blue: 3, red: 1 }, matchWinner: 'blue' });
  });
});
