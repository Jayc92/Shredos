# EXLIB-1C0B3 — Coordinated Equipment Implementation (record)

**Migration 025 status: DRAFT — NOT APPLIED.** Nothing in this
record authorizes applying migration 025, loading catalog data, or
changing any candidate's eligibility.

## 1. Authorization and anchors

- Authorized by Joseph's EXLIB-1C0B3 instruction, implementing the
  EXLIB-1C0B2 decisions (5-7 CLOSED/APPROVED, 2026-08-25).
- B2 decision commit: `360ccd24ac1529c910fc58744be71b3bf9838af3`;
  stable tag `exlib1c0b2-equipment-release-product-decisions-stable`
  (peels to that exact commit).
- B2 decision record: 5,131 bytes, SHA-256
  `6b9e813ad625cb21a8be5a4992d94da7d45f149f3e824388190bb0292da1e64d`.
- Migration 024 (applied) fingerprint: 3,726 bytes, SHA-256
  `190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980`.

## 2. Coordinated implementation inventory

One coordinated release, per the B2 prohibition on schema-only or
bare-CHECK expansion:

- `supabase/migrations/025_exlib_equipment_vocabulary_support.sql`
  (DRAFT — NOT APPLIED): corrected fingerprint **3,587 bytes,
  SHA-256
  `fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c`**.
  One top-level BEGIN/COMMIT; exactly six executable statements
  (BEGIN, two DROP CONSTRAINT, two ADD CONSTRAINT, COMMIT); zero
  NOTIFY (removed on direct review — a CHECK vocabulary expansion
  needs no PostgREST schema-cache reload and it sat outside the
  authorized exact constraint-replacement scope). Installed names
  discovered mechanically from pg_constraint on a disposable
  database (`exercises_equipment_check`,
  `exercise_catalog_equipment_check`); both re-added with the same,
  now-explicit stable names; every existing value preserved.
- `src/types/database.ts` — ExerciseEquipment union: twelve values.
- `src/lib/exercise-validation.ts` — EQUIPMENT_TYPES: twelve values;
  `validateEquipment` still fails closed on unknown values.
- `src/lib/constants.ts` — EXERCISE_EQUIPMENT options with Joseph's
  exact labels; `Other` stays last.
- `src/lib/workout.ts` — explicit Smith Machine progression branch.
- `scripts/verify-exlib1c0b3-live.sh` — disposable live suite.
- `scripts/verify-exlib1c0b3.ts` — deterministic verifier.
- `scripts/verify-exlib1c0b3-guard.sh` — local-only pre-browser
  guard (section 5).
- Labeled RETARGET/ADMISSION corrections across the committed
  verifier suites (migration boundary 24 -> 25; exact-path product
  admissions).

## 3. Values, labels, and Smith Machine behavior

| Value | Label |
|---|---|
| weight_plate | Weight Plate |
| weighted_vest | Weighted Vest |
| smith_machine | Smith Machine |
| sandbag | Sandbag |

All four are selectable wherever a user-created exercise chooses
equipment (create and edit). Smith Machine progression never assumes
or recommends a fixed +5 lb increment: it is handled by an explicit
branch emitting the neutral "Try the next available
increment/setting" guidance, makes no counterbalance or
machine-equivalence claims, and every other equipment value keeps
its previous behavior.

## 4. Local test results

- Disposable live suite (fingerprint-gated, socket-only, exact
  migrations 001-025): both 12-value CHECK definitions proven from
  pg_constraint; all twelve values insert; unknown value fails
  closed; migration 024 unaffected; catalog content tables remain
  0/0/0/0; forced-failure atomicity proven (sabotaged second DROP
  leaves the first CHECK byte-identical).
- Local Docker Supabase stack (`supabase start`, shifted ports):
  the official CLI path applied exact migrations 001-025 cleanly.
- Real-UI verification against the LOCAL stack only: all twelve
  labels render in the create form (desktop and mobile, dark theme,
  `Other` last); each of the four new values was created through
  the real form (`POST /api/exercises` returned 201 for each); the
  edit flow displayed and preserved `smith_machine` through a save
  round-trip (`PATCH` 200); existing equipment unaffected; the
  fresh-load network log was clean.
- Runtime progression proof (executing the real `suggestNextTarget`
  code): smith_machine -> neutral increment/setting;
  machine/cable -> unchanged "next available setting"; all other
  values -> unchanged standard suggestions.
- No catalog loading and no candidate-eligibility change: the
  authoritative ledger remains 48/48 pending-null and all 26
  canonical candidates remain `import_eligible: false`.

## 5. Hosted-contact boundary incident — 2026-08-26

Factual record (this section supersedes any implication elsewhere
that the no-hosted-contact boundary was fully held; it was not):

- The dev server was initially launched BEFORE the local Supabase
  override was active, so the app read the hosted project URL from
  `.env.local`.
- One anonymous middleware auth request (page load) and two failed
  sign-in attempts for a nonexistent local fixture user reached the
  hosted Supabase auth endpoint.
- No valid session was created; no authenticated query, data read,
  data mutation, migration application, or catalog loading occurred.
- `.env.local` was not modified.
- The cause was test sequencing/configuration (server started
  before the local-only environment was materialized), not
  application behavior.
- This is a boundary violation even though it caused no database
  mutation.
- Claude made the contact, not Joseph or ChatGPT.
- No further hosted contact is authorized.

### Prevention rule (mandatory for every future local UI session)

REVISED (EXLIB-1C0B3 final guard correction): the pre-browser
assertion now models the REAL effective Next.js development
environment rather than reading a single dotenv file.

1. Start the disposable/local Supabase stack FIRST.
2. Materialize explicit local-only environment overrides.
3. Mechanically reject any Supabase URL whose host is not loopback:
   the guard resolves the EFFECTIVE `NEXT_PUBLIC_SUPABASE_URL` the
   dev server would actually see — an already-exported process
   environment value takes HIGHEST precedence, then
   `.env.development.local`, `.env.local`, `.env.development`,
   `.env` (first defined wins) — so a hosted process value cannot
   be masked by a local dotenv file. Defined includes an explicitly
   empty value; an empty higher-priority value wins resolution and
   fails closed rather than falling through.
4. The guard parses the actual winning value with a real URL parser
   (Node WHATWG `new URL()`) and fails closed on a missing or empty
   value, a malformed or relative URL, a credential-bearing URL,
   unresolved `$VAR`/`${VAR}` interpolation, any protocol other
   than http/https, any hostname other than exactly `127.0.0.1` or
   `localhost`, and the hosted ShredOS project ref anywhere in the
   value; it prints only the source, protocol, hostname, and
   verdict — never the URL itself.
5. Run this pre-browser assertion proving all effective Supabase
   endpoints resolve to `127.0.0.1` or `localhost`
   (`scripts/verify-exlib1c0b3-guard.sh`). Only then start the dev
   server.
6. Fail closed BEFORE browser launch otherwise.
