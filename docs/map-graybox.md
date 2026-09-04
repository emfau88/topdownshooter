# BREACHLINE — Graybox: Crossline Depot

`Crossline Depot` is an original compact three-lane/loop Graybox. It does not reproduce the V7 layout.

## Combat layout

```text
BLUE SPAWN ─┬─ upper lane ─┐     ┌─ upper lane ─┬─ RED SPAWN
            ├─ middle lane ├─ Z ─┤ middle lane ┤
            └─ lower lane ─┘     └─ lower lane ─┘
```

- **Upper/lower lanes:** mirrored, medium-range routes. Structural lane walls break sightlines; depot consoles, vents and supply lockers add atmosphere without becoming random collision clutter.
- **Middle lane:** the fastest route, with two baffles blocking a direct spawn-to-spawn firing line.
- **Crossovers:** players swap lanes before the centre at both baffles, then choose the north or south side of the objective shell.
- **Spawns:** teams start in matching vertical three-person formations; each spawn has nearby cover and three clear exits.
- **Objective:** `ZONE_CENTER` stays open. Its shell and nearby lane anchors create contest angles, but never a capture bunker.
- **Pickups:** ammunition rewards upper/lower lane ownership, health rewards a central rotation; neither team receives free spawn resources.

## Validation targets

1. Every spawn reaches the Pressure Zone and all three lanes.
2. Both teams can move between all three lanes through multiple crossover routes.
3. Rifle, SMG and Shotgun each have a distinct usable distance band.
4. No spawn has a direct full-map firing line.
5. Navigation never needs to cross a solid wall or decorative-only prop.

The geometry is defined in `src/game/map.ts`; art remains intentionally provisional until B2/B3.
