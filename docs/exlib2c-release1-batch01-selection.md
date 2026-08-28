# EXLIB-2C Release-1 Batch 1 — selection and coverage record

Prepared 2026-08-28. PENDING REVIEW; loading prohibited. Every Batch 1
record is `content_review.status = pending` with zero review
evidence, `import_eligible = false`, and no publication state.
Nothing in this batch is approved, loadable, or specialist-reviewed.

## Deterministic selection procedure

Batch 1 = the 14 seed-name-covered AND seed-link-compatible catalog
identities, plus 11 coverage additions chosen by a deterministic
greedy algorithm over the promoted release-1 inventory
(`docs/exlib2b-release1-inventory.jsonl`, sha256
`d349110f22700a822eb427fc1dcce3e6dbcfd264b6d48ed84936b07b1ca256f5`):

- Candidate pool: all non-deferred release-1 entries except the 14
  base entries and Plank.
- Each round scores every candidate against the selection so far:
  +3 if its primary_muscle is not yet covered, +2 if its
  movement_pattern is not yet covered, +1 if its equipment is not
  yet covered, +2 if difficulty is beginner, +1 if availability is
  minimal or home_gym.
- The highest score wins the round; ties break alphabetically by
  normalized name, ascending. Scores are recomputed after every
  pick. Eleven rounds.

No entry was hand-picked. The focused verifier re-runs this exact
algorithm against the promoted inventory and fails if the selected
set differs.

## Exclusions

- **Plank** — excluded although seed-name-covered: its catalog
  identity is `timed` while the committed seed is `bodyweight`, so
  its seed reconciliation requires the separately reviewed
  correction defined in the EXLIB-2A record (section 8). It will be
  authored in a later batch alongside that review.
- **All 8 deferred weight_time entries** — structurally excluded
  until weight_time ships.

## Machine-readable selection and tallies

```json
{
  "batch": 1,
  "batch_size": 25,
  "coverage_additions": [
    "90/90 hip switch",
    "Band Pallof press",
    "Cat-cow",
    "Couch stretch",
    "Crunch",
    "Dumbbell shrug",
    "Elliptical trainer",
    "Hip adduction machine",
    "Reverse wrist curl",
    "Sandbag hip thrust",
    "Single-leg calf raise"
  ],
  "excluded_plank": true,
  "excluded_weight_time_count": 8,
  "seed_compatible_base": [
    "Bench press",
    "Biceps curl",
    "Chest fly",
    "Incline dumbbell press",
    "Lat pulldown",
    "Lateral raise",
    "Leg curl",
    "Leg extension",
    "Leg press",
    "Romanian deadlift",
    "Seated cable row",
    "Shoulder press",
    "Squat",
    "Triceps pushdown"
  ],
  "selection_weights": {
    "beginner_bonus": 2,
    "home_or_minimal_bonus": 1,
    "new_equipment": 1,
    "new_movement_pattern": 2,
    "new_primary_muscle": 3,
    "tie_break": "alphabetical normalized_name ascending"
  },
  "tallies": {
    "availability": {
      "commercial_gym": 12,
      "home_gym": 7,
      "minimal": 6
    },
    "difficulty": {
      "beginner": 21,
      "intermediate": 4
    },
    "equipment": {
      "barbell": 3,
      "bodyweight": 5,
      "cable": 4,
      "dumbbell": 6,
      "machine": 5,
      "resistance_band": 1,
      "sandbag": 1
    },
    "laterality": {
      "alternating": 1,
      "bilateral": 19,
      "unilateral": 5
    },
    "movement_pattern": {
      "calf_raise": 1,
      "core_anti_rotation": 1,
      "core_flexion": 1,
      "cyclic_cardio": 1,
      "elbow_extension": 1,
      "elbow_flexion": 1,
      "fly_adduction": 1,
      "grip_forearm": 1,
      "hinge": 1,
      "hip_adduction": 1,
      "hip_extension": 1,
      "horizontal_pull": 1,
      "horizontal_push": 1,
      "incline_push": 1,
      "leg_curl": 1,
      "leg_extension": 1,
      "mobility_flow": 1,
      "shoulder_raise": 1,
      "shrug": 1,
      "spinal_articulation": 1,
      "squat": 2,
      "static_stretch": 1,
      "vertical_pull": 1,
      "vertical_push": 1
    },
    "primary_muscle": {
      "abductors": 1,
      "abs": 1,
      "adductors": 1,
      "biceps": 1,
      "calves": 1,
      "chest": 3,
      "forearms": 1,
      "front_delts": 1,
      "full_body": 1,
      "glutes": 1,
      "hamstrings": 2,
      "hip_flexors": 1,
      "lats": 1,
      "lower_back": 1,
      "obliques": 1,
      "quads": 3,
      "side_delts": 1,
      "traps": 1,
      "triceps": 1,
      "upper_back": 1
    },
    "tracking_mode": {
      "bodyweight": 2,
      "cardio": 1,
      "timed": 3,
      "weight_reps": 19
    },
    "training_role": {
      "compound": 9,
      "conditioning": 1,
      "core": 2,
      "isolation": 10,
      "mobility": 3
    }
  }
}
```

## The 25 entries

14 seed-link-compatible base entries:
- Bench press
- Biceps curl
- Chest fly
- Incline dumbbell press
- Lat pulldown
- Lateral raise
- Leg curl
- Leg extension
- Leg press
- Romanian deadlift
- Seated cable row
- Shoulder press
- Squat
- Triceps pushdown

11 deterministic coverage additions:
- 90/90 hip switch
- Band Pallof press
- Cat-cow
- Couch stretch
- Crunch
- Dumbbell shrug
- Elliptical trainer
- Hip adduction machine
- Reverse wrist curl
- Sandbag hip thrust
- Single-leg calf raise

## Coverage tallies

### Primary muscle
| primary_muscle | count |
|---|---|
| abductors | 1 |
| abs | 1 |
| adductors | 1 |
| biceps | 1 |
| calves | 1 |
| chest | 3 |
| forearms | 1 |
| front_delts | 1 |
| full_body | 1 |
| glutes | 1 |
| hamstrings | 2 |
| hip_flexors | 1 |
| lats | 1 |
| lower_back | 1 |
| obliques | 1 |
| quads | 3 |
| side_delts | 1 |
| traps | 1 |
| triceps | 1 |
| upper_back | 1 |

### Movement pattern
| movement_pattern | count |
|---|---|
| calf_raise | 1 |
| core_anti_rotation | 1 |
| core_flexion | 1 |
| cyclic_cardio | 1 |
| elbow_extension | 1 |
| elbow_flexion | 1 |
| fly_adduction | 1 |
| grip_forearm | 1 |
| hinge | 1 |
| hip_adduction | 1 |
| hip_extension | 1 |
| horizontal_pull | 1 |
| horizontal_push | 1 |
| incline_push | 1 |
| leg_curl | 1 |
| leg_extension | 1 |
| mobility_flow | 1 |
| shoulder_raise | 1 |
| shrug | 1 |
| spinal_articulation | 1 |
| squat | 2 |
| static_stretch | 1 |
| vertical_pull | 1 |
| vertical_push | 1 |

### Equipment
| equipment | count |
|---|---|
| barbell | 3 |
| bodyweight | 5 |
| cable | 4 |
| dumbbell | 6 |
| machine | 5 |
| resistance_band | 1 |
| sandbag | 1 |

### Training role
| training_role | count |
|---|---|
| compound | 9 |
| conditioning | 1 |
| core | 2 |
| isolation | 10 |
| mobility | 3 |

### Difficulty
| difficulty | count |
|---|---|
| beginner | 21 |
| intermediate | 4 |

### Availability
| availability | count |
|---|---|
| commercial_gym | 12 |
| home_gym | 7 |
| minimal | 6 |

### Tracking mode
| tracking_mode | count |
|---|---|
| bodyweight | 2 |
| cardio | 1 |
| timed | 3 |
| weight_reps | 19 |

### Laterality
| laterality | count |
|---|---|
| alternating | 1 |
| bilateral | 19 |
| unilateral | 5 |

## Editorial self-review record

A separate line-by-line editorial pass over all 25 entries checked:
exercise-specific steps, setup/execution consistency, per-side
wording on unilateral/alternating entries, equipment references,
tracking-mode wording (reps vs hold/duration vs pace), meaningfully
easier accessibility alternatives, non-medical safety framing, and
duplicated sentence templates. Corrections applied:

1. **Cat-cow** — safety guidance reworded from "pain-free arc" to
   "gentle and comfortable arc" (the original phrasing read as a
   pain guarantee, which the content standard prohibits).
2. **Reverse wrist curl** — safety guidance reworded from the
   colloquial "the fastest way to an angry elbow" to "quickly leads
   to sore elbows" for a consistent instructional voice.
3. **Seven safety guidances strengthened** (Band Pallof press,
   Crunch, Hip adduction machine, Leg curl, Reverse wrist curl,
   Sandbag hip thrust, Squat) — each now carries explicit
   stop/reduce-the-load language for its specific failure mode, per
   the content standard's stop/modify requirement; found by the
   verifier's safety-language check during the editorial pass.

Deliberate convention, not boilerplate: breathing cues share the
exhale-on-effort convention required by the style standard but are
worded per-exercise; the mechanical duplicate-sentence scan across
all 25 records reports zero exact repeats.

## Status

- Review: 25/25 pending, zero review evidence.
- Import eligibility: 25/25 `false`.
- Publication: absent from every record (database-side lifecycle
  only).
- Catalog loading, migration 026, and EXLIB-1C remain unauthorized.
- Specialist review is a later explicit gate; nothing here claims
  or implies it.
