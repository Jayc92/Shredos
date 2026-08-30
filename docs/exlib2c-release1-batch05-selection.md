# EXLIB-2C Release-1 Batch 5 — deterministic selection record

Prepared 2026-08-28. Documents the fifth 25-entry authoring batch of
the 127-entry release-1 inventory. This record approves nothing;
authoring keeps every record pending with null review evidence.

## Procedure

Batch 5 was selected by re-running the established deterministic
cumulative greedy algorithm from the promoted release-1 inventory
(`docs/exlib2b-release1-inventory.jsonl`) and the cumulative
100-record Batch 1-4 corpus. No entry was hand-picked. All 100
Batch 1-4 identities seed the coverage counts; each of 25 rounds
recomputes primary-muscle, movement-pattern, and equipment counts
over everything selected so far, scores the remaining pool with the
weights below ("least represented" is defined mechanically by those
counts), and takes the highest score with an alphabetical
normalized-name tie-break.

Exclusions: every Batch 1-4 canonical name; Plank (separately gated
on its seed-reconciliation review); all 8 deferred weight_time
entries.

## Weights and machine-checkable summary

```json
{
 "batch": 5,
 "batch_size": 25,
 "cumulative_authored": 125,
 "remaining_release1_unauthored": 1,
 "remaining_ordinary_entry": "Thruster",
 "plank_gated_separately": true,
 "deferred_weight_time_excluded": 8,
 "batch5_entries": [
  "Barbell row",
  "Cable crunch",
  "Cable lateral raise",
  "Cable overhead triceps extension",
  "Close-grip bench press",
  "Deadlift",
  "Front squat",
  "Good morning",
  "Hip thrust",
  "Incline barbell press",
  "Inverted row",
  "Kettlebell clean and press",
  "Kettlebell swing",
  "Overhead press",
  "Pallof press",
  "Pull-up",
  "Reverse curl",
  "Sandbag front squat",
  "Sandbag shouldering",
  "Single-leg glute bridge",
  "Skull crusher",
  "Smith machine row",
  "Straight-arm pulldown",
  "Walking lunge",
  "Weighted vest squat"
 ],
 "selection_weights": {
  "coverage_basis": "cumulative Batch 1-4 coverage; least represented defined mechanically over primary muscle, movement pattern, and equipment counts",
  "new_primary_muscle": 3,
  "movement_pattern_uncovered": 2,
  "movement_pattern_single_covered": 1,
  "equipment_at_most_one": 1,
  "beginner_bonus": 2,
  "home_or_minimal_bonus": 1,
  "tie_break": "alphabetical normalized canonical name"
 }
}
```

## Round-by-round score log

| Round | Pick | Score |
|---|---|---|
|  1 | Inverted row | 1 |
|  2 | Kettlebell clean and press | 1 |
|  3 | Kettlebell swing | 1 |
|  4 | Pallof press | 1 |
|  5 | Pull-up | 1 |
|  6 | Sandbag front squat | 1 |
|  7 | Sandbag shouldering | 1 |
|  8 | Single-leg glute bridge | 1 |
|  9 | Straight-arm pulldown | 1 |
| 10 | Walking lunge | 1 |
| 11 | Weighted vest squat | 1 |
| 12 | Barbell row | 0 |
| 13 | Cable crunch | 0 |
| 14 | Cable lateral raise | 0 |
| 15 | Cable overhead triceps extension | 0 |
| 16 | Close-grip bench press | 0 |
| 17 | Deadlift | 0 |
| 18 | Front squat | 0 |
| 19 | Good morning | 0 |
| 20 | Hip thrust | 0 |
| 21 | Incline barbell press | 0 |
| 22 | Overhead press | 0 |
| 23 | Reverse curl | 0 |
| 24 | Skull crusher | 0 |
| 25 | Smith machine row | 0 |

## Accounting

- Cumulative authored after Batch 5: 125 of 127 ordinary release-1
  entries (plus the separately gated Plank).
- Remaining ordinary entry for the final phase: **Thruster**
  (full_body / squat / barbell / advanced / commercial_gym) — it
  scored lowest in the final round because it adds no uncovered
  muscle, pattern, or equipment, is not beginner-rated, and is not
  home/minimal-available.
- The 8 deferred weight_time entries remain excluded pending the
  paused weight_time implementation.

Specialist review is a later explicit gate; nothing in this record
authorizes approval, loading, publication, or import eligibility.
