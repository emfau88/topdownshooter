import { CAPTURE_SECONDS } from '../config';
import type { CaptureOccupancy, CaptureState, Team } from './types';

export interface CaptureUpdate {
  state: CaptureState;
  winner: Team | null;
  contested: boolean;
}

export function updateCapture(
  state: CaptureState,
  occupancy: CaptureOccupancy,
  deltaSeconds: number,
): CaptureUpdate {
  const blueOnly = occupancy.blue > 0 && occupancy.red === 0;
  const redOnly = occupancy.red > 0 && occupancy.blue === 0;
  const capturingTeam: Team | null = blueOnly ? 'blue' : redOnly ? 'red' : null;
  const contested = occupancy.blue > 0 && occupancy.red > 0;

  if (capturingTeam) {
    const progressSeconds =
      state.activeTeam === capturingTeam ? state.progressSeconds + deltaSeconds : deltaSeconds;
    const winner = progressSeconds >= CAPTURE_SECONDS ? capturingTeam : null;
    return {
      state: {
        activeTeam: capturingTeam,
        progressSeconds: Math.min(progressSeconds, CAPTURE_SECONDS),
      },
      winner,
      contested: false,
    };
  }

  const progressSeconds = Math.max(0, state.progressSeconds - deltaSeconds * 0.8);
  return {
    state: {
      activeTeam: progressSeconds > 0 ? state.activeTeam : null,
      progressSeconds,
    },
    winner: null,
    contested,
  };
}
