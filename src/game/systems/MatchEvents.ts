import Phaser from 'phaser';
import type { Team } from '../model/types';

export type MatchEventMap = {
  'round:started': { round: number };
  'actor:damaged': { targetId: string; sourceId: string; amount: number };
  'actor:killed': { targetId: string; sourceId: string };
  'pickup:collected': { actorId: string; kind: 'ammo' | 'med' };
  'takeover:completed': { actorId: string };
  'zone:captured': { team: Team };
};

export class MatchEvents {
  private readonly emitter = new Phaser.Events.EventEmitter();

  emit<K extends keyof MatchEventMap>(event: K, payload: MatchEventMap[K]): void {
    this.emitter.emit(event, payload);
  }

  on<K extends keyof MatchEventMap>(event: K, listener: (payload: MatchEventMap[K]) => void): void {
    this.emitter.on(event, listener);
  }

  destroy(): void {
    this.emitter.removeAllListeners();
  }
}
