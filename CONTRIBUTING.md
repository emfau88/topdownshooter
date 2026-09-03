# BREACHLINE — Working Conventions

## Before changing gameplay

1. Read [ROADMAP.md](./ROADMAP.md) and work only on the current phase/batch unless scope is explicitly expanded.
2. Keep game-state rules in `src/game/model` or `src/game/systems`; scenes orchestrate input, rendering, and presentation.
3. Add or update tests for deterministic rule changes.
4. Do not introduce `Math.random()` into gameplay state. Use `SeededRandom`.

## Assets

1. Follow [ART_STYLEGUIDE.md](./ART_STYLEGUIDE.md).
2. Add the source asset and its metadata before adding a runtime reference.
3. Never overwrite an approved asset. Create a versioned sibling.
4. Update `art/manifest/` and the roadmap status after approval.

## Verification

Run both commands before marking a task complete:

```bash
npm run test
npm run build
```

For scene-facing changes, also perform the manual checks relevant to the change and record the result in the roadmap.
