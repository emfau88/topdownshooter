import type { ActorState } from '../entities/types';
import type { Point } from '../model/types';

export type BlockTest = (x: number, y: number, radius: number) => boolean;

export function moveActor(actor: ActorState, dx: number, dy: number, actorRadius: number, isBlocked: BlockTest): void {
  if (isBlocked(actor.x, actor.y, actorRadius)) depenetrateActor(actor, actorRadius, isBlocked);
  if (!isBlocked(actor.x + dx, actor.y, actorRadius)) actor.x += dx;
  if (!isBlocked(actor.x, actor.y + dy, actorRadius)) actor.y += dy;
}

export function depenetrateActor(actor: ActorState, actorRadius: number, isBlocked: BlockTest): boolean {
  const origin: Point = { x: actor.x, y: actor.y };
  for (let radius = 6; radius <= 96; radius += 6) {
    for (let index = 0; index < 16; index += 1) {
      const angle = index / 16 * Math.PI * 2;
      const x = origin.x + Math.cos(angle) * radius;
      const y = origin.y + Math.sin(angle) * radius;
      if (!isBlocked(x, y, actorRadius)) {
        actor.x = x;
        actor.y = y;
        actor.path = [];
        actor.pathIndex = 0;
        return true;
      }
    }
  }
  return false;
}

export function separateActors(actors: readonly ActorState[], actorRadius: number, isBlocked: BlockTest): void {
  const living = actors.filter((actor) => actor.alive);
  for (let first = 0; first < living.length; first += 1) {
    for (let second = first + 1; second < living.length; second += 1) {
      const a = living[first];
      const b = living[second];
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const magnitude = Math.hypot(dx, dy) || 1;
      const overlap = actorRadius * 2 - magnitude;
      if (overlap <= 0) continue;
      const pushX = dx / magnitude * overlap * 0.5;
      const pushY = dy / magnitude * overlap * 0.5;
      if (!isBlocked(a.x - pushX, a.y - pushY, actorRadius)) {
        a.x -= pushX;
        a.y -= pushY;
      }
      if (!isBlocked(b.x + pushX, b.y + pushY, actorRadius)) {
        b.x += pushX;
        b.y += pushY;
      }
    }
  }
}
