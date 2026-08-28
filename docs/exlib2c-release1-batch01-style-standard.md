# EXLIB-2C Release-1 — terminology and style standard (Batch 1)

Prepared 2026-08-28. Governs every EXLIB-2C authoring batch;
mechanically spot-enforced by `scripts/verify-exlib2c-batch01.ts`
and editorially enforced by the per-batch review pass. This standard
defines wording only; it approves no content.

## Voice and step granularity

- Second person, imperative mood ("Press the bar...", never "The
  lifter should...").
- One primary action per step; a step may carry one short cue
  clause after a comma.
- Setup steps cover position and equipment state before the first
  rep; execution steps cover the movement itself. The two must not
  contradict each other.
- 1-5 setup steps, 2-6 execution steps, 1-4 common mistakes per
  entry; every step 10-240 characters, nonblank.

## Side-specific wording

- `laterality: unilateral` entries must state per-side behavior
  explicitly: complete the set on one side, then match the reps or
  duration on the other side.
- `laterality: alternating` entries must describe the alternation
  rhythm inside a single set.
- Bilateral entries must not contain per-side instructions.

## Rep versus timed versus cardio wording

- `weight_reps` and `bodyweight` entries use rep language and never
  instruct holds as the work unit.
- `timed` entries use hold/duration language ("hold", "for the
  duration of the set") and never count reps as the work unit;
  slow alternating mobility flows may describe continuing the
  alternation for the set's duration.
- `cardio` entries use pace/effort/duration language.

## Equipment adjustment language

- Machine and cable entries name the adjustable parts they depend
  on (seat height, thigh pad, pulley height, pivot alignment,
  range-adjustment lever) in setup or `equipment_setup`.
- Bodyweight entries with no equipment may leave `equipment_setup`
  empty.
- Smith Machine entries (none in Batch 1) must use the approved
  neutral progression wording "next available increment/setting"
  (EXLIB-1C0B2 decision 6) and must never prescribe a fixed
  +5 lb/2.5 kg step.

## Breathing and bracing

- Default convention: exhale on the effort phase, inhale on the
  return; worded per exercise, not pasted.
- Prolonged breath-holding is never required or encouraged. Neutral
  bracing language ("brace your trunk", "take a breath and brace")
  is allowed for heavy compound lifts; continuous-breathing language
  is required for timed holds and mobility work.

## Safety-language boundaries

- Technique-framed and conservative: describe control, range,
  equipment checks, and when to stop or modify (pain, dizziness,
  loss of control, unstable or frayed equipment).
- Prohibited: diagnosis, treatment or rehabilitation prescriptions,
  cure or therapy claims, pain guarantees ("pain-free"), claims of
  universal safety, and any implication of medical or specialist
  approval.
- Safety guidance is specific to the exercise's real failure modes
  (e.g. rack safeties for barbell pressing, band/anchor checks for
  band work, step-edge balance for single-leg calf work).

## Originality and provenance

- ForgeFitOS-original prose only: no copying, close paraphrasing,
  scraping, or derivation of instructional wording from external
  exercise libraries; factual exercise NAMES may match existing
  factual names.
- No attribution or source-crediting text may appear inside
  instructional prose (scanned mechanically).
- `provenance: forgefitos_original` with `authored_by`/`authored_at`
  on every record; source fields are forbidden on original content.

## Relationships and aliases

- Substitutions/regressions/progressions are authoring-time staging
  references that must resolve to canonical names in the promoted
  release-1 inventory; no self-reference; normalized uniqueness;
  empty arrays are preferred over invented weak relationships.
- Aliases are true synonyms of the same movement, never variants
  with different equipment or laterality, and must not collide with
  any corpus canonical name.

## Review and publication posture

- Every authored record is `content_review.status = pending` with
  reviewer, reviewed_at, and rationale exactly null; blank is never
  approval.
- `import_eligible` is literal `false` on every record.
- Publication state never appears in authoring records; it is a
  database-side lifecycle promoted separately for approved/revised
  versions only.
