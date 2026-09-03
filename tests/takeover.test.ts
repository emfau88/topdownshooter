import { describe, expect, it } from 'vitest';
import { chooseTakeoverCandidate } from '../src/game/model/takeover';

describe('takeover selection', () => {
  it('prefers a sheltered living ally over an exposed closer ally', () => {
    const selected = chooseTakeoverCandidate({ x: 0, y: 0 }, [
      { id: 'near', alive: true, exposed: true, position: { x: 10, y: 0 } },
      { id: 'safe', alive: true, exposed: false, position: { x: 100, y: 0 } },
    ]);
    expect(selected).toBe('safe');
  });

  it('uses distance and then id as deterministic tie breakers', () => {
    const selected = chooseTakeoverCandidate({ x: 0, y: 0 }, [
      { id: 'bravo', alive: true, exposed: false, position: { x: 20, y: 0 } },
      { id: 'alpha', alive: true, exposed: false, position: { x: -20, y: 0 } },
    ]);
    expect(selected).toBe('alpha');
  });

  it('returns null when the squad is eliminated', () => {
    expect(chooseTakeoverCandidate({ x: 0, y: 0 }, [
      { id: 'down', alive: false, exposed: false, position: { x: 0, y: 0 } },
    ])).toBeNull();
  });
});
