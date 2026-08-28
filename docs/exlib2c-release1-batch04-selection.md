# EXLIB-2C Release-1 Batch 4 — selection and coverage record

Prepared 2026-08-28. Documents the deterministic selection of the
fourth 25-entry authoring batch. This record approves nothing;
every authored record remains pending with null review evidence.

## Deterministic selection procedure

Selection re-runs the established cumulative greedy algorithm from
the promoted release-1 inventory, seeded with the full 75-record
Batch 1-3 corpus, picking 25 entries one at a time. Before each
pick, primary-muscle, movement-pattern, and equipment tallies are
recomputed over everything already selected, and each remaining
candidate is scored with the mechanical least-represented weights:

- primary muscle count 0: +3
- movement-pattern count 0: +2
- movement-pattern count 1: +1
- equipment count <= 1: +1
- beginner difficulty: +2
- home/minimal availability: +1
- tie-break: alphabetical normalized canonical name

No entry was hand-picked; the focused verifier re-runs this exact
procedure from the stable inventory and fails on any divergence.

## Exclusions

- **All 75 Batch 1-3 identities** (authored, pending review).
- **Plank**, separately gated pending its EXLIB-2A seed
  reconciliation review.
- **All 8 deferred weight_time entries** (implementation paused).

## Machine-readable selection and tallies

```json
{
  "batch": 4,
  "batch4_entries": [
    "Ab wheel rollout",
    "Arnold press",
    "Bulgarian split squat",
    "Chin-up",
    "Dumbbell fly",
    "Hanging knee raise",
    "Hanging leg raise",
    "Hip abduction machine",
    "Incline dumbbell curl",
    "Machine chest press",
    "Machine fly",
    "Machine hip thrust",
    "Machine lateral raise",
    "Nordic hamstring curl",
    "Preacher curl",
    "Reverse pec deck",
    "Sandbag bent-over row",
    "Seated calf raise",
    "Seated machine shoulder press",
    "Smith machine bench press",
    "Smith machine squat",
    "Standing calf raise",
    "Stationary bike",
    "Weighted vest pull-up",
    "Weighted vest push-up"
  ],
  "batch4_tallies": {
    "availability": {
      "commercial_gym": 13,
      "home_gym": 9,
      "minimal": 3
    },
    "difficulty": {
      "advanced": 6,
      "beginner": 13,
      "intermediate": 6
    },
    "equipment": {
      "bodyweight": 4,
      "dumbbell": 4,
      "machine": 11,
      "other": 1,
      "sandbag": 1,
      "smith_machine": 2,
      "weighted_vest": 2
    },
    "laterality": {
      "bilateral": 24,
      "unilateral": 1
    },
    "movement_pattern": {
      "calf_raise": 2,
      "core_anti_extension": 1,
      "core_flexion": 2,
      "cyclic_cardio": 1,
      "elbow_flexion": 2,
      "fly_adduction": 3,
      "hip_abduction": 1,
      "hip_extension": 1,
      "horizontal_pull": 1,
      "horizontal_push": 3,
      "leg_curl": 1,
      "lunge": 1,
      "shoulder_raise": 1,
      "squat": 1,
      "vertical_pull": 2,
      "vertical_push": 2
    },
    "primary_muscle": {
      "abductors": 1,
      "abs": 3,
      "biceps": 2,
      "calves": 2,
      "chest": 5,
      "front_delts": 2,
      "glutes": 1,
      "hamstrings": 1,
      "lats": 2,
      "quads": 3,
      "rear_delts": 1,
      "side_delts": 1,
      "upper_back": 1
    },
    "tracking_mode": {
      "bodyweight": 6,
      "cardio": 1,
      "weight_reps": 18
    },
    "training_role": {
      "compound": 11,
      "conditioning": 1,
      "core": 3,
      "isolation": 10
    }
  },
  "batch_size": 25,
  "cumulative_authored": 100,
  "cumulative_tallies": {
    "availability": {
      "commercial_gym": 39,
      "home_gym": 33,
      "minimal": 28
    },
    "difficulty": {
      "advanced": 9,
      "beginner": 78,
      "intermediate": 13
    },
    "equipment": {
      "barbell": 5,
      "bodyweight": 24,
      "cable": 9,
      "dumbbell": 21,
      "kettlebell": 3,
      "machine": 20,
      "other": 3,
      "resistance_band": 5,
      "sandbag": 2,
      "smith_machine": 4,
      "weight_plate": 2,
      "weighted_vest": 2
    },
    "laterality": {
      "alternating": 10,
      "bilateral": 76,
      "unilateral": 14
    },
    "movement_pattern": {
      "calf_raise": 4,
      "core_anti_extension": 3,
      "core_anti_rotation": 1,
      "core_flexion": 4,
      "core_lateral": 2,
      "core_rotation": 2,
      "cyclic_cardio": 3,
      "dip_push": 2,
      "elbow_extension": 2,
      "elbow_flexion": 7,
      "fly_adduction": 5,
      "grip_forearm": 2,
      "ground_to_standing": 1,
      "hinge": 3,
      "hip_abduction": 3,
      "hip_adduction": 1,
      "hip_extension": 5,
      "horizontal_pull": 7,
      "horizontal_push": 6,
      "incline_push": 2,
      "jump": 1,
      "leg_curl": 2,
      "leg_extension": 1,
      "locomotion": 2,
      "lunge": 3,
      "mobility_flow": 2,
      "pullover": 1,
      "shoulder_raise": 4,
      "shrug": 2,
      "spinal_articulation": 2,
      "squat": 5,
      "static_stretch": 1,
      "vertical_pull": 5,
      "vertical_push": 4
    },
    "primary_muscle": {
      "abductors": 4,
      "abs": 5,
      "adductors": 2,
      "biceps": 7,
      "calves": 5,
      "chest": 11,
      "forearms": 2,
      "front_delts": 6,
      "full_body": 5,
      "glutes": 6,
      "hamstrings": 4,
      "hip_flexors": 2,
      "lats": 6,
      "lower_back": 3,
      "obliques": 4,
      "quads": 10,
      "rear_delts": 3,
      "side_delts": 2,
      "traps": 2,
      "triceps": 4,
      "upper_back": 7
    },
    "tracking_mode": {
      "bodyweight": 20,
      "cardio": 6,
      "timed": 8,
      "weight_reps": 66
    },
    "training_role": {
      "accessory": 6,
      "compound": 37,
      "conditioning": 7,
      "core": 11,
      "isolation": 34,
      "mobility": 5
    }
  },
  "deferred_weight_time_excluded": 8,
  "plank_gated_separately": true,
  "remaining_release1_unauthored": 26,
  "selection_weights": {
    "beginner_bonus": 2,
    "coverage_basis": "cumulative Batch 1-3 corpus; least represented defined mechanically",
    "equipment_at_most_one": 1,
    "home_or_minimal_bonus": 1,
    "movement_pattern_single_covered": 1,
    "movement_pattern_uncovered": 2,
    "new_primary_muscle": 3,
    "tie_break": "alphabetical normalized canonical name"
  }
}
```

## The 25 Batch 4 entries

- Ab wheel rollout (abs, core_anti_extension, other, advanced)
- Arnold press (front_delts, vertical_push, dumbbell, intermediate)
- Bulgarian split squat (quads, lunge, dumbbell, advanced)
- Chin-up (lats, vertical_pull, bodyweight, advanced)
- Dumbbell fly (chest, fly_adduction, dumbbell, intermediate)
- Hanging knee raise (abs, core_flexion, bodyweight, intermediate)
- Hanging leg raise (abs, core_flexion, bodyweight, advanced)
- Hip abduction machine (abductors, hip_abduction, machine, beginner)
- Incline dumbbell curl (biceps, elbow_flexion, dumbbell, intermediate)
- Machine chest press (chest, horizontal_push, machine, beginner)
- Machine fly (chest, fly_adduction, machine, beginner)
- Machine hip thrust (glutes, hip_extension, machine, beginner)
- Machine lateral raise (side_delts, shoulder_raise, machine, beginner)
- Nordic hamstring curl (hamstrings, leg_curl, bodyweight, advanced)
- Preacher curl (biceps, elbow_flexion, machine, beginner)
- Reverse pec deck (rear_delts, fly_adduction, machine, beginner)
- Sandbag bent-over row (upper_back, horizontal_pull, sandbag, intermediate)
- Seated calf raise (calves, calf_raise, machine, beginner)
- Seated machine shoulder press (front_delts, vertical_push, machine, beginner)
- Smith machine bench press (chest, horizontal_push, smith_machine, beginner)
- Smith machine squat (quads, squat, smith_machine, beginner)
- Standing calf raise (calves, calf_raise, machine, beginner)
- Stationary bike (quads, cyclic_cardio, machine, beginner)
- Weighted vest pull-up (lats, vertical_pull, weighted_vest, advanced)
- Weighted vest push-up (chest, horizontal_push, weighted_vest, intermediate)

## Batch 4 coverage

### Primary muscle

- abductors: 1
- abs: 3
- biceps: 2
- calves: 2
- chest: 5
- front_delts: 2
- glutes: 1
- hamstrings: 1
- lats: 2
- quads: 3
- rear_delts: 1
- side_delts: 1
- upper_back: 1

### Movement pattern

- calf_raise: 2
- core_anti_extension: 1
- core_flexion: 2
- cyclic_cardio: 1
- elbow_flexion: 2
- fly_adduction: 3
- hip_abduction: 1
- hip_extension: 1
- horizontal_pull: 1
- horizontal_push: 3
- leg_curl: 1
- lunge: 1
- shoulder_raise: 1
- squat: 1
- vertical_pull: 2
- vertical_push: 2

### Equipment

- bodyweight: 4
- dumbbell: 4
- machine: 11
- other: 1
- sandbag: 1
- smith_machine: 2
- weighted_vest: 2

### Tracking mode / laterality / role / difficulty / availability

- tracking_mode.bodyweight: 6
- tracking_mode.cardio: 1
- tracking_mode.weight_reps: 18
- laterality.bilateral: 24
- laterality.unilateral: 1
- training_role.compound: 11
- training_role.conditioning: 1
- training_role.core: 3
- training_role.isolation: 10
- difficulty.advanced: 6
- difficulty.beginner: 13
- difficulty.intermediate: 6
- availability.commercial_gym: 13
- availability.home_gym: 9
- availability.minimal: 3

## Cumulative coverage after Batch 4 (100 authored entries)

### Primary muscle

- abductors: 4
- abs: 5
- adductors: 2
- biceps: 7
- calves: 5
- chest: 11
- forearms: 2
- front_delts: 6
- full_body: 5
- glutes: 6
- hamstrings: 4
- hip_flexors: 2
- lats: 6
- lower_back: 3
- obliques: 4
- quads: 10
- rear_delts: 3
- side_delts: 2
- traps: 2
- triceps: 4
- upper_back: 7

### Movement pattern

- calf_raise: 4
- core_anti_extension: 3
- core_anti_rotation: 1
- core_flexion: 4
- core_lateral: 2
- core_rotation: 2
- cyclic_cardio: 3
- dip_push: 2
- elbow_extension: 2
- elbow_flexion: 7
- fly_adduction: 5
- grip_forearm: 2
- ground_to_standing: 1
- hinge: 3
- hip_abduction: 3
- hip_adduction: 1
- hip_extension: 5
- horizontal_pull: 7
- horizontal_push: 6
- incline_push: 2
- jump: 1
- leg_curl: 2
- leg_extension: 1
- locomotion: 2
- lunge: 3
- mobility_flow: 2
- pullover: 1
- shoulder_raise: 4
- shrug: 2
- spinal_articulation: 2
- squat: 5
- static_stretch: 1
- vertical_pull: 5
- vertical_push: 4

### Equipment

- barbell: 5
- bodyweight: 24
- cable: 9
- dumbbell: 21
- kettlebell: 3
- machine: 20
- other: 3
- resistance_band: 5
- sandbag: 2
- smith_machine: 4
- weight_plate: 2
- weighted_vest: 2

### Difficulty and availability

- difficulty.advanced: 9
- difficulty.beginner: 78
- difficulty.intermediate: 13
- availability.commercial_gym: 39
- availability.home_gym: 33
- availability.minimal: 28

## Remaining work

- 26 ordinary release-1 entries remain unauthored.
- Plank remains separately gated.
- 8 deferred weight_time entries remain excluded until that
  implementation is explicitly authorized.

## Status

- Every Batch 4 record is authored as forgefitos_original prose,
  content_review pending with null evidence, review_status
  proposed, import_eligible false, and no publication state.
- Specialist review is a later explicit gate; nothing here claims
  or implies approval, eligibility, or loadability.
