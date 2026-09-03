# B0 — Generation and Review Log

All B0 candidates were generated as isolated PNG source files with transparent backgrounds. They are candidates, not runtime assets; trimming, target-size normalization, pivot verification and in-game review still have to happen before approval.

| Asset | Source | Result | Review note |
|---|---|---|---|
| Blue Rifle Soldier | `character_blue_rifle_idle_v01.png` | candidate | Correct overhead/back-facing silhouette; source is oversized and will be normalized after collective in-game review. |
| Straight Wall | `environment_wall_straight_v01.png` | candidate | Second attempt accepted; first attempt was rejected because it showed a vertical facade. |
| Standard Crate | `prop_crate_standard_v01.png` | candidate | Correct square overhead footprint and readable X-brace. |
| Medkit | `pickup_medkit_idle_v01.png` | candidate | Correct overhead footprint, readable white cross, no lettering. |

## Prompt invariants used for every accepted candidate

- exact orthographic 90° camera, never isometric or 3/4
- alpha background, isolated single asset, no floor or scene
- friendly comic-game material treatment with near-black outlines
- no text, logos or watermarks
- centered full object with enough transparent padding for trimming and atlas packing

## Rejected output

The first wall attempt had a visible lower/vertical face. It remains outside the project and must not be packaged or used as a reference for later generations.
