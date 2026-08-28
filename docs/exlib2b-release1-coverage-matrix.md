# EXLIB-2B — Release-1 coverage matrix (PLANNING ONLY)

Prepared 2026-08-28 on the EXLIB-2A/2B design milestone. This matrix
approves nothing: no entry is import-eligible, reviewed, or an import
payload. It defines the exact proposed shape of the first reviewed
release of the extensive ForgeFitOS exercise library and reconciles
mechanically against `docs/exlib2b-release1-inventory.jsonl`
(the verifier `scripts/verify-exlib2a2b.ts` recomputes every number
below from the inventory and fails on any drift).

## Targets

- Mature catalog target: approximately 300-400 exercises
  (Joseph's approved direction, 2026-08-28).
- Release 1: **127 proposed exercises** (target range
  120-150), chosen for everyday training value across every supported
  equipment class, plus **8 explicitly deferred
  weight_time entries** that ship only after weight_time is
  implemented.
- No filler: every entry carries a meaningful equipment, movement,
  difficulty, laterality, or coaching distinction; internal
  normalized-name duplicates are zero by construction and re-proven
  mechanically.

## Machine-readable matrix

The verifier parses this fenced block and reconciles it against the
inventory file:

```json
{
  "collision_analysis": {
    "corresponds_to_seed": 15,
    "fully_distinct": 60,
    "internal_normalized_duplicates": 0,
    "name_matches_legacy_candidate": 1,
    "name_matches_manifest_entry": 59
  },
  "deferred_weight_time_count": 8,
  "release_1_proposed_count": 127,
  "release_1_tallies": {
    "availability": {
      "commercial_gym": 56,
      "home_gym": 40,
      "minimal": 31
    },
    "difficulty": {
      "advanced": 15,
      "beginner": 79,
      "intermediate": 33
    },
    "equipment": {
      "barbell": 16,
      "bodyweight": 28,
      "cable": 14,
      "dumbbell": 22,
      "kettlebell": 5,
      "machine": 20,
      "other": 3,
      "resistance_band": 5,
      "sandbag": 4,
      "smith_machine": 5,
      "weight_plate": 2,
      "weighted_vest": 3
    },
    "laterality": {
      "alternating": 12,
      "bilateral": 97,
      "unilateral": 18
    },
    "movement_pattern": {
      "calf_raise": 5,
      "carry": 1,
      "core_anti_extension": 5,
      "core_anti_rotation": 2,
      "core_flexion": 6,
      "core_lateral": 2,
      "core_rotation": 2,
      "dip_push": 2,
      "elbow_extension": 4,
      "elbow_flexion": 8,
      "fly_adduction": 5,
      "grip_forearm": 2,
      "hinge": 7,
      "hip_abduction": 4,
      "hip_adduction": 1,
      "hip_extension": 7,
      "horizontal_pull": 11,
      "horizontal_push": 7,
      "incline_push": 3,
      "leg_curl": 2,
      "leg_extension": 1,
      "lunge": 9,
      "pullover": 2,
      "shoulder_raise": 5,
      "shrug": 2,
      "squat": 10,
      "vertical_pull": 6,
      "vertical_push": 6
    },
    "primary_muscle": {
      "abductors": 4,
      "abs": 7,
      "adductors": 2,
      "biceps": 7,
      "calves": 5,
      "chest": 12,
      "forearms": 3,
      "front_delts": 7,
      "full_body": 8,
      "glutes": 8,
      "hamstrings": 6,
      "hip_flexors": 2,
      "lats": 8,
      "lower_back": 4,
      "obliques": 5,
      "quads": 14,
      "rear_delts": 3,
      "side_delts": 3,
      "traps": 2,
      "triceps": 7,
      "upper_back": 10
    },
    "tracking_mode": {
      "bodyweight": 25,
      "cardio": 6,
      "timed": 8,
      "weight_reps": 88
    },
    "training_role": {
      "accessory": 7,
      "compound": 51,
      "conditioning": 11,
      "core": 14,
      "isolation": 39,
      "mobility": 5
    }
  },
  "release_1_target_range": [
    120,
    150
  ],
  "total_inventory_records": 135
}
```

## Release-1 distribution (human-readable)

### By primary muscle
| primary_muscle | count |
|---|---|
| abductors | 4 |
| abs | 7 |
| adductors | 2 |
| biceps | 7 |
| calves | 5 |
| chest | 12 |
| forearms | 3 |
| front_delts | 7 |
| full_body | 8 |
| glutes | 8 |
| hamstrings | 6 |
| hip_flexors | 2 |
| lats | 8 |
| lower_back | 4 |
| obliques | 5 |
| quads | 14 |
| rear_delts | 3 |
| side_delts | 3 |
| traps | 2 |
| triceps | 7 |
| upper_back | 10 |

### By movement pattern
| movement_pattern | count |
|---|---|
| calf_raise | 5 |
| carry | 1 |
| core_anti_extension | 5 |
| core_anti_rotation | 2 |
| core_flexion | 6 |
| core_lateral | 2 |
| core_rotation | 2 |
| dip_push | 2 |
| elbow_extension | 4 |
| elbow_flexion | 8 |
| fly_adduction | 5 |
| grip_forearm | 2 |
| hinge | 7 |
| hip_abduction | 4 |
| hip_adduction | 1 |
| hip_extension | 7 |
| horizontal_pull | 11 |
| horizontal_push | 7 |
| incline_push | 3 |
| leg_curl | 2 |
| leg_extension | 1 |
| lunge | 9 |
| pullover | 2 |
| shoulder_raise | 5 |
| shrug | 2 |
| squat | 10 |
| vertical_pull | 6 |
| vertical_push | 6 |

### By equipment
| equipment | count |
|---|---|
| barbell | 16 |
| bodyweight | 28 |
| cable | 14 |
| dumbbell | 22 |
| kettlebell | 5 |
| machine | 20 |
| other | 3 |
| resistance_band | 5 |
| sandbag | 4 |
| smith_machine | 5 |
| weight_plate | 2 |
| weighted_vest | 3 |

All twelve supported equipment values are represented, including the
four EXLIB-1C0B3 additions (smith_machine, weight_plate,
weighted_vest, sandbag).

### By tracking mode
| tracking_mode | count |
|---|---|
| bodyweight | 25 |
| cardio | 6 |
| timed | 8 |
| weight_reps | 88 |

weight_time appears ONLY in the deferred pool, never in release 1.

### By laterality
| laterality | count |
|---|---|
| alternating | 12 |
| bilateral | 97 |
| unilateral | 18 |

### By training role
| training_role | count |
|---|---|
| accessory | 7 |
| compound | 51 |
| conditioning | 11 |
| core | 14 |
| isolation | 39 |
| mobility | 5 |

### By difficulty
| difficulty | count |
|---|---|
| advanced | 15 |
| beginner | 79 |
| intermediate | 33 |

### By home/commercial availability
| availability | count |
|---|---|
| commercial_gym | 56 |
| home_gym | 40 |
| minimal | 31 |

## Collision and correspondence analysis (mechanical)

Computed by normalized-name (lowercased, trimmed) comparison against
the 15 committed seed exercises, the 26 legacy EXLIB candidates, the
395-entry legacy discovery manifest, and the inventory itself:

- Internal normalized duplicates: **0**.
- Corresponds to an existing seed: **15** — every one of the
  15 seed exercises has a catalog identity in release 1, enabling the
  later controlled, non-destructive seed reconciliation (EXLIB-2A
  record, section 8). These are identity correspondences, not
  collisions: delivery skips them per-user via the existing
  fail-closed name-claim machinery, so existing rows are never
  touched.
- Name matches a legacy EXLIB candidate: **1**
  (Plate-weighted plank, itself deferred for weight_time). The 26
  legacy candidates remain import-ineligible and are NOT part of this
  program's corpus.
- Name matches a legacy manifest entry: **59** — expected and
  acceptable: exercise NAMES are uncopyrightable facts, and overlap
  with any catalog of common exercises is unavoidable. No manifest
  content beyond the factual name is referenced, and all release-1
  instructional content will be independently authored under the
  EXLIB-2C schema's provenance rules.
- Fully distinct proposed names: **60**.

Classification vocabulary used per entry
(`collision_classification`): `corresponds_to_seed` (identity match
with a committed seed), `name_matches_prior_artifact` (factual name
overlap with the legacy candidate list or manifest),
`deferred_weight_time`, `distinct`. Equipment-specific and laterality
variants are distinct ENTRIES by design (e.g. Bench press vs Dumbbell
bench press vs Smith machine bench press) — each carries a different
equipment or laterality value, which is the meaningful-distinction
test, and aliases are reserved for true synonyms of ONE movement at
authoring time.

## Deferred pool (8 entries)

All deferred entries declare `tracking_mode: "weight_time"` with
`deferred: true` and an explicit reason; they are structurally
excluded from release 1 and from every future import subset until
weight_time ships (schema rule + verifier check + the unchanged
4-value tracking-mode CHECK constraints in the live schema).

## What release 1 excludes (later releases)

- All weight_time-dependent movements (above).
- Extensive mobility/warmup library expansion (5 foundation
  movements included; the fuller ~24-entry set follows).
- Extensive conditioning expansion (6 cardio-machine staples
  included).
- Highly specialized rehabilitation movements and anything requiring
  specialist judgment that cannot yet be substantiated.
- Olympic-lift derivatives beyond the included kettlebell/barbell
  conditioning staples.
