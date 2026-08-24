-- ============================================================
-- ForgeFitOS EXLIB-1B3B — Post-application hardening
-- 024_exlib_post_application_hardening.sql
-- ============================================================
-- STATUS: DRAFT — NOT APPLIED. Joseph must not apply migration 024
-- until ChatGPT reviews the SQL and explicitly approves the exact
-- fingerprint recorded in
-- docs/exlib1b3-post-application-hardening-audit.md.
--
-- Hardens the APPLIED migration 023 Revision H (92,806 bytes,
-- sha256
-- 0991448c39a558385431c78cef6d6063df208312a3f53866756ba730066c42f2,
-- Supabase history entry
-- 20260824135804_exlib_catalog_and_delivery_contract_revision_h).
-- Run AFTER 023.
--
-- CONTAINS NO CONTENT DATA. Exactly SIX operations, per the
-- approved EXLIB-1B3A audit scope, and nothing else:
--   * two ALTER FUNCTION statements pinning search_path = '' on
--     the two SECURITY INVOKER verify functions (Supabase lint
--     0011; audit section 3.3). ALTER FUNCTION — never a function
--     replacement — so the body, signature, return type, security
--     model, volatility, parallel setting, owner, and ACL are
--     untouched by construction; only proconfig changes. Both
--     bodies already schema-qualify every reference, so behavior
--     is identical.
--   * four partial, non-unique, single-column btree indexes
--     supporting the RESTRICT checks of the documented catalog
--     correction paths (audit sections 4.2-4.3, rows 6, 7, 11,
--     13): without them, the supported delete-while-unreferenced
--     alias correction and the pending-snapshot correction scan
--     unbounded child tables (including a full heap scan of
--     exercises) while holding the parent row lock.
-- No table, column, trigger, policy, grant, revoke, or data change
-- of any kind. Rollback contract: reset the two functions'
-- search_path setting and drop exactly these four indexes (recorded
-- in the audit notes).
-- ============================================================

-- One explicit top-level transaction encloses every executable
-- statement below (same atomic-install rule as Revision H).
BEGIN;

-- ── 1. Function search_path hardening ─────────────────────────────
-- Exactly one applicable signature exists for each (proven against
-- the applied migration 023: one niladic definition per function,
-- zero overloads).
ALTER FUNCTION public.exlib_verify_catalog_claims() SET search_path = '';
ALTER FUNCTION public.exlib_verify_alias_lifecycle() SET search_path = '';

-- ── 2. FK-supporting partial indexes ──────────────────────────────
-- Names proven absent from migrations 001-023. Plain CREATE INDEX
-- (no CONCURRENTLY inside the transaction; no IF NOT EXISTS — an
-- unexpected prior object must fail the whole migration closed).
-- Each is partial on exactly the FK column's non-null rows: the
-- referential-integrity lookup (column = value) implies the
-- predicate, and catalog-linked rows are the only rows the checks
-- ever seek.
CREATE INDEX exercises_catalog_id_idx
  ON public.exercises (catalog_id)
  WHERE catalog_id IS NOT NULL;

CREATE INDEX exercise_aliases_catalog_alias_id_idx
  ON public.exercise_aliases (catalog_alias_id)
  WHERE catalog_alias_id IS NOT NULL;

CREATE INDEX exercise_catalog_run_items_catalog_id_idx
  ON public.exercise_catalog_run_items (catalog_id)
  WHERE catalog_id IS NOT NULL;

CREATE INDEX exercise_catalog_run_items_catalog_alias_id_idx
  ON public.exercise_catalog_run_items (catalog_alias_id)
  WHERE catalog_alias_id IS NOT NULL;

-- End of the single top-level transaction.
COMMIT;
