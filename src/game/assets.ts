import Phaser from 'phaser';

export const ASSET_KEYS = {
  soldiers: 'soldiers-sheet',
  environment: 'environment-sheet',
  b0Character: 'b0-character',
  b0Environment: 'b0-environment',
  b0Gameplay: 'b0-gameplay',
} as const;

type FrameDefinition = readonly [name: string, x: number, y: number, width: number, height: number];

const SOLDIER_FRAMES: readonly FrameDefinition[] = [
  ['blue-rifle', 18, 48, 305, 292],
  ['blue-smg', 338, 50, 270, 290],
  ['blue-shotgun', 607, 45, 315, 300],
  ['blue-dead', 918, 40, 322, 330],
  ['red-rifle', 18, 386, 305, 292],
  ['red-smg', 338, 385, 270, 300],
  ['red-shotgun', 607, 382, 315, 302],
  ['red-dead', 918, 378, 322, 340],
  ['pickup-ammo', 817, 987, 205, 210],
  ['pickup-med', 1030, 978, 210, 220],
];

const ENVIRONMENT_FRAMES: readonly FrameDefinition[] = [
  ['floor-olive', 24, 29, 180, 184],
  ['floor-concrete', 226, 29, 180, 184],
  ['floor-sand', 435, 29, 180, 184],
  ['floor-hazard', 639, 29, 180, 184],
  ['floor-grate', 844, 29, 180, 184],
  ['floor-stain', 1052, 29, 178, 184],
  // Inset variants remove the heavy baked edge from the source tiles. They are
  // deliberately used for tiled floors, so the arena reads as one surface.
  ['floor-olive-seamless', 32, 37, 164, 168],
  ['floor-concrete-seamless', 234, 37, 164, 168],
  ['floor-stain-seamless', 1060, 37, 162, 168],
  ['wall-horizontal', 31, 289, 299, 109],
  ['wall-vertical', 380, 244, 70, 194],
  ['wall-corner', 503, 244, 166, 196],
  ['wall-inner-corner', 743, 251, 173, 184],
  ['wall-t', 947, 251, 279, 168],
  ['wall-short', 49, 504, 119, 111],
  ['door-frame', 207, 459, 224, 168],
  ['door-closed', 469, 460, 226, 166],
  ['door-open', 727, 463, 264, 162],
  ['barrier', 1029, 514, 185, 102],
  ['crate', 25, 641, 155, 158],
  ['long-crate', 210, 641, 280, 155],
  ['barrel', 500, 627, 136, 180],
  ['sandbags', 659, 638, 303, 166],
  ['desk', 991, 641, 250, 177],
  ['console', 15, 815, 385, 220],
  ['plant', 414, 812, 150, 218],
  ['server', 556, 812, 165, 220],
  ['vent', 724, 812, 257, 220],
  ['supply', 1004, 811, 238, 234],
];

function addFrames(texture: Phaser.Textures.Texture, definitions: readonly FrameDefinition[]): void {
  for (const [name, x, y, width, height] of definitions) {
    texture.add(name, 0, x, y, width, height);
  }
}

export function registerAtlasFrames(textures: Phaser.Textures.TextureManager): void {
  addFrames(textures.get(ASSET_KEYS.soldiers), SOLDIER_FRAMES);
  addFrames(textures.get(ASSET_KEYS.environment), ENVIRONMENT_FRAMES);
  addFrames(textures.get(ASSET_KEYS.b0Environment), [
    ['wall-straight', 0, 0, 512, 256],
    ['crate-standard', 512, 0, 256, 256],
  ]);
}
