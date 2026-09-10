# weight_time W2 — installed tracking-mode CHECK constraint names (record)

**Derived mechanically on a DISPOSABLE local database. No hosted
contact: no Supabase, no Vercel, no remote service of any kind.**

Plan step: `docs/weight-time-coordinated-implementation-plan.md`
§2 (the two CHECKs), §10.3(1) (precondition), §16 W2.

## 1. Why this record exists

Both `tracking_mode` CHECK constraints are **unnamed inline
constraints** in the committed SQL:

| Table | Committed definition |
|---|---|
| `public.exercises` | `010_phase2r_exercise_tracking_modes.sql:26-28` — `CHECK (tracking_mode IN ('weight_reps', 'bodyweight', 'cardio', 'timed'))` |
| `public.exercise_catalog` | `023_exlib_catalog_and_delivery_contract.sql:384-385` — `CHECK (tracking_mode IN ('weight_reps','bodyweight','cardio','timed'))` |

PostgreSQL assigns their installed names at `CREATE` time, so the names
migration 028 must `DROP` in order to replace them with 5-value
versions are **not in the tree**. Migration 025 faced the same problem
for the equipment CHECKs and solved it the same way — "Installed names
discovered mechanically from pg_constraint on a disposable database"
(`docs/exlib1c0b3-coordinated-equipment-implementation.md` §2).

## 2. How the names were derived

`scripts/discover-tracking-mode-constraint-names-live.sh` (committed
alongside this record):

1. refuses to run unless `supabase/migrations` is clean in git, so the
   applied bytes are exactly the committed bytes at the printed HEAD;
2. refuses to run unless exactly the 27 numbered migrations 001–027 are
   present — a 028 appearing would make this discovery stale, so it
   fails closed instead;
3. prints a manifest digest (sha256 of each migration's sha256, in
   order) so the applied set is pinned;
4. `initdb`s a disposable cluster in a temp directory — unix socket
   only, no TCP, torn down on exit;
5. creates the `anon`/`authenticated`/`service_role` and `auth.*` stubs
   and applies the exact migrations 001–027 in order. That is the
   sequence the EXLIB-2M application record documents as in effect on
   hosted ShredOS (`docs/exlib2m-migration-027-application-record.md`
   §1: "the REPOSITORY schema/migration sequence effective on hosted
   ShredOS is now 001-027");
6. reads `pg_constraint` for every CHECK whose definition mentions
   `tracking_mode` and prints `schema.table|conname|definition`
   verbatim;
7. asserts exactly two such constraints, one per table, both carrying
   the exact 4-value baseline definition that 028 will replace.

## 3. Result — verbatim run output (2026-09-09)

```
Repository state (what will be applied)
  root=/Users/joseph.carfagno/Downloads/forgefit/app/shredos
  HEAD=5fbdfc8f5783acf858aaa14940d260c28bab9a2b
  PASS  supabase/migrations is clean in git (applied bytes = committed bytes at HEAD)
  PASS  exactly 27 numbered migrations present, last = 027_exlib_catalog_content_schema.sql
  applied-file manifest (sha256 of each file, in order) digest: 284ddd00531b4b3102c5c13764b3f2ad90ef411084268730db0577902d1c5d28

Disposable cluster
  PASS  cluster up at /tmp/wt-w2-pg.Obb4Rc (unix socket only; no TCP; no Supabase); PostgreSQL 16.15 (Homebrew)

Apply auth stubs + exact migrations 001-027 in order
  PASS  exact migrations 001-027 applied cleanly in order

Installed CHECK constraints mentioning tracking_mode (pg_constraint, verbatim: schema.table|conname|definition)
  public.exercise_catalog|exercise_catalog_tracking_mode_check|CHECK ((tracking_mode = ANY (ARRAY['weight_reps'::text, 'bodyweight'::text, 'cardio'::text, 'timed'::text])))
  public.exercises|exercises_tracking_mode_check|CHECK ((tracking_mode = ANY (ARRAY['weight_reps'::text, 'bodyweight'::text, 'cardio'::text, 'timed'::text])))
  PASS  exactly two CHECK constraints mention tracking_mode
  PASS  public.exercises carries a tracking_mode CHECK named 'exercises_tracking_mode_check'
  PASS  public.exercise_catalog carries a tracking_mode CHECK named 'exercise_catalog_tracking_mode_check'
  PASS  public.exercises definition is the exact 4-value baseline
  PASS  public.exercise_catalog definition is the exact 4-value baseline

DISCOVERED INSTALLED NAMES (what migration 028's DROP CONSTRAINT must target)
  public.exercises.tracking_mode         => exercises_tracking_mode_check
  public.exercise_catalog.tracking_mode  => exercise_catalog_tracking_mode_check

9 passed, 0 failed
```

## 4. Discovered names

| Table | Column | Installed constraint name | Installed definition (pg_get_constraintdef) |
|---|---|---|---|
| `public.exercises` | `tracking_mode` | **`exercises_tracking_mode_check`** | `CHECK ((tracking_mode = ANY (ARRAY['weight_reps'::text, 'bodyweight'::text, 'cardio'::text, 'timed'::text])))` |
| `public.exercise_catalog` | `tracking_mode` | **`exercise_catalog_tracking_mode_check`** | `CHECK ((tracking_mode = ANY (ARRAY['weight_reps'::text, 'bodyweight'::text, 'cardio'::text, 'timed'::text])))` |

## 5. What this establishes, and what it does not

- **Establishes:** the names PostgreSQL assigns when the committed
  migrations 001–027 are applied in order to an empty cluster
  (PostgreSQL 16.15 locally). They match PostgreSQL's default naming
  for an inline column CHECK (`<table>_<column>_check`); that rule is
  an observation consistent with the read, **not** the basis of the
  claim — the read is.
- **Expected on hosted, not read from hosted.** Hosted ShredOS ran the
  same committed bytes in the same order (EXLIB-2M record), so the same
  names are expected there. This record does **not** read the hosted
  database; Claude never does. The hosted PostgreSQL version is not
  known to this record; the default naming rule has been stable across
  supported versions, but that is an expectation, stated as one.
- **028 is fail-closed on a name mismatch by construction.** `ALTER
  TABLE … DROP CONSTRAINT <name>` errors if the name is absent, and
  inside 028's single transaction that aborts everything with nothing
  half-applied — the same property the 025 live suite proved for the
  equipment replacement (sabotaged second DROP ⇒ first CHECK left
  byte-identical). 028's own disposable live suite must re-prove this
  at authoring time (W6).
- **The replacements must carry these same, now-explicit names** (the
  025 precedent), so no future migration has to rediscover them.

## 6. Re-derivation

```bash
bash scripts/discover-tracking-mode-constraint-names-live.sh
```

From any cwd; exit 0 and `9 passed, 0 failed` reproduce this record.
Run it again before authoring 028 if `supabase/migrations` has changed
since HEAD `5fbdfc8f`.
