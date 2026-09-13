# weight_time five-entry release: human review page

STATUS: DECISIONS RECORDED. All three governing decision families are COMPLETE in their forms, so this page is
no longer a blank-form surface. It is still the review surface and NOT the approval: the completed forms are the
approval, and `docs/weight-time-five-entry-human-decision-record.md` binds them by bytes.
Blank is never approval; the recorded decision timestamp is 2026-09-13T18:25:13-04:00. Every value below is
rendered from committed bytes (`docs/weight-time-five-entry-lifecycle-manifest.json`), never retyped.

GENERATED FILE. Do not edit by hand - regenerate with
`npx tsx scripts/generate-weight-time-five-entry-packages.ts`.

## What you are deciding, in one paragraph

Five weight_time catalog snapshots already exist on hosted ShredOS, pending review (loaded by the
spent W14 act). Three decisions were needed, and all three forms are now COMPLETE. **Family A** (one per exercise):
is the catalog snapshot - its identity and metadata below - approved for release? **Family B** (one
per exercise): is the AI-drafted instructional content below fit to publish? **Family C** (once):
the permanent run key and the product + legal authority for the new delivery run. The three carries
(Farmer's carry, Suitcase carry, Sandbag bear-hug carry) are NOT in scope and appear nowhere.

## Who may decide (surfaced, not resolved)

- Family A and family C precedent: the operator (Joseph Carfagno) decided both for the plank release.
- Family B precedent: the one promoted content review in this repository was performed by a **named
  external specialist with a stated credential** (a personal trainer), and the form inherited from it
  says "named human specialist, never AI". The database enforces only a non-blank reviewer string.
  **Decide who completes family B before the sitting** (reviewer question RQ-4 in the content form).

## The forms

| Family | Form | Cardinality | Leaves per decision |
| --- | --- | --- | --- |
| A | `docs/weight-time-five-entry-snapshot-review-form.json` | 5 | decision (APPROVE / REJECT / CORRECT), reviewer, reviewer_role_or_credential, reviewed_at (with offset), rationale (>= 10 chars), optional evidence |
| B | `docs/weight-time-five-entry-content-review-form.json` | 5 | decision (approved / revised / rejected), reviewer, reviewer_role_or_credential, reviewed_at, rationale, the per-exercise judgment confirmations, optional evidence |
| C | `docs/weight-time-five-entry-run-authority-form.json` | 1 | run_key_literal, product approver + timestamp, legal approver + timestamp, approval_rationale, run_membership (cumulative: historical six + five) |

Only APPROVE (A) and approved (B) have prepared packages. Any other choice ends the release for that
exercise and needs its own instruction; the generator refuses to render a package for it.

## Reviewer questions the preparer raised (recorded as raised; never resolved by the preparer)

- **RQ-1** (all five, family B): expected relationships are EMPTY for every entry; no substitution,
  progression or regression edge is proposed. Adding edges is legitimate and costs one regeneration.
- **RQ-2** (133, family A): source_url and source_page are the same standalone article URL; lawful and
  ruled in W14; restated so approval is informed.
- **RQ-3** (138, family A): availability is `minimal` (a wall and one plate), the other four are `home_gym`.
- **RQ-4** (all five, family B): who may lawfully complete family B (see above).
- **RQ-5** (132, family B): the plate is placed and removed by another person "whenever you can"; the
  accessibility alternative is unweighted. Is a solo trainee adequately served?
- **RQ-6** (family C): confirm or replace the proposed run key `w14e-weight-time-release1-staged-v1` (permanent, globally unique).
- **RQ-7** (family C): the plank precedent had one named human give both product and legal approval at
  the same instant; confirm the same posture or name a second approver.
- **RQ-8** (family C): the sealed plank run stays sealed and untouched; the new run is CUMULATIVE (review
  finding R-E1): it carries the plank run's six membership rows forward and adds the five. Read finding
  F-E8 in the report before any repoint: the committed delivery function refuses the cumulative run for
  users who already received Plank from the historical run.

## The five exercises

### 132. Plate-weighted plank

- logical identity: `e21b2c00-0000-4000-a000-000000000004` (frozen in W14); content version 1 id: `e21b2c00-0000-4000-a000-000000000104`
- tracking contract: **weight_time** - recorded as added weight plus duration, never repetitions

**Snapshot metadata (family A decides this; every field is immutable at catalog_version 1 once approved)**

| Field | Value |
| --- | --- |
| category / primary_muscle / equipment | isolation / abs / weight_plate |
| laterality / tracking_mode | bilateral / weight_time |
| movement_pattern / training_role | core_anti_extension / core |
| difficulty / availability | intermediate / home_gym |
| anatomy (secondary/tertiary) | obliques:secondary |
| aliases | (none) |
| provenance | external_source_derived |
| source_url | https://www.strengthlog.com/weighted-plank/ |
| source_page | https://www.strengthlog.com/exercise-directory/ |
| retrieved_at / import_confidence | 2026-08-20 / human_review_required |
| snapshot payload fingerprint (W14) | `f1f2843950c1426c5b5b615b50ec97d168e632b7e1c8946f98f5178efd5e1216` |

**Instructional content (family B decided this; AI-drafted, then reviewed and approved by Nick Tkacz, Physical Trainer)**

- authored_by: ForgeFitOS content program (AI-drafted original prose; pending human specialist review); authored_at: 2026-09-12
- content payload fingerprint: `fb04c3e93b3dc09e0b64879c9fb9c6141f511a32fc0586119b4399259dee43a8`

Setup:

1. Set your forearms on the floor shoulder-width apart with your elbows under your shoulders, then extend your legs into one straight line from heels to head.
2. Have a partner set one weight plate flat across your upper back, centred between your shoulder blades, never on your neck or lower back.
3. Start with a light plate that lets you hold the same stable plank position for the planned time; add load gradually across sessions, never within a hold.

Execution:

1. Brace your abs and squeeze your glutes so your hips stay level with your shoulders and the plate sits flat without rocking.
2. Hold the position and keep breathing; a plate that stays still is the clearest sign your torso is not shifting underneath it.
3. End the hold the moment your hips sag or your lower back starts to arch, and have the plate lifted off before you come down.
4. Record the weight you held and the duration you completed; this exercise is scored as added weight plus time, never as repetitions.

Breathing cue: Breathe steadily and continuously through the hold while keeping your brace; do not hold your breath to stiffen the position.

Common mistakes:

- Letting the hips drift up into a pike, which shortens the lever and makes the added plate easier than the logged weight suggests.
- Placing the plate low on the lower back, where it loads the spine instead of the mid-back and hides a sagging position.
- Adding load before the unweighted hold is stable, so the position breaks down instead of the trunk being challenged.

Safety: Have the plate placed and removed by another person whenever you can, because sliding a plate on or off alone tends to twist the torso under load. Keep the plate off the neck and off the lower back, and end the hold at the first loss of a flat, level torso rather than pushing to failure with weight on your back.

Equipment setup: One flat weight plate and a mat. A bumper plate sits more stably than a thin iron plate, and a training partner to place and remove it is strongly preferred.

Accessibility alternative: Hold an unweighted plank for the same duration, or hold the position with your knees on the floor and no plate, adding time before you add any load.

Expected relationships: (none proposed; see RQ-1)

**Decisions required for this exercise**

- Family A leaf set: `entries[132].human_fields` in the snapshot form - decision, reviewer, reviewer_role_or_credential, reviewed_at, rationale.
- Family B leaf set: the entry with content_id `e21b2c00-0000-4000-a000-000000000104` in the content form - decision, reviewer, reviewer_role_or_credential, reviewed_at, rationale, and each needs_human_judgment_confirmations key (true or false).

### 133. Weighted vest plank

- logical identity: `e21b2c00-0000-4000-a000-000000000005` (frozen in W14); content version 1 id: `e21b2c00-0000-4000-a000-000000000105`
- tracking contract: **weight_time** - recorded as added weight plus duration, never repetitions

**Snapshot metadata (family A decides this; every field is immutable at catalog_version 1 once approved)**

| Field | Value |
| --- | --- |
| category / primary_muscle / equipment | isolation / abs / weighted_vest |
| laterality / tracking_mode | bilateral / weight_time |
| movement_pattern / training_role | core_anti_extension / core |
| difficulty / availability | intermediate / home_gym |
| anatomy (secondary/tertiary) | obliques:secondary |
| aliases | (none) |
| provenance | external_source_derived |
| source_url | https://marathonhandbook.com/weighted-plank/ |
| source_page | https://marathonhandbook.com/weighted-plank/ |
| retrieved_at / import_confidence | 2026-08-24 / human_review_required |
| snapshot payload fingerprint (W14) | `42f26ff9b4265544bcde194ea1e77c38652abf1b4b0bbee7055e0911fc53fa1e` |

**Instructional content (family B decided this; AI-drafted, then reviewed and approved by Nick Tkacz, Physical Trainer)**

- authored_by: ForgeFitOS content program (AI-drafted original prose; pending human specialist review); authored_at: 2026-09-12
- content payload fingerprint: `454c9158bb79a07bb203f336d147ce6b6efab1cd373c7fb463fe92f4654efe1f`

Setup:

1. Fit the vest before you get down: tighten the straps so it sits high on the torso and cannot slide toward your head once you are horizontal.
2. Set your forearms shoulder-width apart with your elbows under your shoulders, then extend your legs into one straight line from heels to head.
3. Start with a light vest load that lets you hold the same stable plank position for the planned time, check that the weight sits evenly front to back, and add load gradually across sessions.

Execution:

1. Brace your abs and squeeze your glutes so the vest's load stays over your mid-torso instead of dragging your hips toward the floor.
2. Hold the position and keep breathing; a vest that rides forward means the straps need tightening, not that you should push on.
3. End the hold when your hips sag or your lower back arches, then lower your knees before standing so the vest does not swing.
4. Record the vest weight and the duration you completed; this exercise is scored as added weight plus time, never as repetitions.

Breathing cue: Breathe steadily and continuously while keeping your brace; a snug vest can make deep breaths feel more restricted, so keep the breaths even rather than holding them.

Common mistakes:

- Wearing the vest loose, so it slides toward the shoulders and moves the load off the mid-torso partway through the hold.
- Letting the hips sag under the extra load, which turns a trunk hold into a lower-back hold.
- Adding vest weight in large jumps, because a spread-out load is easy to underestimate until the position fails.
- Treating the vest as a way to extend a hold rather than as a separate, shorter, heavier effort.

Safety: Check the straps and weight pockets before every set, because a pocket that comes loose during a hold drops load unpredictably. Keep the load balanced front to back, and end the hold at the first loss of a flat, level torso instead of pushing to failure while wearing weight.

Equipment setup: A weighted vest with secured, evenly distributed weight pockets, and a mat. Confirm the straps are snug and every pocket is closed before you start the hold.

Accessibility alternative: Hold an unweighted plank for the same duration, or wear the vest for a shorter hold and build the time back up before adding any pockets.

Expected relationships: (none proposed; see RQ-1)

**Decisions required for this exercise**

- Family A leaf set: `entries[133].human_fields` in the snapshot form - decision, reviewer, reviewer_role_or_credential, reviewed_at, rationale.
- Family B leaf set: the entry with content_id `e21b2c00-0000-4000-a000-000000000105` in the content form - decision, reviewer, reviewer_role_or_credential, reviewed_at, rationale, and each needs_human_judgment_confirmations key (true or false).

### 137. Weighted dead hang

- logical identity: `e21b2c00-0000-4000-a000-000000000006` (frozen in W14); content version 1 id: `e21b2c00-0000-4000-a000-000000000106`
- tracking contract: **weight_time** - recorded as added weight plus duration, never repetitions

**Snapshot metadata (family A decides this; every field is immutable at catalog_version 1 once approved)**

| Field | Value |
| --- | --- |
| category / primary_muscle / equipment | isolation / forearms / weight_plate |
| laterality / tracking_mode | bilateral / weight_time |
| movement_pattern / training_role | grip_forearm / accessory |
| difficulty / availability | intermediate / home_gym |
| anatomy (secondary/tertiary) | lats:secondary |
| aliases | (none) |
| provenance | forgefitos_original |
| source fields | all four NULL (ForgeFitOS original; constraint-enforced) |
| snapshot payload fingerprint (W14) | `ed584b1c2a8b224f2367642d8d32e67ee26214abac7e380dabba384a3de9922e` |

**Instructional content (family B decided this; AI-drafted, then reviewed and approved by Nick Tkacz, Physical Trainer)**

- authored_by: ForgeFitOS content program (AI-drafted original prose; pending human specialist review); authored_at: 2026-09-12
- content payload fingerprint: `0ab5a7048fc6a1619299281b9a200a9323c7793c91e89d6fea854b54a88e21a3`

Setup:

1. Attach the plate to a dipping belt around your hips and check that it hangs centred before you reach for the bar.
2. Set your hands on the bar just outside shoulder width with a full overhand grip and your thumbs wrapped around it.
3. Step off a box rather than jumping up, so the added weight does not swing and load your shoulders all at once.

Execution:

1. Hang with your arms straight and your shoulders active rather than fully slack, keeping your body still.
2. Keep your grip closed and your legs quiet so the weight hangs plumb underneath you instead of swinging.
3. Release when your grip starts to open, then step down under control; never drop from the bar with weight attached.
4. Record the added weight and the duration you completed; this exercise is scored as added weight plus time, never as repetitions.

Breathing cue: Breathe steadily and evenly through the hang; do not hold your breath to squeeze the bar.

Common mistakes:

- Jumping up to the bar with weight attached, which loads the shoulders and grip before the hang has even started.
- Letting the body swing, so the grip fights momentum instead of holding one steady load.
- Using a thumbless grip under added weight, which gives up the most secure part of the hold.
- Adding weight before an unweighted hang is stable and controlled for the planned hold.

Safety: Hang over a clear floor and set the bar at a height that lets you step off and step back down with the weight still attached. Load the belt before you take the bar and keep the plate hanging centred, and release the bar deliberately, because dropping from a loaded hang puts the whole load on the shoulders at once.

Equipment setup: A secure pull-up bar rated for your bodyweight plus the added load, and a dipping belt loaded with a weight plate.

Accessibility alternative: Hang from the bar with no added weight for the same duration, or use a lower bar with your feet on the floor so your legs carry part of the load.

Expected relationships: (none proposed; see RQ-1)

**Decisions required for this exercise**

- Family A leaf set: `entries[137].human_fields` in the snapshot form - decision, reviewer, reviewer_role_or_credential, reviewed_at, rationale.
- Family B leaf set: the entry with content_id `e21b2c00-0000-4000-a000-000000000106` in the content form - decision, reviewer, reviewer_role_or_credential, reviewed_at, rationale, and each needs_human_judgment_confirmations key (true or false).

### 138. Weighted wall sit

- logical identity: `e21b2c00-0000-4000-a000-000000000007` (frozen in W14); content version 1 id: `e21b2c00-0000-4000-a000-000000000107`
- tracking contract: **weight_time** - recorded as added weight plus duration, never repetitions

**Snapshot metadata (family A decides this; every field is immutable at catalog_version 1 once approved)**

| Field | Value |
| --- | --- |
| category / primary_muscle / equipment | compound / quads / weight_plate |
| laterality / tracking_mode | bilateral / weight_time |
| movement_pattern / training_role | squat / accessory |
| difficulty / availability | beginner / minimal |
| anatomy (secondary/tertiary) | glutes:secondary |
| aliases | (none) |
| provenance | forgefitos_original |
| source fields | all four NULL (ForgeFitOS original; constraint-enforced) |
| snapshot payload fingerprint (W14) | `b17b5b6be91df93a4aa17c18aa8384bd61515e4e9f43072d0d41d7c3af10db1e` |

**Instructional content (family B decided this; AI-drafted, then reviewed and approved by Nick Tkacz, Physical Trainer)**

- authored_by: ForgeFitOS content program (AI-drafted original prose; pending human specialist review); authored_at: 2026-09-12
- content payload fingerprint: `f3606f4aeef436e7c0b90fbc6585d6845bfb32024d47707eeb813138de018f98`

Setup:

1. Stand with your back flat against a wall, then walk your feet forward and slide down until your thighs are parallel to the floor.
2. Set your feet far enough forward that at the target depth your shins are roughly vertical, your whole foot stays planted and the position feels stable, with your whole back against the wall.
3. Once you are already in position, have a plate placed on your thighs close to your hips and hold it there with both hands.

Execution:

1. Press your back into the wall and drive through both feet evenly so the plate stays level across your thighs.
2. Hold with your knees at roughly a right angle and your weight through the whole foot rather than the toes.
3. End the hold when your thighs rise out of parallel or your back peels off the wall, then set the plate down before standing.
4. Record the plate weight and the duration you completed; this exercise is scored as added weight plus time, never as repetitions.

Breathing cue: Keep breathing evenly the whole way through the hold; do not hold your breath as the legs tire.

Common mistakes:

- Sliding up out of parallel as the hold gets hard, which quietly makes the effort easier than the logged time suggests.
- Resting the plate on the knees instead of near the hips, where it shifts the load and tends to slide.
- Placing the feet too close to the wall, so the heels lighten and the standardized position shifts as the hold goes on.
- Coming out of the hold by standing up with the plate still resting on the thighs.

Safety: Get into the seated position first and have the plate placed afterwards, because picking a plate up while already holding a wall sit tends to pull you out of position. Keep both hands on the plate so it cannot slide off your thighs, and set it down before you stand.

Equipment setup: A flat wall and one weight plate held on the thighs near the hips. A bumper plate is easier to keep flat than a thin iron plate.

Accessibility alternative: Hold the wall sit with no plate for the same duration, or sit higher than parallel and add depth before you add any weight.

Expected relationships: (none proposed; see RQ-1)

**Decisions required for this exercise**

- Family A leaf set: `entries[138].human_fields` in the snapshot form - decision, reviewer, reviewer_role_or_credential, reviewed_at, rationale.
- Family B leaf set: the entry with content_id `e21b2c00-0000-4000-a000-000000000107` in the content form - decision, reviewer, reviewer_role_or_credential, reviewed_at, rationale, and each needs_human_judgment_confirmations key (true or false).

### 139. Weighted vest wall sit

- logical identity: `e21b2c00-0000-4000-a000-000000000008` (frozen in W14); content version 1 id: `e21b2c00-0000-4000-a000-000000000108`
- tracking contract: **weight_time** - recorded as added weight plus duration, never repetitions

**Snapshot metadata (family A decides this; every field is immutable at catalog_version 1 once approved)**

| Field | Value |
| --- | --- |
| category / primary_muscle / equipment | compound / quads / weighted_vest |
| laterality / tracking_mode | bilateral / weight_time |
| movement_pattern / training_role | squat / accessory |
| difficulty / availability | beginner / home_gym |
| anatomy (secondary/tertiary) | glutes:secondary |
| aliases | (none) |
| provenance | forgefitos_original |
| source fields | all four NULL (ForgeFitOS original; constraint-enforced) |
| snapshot payload fingerprint (W14) | `0366906db6e0399a2993b2c34841fe025293cbc166ea8f90e24b20bc77034d00` |

**Instructional content (family B decided this; AI-drafted, then reviewed and approved by Nick Tkacz, Physical Trainer)**

- authored_by: ForgeFitOS content program (AI-drafted original prose; pending human specialist review); authored_at: 2026-09-12
- content payload fingerprint: `552dc5810ff446ec219304e19adab0429f560323090fd3651ae57c0241362f45`

Setup:

1. Fit and tighten the vest while standing, so it sits snug on the torso and will not slide up once your back is against the wall.
2. Stand with your back flat against the wall, walk your feet forward, and slide down until your thighs are parallel to the floor.
3. Set your feet far enough forward that at the target depth your shins are roughly vertical and your whole foot stays planted, and check that the vest is not bunched between your back and the wall.

Execution:

1. Press your back into the wall and drive through both feet evenly, keeping the vest's load centred over your hips.
2. Hold with your knees at roughly a right angle and your hands free at your sides or folded across your chest.
3. End the hold when your thighs rise out of parallel or your back peels off the wall, then stand up under control.
4. Record the vest weight and the duration you completed; this exercise is scored as added weight plus time, never as repetitions.

Breathing cue: Breathe evenly and continuously through the hold; a snug vest can make deep breaths feel more restricted, so keep the breaths even rather than holding them.

Common mistakes:

- Sliding up out of parallel as the hold gets hard, which makes the logged time overstate the work actually done.
- Letting the vest bunch up behind the back, which pushes the torso off the wall and changes the angle.
- Adding vest weight when sitting above parallel is what is really limiting the hold.
- Placing the feet too close to the wall, so the heels lighten and the position shifts as fatigue sets in.

Safety: Fit the vest before you get into position and check that its pockets are closed, because load shifting partway through a wall sit tends to pull the torso off the wall. Keep the whole foot planted and end the hold at the first loss of parallel rather than pushing to failure under load.

Equipment setup: A flat wall and a weighted vest with secured, evenly distributed pockets. A vest keeps the hands free and distributes the external load across the torso rather than resting it on the thighs.

Accessibility alternative: Hold the wall sit with no vest for the same duration, or wear the vest for a shorter hold and build the time back up before adding any pockets.

Expected relationships: (none proposed; see RQ-1)

**Decisions required for this exercise**

- Family A leaf set: `entries[139].human_fields` in the snapshot form - decision, reviewer, reviewer_role_or_credential, reviewed_at, rationale.
- Family B leaf set: the entry with content_id `e21b2c00-0000-4000-a000-000000000108` in the content form - decision, reviewer, reviewer_role_or_credential, reviewed_at, rationale, and each needs_human_judgment_confirmations key (true or false).

## Family C, once for the run

- run_key_literal: RECORDED as `w14e-weight-time-release1-staged-v1` (permanent, globally unique; never `exlib2u-plank-release1-staged-v1`).
- product approver identity + timestamp (with offset), legal approver identity + timestamp (with offset).
- approval_rationale: state plainly what the approval does NOT authorize (it does not enable production
  delivery; the Vercel run-key change is a separate operator act).
- run_membership: the one offered choice, `CUMULATIVE_HISTORICAL_SIX_PLUS_FIVE_WEIGHT_TIME_IDENTITIES`
  (the historical plank run's 3 exercise + 3 alias members carried forward, plus the five: 8 + 3 = 11 rows).

## What happens now the forms are complete

The same generator has rendered the seven EXECUTABLE hosted packages from the completed forms (this commit,
reviewed independently; every recorded tuple and every package digest is bound in `docs/weight-time-five-entry-human-decision-record.md`).
Each package is still UNRUN. Each is executed ONCE by Joseph/ChatGPT against ShredOS under its own one-use
instruction, in the order stated in `docs/weight-time-five-entry-operator-runbook.md`. Nothing in this page, and
nothing in this repository, performs any of that: the run authority in family C authorizes the run ARTIFACT only
and does not enable production delivery, the Vercel repoint, or any deployment.
