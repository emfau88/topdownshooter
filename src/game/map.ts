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
  // Perimeter: the playable arena is an explicit, readable rectangle.
  { x: 0, y: 0, width: 1600, height: 42 },
  { x: 0, y: 918, width: 1600, height: 42 },
  { x: 0, y: 0, width: 42, height: 960 },
  { x: 1558, y: 0, width: 42, height: 960 },

  // Upper and lower lanes: mirrored long cover turns each into a deliberate
  // medium-range duel instead of a single uninterrupted firing line.
  { x: 420, y: 170, width: 235, height: 36 },
  { x: 945, y: 170, width: 235, height: 36 },
  { x: 420, y: 754, width: 235, height: 36 },
  { x: 945, y: 754, width: 235, height: 36 },

  // Mid-lane baffles block spawn-to-spawn sightlines, but leave a choice of
  // north or south crossover before a team commits to the Pressure Zone.
  { x: 455, y: 374, width: 36, height: 212 },
  { x: 1109, y: 374, width: 36, height: 212 },

  // Objective shell: deliberately open at both sides and protected only on its
  // north/south edges. Players can contest from cover, but no wall sits inside
  // the capture circle or seals it off from the middle lane.
  { x: 660, y: 322, width: 280, height: 36 },
  { x: 660, y: 602, width: 280, height: 36 },
];

export const PROPS: readonly PropDefinition[] = [
  // Spawn-side cover gives every lane an understandable first safe position.
  { kind: 'sandbags', x: 245, y: 175, width: 150, height: 64, solid: true },
  { kind: 'sandbags', x: 1205, y: 175, width: 150, height: 64, solid: true },
  { kind: 'sandbags', x: 245, y: 721, width: 150, height: 64, solid: true },
  { kind: 'sandbags', x: 1205, y: 721, width: 150, height: 64, solid: true },

  // The objective stays intentionally clear. Structural walls define the lanes;
  // loose crates are not used as arbitrary maze pieces.
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
  // Pickups are rewards for owning a lane or rotating near the centre, never
  // free resources in either spawn pocket.
  { x: 800, y: 255, kind: 'ammo' as const },
  { x: 800, y: 705, kind: 'ammo' as const },
  { x: 555, y: 480, kind: 'med' as const },
  { x: 1045, y: 480, kind: 'med' as const },
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
