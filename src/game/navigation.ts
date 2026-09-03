import { WORLD_HEIGHT, WORLD_WIDTH } from './config';
import { isBlocked } from './map';
import type { Point } from './model/types';

const GRID_SIZE = 40;
const COLUMNS = WORLD_WIDTH / GRID_SIZE;
const ROWS = WORLD_HEIGHT / GRID_SIZE;

interface Node extends Point {
  cost: number;
  estimate: number;
}

function key(x: number, y: number): string {
  return `${x},${y}`;
}

function cellBlocked(x: number, y: number): boolean {
  return isBlocked(x * GRID_SIZE + GRID_SIZE / 2, y * GRID_SIZE + GRID_SIZE / 2, 18);
}

export function findPath(start: Point, goal: Point): Point[] {
  const startX = Math.max(1, Math.min(COLUMNS - 2, Math.floor(start.x / GRID_SIZE)));
  const startY = Math.max(1, Math.min(ROWS - 2, Math.floor(start.y / GRID_SIZE)));
  let goalX = Math.max(1, Math.min(COLUMNS - 2, Math.floor(goal.x / GRID_SIZE)));
  let goalY = Math.max(1, Math.min(ROWS - 2, Math.floor(goal.y / GRID_SIZE)));

  if (cellBlocked(goalX, goalY)) {
    const alternatives = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;
    const free = alternatives.find(([dx, dy]) => !cellBlocked(goalX + dx, goalY + dy));
    if (free) {
      goalX += free[0];
      goalY += free[1];
    }
  }

  const open: Node[] = [{ x: startX, y: startY, cost: 0, estimate: 0 }];
  const previous = new Map<string, Point>();
  const costs = new Map<string, number>([[key(startX, startY), 0]]);
  const directions = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [1, -1], [-1, 1], [-1, -1],
  ] as const;

  for (let iterations = 0; open.length > 0 && iterations < 1200; iterations += 1) {
    open.sort((a, b) => a.estimate - b.estimate);
    const current = open.shift();
    if (!current) break;

    if (current.x === goalX && current.y === goalY) {
      const output: Point[] = [];
      let cursor: Point = current;
      let cursorKey = key(cursor.x, cursor.y);
      while (previous.has(cursorKey)) {
        output.push({
          x: cursor.x * GRID_SIZE + GRID_SIZE / 2,
          y: cursor.y * GRID_SIZE + GRID_SIZE / 2,
        });
        cursor = previous.get(cursorKey) as Point;
        cursorKey = key(cursor.x, cursor.y);
      }
      return output.reverse();
    }

    for (const [dx, dy] of directions) {
      const nextX = current.x + dx;
      const nextY = current.y + dy;
      if (nextX < 1 || nextY < 1 || nextX >= COLUMNS - 1 || nextY >= ROWS - 1) continue;
      if (cellBlocked(nextX, nextY)) continue;
      if (dx !== 0 && dy !== 0 && (cellBlocked(current.x + dx, current.y) || cellBlocked(current.x, current.y + dy))) continue;

      const nextCost = current.cost + (dx !== 0 && dy !== 0 ? 1.4 : 1);
      const nextKey = key(nextX, nextY);
      if (nextCost >= (costs.get(nextKey) ?? Number.POSITIVE_INFINITY)) continue;
      costs.set(nextKey, nextCost);
      previous.set(nextKey, { x: current.x, y: current.y });
      open.push({
        x: nextX,
        y: nextY,
        cost: nextCost,
        estimate: nextCost + Math.hypot(goalX - nextX, goalY - nextY),
      });
    }
  }
  return [];
}
