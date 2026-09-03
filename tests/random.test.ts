import { describe, expect, it } from 'vitest';
import { SeededRandom } from '../src/game/model/random';

describe('SeededRandom', () => {
  it('replays the same sequence for the same seed', () => {
    const first = new SeededRandom(421);
    const second = new SeededRandom(421);
    expect(Array.from({ length: 8 }, () => first.next())).toEqual(
      Array.from({ length: 8 }, () => second.next()),
    );
  });

  it('keeps generated floating-point values in the expected range', () => {
    const random = new SeededRandom(77);
    for (let index = 0; index < 100; index += 1) {
      const value = random.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
