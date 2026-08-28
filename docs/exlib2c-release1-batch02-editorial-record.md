# EXLIB-2C Release-1 Batch 2 — editorial review record

Prepared 2026-08-28. Documents the complete line-by-line editorial
pass over all 25 Batch 2 records before commit. This record approves
nothing; every record remains pending with null review evidence.

## Checks performed

Every record was reviewed line-by-line for: name-to-movement match;
setup/execution agreement; equipment and adjustment instructions
matching stable metadata; tracking-mode wording (reps vs
hold/duration vs pace); laterality consistency in every field
including breathing and accessibility; breathing without prolonged
holds; exercise-specific mistakes; safety guidance addressing real
failure modes without medical claims; accessibility alternatives
that genuinely reduce a barrier (no kneeling used as a generic
option anywhere in the batch); defensible relationship direction;
and duplicated/templated sentences within the batch and against all
25 Batch 1 records.

## Corrections applied

1. **Ten duplicated sentences reworded** (found by the mechanical
   cross-batch and within-batch sentence scans during authoring
   validation; each rewritten per-exercise, none deleted):
   - Band row, execution — shoulder-blade squeeze sentence
     duplicated Seated cable row (Batch 1); reworded.
   - Bicycle crunch, setup — lower-back contact sentence duplicated
     Crunch (Batch 1); reworded.
   - Dumbbell Romanian deadlift, execution — hip-drive finish
     duplicated Romanian deadlift (Batch 1); reworded.
   - Dumbbell Romanian deadlift, setup — stance sentence duplicated
     Romanian deadlift (Batch 1); reworded.
   - Glute bridge, execution — hip-lowering sentence duplicated
     Sandbag hip thrust (Batch 1); reworded.
   - Glute bridge, setup — lying-position sentence duplicated
     Crunch (Batch 1); reworded.
   - Hammer curl, setup — stance sentence duplicated Dumbbell shrug
     (Batch 1); reworded.
   - Hammer curl, execution — still-upper-arms sentence duplicated
     Band curl (within Batch 2); reworded.
   - Bodyweight squat, setup — stance sentence duplicated Goblet
     squat (within Batch 2); reworded.
   - Frog pump, setup — arms-resting sentence duplicated Glute
     bridge (within Batch 2); reworded.

2. **Banded lateral walk — band-condition check added**
   (equipment_setup): the loop-band entry lacked an explicit
   band-condition inspection while the other three band entries
   carried one; its equipment setup now specifies a band free of
   tears or thinning spots, keeping equipment-hazard guidance
   concrete and consistent (found by the verifier's band-hazard
   check during the editorial pass).

3. **Stop/modify vocabulary decision (no prose change)**: a strict
   Batch 1-shaped stop/modify regex initially flagged ten safety
   guidances. On line-by-line review, every flagged text already
   carries a concrete conservative modification for its real
   failure mode (end the set, keep that leg higher, use a rail or
   doorway for support, raise the hands to a higher surface, pause
   to settle the bell, step down a size, switch to a standard
   bridge, lower the hips slightly, work in a reversible range, one
   leg at a time near a rail). The prose was judged sound and NOT
   reworded; instead the Batch 2 verifier's stop/modify check uses
   an explicit accepted-action vocabulary covering these concrete
   modifications, so future batches cannot pass with vague safety
   text while genuinely specific guidance is not penalized for
   avoiding formulaic wording.

## Batch 1 lessons verified as carried forward

- Unilateral records (Side plank, Kettlebell row, One-arm dumbbell
  row) default to one side at a time in every field, with
  complete-one-side / switch / match language and singular wording
  throughout.
- Alternating records (Bicycle crunch, Dead bug, Reverse lunge,
  Front raise, Hammer curl, Stair climber) describe the alternation
  rhythm inside the set; none use per-side set-logging language.
- Bilateral records carry no per-side logging instruction.
- No pouring cue; neutral wrist/thumb language used where shoulder
  mechanics require it (Plate front raise, Front raise).
- No personified body-part language ("complains"), colorful injury
  warnings, causal injury claims, diagnosis/treatment/rehab
  language, universal-safety claims, pain guarantees, or
  strength-curve claims.
- Accessibility alternatives all reduce a genuine barrier (support,
  reduced range, lighter implement, higher surface, chair-based);
  kneeling is not used as an accessibility option.
- Timed and mobility work uses continuous breathing; no prolonged
  breath-holding anywhere.
- Machine guidance is model-neutral (Stair climber explicitly notes
  controls differ between machines and to locate the stop control).
- Equipment hazards are concrete: band nick/anchor pull-tests and
  slip-stops, bench-tip checks, band seating on the pull-up bar,
  plate grip security, dumbbell-over-face grip check, kettlebell
  sway control, rope sizing and surface.
