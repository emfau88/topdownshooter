# BREACHLINE — Graybox: Crossline Yard

`Crossline Yard` is an original compact three-lane/loop Graybox. It does not reproduce the V7 layout.

## Combat layout

```text
RED SPAWN ── upper lane ──┐
                           ├── PRESSURE ZONE ──┐
BLUE SPAWN ─ middle lane ──┤                    ├── RED SPAWN
                           └── lower lane ─────┘
```

- **Upper lane:** longer rifle sightline broken by the north cover frame.
- **Middle lane:** direct but hazardous route through the objective pair of blockers.
- **Lower lane:** closer flank with sandbags and supply cover.
- **Crossovers:** two protected north/south connections join the lanes around the pressure zone. The south connection retains a 55 px navigable gap beside the long crate.
- **Spawns:** each team has a pocket, an immediate exit and a safe rally path before entering a lane.
- **Objective:** `ZONE_CENTER` is centrally placed, with cover close enough for contesting but not inside the circle.

## Validation targets

1. Every spawn reaches the Pressure Zone.
2. Both teams can move between all three lanes through at least two crossover routes.
3. Rifle, SMG and Shotgun each have a distinct usable distance band.
4. Navigation never needs to cross a solid wall or decorative-only prop.

The geometry is defined in `src/game/map.ts`; art remains intentionally provisional until B2/B3.
