-- ============================================================
-- ForgeFitOS EXLIB-1C0B3 — Equipment vocabulary support
-- 025_exlib_equipment_vocabulary_support.sql
-- ============================================================
-- STATUS: DRAFT — NOT APPLIED. Joseph must not apply migration 025
-- until ChatGPT reviews the SQL and explicitly approves the exact
-- fingerprint.
--
-- Runs AFTER migration 024 (applied: 3,726 bytes, sha256
-- 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980,
-- Supabase history 20260824174252_exlib_post_application_hardening).
-- Implements the equipment portion of Joseph's approved product
-- decisions recorded in
-- docs/exlib1c0b2-equipment-release-product-decisions.md (5,131
-- bytes, sha256
-- 6b9e813ad625cb21a8be5a4992d94da7d45f149f3e824388190bb0292da1e64d,
-- stable tag exlib1c0b2-equipment-release-product-decisions-stable).
--
-- CONTAINS NO CONTENT DATA. Exactly FOUR operations and nothing
-- else: the two affected equipment CHECK constraints are replaced
-- (drop + re-add, the documented PostgreSQL method — CHECKs cannot
-- be modified in place), each preserving every existing value and
-- adding exactly weight_plate, weighted_vest, smith_machine, and
-- sandbag. The dropped names are the INSTALLED names discovered
-- mechanically from pg_constraint on a disposable database built
-- from exact migrations 001-024 (the source CHECKs were unnamed
-- inline column constraints from migrations 003 and 023, so
-- PostgreSQL generated <table>_<column>_check). The re-added
-- constraints carry the same names, now EXPLICIT and stable.
-- Because the new value set is a strict superset of the old one,
-- every existing row satisfies the expanded constraints by
-- construction; ADD CONSTRAINT still scans and verifies (no NOT
-- VALID is used).
--
-- No table, column, policy, grant, trigger, function, RLS, or data
-- change of any kind. No weight_time (tracking decisions 1-4 remain
-- OPEN). No catalog rows and no ledger changes. Rollback contract:
-- constraint contraction is only possible while zero rows use the
-- four new values; the recorded rollback is a forward corrective
-- migration, never contraction over live values.
-- ============================================================

-- One explicit top-level transaction encloses every executable
-- statement below (same atomic-install rule as migrations 023/024).
BEGIN;

-- ── 1. Tenant table: public.exercises ─────────────────────────────
-- Installed name discovered mechanically: exercises_equipment_check
ALTER TABLE public.exercises
  DROP CONSTRAINT exercises_equipment_check;

ALTER TABLE public.exercises
  ADD CONSTRAINT exercises_equipment_check CHECK (equipment IN (
    'barbell', 'dumbbell', 'cable', 'machine',
    'bodyweight', 'resistance_band', 'kettlebell', 'other',
    'weight_plate', 'weighted_vest', 'smith_machine', 'sandbag'));

-- ── 2. Catalog table: public.exercise_catalog ─────────────────────
-- Installed name discovered mechanically:
-- exercise_catalog_equipment_check
ALTER TABLE public.exercise_catalog
  DROP CONSTRAINT exercise_catalog_equipment_check;

ALTER TABLE public.exercise_catalog
  ADD CONSTRAINT exercise_catalog_equipment_check CHECK (equipment IN (
    'barbell', 'dumbbell', 'cable', 'machine',
    'bodyweight', 'resistance_band', 'kettlebell', 'other',
    'weight_plate', 'weighted_vest', 'smith_machine', 'sandbag'));

-- End of the single top-level transaction.
COMMIT;
