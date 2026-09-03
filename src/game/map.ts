import type { Point } from './model/types';

export interface MapRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
  kind?: string;
  prop?: boolean;
}

export interface PropDefinition extends MapRectangle {
  kind: 'crate' | 'long-crate' | 'barrel' | 'sandbags' | 'desk' | 'console' | 'plant' | 'server' | 'vent' | 'supply';
  solid: boolean;
}

export const STATIC_WALLS: readonly MapRectangle[] = [
  { x: 0, y: 0, width: 1600, height: 42 },
  { x: 0, y: 918, width: 1600, height: 42 },
  { x: 0, y: 0, width: 42, height: 960 },
  { x: 1558, y: 0, width: 42, height: 960 },
  { x: 540, y: 245, width: 175, height: 38 },
  { x: 850, y: 245, width: 210, height: 38 },
  { x: 540, y: 677, width: 175, height: 38 },
  { x: 850, y: 677, width: 210, height: 38 },
  { x: 540, y: 245, width: 38, height: 165 },
  { x: 540, y: 525, width: 38, height: 190 },
  { x: 1022, y: 245, width: 38, height: 165 },
  { x: 1022, y: 525, width: 38, height: 190 },
  { x: 210, y: 210, width: 280, height: 38 },
  { x: 210, y: 210, width: 38, height: 180 },
  { x: 1110, y: 210, width: 280, height: 38 },
  { x: 1352, y: 210, width: 38, height: 180 },
  { x: 210, y: 710, width: 280, height: 38 },
  { x: 210, y: 570, width: 38, height: 178 },
  { x: 1110, y: 710, width: 280, height: 38 },
  { x: 1352, y: 570, width: 38, height: 178 },
  { x: 710, y: 395, width: 180, height: 54 },
  { x: 710, y: 515, width: 180, height: 54 },
  { x: 355, y: 455, width: 150, height: 48 },
  { x: 1095, y: 455, width: 150, height: 48 },
];

export const PROPS: readonly PropDefinition[] = [
  { kind: 'crate', x: 292, y: 285, width: 82, height: 82, solid: true },
  { kind: 'crate', x: 410, y: 315, width: 82, height: 82, solid: true },
  { kind: 'barrel', x: 1265, y: 302, width: 64, height: 84, solid: true },
  { kind: 'sandbags', x: 265, y: 610, width: 190, height: 72, solid: true },
  { kind: 'sandbags', x: 1148, y: 610, width: 190, height: 72, solid: true },
  { kind: 'console', x: 655, y: 300, width: 285, height: 115, solid: false },
  { kind: 'desk', x: 620, y: 605, width: 210, height: 105, solid: false },
  { kind: 'server', x: 1180, y: 270, width: 74, height: 112, solid: true },
  { kind: 'plant', x: 487, y: 208, width: 72, height: 92, solid: false },
  { kind: 'plant', x: 1045, y: 676, width: 72, height: 92, solid: false },
  { kind: 'long-crate', x: 722, y: 738, width: 184, height: 76, solid: true },
  { kind: 'vent', x: 1265, y: 760, width: 104, height: 92, solid: true },
  { kind: 'supply', x: 90, y: 410, width: 105, height: 105, solid: true },
];

export const COLLIDERS: readonly MapRectangle[] = [
  ...STATIC_WALLS,
  ...PROPS.filter((prop) => prop.solid).map((prop) => ({
    x: prop.x,
    y: prop.y,
    width: prop.width,
    height: prop.height,
    prop: true,
  })),
];

export const PICKUP_POSITIONS = [
  { x: 470, y: 480, kind: 'med' as const },
  { x: 1130, y: 480, kind: 'med' as const },
  { x: 800, y: 205, kind: 'ammo' as const },
  { x: 800, y: 825, kind: 'ammo' as const },
];

export function circleIntersectsRectangle(
  x: number,
  y: number,
  radius: number,
  rectangle: MapRectangle,
): boolean {
  const nearestX = Math.max(rectangle.x, Math.min(x, rectangle.x + rectangle.width));
  const nearestY = Math.max(rectangle.y, Math.min(y, rectangle.y + rectangle.height));
  const dx = x - nearestX;
  const dy = y - nearestY;
  return dx * dx + dy * dy < radius * radius;
}

export function isBlocked(x: number, y: number, radius = 18): boolean {
  return COLLIDERS.some((rectangle) => circleIntersectsRectangle(x, y, radius, rectangle));
}

export function segmentIntersectsRectangle(start: Point, end: Point, rectangle: MapRectangle): boolean {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  let near = 0;
  let far = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [
    start.x - rectangle.x,
    rectangle.x + rectangle.width - start.x,
    start.y - rectangle.y,
    rectangle.y + rectangle.height - start.y,
  ];

  for (let index = 0; index < 4; index += 1) {
    const direction = p[index] ?? 0;
    const distance = q[index] ?? 0;
    if (direction === 0) {
      if (distance < 0) return false;
      continue;
    }
    const ratio = distance / direction;
    if (direction < 0) {
      if (ratio > far) return false;
      near = Math.max(near, ratio);
    } else {
      if (ratio < near) return false;
      far = Math.min(far, ratio);
    }
  }
  return true;
}

export function segmentIntersectsCircle(start: Point, end: Point, center: Point, radius: number): boolean {
  const vx = end.x - start.x;
  const vy = end.y - start.y;
  const wx = center.x - start.x;
  const wy = center.y - start.y;
  const denominator = vx * vx + vy * vy || 1;
  const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / denominator));
  const px = start.x + vx * t;
  const py = start.y + vy * t;
  const dx = px - center.x;
  const dy = py - center.y;
  return dx * dx + dy * dy <= radius * radius;
}
