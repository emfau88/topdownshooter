import { describe, expect, it } from 'vitest';
import { createSmoke, tickSmokes } from '../src/game/model/smoke';

describe('smoke lifecycle', () => {
  it('creates a smoke cloud with the configured duration and radius', () => {
    expect(createSmoke(7, { x: 12, y: 30 })).toMatchObject({ id: 7, x: 12, y: 30, radius: 100, remainingMs: 7500, ageMs: 0 });
  });

  it('ages clouds deterministically and removes expired clouds', () => {
    const result = tickSmokes([{ ...createSmoke(1, { x: 0, y: 0 }), remainingMs: 100 }], 100);
    expect(result).toEqual([]);
  });
});
