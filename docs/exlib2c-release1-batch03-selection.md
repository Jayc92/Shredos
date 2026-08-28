# EXLIB-2C Release-1 Batch 3 — selection and coverage record

Prepared 2026-08-28. PENDING REVIEW; loading prohibited. Every Batch 3
record is `content_review.status = pending` with zero review
evidence, `import_eligible = false`, and no publication state.
Nothing in this batch is approved, loadable, or specialist-reviewed.

## Deterministic selection procedure

Batch 3 = 25 entries selected by the cumulative deterministic greedy
algorithm, re-run against coverage after Batches 1-2 over the
promoted inventory (`docs/exlib2b-release1-inventory.jsonl`, sha256
`d349110f22700a822eb427fc1dcce3e6dbcfd264b6d48ed84936b07b1ca256f5`):

- Candidate pool: all non-deferred release-1 entries EXCLUDING the
  50 Batch 1-2 identities and Plank.
- Each round scores every candidate against the cumulative
  selection (Batches 1-2 + picks so far), with "least represented"
  defined MECHANICALLY from cumulative counts:
  - +3 if its primary_muscle has cumulative count 0;
  - +2 if its movement_pattern has count 0, or +1 if count 1;
  - +1 if its equipment has count <= 1 (uncovered or singly
    represented);
  - +2 if difficulty is beginner;
  - +1 if availability is minimal or home_gym.
- Highest score wins; ties break alphabetically by normalized name,
  ascending. Scores recompute after every pick. Twenty-five rounds.

No entry was hand-picked; the focused verifier re-runs this exact
algorithm and fails on any difference. Stable inventory metadata is
unchanged.

## Exclusions

- **All 50 Batch 1-2 identities** (authored, pending review).
- **Plank** — separately gated on the EXLIB-2A seed reconciliation.
- **All 8 deferred weight_time entries.**

## Machine-readable selection and tallies

```json
{
  "batch": 3,
  "batch3_entries": [
    "Back extension",
    "Barbell curl",
    "Barbell shrug",
    "Cable curl",
    "Cable glute kickback",
    "Cable hip abduction",
    "Chest-supported row",
    "Close-grip lat pulldown",
    "Copenhagen plank",
    "Dip",
    "Face pull",
    "Overhead triceps extension",
    "Push-up",
    "Rowing machine",
    "Russian twist",
    "Smith machine calf raise",
    "Smith machine shoulder press",
    "Standing knee raise",
    "Step-up",
    "Superman hold",
    "Thoracic extension on foam roller",
    "Treadmill run",
    "Turkish get-up",
    "World's greatest stretch",
    "Wrist curl"
  ],
  "batch3_tallies": {
    "availability": {
      "commercial_gym": 13,
      "home_gym": 6,
      "minimal": 6
    },
    "difficulty": {
      "advanced": 3,
      "beginner": 21,
      "intermediate": 1
    },
    "equipment": {
      "barbell": 2,
      "bodyweight": 7,
      "cable": 5,
      "dumbbell": 3,
      "kettlebell": 1,
      "machine": 3,
      "other": 1,
      "smith_machine": 2,
      "weight_plate": 1
    },
    "laterality": {
      "alternating": 3,
      "bilateral": 17,
      "unilateral": 5
    },
    "movement_pattern": {
      "calf_raise": 1,
      "core_anti_extension": 1,
      "core_flexion": 1,
      "core_lateral": 1,
      "core_rotation": 1,
      "cyclic_cardio": 1,
      "dip_push": 1,
      "elbow_extension": 1,
      "elbow_flexion": 2,
      "grip_forearm": 1,
      "ground_to_standing": 1,
      "hinge": 1,
      "hip_abduction": 1,
      "hip_extension": 1,
      "horizontal_pull": 2,
      "horizontal_push": 1,
      "locomotion": 1,
      "lunge": 1,
      "mobility_flow": 1,
      "shrug": 1,
      "spinal_articulation": 1,
      "vertical_pull": 1,
      "vertical_push": 1
    },
    "primary_muscle": {
      "abductors": 1,
      "adductors": 1,
      "biceps": 2,
      "calves": 1,
      "chest": 1,
      "forearms": 1,
      "front_delts": 1,
      "full_body": 4,
      "glutes": 1,
      "hip_flexors": 1,
      "lats": 1,
      "lower_back": 2,
      "obliques": 1,
      "quads": 1,
      "rear_delts": 1,
      "traps": 1,
      "triceps": 2,
      "upper_back": 2
    },
    "tracking_mode": {
      "bodyweight": 4,
      "cardio": 2,
      "timed": 4,
      "weight_reps": 15
    },
    "training_role": {
      "accessory": 3,
      "compound": 6,
      "conditioning": 3,
      "core": 3,
      "isolation": 8,
      "mobility": 2
    }
  },
  "batch_size": 25,
  "cumulative_authored": 75,
  "cumulative_tallies": {
    "availability": {
      "commercial_gym": 26,
      "home_gym": 24,
      "minimal": 25
    },
    "difficulty": {
      "advanced": 3,
      "beginner": 65,
      "intermediate": 7
    },
    "equipment": {
      "barbell": 5,
      "bodyweight": 20,
      "cable": 9,
      "dumbbell": 17,
      "kettlebell": 3,
      "machine": 9,
      "other": 2,
      "resistance_band": 5,
      "sandbag": 1,
      "smith_machine": 2,
      "weight_plate": 2
    },
    "laterality": {
      "alternating": 10,
      "bilateral": 52,
      "unilateral": 13
    },
    "movement_pattern": {
      "calf_raise": 2,
      "core_anti_extension": 2,
      "core_anti_rotation": 1,
      "core_flexion": 2,
      "core_lateral": 2,
      "core_rotation": 2,
      "cyclic_cardio": 2,
      "dip_push": 2,
      "elbow_extension": 2,
      "elbow_flexion": 5,
      "fly_adduction": 2,
      "grip_forearm": 2,
      "ground_to_standing": 1,
      "hinge": 3,
      "hip_abduction": 2,
      "hip_adduction": 1,
      "hip_extension": 4,
      "horizontal_pull": 6,
      "horizontal_push": 3,
      "incline_push": 2,
      "jump": 1,
      "leg_curl": 1,
      "leg_extension": 1,
      "locomotion": 2,
      "lunge": 2,
      "mobility_flow": 2,
      "pullover": 1,
      "shoulder_raise": 3,
      "shrug": 2,
      "spinal_articulation": 2,
      "squat": 4,
      "static_stretch": 1,
      "vertical_pull": 3,
      "vertical_push": 2
    },
    "primary_muscle": {
      "abductors": 3,
      "abs": 2,
      "adductors": 2,
      "biceps": 5,
      "calves": 3,
      "chest": 6,
      "forearms": 2,
      "front_delts": 4,
      "full_body": 5,
      "glutes": 5,
      "hamstrings": 3,
      "hip_flexors": 2,
      "lats": 4,
      "lower_back": 3,
      "obliques": 4,
      "quads": 7,
      "rear_delts": 2,
      "side_delts": 1,
      "traps": 2,
      "triceps": 4,
      "upper_back": 6
    },
    "tracking_mode": {
      "bodyweight": 14,
      "cardio": 5,
      "timed": 8,
      "weight_reps": 48
    },
    "training_role": {
      "accessory": 6,
      "compound": 26,
      "conditioning": 6,
      "core": 8,
      "isolation": 24,
      "mobility": 5
    }
  },
  "plank_gated_separately": true,
  "remaining_release1_unauthored": 51,
  "selection_weights": {
    "beginner_bonus": 2,
    "coverage_basis": "cumulative counts after Batches 1-2 (least represented defined mechanically: pattern count 0 scores 2, count 1 scores 1; equipment count <= 1 scores 1)",
    "equipment_at_most_one": 1,
    "home_or_minimal_bonus": 1,
    "movement_pattern_single_covered": 1,
    "movement_pattern_uncovered": 2,
    "new_primary_muscle": 3,
    "tie_break": "alphabetical normalized_name ascending"
  }
}
```

## The 25 Batch 3 entries

- Back extension
- Barbell curl
- Barbell shrug
- Cable curl
- Cable glute kickback
- Cable hip abduction
- Chest-supported row
- Close-grip lat pulldown
- Copenhagen plank
- Dip
- Face pull
- Overhead triceps extension
- Push-up
- Rowing machine
- Russian twist
- Smith machine calf raise
- Smith machine shoulder press
- Standing knee raise
- Step-up
- Superman hold
- Thoracic extension on foam roller
- Treadmill run
- Turkish get-up
- World's greatest stretch
- Wrist curl

## Batch 3 coverage

### Primary muscle
| primary_muscle | count |
|---|---|
| abductors | 1 |
| adductors | 1 |
| biceps | 2 |
| calves | 1 |
| chest | 1 |
| forearms | 1 |
| front_delts | 1 |
| full_body | 4 |
| glutes | 1 |
| hip_flexors | 1 |
| lats | 1 |
| lower_back | 2 |
| obliques | 1 |
| quads | 1 |
| rear_delts | 1 |
| traps | 1 |
| triceps | 2 |
| upper_back | 2 |

### Movement pattern
| movement_pattern | count |
|---|---|
| calf_raise | 1 |
| core_anti_extension | 1 |
| core_flexion | 1 |
| core_lateral | 1 |
| core_rotation | 1 |
| cyclic_cardio | 1 |
| dip_push | 1 |
| elbow_extension | 1 |
| elbow_flexion | 2 |
| grip_forearm | 1 |
| ground_to_standing | 1 |
| hinge | 1 |
| hip_abduction | 1 |
| hip_extension | 1 |
| horizontal_pull | 2 |
| horizontal_push | 1 |
| locomotion | 1 |
| lunge | 1 |
| mobility_flow | 1 |
| shrug | 1 |
| spinal_articulation | 1 |
| vertical_pull | 1 |
| vertical_push | 1 |

### Equipment
| equipment | count |
|---|---|
| barbell | 2 |
| bodyweight | 7 |
| cable | 5 |
| dumbbell | 3 |
| kettlebell | 1 |
| machine | 3 |
| other | 1 |
| smith_machine | 2 |
| weight_plate | 1 |

### Tracking mode / laterality / role / difficulty / availability
| tracking_mode | count |
|---|---|
| bodyweight | 4 |
| cardio | 2 |
| timed | 4 |
| weight_reps | 15 |

| laterality | count |
|---|---|
| alternating | 3 |
| bilateral | 17 |
| unilateral | 5 |

| training_role | count |
|---|---|
| accessory | 3 |
| compound | 6 |
| conditioning | 3 |
| core | 3 |
| isolation | 8 |
| mobility | 2 |

| difficulty | count |
|---|---|
| advanced | 3 |
| beginner | 21 |
| intermediate | 1 |

| availability | count |
|---|---|
| commercial_gym | 13 |
| home_gym | 6 |
| minimal | 6 |

Batch 3 introduces the first Smith machine entries; both carry the
approved neutral progression wording "next available
increment/setting" (EXLIB-1C0B2 decision 6) and no fixed-increment
prescription.

## Cumulative coverage after Batch 3 (75 authored entries)

### Primary muscle
| primary_muscle | count |
|---|---|
| abductors | 3 |
| abs | 2 |
| adductors | 2 |
| biceps | 5 |
| calves | 3 |
| chest | 6 |
| forearms | 2 |
| front_delts | 4 |
| full_body | 5 |
| glutes | 5 |
| hamstrings | 3 |
| hip_flexors | 2 |
| lats | 4 |
| lower_back | 3 |
| obliques | 4 |
| quads | 7 |
| rear_delts | 2 |
| side_delts | 1 |
| traps | 2 |
| triceps | 4 |
| upper_back | 6 |

### Movement pattern
| movement_pattern | count |
|---|---|
| calf_raise | 2 |
| core_anti_extension | 2 |
| core_anti_rotation | 1 |
| core_flexion | 2 |
| core_lateral | 2 |
| core_rotation | 2 |
| cyclic_cardio | 2 |
| dip_push | 2 |
| elbow_extension | 2 |
| elbow_flexion | 5 |
| fly_adduction | 2 |
| grip_forearm | 2 |
| ground_to_standing | 1 |
| hinge | 3 |
| hip_abduction | 2 |
| hip_adduction | 1 |
| hip_extension | 4 |
| horizontal_pull | 6 |
| horizontal_push | 3 |
| incline_push | 2 |
| jump | 1 |
| leg_curl | 1 |
| leg_extension | 1 |
| locomotion | 2 |
| lunge | 2 |
| mobility_flow | 2 |
| pullover | 1 |
| shoulder_raise | 3 |
| shrug | 2 |
| spinal_articulation | 2 |
| squat | 4 |
| static_stretch | 1 |
| vertical_pull | 3 |
| vertical_push | 2 |

### Equipment
| equipment | count |
|---|---|
| barbell | 5 |
| bodyweight | 20 |
| cable | 9 |
| dumbbell | 17 |
| kettlebell | 3 |
| machine | 9 |
| other | 2 |
| resistance_band | 5 |
| sandbag | 1 |
| smith_machine | 2 |
| weight_plate | 2 |

### Difficulty and availability
| difficulty | count |
|---|---|
| advanced | 3 |
| beginner | 65 |
| intermediate | 7 |

| availability | count |
|---|---|
| commercial_gym | 26 |
| home_gym | 24 |
| minimal | 25 |

## Remaining work

- Authored so far: 75 of 127 release-1 entries.
- Remaining unauthored: 51 entries plus Plank (gated on its
  separately reviewed seed reconciliation) and the 8 deferred
  weight_time entries (gated on the weight_time implementation).

## Status

- Review: 25/25 pending, zero review evidence; Batches 1-2 remain
  pending and untouched.
- Import eligibility: 25/25 `false`.
- Publication: absent from every record.
- Catalog loading, migration 026, and EXLIB-1C remain unauthorized.
- Specialist review is a later explicit gate; nothing here claims
  or implies it.
