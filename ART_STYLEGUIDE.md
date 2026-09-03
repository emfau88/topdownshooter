# BREACHLINE — 90° Top-down Art Contract

This file locks the visual rules for all production assets. An asset that violates one of the mandatory constraints is not approved for the runtime build.

## Camera and geometry — mandatory

- Camera: exact 90° orthographic top-down view.
- All circles remain circles; no foreshortening or vanishing point.
- Characters show helmet crown, shoulders, back, arms, boots, and weapon top surfaces only.
- No visible faces, chests, facades, object undersides, or wall side planes.
- Depth reads through clean ink contours, top-surface highlights, and a tight, soft contact shadow only.

## Style

- Friendly, polished comic-game language; never gritty simulation or photoreal war art.
- Dark, clean outer contour; medium inner material contour; restrained texture detail.
- Warm concrete, olive floor, charcoal engineering parts, hazard yellow as environment accents.
- Blue `#2697FF` and red `#EF493D` are reserved for immediate team recognition.
- Large silhouettes must remain clear at 64 CSS pixels.

## Source-master specification

| Class | Master canvas | In-game reference | Pivot | Padding |
|---|---:|---:|---|---:|
| Character body/weapon | 384 × 384 px | 72 px | bottom-center of contact area | 48 px |
| Pickup | 256 × 256 px | 56 px | center | 32 px |
| Small prop | 256 × 256 px | 64–96 px | ground center | 24 px |
| Wall/cover module | 512 × 256 px | grid dependent | ground center | 32 px |
| UI icon | 256 × 256 px | 24–64 px | center | 24 px |
| FX element | 256 × 256 px | use case dependent | effect origin | 32 px |

## Export contract

- PNG with genuine alpha; no matte background.
- One asset or tightly coupled state per source image; never a generative all-in-one sprite sheet.
- Runtime atlas and JSON metadata are derived files, never the sole source.
- Required metadata: asset ID, source path, dimensions, pivot, collision footprint (if applicable), version, and approval state.
- Naming: `category_subject_variant_state_vNN.png`.

## B0 acceptance criteria

The first soldier, wall, crate, and medkit must be reviewed together at 720 × 360 before any bulk batch starts. They pass only when:

- all are visually 90° top-down;
- contour weight and lighting match;
- team and gameplay function are readable at phone scale;
- no generated text, logo, clipped edge, or pseudo-isometric side surface appears.
