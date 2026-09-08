# EXLIB-2Z — S5 seal package preparation record

Recorded 2026-09-08 (UTC). This milestone AUTHORED AND VALIDATED,
locally and only locally, the one-use S5 seal package
docs/exlib2z-s5-seal-package.sql. THIS IS PREPARATION AND REVIEW
ONLY: no run was sealed anywhere outside the disposable verification
clusters, no delivery or revocation of any kind was performed or
simulated against anything hosted, and the hosted ShredOS database
was not contacted. No hosted contact by Claude occurred at any
point. Executing the package remains a later, separately gated,
one-use hosted act by Joseph/ChatGPT after Codex review and an
explicit human authorization — never by Claude. Section 17 drafts
that authorization; it is PREPARED, NOT ISSUED.

## 1. What was prepared (the exact bytes)

- Package: docs/exlib2z-s5-seal-package.sql, 42,012 bytes, sha256
  701302cb3baa36a510f96163ca5393ac63475d78463607757b02bd46b5015e6a,
  authored on the fresh branch exlib2z-s5-seal-prep created at
  promoted main 290f9bbbfea84ac6bcd2cefb59f7bed2247e2021 (the
  EXLIB-2U hosted-application evidence tip, durably closed under tag
  exlib2u-hosted-application-evidence-stable, object
  82e9800765579f15adc127eb4a218982c50425c8, 98-byte annotation
  byte-verified at the closeout).
- The package performs the single lawful S5 act of the promoted
  activation design: EXACTLY ONE
  public.exlib_approve_and_seal_run call bearing the reserved run
  key. It contains no INSERT, no UPDATE, no DELETE, no delivery
  call, no rollback call, and no revocation call; one BEGIN, one
  COMMIT, three DO blocks (preconditions, the act, postconditions),
  and the same eleven-table SHARE ROW EXCLUSIVE lock set as the
  reviewed EXLIB-2U package. Its trigger-binding and authority
  gates are byte-identical to the reviewed, hosted-proven EXLIB-2U
  package blocks (inherited, not rewritten; the static verifier
  proves the byte identity mechanically).

## 2. The exact promoted S5 contract (from committed bytes)

exlib_approve_and_seal_run(p_run_key TEXT) RETURNS JSONB, LANGUAGE
plpgsql, SECURITY DEFINER, SET search_path = public, pg_temp
(migration 023; migrations 024-027 leave the run tables, both
freeze triggers, the seal function, and the revocation function
untouched — 024 only adds two run_items foreign-key indexes). The
function:

1. locks the run FOR UPDATE by key and refuses
   'exlib_approve_and_seal_run: unknown run key' when absent;
2. refuses 'exlib_approve_and_seal_run: run is already sealed; a
   different approval decision requires a NEW run' when sealed_at
   is already set;
3. performs ONE UPDATE: SET approved_for_delivery = true,
   sealed_at = NOW() — the single validated unsealed -> sealed
   transition;
4. returns jsonb {run_key, sealed: true, exercise_members,
   alias_members}.

THE FUNCTION IS THE FRONT DOOR OF A DATABASE-ENFORCED GATE, NOT THE
ONLY GUARD: the BEFORE trigger exlib_freeze_run_row revalidates the
identical transition on EVERY write path, refusing (a) any
approval/seal movement that is not exactly the atomic unsealed ->
sealed pair, (b) 'dry runs cannot be sealed', (c) incomplete or
blank product/legal evidence ('sealing requires complete, non-blank
product + legal approval evidence'), (d) an empty membership, and
(e) any unready exercise member ('cannot seal — % exercise
member(s) are not approved, active, and fully review-audited',
where unready means review_status <> approved, inactive, or blank
reviewed_by/review_rationale — a check defined over EXERCISE
members only; alias members carry no readiness conditions beyond
their foreign keys).

AUTHORITY POSTURE: migration 023 REVOKEs
exlib_approve_and_seal_run(TEXT) from PUBLIC, anon, AND
authenticated and grants nothing back — the migration's own words:
'It is NOT client-callable ...: approval is a reviewed operator
action in a privileged context, never a product-surface call, and
it takes no user identity at all.' Only the owner (the operator
role postgres) and superusers can execute it. The live suite
measures has_function_privilege('authenticated', ..., 'EXECUTE') =
false on the real post-migration database.

TABLE MACHINERY (all from migration 023 bytes):
- exercise_catalog_import_runs_freeze_trigger — BEFORE INSERT OR
  UPDATE, exlib_freeze_run_row(), tgtype 23, the sole non-internal
  trigger on the runs table. It does NOT cover DELETE: a POPULATED
  run is delete-protected by the run_items -> runs ON DELETE
  RESTRICT foreign key instead (each of the six membership rows
  restricts the staged run), while an EMPTY unsealed run could be
  deleted by the owner — noted honestly; the reserved run has six
  members and cannot be deleted.
- exercise_catalog_run_items_freeze_trigger — BEFORE INSERT OR
  UPDATE OR DELETE, exlib_freeze_run_membership(), tgtype 31, sole
  non-internal trigger. UPDATE refuses unconditionally ('membership
  rows are immutable'); INSERT/DELETE lock the PARENT RUN ROW FOR
  UPDATE and refuse once sealed ('a sealed run''s membership is
  PERMANENT; changed membership requires a NEW run (delivery
  disablement and revocation never reopen editing)').
- CHECK constraints: approval_audit_chk (a run can never be
  approved with blank identities, missing timestamps, missing
  rationale, or as a dry run), seal_coupling_chk (approved_for_
  delivery = true if and only if sealed_at IS NOT NULL — approval
  and the seal are ONE state), revoke_after_seal_chk (revoked_at
  only on sealed runs).

## 3. The irreversible effects of ONE successful S5 call

- approved_for_delivery = true and sealed_at = NOW(), set together
  in one statement; NOW() is the transaction timestamp, so the seal
  instant is bound to the executing transaction (the package's
  postcondition asserts sealed_at = now() inside the same
  transaction).
- The run membership (exactly the six staged rows) becomes
  PERMANENT: no insert, no delete, no update, ever.
- Once sealed, these fields are IMMUTABLE per the freeze trigger's
  sealed branch: run_key, dry_run, approved_for_delivery,
  product_approved_by, product_approved_at, legal_approved_by,
  legal_approved_at, approval_rationale, sealed_at, created_at —
  the trigger's verbatim refusal: 'a sealed run''s approval-bound
  fields (run_key, dry_run, approval evidence, seal) are immutable;
  a different approval decision requires a NEW run'.
  Only the documented operational fields (started_at, completed_at,
  result_counts — progress/outcome bookkeeping carrying no
  approval-decision content) and the one-way revoked_at remain
  writable. The live suite probes every immutable field directly on
  a sealed database and proves each refusal, plus the
  operational-field contrast (started_at updates and reverts).
- There is NO unseal. Revocation is a SEPARATE one-way emergency
  action on sealed runs only (section 10) and is NOT part of S5.
- Delivery is NOT performed by S5: the seal moves no counts, writes
  no tenant row, and calls nothing. The package proves this with
  whole-row tenant digests and the absolute zero-import_run_id
  count across the gated interval.
- RISK ELEVATION, stated plainly: after the seal, the delivery
  gate's five-conjunct predicate (run_key match AND
  approved_for_delivery = true AND dry_run = false AND sealed_at IS
  NOT NULL AND revoked_at IS NULL — identical bytes in migration
  023 and in the current deliver_catalog_exercises definition of
  migration 026) MATCHES this run. deliver_catalog_exercises is
  SECURITY DEFINER with EXECUTE granted to authenticated (granted
  by migration 023; migration 026's bytes record that the grant is
  retained because CREATE OR REPLACE preserves existing ACLs). So
  sealing makes catalog delivery REACHABLE by any authenticated
  caller that names the run key, into that caller's own tenant,
  independently of the application's delivery flag. The promoted
  EXLIB-2T runtime defaults STRICTLY OFF on the application side,
  and — per the EXLIB-2U evidence record's evidence-bounded ruling
  — the current hosted Vercel environment posture has NOT been
  re-observed; the database-side predicate is the security
  boundary, and S5 is the act that flips it. Sealing is therefore
  the LAST database gate before user-reachable delivery. This is
  the central human decision the section-17 authorization exists to
  gate.

## 4. The run identity and evidence S5 consumes

S5 writes NO evidence: it validates and permanently freezes the
values the SPENT EXLIB-2U staging already carries, all reserved by
docs/exlib2v-s4-authority-inputs-form-completed.json (3,416 B,
sha256
6cf77759f7a8ddf89d32b2fd225bcbe0eddaf09587dcc9d01a657752b9adeeae,
byte-identical to its promoted blob):

- run_key: exlib2u-plank-release1-staged-v1 — the exact literal the
  package binds in its one seal call and every run gate (the static
  verifier proves the equality against the artifact bytes, never a
  restatement).
- Evidence on the staged run, gated character-for-character before
  the seal freezes it forever: product_approved_by =
  legal_approved_by = Joseph Carfagno; product_approved_at =
  legal_approved_at = TIMESTAMPTZ '2026-09-07T11:05:00-04:00' (the
  AUTHORITY-decision instant; the snapshot approvals are the
  SEPARATE renewed decisions at 2026-09-07T19:06:00-04:00, gated in
  their own family and never substituted); approval_rationale = the
  artifact's exact staged-validation string.
- Membership: the six ALL_THREE_IDENTITIES rows, resolved through
  governed identities only and gated as the exact six-line member
  surface.
- HOSTED RUN SURROGATE (operator preflight, not an in-package
  gate): the staged run's hosted id is
  6669ba78-8e75-4042-ac2a-14082a9e5940 with database-created
  instant 2026-09-08T05:26:09.940165Z, exactly as the promoted
  EXLIB-2U hosted-application record preserved them. Surrogates are
  hosted-generated, so an environment-neutral package cannot pin
  them without becoming untestable on disposable clusters; the pin
  therefore lives in the operator preflight (section 5), and the
  static verifier proves this record's literals equal the promoted
  2U application record's bytes mechanically.

## 5. The complete pre-seal predicate

OPERATOR PREFLIGHT (hosted-only, read-only, ALL required
immediately before execution):

1. The SQL editor session is connected to ShredOS ref
   ttybyljytiwntvorugcv.
2. The package file's sha256, re-measured at the gate, equals the
   fingerprint in section 1 (any byte change voids the approval and
   the authorization).
3. Run surrogate identity:
   SELECT id, created_at FROM public.exercise_catalog_import_runs
   WHERE run_key = 'exlib2u-plank-release1-staged-v1';
   must read exactly id 6669ba78-8e75-4042-ac2a-14082a9e5940,
   created_at 2026-09-08T05:26:09.940165Z (section 4). Any other
   result: STOP / DO NOT SEAL.
4. A current physical backup is verified present and its rewind
   horizon understood (a restore is the only physical path back and
   rewinds everything after its instant).
5. The one-use authorization for THIS fingerprint is unspent (no
   prior attempt of any outcome).

IN-PACKAGE GATES (one transaction; 29 precondition refusals, every
one carrying STOP / DO NOT SEAL; the live suite proves the counts
and the reachable refusals):

- executor posture: current_user must be postgres;
- structural presence: both run tables, the seal function, the
  revocation function, and the delivery function must exist;
- EXACT ENABLED TRIGGER BINDINGS (byte-identical to the reviewed
  EXLIB-2U gate): promoted name + table + function + BEFORE-ROW
  event set (tgtype 23 / 31) + tgenabled = 'O' + sole non-internal
  trigger per table;
- ABSOLUTE AUTHORITY BASELINE (byte-identical to the reviewed
  EXLIB-2U gate): all four catalog-role memberships as complete
  tuples (member postgres, grantor supabase_admin, ADMIN TRUE,
  INHERIT FALSE, SET FALSE; exactly four rows), plus a whole-row
  membership digest captured-and-compared across the gated
  interval;
- the FRONT-LINE VECTOR: the eleven-table state vector must read
  EXACTLY the post-EXLIB-2U staged baseline 3/3/5/3/6/1/2/2/1/6/3
  (exactly one run; exactly six members; nothing drifted anywhere);
- the RESERVED RUN, locked FOR UPDATE (the same row lock the seal
  function and both freeze triggers take): the one counted run must
  BE the reserved key — a count-camouflaged key substitution
  refuses here (live control F3 isolates this gate);
- ONE-USE / SPENT: sealed_at set, approved_for_delivery true, or
  revoked_at set all refuse ('the S5 authority is ONE-USE and this
  database shows it SPENT') — this is also exactly where a second
  execution and the losing race session refuse;
- staged POSTURE: dry_run = false; started_at, completed_at,
  result_counts all NULL; created_at NOT NULL;
- reserved EVIDENCE character-for-character (identities, both
  instants by exact comparison, the rationale);
- the SIX-LINE MEMBERSHIP SURFACE exactly ALL_THREE_IDENTITIES
  (live control F10 isolates this gate under full count
  camouflage) and zero membership rows outside the run;
- delivery has NEVER run (zero tenant rows carry an import_run_id)
  and the unsealed run must not already satisfy the delivery
  predicate;
- the seal validation's own member-readiness queries (copied from
  the committed exlib_freeze_run_row bytes): exactly 3 exercise + 3
  alias members, zero unready;
- the reviewed WORLD: the three per-identity snapshot gates (the
  applied EXLIB-2Y approval tuples and every governed field of each
  decision packet), the exact three-event review surface, the exact
  three-alias surface, the published + admitted + fingerprint-fresh
  Plank content with its two projected relationships, and the
  claims invariant 0/0 — a seal must never freeze a membership
  pointing into a drifted world.

SHADOWING DISCLOSURES (deliberate defense-in-depth, in the reviewed
EXLIB-2U tradition): the dry-run, blank-evidence, empty-membership,
and unready-member conditions are each ALSO enforced by the freeze
trigger inside the seal statement itself, and dry-run/blank
evidence additionally by the approval_audit_chk CHECK — the package
gates fire FIRST so a mismatch aborts before any seal statement
runs. The vector gate shadows every membership-count change (live
control F9 fires there); the per-identity world gates shadow the
unready mirror (live control F11 fires at the tuple gate). The seal
function's own two refusals ('unknown run key', 'already sealed')
stand behind the package's key and SPENT gates and are additionally
proven directly (live controls F18 and P8).

## 6. The exact expected post-seal state (from a successful ONE call)

- Vector UNCHANGED: 3/3/5/3/6/1/2/2/1/6/3 (the seal creates and
  deletes nothing).
- The run row: approved_for_delivery = true; sealed_at = the
  executing transaction's instant (asserted equal to now() inside
  the package transaction); revoked_at NULL; started_at,
  completed_at, result_counts still NULL; run_key, dry_run,
  created_at, and all five evidence values byte-identical to the
  captured pre-seal line.
- The six membership rows WHOLE-ROW byte-identical, still resolving
  to the exact ALL_THREE_IDENTITIES member surface.
- The delivery predicate now matches EXACTLY ONE row — the intended
  irreversible effect, stated and verified, never exercised.
- Delivery did NOT run: zero tenant rows carry an import_run_id;
  both tenant digests identical.
- Every other surface digest-identical (snapshots, events, anatomy,
  aliases, claims, content, expected relationships, projection,
  logical, authority whole-row); claims invariant 0/0.
- The function result is EXACTLY {run_key:
  exlib2u-plank-release1-staged-v1, sealed: true,
  exercise_members: 3, alias_members: 3} (asserted in the act
  block; any other result rolls back the seal).
- The surfaced display row: EXLIB-2Z SEALED / runs 1 / run_items 6
  / approved true / sealed_at / unrevoked true /
  delivery_predicate_rows 1 / delivered_tenant_rows 0.

## 7. Abort conditions

ANY precondition mismatch raises an exception, rolls back the whole
transaction (nothing sealed, nothing written), and the verdict is
STOP / DO NOT SEAL — every one of the 29 precondition refusal
messages carries that phrase, and the live suite enforces the
count-to-phrase equality. ANY postcondition mismatch (including an
unexpected function result) rolls back THE SEAL ITSELF — proven
live by control F19, where the seal executes inside the transaction
and a failed postcondition leaves the run unsealed and the staged
world byte-intact. NO repair, retry, substitution, or opportunistic
mutation is authorized under any refusal: the operator reports the
exact message and the state, and any next step is a fresh review
and a fresh authorization. A refusal is evidence, never an
invitation to fix the database.

## 8. One-use / SPENT semantics and the ambiguity protocol

- The one-use S5 authorization is consumed by the ATTEMPT, not only
  by success. After ANY attempt — success, refusal, or ambiguity —
  no further execution is authorized without a NEW explicit human
  authorization.
- SUCCESS: the seal is SPENT — DO NOT RERUN; capture the section 9
  evidence immediately.
- CLEAN REFUSAL: the transaction rolled back whole; nothing was
  sealed (the live suite proves rollback after every refusal
  class); report the exact refusal message; the authorization is
  consumed.
- AMBIGUOUS TRANSPORT OUTCOME (timeout, disconnect, unknown
  result): NEVER retry blind. Run the read-only disambiguation
  query first:
  SELECT run_key, approved_for_delivery, sealed_at, revoked_at
  FROM public.exercise_catalog_import_runs
  WHERE run_key = 'exlib2u-plank-release1-staged-v1';
  If sealed_at IS NOT NULL: the seal LANDED — treat the attempt as
  executed and SPENT and proceed to evidence capture. If sealed_at
  IS NULL: the seal did NOT land — the authorization is still
  consumed; any new attempt requires a fresh review of why the
  transport failed and a fresh one-use authorization.
- The database-side backstop: a second execution of the package
  refuses at the SPENT gate (proven by live controls E1 and the
  two-session race G1-G3, which also proves a single seal instant),
  and a second direct function call refuses with the committed
  'already sealed' message (P8). These backstops exist so that even
  a wrongly repeated attempt cannot double-seal; they do NOT make a
  repeat lawful.

## 9. The post-seal evidence to capture immediately (a future
EXLIB-2Z application record, mirroring the EXLIB-2U evidence
milestone)

1. The returned function result (the exact four-field JSONB).
2. The run surrogate id and run key (must still be
   6669ba78-8e75-4042-ac2a-14082a9e5940 /
   exlib2u-plank-release1-staged-v1).
3. The database-generated seal instant (sealed_at) and its position
   in the execution chronology (preflight < execution < post-proof
   instants, every instant parsing).
4. The sealed posture: approved_for_delivery = true, sealed_at NOT
   NULL, revoked_at NULL, operational fields NULL, evidence values
   byte-identical.
5. The membership: still exactly the six ALL_THREE_IDENTITIES rows
   (the member surface re-read; counts 3/3).
6. The seal function's member counts as returned (3/3) and the
   readiness posture at execution.
7. Preservation: the state vector still 3/3/5/3/6/1/2/2/1/6/3;
   snapshots, review events, publication, projection, claims,
   tenant counts (exercises and tenant aliases), and the four-role
   authority baseline all unchanged.
8. Proof that no delivery occurred: zero tenant rows carry an
   import_run_id; tenant aliases unchanged; delivery predicate rows
   = 1 (eligible) with delivered rows 0 (not exercised).
9. The advisor observation (observed only, never modified),
   enumerated completely with per-class counts summing to totals —
   the EXLIB-2U round-1 lesson.
10. The physical backup instant current at execution and its rewind
    horizon relative to the seal.
11. The boundary: executed once by the operator path; Claude
    performed no hosted contact; no retry occurred after any
    outcome; no delivery, revocation, environment, seed, inventory,
    Git, Vercel, or EXLIB-2S action.

## 10. Rollback and emergency semantics

- Sealing is NOT normally reversible, and nothing in this milestone
  describes it as such. There is no unseal; the freeze trigger
  refuses sealed_at/approved_for_delivery changes in every
  direction (probed live, P3).
- exlib_revoke_run_delivery(p_run_key) is the SEPARATE one-way
  emergency delivery shutdown for a SEALED run: it refuses unknown
  keys ('exlib_revoke_run_delivery: unknown run key') and unsealed
  runs ('exlib_revoke_run_delivery: only sealed runs can be
  revoked'), sets
  revoked_at = NOW() exactly once, reports idempotently on repeat
  ('already_revoked': true), and NEVER reopens membership or
  approval editing (the freeze trigger keys exclusively on
  sealed_at; revocation is additionally one-way by trigger:
  'revocation is one-way and permanent'). Like the seal function it
  is revoked from PUBLIC, anon, and authenticated with no grant
  back.
- Revocation is NOT part of S5 and is NOT authorized by this
  milestone or by the section 17 draft. DELIBERATE OMISSION,
  flagged for Codex: the live suite never calls
  exlib_revoke_run_delivery, not even on the disposable clusters —
  the governing instruction says revocation must not be executed in
  this milestone, and this preparation reads that fail-closed; its
  semantics above are established from the committed bytes and
  pinned by the static verifier. If Codex wants live revocation
  coverage, that is a correction this record invites.
- The only physical path back after a seal is a full backup
  restore, which rewinds every later write with it — an operator
  decision entirely outside this milestone.

## 11. S6 separation

S5 seal consideration is strictly separate from delivery
configuration and execution. This milestone and the section 17
draft authorize NO delivery environment-variable change, NO runtime
activation, and NO delivery call. The promoted EXLIB-2T runtime
defaults STRICTLY OFF on the application side and its flag-ON path
is separately reviewed; the hosted environment posture is stated
evidence-bounded (not re-observed since the EXLIB-2U evidence
ruling). What a seal DOES change is recorded in section 3's risk
elevation: the database-side predicate flips, making delivery
reachable by any authenticated caller that names the run key —
measured structurally on the live cluster
(has_function_privilege('authenticated',
'deliver_catalog_exercises(text)', 'EXECUTE') = true; the seal
function itself = false; anon = false). DELIBERATE OMISSION,
flagged for Codex: the live suite performs NO successful delivery
probe even post-seal on the disposable clusters — reachability is
proven structurally (predicate match + measured privilege), never
by delivering, because the governing instruction authorizes no
delivery call and this preparation reads that fail-closed.

## 12. Validation performed (all local; measured, not asserted)

- LIVE (scripts/verify-exlib2z-live.sh, disposable socket-only
  cluster; deliberately outside the TS battery like every live
  suite): 122 passed, 0 failed. On the exact chain-built post-2U
  staged pre-state (2K+2O+2P+2Q+2R+2Y plus the SPENT 2U staging
  executed once each over the 84-exercise tenant fixture, every
  chain package fingerprint-pinned including the 2U package at
  ceb4964f...): the package identity/shape pins (exactly one seal
  call, zero other lifecycle calls, zero direct DML, the abort-
  language count equalities, the inherited strengthened gates); the
  happy path (the seal succeeds exactly once, the vector moves
  NOWHERE, the sealed posture exact with evidence byte-identical,
  membership whole-row identical, all surfaces digest-identical,
  authority untouched, the delivery predicate now 1 with delivered
  rows 0, structural reachability measured, claims intact,
  strengthened surfaces re-read on the sealed database); the
  post-seal contract probed directly (run_key / approver / unseal /
  dry_run UPDATEs each refused by the freeze trigger; membership
  INSERT/DELETE refused as PERMANENT; membership UPDATE refused
  unconditionally; a second direct seal call refused with the
  committed message; the operational-field contrast proven and
  reverted; state exactly intact after every probe); ONE-USE (the
  second package execution refuses at the SPENT gate; the seal
  instant unchanged); a nineteen-variant refusal matrix on fresh
  post-2U template copies with nothing-sealed proven after every
  refusal — missing run, foreign second run, COUNT-CAMOUFLAGED key
  substitution (isolating the reserved-key gate), dry-run flip,
  drifted approver identity, drifted evidence instant, drifted
  rationale, blank evidence, membership removal, COUNT-CAMOUFLAGED
  membership repoint (full duplicate-row camouflage isolating the
  membership-surface gate), drifted approval tuple (the world
  gate), a DISABLED freeze trigger, a DECOY-REBOUND freeze trigger,
  three COUNT-PRESERVING authority substitutions (member, admin
  option, grantor — each restored to the exact five-field baseline,
  restoration asserted), wrong executor authority, a tampered COPY
  calling the seal with a nonexistent key (mid-package function
  failure; rollback whole), and a tampered COPY with an impossible
  postcondition (THE SEAL ITSELF proven rolled back); the
  two-session race (exactly one sealer, the loser refusing at the
  SPENT gate, a single seal instant); and the final cluster-wide
  authority-restoration and zero-harness-roles proof.
- STATIC (scripts/verify-exlib2z.ts, joins the battery): sixteen
  proofs Z1-Z16 as described in section 13.
- BATTERY: see section 14 for the sweep and the reconciled totals.
- The package under test in every run above was byte-identical to
  the fingerprint in section 1.

## 13. Verifier lifecycle for this milestone

scripts/verify-exlib2z.ts (new, static, in the battery) proves: the
package fingerprint and labels (PREPARED / NOT AUTHORIZED /
ONE-USE / MATERIALLY IRREVERSIBLE / the hosted target and executor
boundary / the risk elevation); the statement shape (one seal call,
zero other calls, zero DML, one transaction, three DO blocks, the
eleven-table lock set); the BYTE-IDENTITY of the inherited
trigger-binding and authority gate blocks with the reviewed
EXLIB-2U package's blocks (extracted from the 2U bytes, located
verbatim in the 2Z bytes); the MECHANICAL authority binding (run
key, identities, instants, rationale — extracted from the artifact
bytes, never restated — and the instant-distinctness of the two
decision families); the S5 contract extraction (the seal function's
UPDATE effect lines, both function refusals, the immutable-field
list, and the membership-permanence message all located in the
migration bytes and quoted in this record verbatim); the pre-seal
predicate completeness (every gate of section 5 present in the
package bytes, the readiness mirror byte-equal to the trigger's own
query shape); the abort semantics (the refusal-message inventory
and its STOP / DO NOT SEAL and does-not-survive count equalities);
the one-use and ambiguity protocol (this record's disambiguation
query and consumed-by-attempt language); the post-seal evidence
checklist; the revocation section (quotes byte-located in the
migration; zero revocation call sites in the package AND the live
suite); the S6 separation and risk-elevation claims (the grant line
and ACL-preservation note byte-located in migrations 023/026); the
hosted-surrogate pins (this record's id and created_at literals
byte-located in the promoted EXLIB-2U application record); the
drafted-not-issued authorization (present, marked UNSENT, carrying
the spent-check and re-measure language); hygiene (ASCII plus
em-dash only in this record; no credential or delivery
environment-variable literals in any phase file); live-suite
presence and coverage (the control labels and deliberate-omission
flags); the EXLIB-2U application verifier retarget (label present,
stale main-pin absent, anchored constants exact); and topology (the
one plain forward commit over 290f9bbb carrying exactly the phase
inventory).

## 14. Stale-claim sweep and battery reconciliation

The sweep against a simulated commit built from the intended phase
paths (before any retarget; measured 98 suites / 7,211 checks / 4
failures) enumerated exactly ONE stale HISTORICAL suite, failing
exactly TWO checks — verify-exlib2u-application.ts E1 and E11 —
precisely the post-closeout staleness the durable-closeout ruling
predicted (E1 pinned refs/heads/main = ea8f6902..., true until the
authorized closeout moved main; E11 pinned a HEAD-relative
two-commit topology, true until this milestone's own first
successor commit). The only other reds were this milestone's OWN
new verifier holding its two retarget-coverage checks (Z14, Z16)
red until the retarget landed — the guard authored before the
repair, its output the worklist, by design not a stale claim. Both
stale checks are the recurring completed-phase pattern (tenth
instance) and both were retargeted count-neutral under the exact
label `RETARGET (EXLIB-2Z S5 seal preparation)`, anchored at
that phase's own promoted evidence tip
290f9bbbfea84ac6bcd2cefb59f7bed2247e2021 and its durable stable tag
(object 82e9800765579f15adc127eb4a218982c50425c8, peel and
89/98-byte annotation lineage as closed out) — where the claims
held and hold forever. No substantive hosted-event assertion was
weakened or deleted: E1 still proves the SPENT posture, the package
fingerprints live and at the tip, and the tag lineage; E11 still
proves the preserved round-0 commit, the single-parent correction
chain, and both exact inventories — all against constants. The
suite still reports eleven checks (E1-E11); the runtime check count
is unchanged.

With the retarget in place the simulated-commit battery, the
committed battery, and the fresh-clone battery all read 98 suites /
7,211 checks / 0 failures — the promoted baseline 97/7,195 plus
exactly this milestone's new 16-check static suite and nothing
else.

## 15. What did NOT happen (the boundary)

Nothing was sealed anywhere outside the disposable clusters: the
hosted run remains staged, unapproved, unsealed, unrevoked, exactly
as the EXLIB-2U evidence record preserved it. No delivery, no
revocation, no delivery-flag or environment change, no seed, no
inventory change, no EXLIB-2S act, no S6 act, no quarantine change,
no push, no tag, no promotion. No hosted contact by Claude at any
point. The SPENT EXLIB-2U package was executed ONLY on throwaway
local clusters as chain replay — the established validation method
for every hosted-lifecycle milestone — and its hosted SPENT / DO
NOT RERUN posture is unchanged and restated here. The hosted
execution of THIS package, when and if authorized after Codex
review, follows the standing rule: executed hosted exactly once by
Joseph/ChatGPT under its own explicit one-use instruction (section
17 drafts it; nothing issues it).

## 16. Stop condition

This milestone stops LOCAL-ONLY on its branch for Codex review. Not
pushed, not promoted, not tagged; the reserved authority artifact,
the three decision artifacts, the spent EXLIB-2U package, and every
promoted record byte-untouched; the only modified committed file is
the labeled EXLIB-2U application-verifier retarget of section 14.

## 17. The human authorization a hosted execution would require
(PREPARED — NOT ISSUED — DELIBERATELY UNSENT)

The following is the COMPLETE text the operator would send, only
after Codex approves this preparation, and only as their own one-use
decision. Nothing in this record issues, requests, or pre-consumes
it; Claude never issues authorizations.

    Authorize the EXLIB-2Z hosted S5 seal execution exactly as
    reviewed:
    * spent-check FIRST: confirm no prior attempt of any outcome
      (the hosted run must read approved_for_delivery = false,
      sealed_at NULL, revoked_at NULL);
    * perform the operator preflight of the preparation record's
      section 5, items 1-5, including re-measuring the package
      file's sha256 against the reviewed fingerprint and matching
      the preserved run surrogate and created_at exactly;
    * execute docs/exlib2z-s5-seal-package.sql exactly once against
      ShredOS ref ttybyljytiwntvorugcv as the operator role, in one
      transaction, by the operator path only;
    * on ANY refusal: STOP / DO NOT SEAL — report the exact message
      and state; no repair, retry, or substitution;
    * on ANY ambiguous transport outcome: do NOT retry; run the
      preparation record's section 8 read-only disambiguation query
      and report which branch obtains;
    * on success: capture the section 9 evidence immediately and
      completely;
    * then stop.
    This authorization is ONE-USE and is consumed by the attempt.
    It permits no delivery, no revocation, no delivery-variable or
    environment change, no runtime activation, no S6 work, no
    EXLIB-2S work, no Git push or tag, and no manual Vercel action.

After a hosted execution, the next gated milestones in order, each
separately instructed: the EXLIB-2Z hosted-application evidence
record (section 9), its Codex review, its consolidated closeout —
and only then any S6 delivery-configuration consideration, which is
its own proposal, review, and authorization chain.
