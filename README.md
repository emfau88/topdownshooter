# BREACHLINE

A clean-room implementation of a focused 3v3 mobile tactical shooter slice. The supplied V7 build is used only as a reference for interaction, pacing, and art direction; none of its single-file code is used as application architecture.

The maintained implementation order, production batches, gates, and current status live in [ROADMAP.md](./ROADMAP.md).
Working conventions and the art contract are in [CONTRIBUTING.md](./CONTRIBUTING.md) and [ART_STYLEGUIDE.md](./ART_STYLEGUIDE.md).

## Run locally

```bash
npm install
npm run dev
```

Open the shown URL in a landscape browser. Desktop controls are `WASD`, mouse aim, `Space` to fire, `R` to reload, and `G` to throw smoke. Mobile controls use two sticks plus dedicated Fire, Reload, and Smoke buttons.

## Match rules

- Pick Rifle, SMG, or Shotgun before every round. The primary is locked until the next round.
- A round lasts 75 seconds. The Pressure Zone becomes active with 20 seconds remaining.
- Holding the zone uncontested for exactly 6 seconds wins the round. Progress decays while empty or contested and resets when control changes teams.
- At 0:00, Sudden Death begins. The zone stays active until capture or elimination decides the round.
- Reloading only transfers ammunition from reserve into the magazine. Ammo pickups add one magazine up to the weapon-specific reserve cap.
- On death, control transfers to the nearest sheltered living ally, falling back to the nearest living ally. The ally keeps their existing weapon, magazine, reserve, health, armor, and grenade.
- First team to three round wins takes the match.

## Architecture

- `src/game/model`: deterministic rules that can be unit tested without Phaser.
- `src/game/scenes`: loading, rendering, input, AI, and match orchestration.
- `src/game/map.ts`: arena layout, collision, and line-of-sight geometry.
- `src/game/navigation.ts`: grid-based A* pathfinding for bots.
- `public/assets`: source atlases kept separate from the application bundle.
