import { recordRoundWin, type MatchScore } from './match';
import type { MatchPhase, Team } from './types';

export interface RoundEndState {
  phase: MatchPhase;
  score: MatchScore;
}

export interface RoundEndResult extends RoundEndState {
  matchWinner: Team | null;
}

/** Accepts a round result only once, while the combat phase is live. */
export function resolveRoundEnd(state: RoundEndState, team: Team): RoundEndResult | null {
  if (state.phase !== 'combat') return null;
  const win = recordRoundWin(state.score, team);
  return {
    phase: win.matchWinner ? 'match-over' : 'round-over',
    score: win.score,
    matchWinner: win.matchWinner,
  };
}
