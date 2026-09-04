import { describe, expect, it } from 'vitest';
import { recordRoundWin } from '../src/game/model/match';

describe('best-of-five match score', () => {
  it('does not end the match before three round wins', () => {
    expect(recordRoundWin({ blue: 1, red: 1 }, 'blue')).toEqual({ score: { blue: 2, red: 1 }, matchWinner: null });
  });

  it('ends the match at the third round win', () => {
    expect(recordRoundWin({ blue: 2, red: 1 }, 'blue')).toEqual({ score: { blue: 3, red: 1 }, matchWinner: 'blue' });
  });
});
