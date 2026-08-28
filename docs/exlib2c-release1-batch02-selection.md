# EXLIB-2C Release-1 Batch 2 — selection and coverage record

Prepared 2026-08-28. PENDING REVIEW; loading prohibited. Every Batch 2
record is `content_review.status = pending` with zero review
evidence, `import_eligible = false`, and no publication state.
Nothing in this batch is approved, loadable, or specialist-reviewed.

## Deterministic selection procedure

Batch 2 = 25 entries selected by the same deterministic greedy
algorithm as Batch 1, re-run against CUMULATIVE release-1 coverage
after Batch 1, over the promoted inventory
(`docs/exlib2b-release1-inventory.jsonl`, sha256
`d349110f22700a822eb427fc1dcce3e6dbcfd264b6d48ed84936b07b1ca256f5`):

- Candidate pool: all non-deferred release-1 entries EXCLUDING the
  25 Batch 1 identities and Plank (whose seed tracking-mode
  reconciliation remains separately gated).
- Each round scores every candidate against the cumulative
  selection (Batch 1 + picks so far): +3 if its primary_muscle is
  not yet covered, +2 if its movement_pattern is not yet covered,
  +1 if its equipment is not yet covered (the mechanical definition
  of "underrepresented" is binary not-yet-covered), +2 if
  difficulty is beginner, +1 if availability is minimal or
  home_gym.
- Highest score wins; ties break alphabetically by normalized name,
  ascending. Scores recompute after every pick. Twenty-five rounds.

No entry was hand-picked; the focused verifier re-runs this exact
algorithm and fails on any difference. Stable inventory metadata is
unchanged.

## Exclusions

- **All 25 Batch 1 identities** (already authored, pending review).
- **Plank** — separately gated on the EXLIB-2A seed reconciliation
  review (seed `bodyweight` vs catalog `timed`).
- **All 8 deferred weight_time entries** — excluded until
  weight_time ships.

## Machine-readable selection and tallies

```json
{
  "batch": 2,
  "batch2_entries": [
    "Band curl",
    "Band row",
    "Band-assisted pull-up",
    "Banded lateral walk",
    "Bench dip",
    "Bicycle crunch",
    "Bodyweight squat",
    "Dead bug",
    "Dumbbell bench press",
    "Dumbbell pullover",
    "Dumbbell Romanian deadlift",
    "Frog pump",
    "Front raise",
    "Glute bridge",
    "Goblet squat",
    "Hammer curl",
    "Incline push-up",
    "Jump rope",
    "Kettlebell row",
    "One-arm dumbbell row",
    "Plate front raise",
    "Reverse fly",
    "Reverse lunge",
    "Side plank",
    "Stair climber"
  ],
  "batch2_tallies": {
    "availability": {
      "commercial_gym": 1,
      "home_gym": 11,
      "minimal": 13
    },
    "difficulty": {
      "beginner": 23,
      "intermediate": 2
    },
    "equipment": {
      "bodyweight": 8,
      "dumbbell": 8,
      "kettlebell": 2,
      "machine": 1,
      "other": 1,
      "resistance_band": 4,
      "weight_plate": 1
    },
    "laterality": {
      "alternating": 6,
      "bilateral": 16,
      "unilateral": 3
    },
    "movement_pattern": {
      "core_anti_extension": 1,
      "core_lateral": 1,
      "core_rotation": 1,
      "dip_push": 1,
      "elbow_flexion": 2,
      "fly_adduction": 1,
      "hinge": 1,
      "hip_abduction": 1,
      "hip_extension": 2,
      "horizontal_pull": 3,
      "horizontal_push": 1,
      "incline_push": 1,
      "jump": 1,
      "locomotion": 1,
      "lunge": 1,
      "pullover": 1,
      "shoulder_raise": 2,
      "squat": 2,
      "vertical_pull": 1
    },
    "primary_muscle": {
      "abductors": 1,
      "abs": 1,
      "biceps": 2,
      "calves": 1,
      "chest": 2,
      "front_delts": 2,
      "glutes": 3,
      "hamstrings": 1,
      "lats": 2,
      "obliques": 2,
      "quads": 3,
      "rear_delts": 1,
      "triceps": 1,
      "upper_back": 3
    },
    "tracking_mode": {
      "bodyweight": 8,
      "cardio": 2,
      "timed": 1,
      "weight_reps": 14
    },
    "training_role": {
      "accessory": 3,
      "compound": 11,
      "conditioning": 2,
      "core": 3,
      "isolation": 6
    }
  },
  "batch_size": 25,
  "cumulative_authored": 50,
  "cumulative_tallies": {
    "availability": {
      "commercial_gym": 13,
      "home_gym": 18,
      "minimal": 19
    },
    "difficulty": {
      "beginner": 44,
      "intermediate": 6
    },
    "equipment": {
      "barbell": 3,
      "bodyweight": 13,
      "cable": 4,
      "dumbbell": 14,
      "kettlebell": 2,
      "machine": 6,
      "other": 1,
      "resistance_band": 5,
      "sandbag": 1,
      "weight_plate": 1
    },
    "laterality": {
      "alternating": 7,
      "bilateral": 35,
      "unilateral": 8
    },
    "movement_pattern": {
      "calf_raise": 1,
      "core_anti_extension": 1,
      "core_anti_rotation": 1,
      "core_flexion": 1,
      "core_lateral": 1,
      "core_rotation": 1,
      "cyclic_cardio": 1,
      "dip_push": 1,
      "elbow_extension": 1,
      "elbow_flexion": 3,
      "fly_adduction": 2,
      "grip_forearm": 1,
      "hinge": 2,
      "hip_abduction": 1,
      "hip_adduction": 1,
      "hip_extension": 3,
      "horizontal_pull": 4,
      "horizontal_push": 2,
      "incline_push": 2,
      "jump": 1,
      "leg_curl": 1,
      "leg_extension": 1,
      "locomotion": 1,
      "lunge": 1,
      "mobility_flow": 1,
      "pullover": 1,
      "shoulder_raise": 3,
      "shrug": 1,
      "spinal_articulation": 1,
      "squat": 4,
      "static_stretch": 1,
      "vertical_pull": 2,
      "vertical_push": 1
    },
    "primary_muscle": {
      "abductors": 2,
      "abs": 2,
      "adductors": 1,
      "biceps": 3,
      "calves": 2,
      "chest": 5,
      "forearms": 1,
      "front_delts": 3,
      "full_body": 1,
      "glutes": 4,
      "hamstrings": 3,
      "hip_flexors": 1,
      "lats": 3,
      "lower_back": 1,
      "obliques": 3,
      "quads": 6,
      "rear_delts": 1,
      "side_delts": 1,
      "traps": 1,
      "triceps": 2,
      "upper_back": 4
    },
    "tracking_mode": {
      "bodyweight": 10,
      "cardio": 3,
      "timed": 4,
      "weight_reps": 33
    },
    "training_role": {
      "accessory": 3,
      "compound": 20,
      "conditioning": 3,
      "core": 5,
      "isolation": 16,
      "mobility": 3
    }
  },
  "plank_gated_separately": true,
  "remaining_release1_unauthored": 76,
  "selection_weights": {
    "beginner_bonus": 2,
    "coverage_basis": "cumulative coverage after Batch 1 (binary not-yet-covered)",
    "home_or_minimal_bonus": 1,
    "new_equipment": 1,
    "new_movement_pattern": 2,
    "new_primary_muscle": 3,
    "tie_break": "alphabetical normalized_name ascending"
  }
}
```

## The 25 Batch 2 entries

- Band curl
- Band row
- Band-assisted pull-up
- Banded lateral walk
- Bench dip
- Bicycle crunch
- Bodyweight squat
- Dead bug
- Dumbbell bench press
- Dumbbell pullover
- Dumbbell Romanian deadlift
- Frog pump
- Front raise
- Glute bridge
- Goblet squat
- Hammer curl
- Incline push-up
- Jump rope
- Kettlebell row
- One-arm dumbbell row
- Plate front raise
- Reverse fly
- Reverse lunge
- Side plank
- Stair climber

## Batch 2 coverage

### Primary muscle
| primary_muscle | count |
|---|---|
| abductors | 1 |
| abs | 1 |
| biceps | 2 |
| calves | 1 |
| chest | 2 |
| front_delts | 2 |
| glutes | 3 |
| hamstrings | 1 |
| lats | 2 |
| obliques | 2 |
| quads | 3 |
| rear_delts | 1 |
| triceps | 1 |
| upper_back | 3 |

### Movement pattern
| movement_pattern | count |
|---|---|
| core_anti_extension | 1 |
| core_lateral | 1 |
| core_rotation | 1 |
| dip_push | 1 |
| elbow_flexion | 2 |
| fly_adduction | 1 |
| hinge | 1 |
| hip_abduction | 1 |
| hip_extension | 2 |
| horizontal_pull | 3 |
| horizontal_push | 1 |
| incline_push | 1 |
| jump | 1 |
| locomotion | 1 |
| lunge | 1 |
| pullover | 1 |
| shoulder_raise | 2 |
| squat | 2 |
| vertical_pull | 1 |

### Equipment
| equipment | count |
|---|---|
| bodyweight | 8 |
| dumbbell | 8 |
| kettlebell | 2 |
| machine | 1 |
| other | 1 |
| resistance_band | 4 |
| weight_plate | 1 |

### Tracking mode / laterality / role / difficulty / availability
| tracking_mode | count |
|---|---|
| bodyweight | 8 |
| cardio | 2 |
| timed | 1 |
| weight_reps | 14 |

| laterality | count |
|---|---|
| alternating | 6 |
| bilateral | 16 |
| unilateral | 3 |

| training_role | count |
|---|---|
| accessory | 3 |
| compound | 11 |
| conditioning | 2 |
| core | 3 |
| isolation | 6 |

| difficulty | count |
|---|---|
| beginner | 23 |
| intermediate | 2 |

| availability | count |
|---|---|
| commercial_gym | 1 |
| home_gym | 11 |
| minimal | 13 |

## Cumulative coverage after Batch 2 (50 authored entries)

### Primary muscle
| primary_muscle | count |
|---|---|
| abductors | 2 |
| abs | 2 |
| adductors | 1 |
| biceps | 3 |
| calves | 2 |
| chest | 5 |
| forearms | 1 |
| front_delts | 3 |
| full_body | 1 |
| glutes | 4 |
| hamstrings | 3 |
| hip_flexors | 1 |
| lats | 3 |
| lower_back | 1 |
| obliques | 3 |
| quads | 6 |
| rear_delts | 1 |
| side_delts | 1 |
| traps | 1 |
| triceps | 2 |
| upper_back | 4 |

### Movement pattern
| movement_pattern | count |
|---|---|
| calf_raise | 1 |
| core_anti_extension | 1 |
| core_anti_rotation | 1 |
| core_flexion | 1 |
| core_lateral | 1 |
| core_rotation | 1 |
| cyclic_cardio | 1 |
| dip_push | 1 |
| elbow_extension | 1 |
| elbow_flexion | 3 |
| fly_adduction | 2 |
| grip_forearm | 1 |
| hinge | 2 |
| hip_abduction | 1 |
| hip_adduction | 1 |
| hip_extension | 3 |
| horizontal_pull | 4 |
| horizontal_push | 2 |
| incline_push | 2 |
| jump | 1 |
| leg_curl | 1 |
| leg_extension | 1 |
| locomotion | 1 |
| lunge | 1 |
| mobility_flow | 1 |
| pullover | 1 |
| shoulder_raise | 3 |
| shrug | 1 |
| spinal_articulation | 1 |
| squat | 4 |
| static_stretch | 1 |
| vertical_pull | 2 |
| vertical_push | 1 |

### Equipment
| equipment | count |
|---|---|
| barbell | 3 |
| bodyweight | 13 |
| cable | 4 |
| dumbbell | 14 |
| kettlebell | 2 |
| machine | 6 |
| other | 1 |
| resistance_band | 5 |
| sandbag | 1 |
| weight_plate | 1 |

### Difficulty and availability
| difficulty | count |
|---|---|
| beginner | 44 |
| intermediate | 6 |

| availability | count |
|---|---|
| commercial_gym | 13 |
| home_gym | 18 |
| minimal | 19 |

## Remaining work

- Authored so far: 50 of 127 release-1 entries.
- Remaining unauthored: 76 entries plus Plank (gated on its
  separately reviewed seed reconciliation) and the 8 deferred
  weight_time entries (gated on the weight_time implementation).

## Status

- Review: 25/25 pending, zero review evidence; Batch 1's 25 remain
  pending and untouched.
- Import eligibility: 25/25 `false`.
- Publication: absent from every record.
- Catalog loading, migration 026, and EXLIB-1C remain unauthorized.
- Specialist review is a later explicit gate; nothing here claims
  or implies it.
