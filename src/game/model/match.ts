import { ROUND_WINS_TO_MATCH } from '../config';
import type { Team } from './types';

export type MatchScore = Record<Team, number>;

export interface RoundWinResult {
  score: MatchScore;
  matchWinner: Team | null;
}

export function recordRoundWin(score: MatchScore, team: Team): RoundWinResult {
  const nextScore: MatchScore = { ...score, [team]: score[team] + 1 };
  return {
    score: nextScore,
    matchWinner: nextScore[team] >= ROUND_WINS_TO_MATCH ? team : null,
  };
}
