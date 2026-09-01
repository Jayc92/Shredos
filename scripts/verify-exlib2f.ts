// EXLIB-2F verifier — migration-026 APPLY-PREP (candidate PREPARED,
// NOT APPLIED to any hosted or persistent database).
//
// Proves: the exact promoted EXLIB-2E source (tag object, tip, and
// every protected fingerprint); the live migration boundary now owned
// by this phase (exactly one 026 candidate, no 027, exactly 26
// numbered files); the reviewed docs proposal byte-unchanged; the
// mechanical construction of the candidate (after excluding ONLY the
// truthful leading status-header commentary, its executable SQL is
// byte-identical to the reviewed proposal's executable SQL) with a
// truthful header; every reviewed structural property re-proven on
// the CANDIDATE bytes (three functions, helper posture, strict run
// invariant, snapshot gate, shared validation shape, parent-then-child
// locking, tenant-scoped P2 update, rollback exclusions, no rename
// mechanism, 13+1 report keys, byte-carried generic 023 behavior);
// the no-product-change boundary (seed/ledger/eligibility/126-record
// corpus untouched, no runtime/dependency/config change); the
// not-claimed-as-applied posture; and that every historical-verifier
// retarget is narrow, labeled, and anchored. Performs NO hosted
// contact.
//
// Fail-closed: any mismatch fails the suite.
import { execSync } from 'child_process'
import { createHash } from 'crypto'
import { existsSync, readFileSync, readdirSync } from 'fs'

let passed = 0
let failed = 0
const check = (name: string, ok: boolean, detail?: string): void => {
  if (ok) { passed += 1; console.log(`  PASS  ${name}`) }
  else { failed += 1; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
const read = (p: string): string => readFileSync(p, 'utf8')
const sha256 = (p: string): string => createHash('sha256').update(readFileSync(p)).digest('hex')
const parseJsonl = (p: string): any[] => read(p).split('\n')
  .filter((l) => l.trim() && !l.trim().startsWith('#')).map((l) => JSON.parse(l))

const CANDIDATE = 'supabase/migrations/026_exlib_plank_seed_reconciliation.sql'
const PROPOSAL = 'docs/exlib2e-migration-026-proposal.sql'
const RECORD = 'docs/exlib2f-migration-026-apply-prep-record.md'
const LIVE = 'scripts/verify-exlib2f-live.sh'
const VERIFIER = 'scripts/verify-exlib2f.ts'
const EXLIB2E_TIP = '7fed0eed6f18c1752e15d3ba76b6e0c7adeaacf3'
const EXLIB2E_TAG_OBJECT = '5d20d33ec275b7764d629d429b6b8a17655857d0'
const PROPOSAL_SHA = 'a6696066d178ced7e53bf81e7106cce64a87e2c73d9b342464d930a2fe3c2108'

const PHASE_NEW = [CANDIDATE, RECORD, LIVE, VERIFIER].sort()
// Every historical verifier that carried a live "exactly 001-025 / no
// 026" claim, retargeted under an explicit EXLIB-2F label this phase.
const RETARGETED = [
  'scripts/verify-exlib1a.ts', 'scripts/verify-exlib1b1.ts', 'scripts/verify-exlib1b2.ts',
  'scripts/verify-exlib1b3.ts', 'scripts/verify-exlib1c0.ts', 'scripts/verify-exlib1c0a.ts',
  'scripts/verify-exlib1c0b.ts', 'scripts/verify-exlib1c0b2.ts', 'scripts/verify-exlib1c0b3-live.sh',
  'scripts/verify-exlib1c0b3.ts', 'scripts/verify-exlib1c0b4.ts', 'scripts/verify-exlib1c0b5.ts',
  'scripts/verify-exlib2a2b.ts', 'scripts/verify-exlib2c-batch01.ts', 'scripts/verify-exlib2c-batch02.ts',
  'scripts/verify-exlib2c-batch03.ts', 'scripts/verify-exlib2c-batch04.ts', 'scripts/verify-exlib2c-batch05.ts',
  'scripts/verify-exlib2c-batch06.ts', 'scripts/verify-exlib2d.ts', 'scripts/verify-exlib2e-live.sh',
  'scripts/verify-exlib2e.ts', 'scripts/verify-food-log-ux.ts', 'scripts/verify-phase5b3.ts',
  'scripts/verify-phase5b4.ts', 'scripts/verify-phase5b5.ts', 'scripts/verify-ui1a.ts',
  'scripts/verify-ui1b.ts', 'scripts/verify-ui2.ts', 'scripts/verify-ui3.ts', 'scripts/verify-ui4.ts',
  'scripts/verify-ui5a.ts', 'scripts/verify-ui5b1a.ts', 'scripts/verify-ui5b1b.ts',
  'scripts/verify-ui5b2.ts', 'scripts/verify-ui6a.ts', 'scripts/verify-ui6b.ts',
  'scripts/verify-ui6c.ts', 'scripts/verify-ui7.ts'].sort()
const PHASE_ALL = [...PHASE_NEW, ...RETARGETED].sort()

// The candidate's executable SQL = everything after the maximal
// leading prefix of blank/comment lines; identical definition for the
// proposal, so ONLY leading status commentary may differ.
const stripLeadingCommentary = (text: string): string => {
  const lines = text.split(/(?<=\n)/)
  let i = 0
  while (i < lines.length && (lines[i].trim() === '' || lines[i].trimStart().startsWith('--'))) i += 1
  return lines.slice(i).join('')
}
const fnText = (src: string, name: string): string => {
  const start = src.indexOf(`CREATE OR REPLACE FUNCTION ${name}`)
  if (start < 0) return ''
  return src.slice(start, src.indexOf('$$;', start) + 3)
}
const returnKeys = (fn: string): string[] => {
  const ret = fn.slice(fn.lastIndexOf('RETURN jsonb_build_object'))
  return Array.from(ret.matchAll(/'(\w+)',/g)).map((m) => m[1])
}

const cand = read(CANDIDATE)
const prop = read(PROPOSAL)
const m023 = read('supabase/migrations/023_exlib_catalog_and_delivery_contract.sql')
const recFlat = existsSync(RECORD) ? read(RECORD).replace(/\s+/g, ' ') : ''

async function main(): Promise<void> {
  console.log('EXLIB-2F verification (migration-026 apply-prep, candidate NOT applied)')

  console.log('\nA. Source, boundary, and construction')
  {
    check('A1: promoted EXLIB-2E source exact — the annotated tag object peels to the promoted tip, and every protected fingerprint holds (proposal, 2E record, 2D record/matrix, six batch corpora, inventory, schema, 025, ledger)',
      (() => {
        try {
          if (execSync(`git rev-parse ${EXLIB2E_TAG_OBJECT}^{}`, { encoding: 'utf8' }).trim() !== EXLIB2E_TIP) return false
          execSync(`git merge-base --is-ancestor ${EXLIB2E_TIP} HEAD`, { stdio: 'pipe' })
        } catch { return false }
        return sha256(PROPOSAL) === PROPOSAL_SHA &&
          sha256('docs/exlib2e-implementation-review-record.md') === '6c1ef278ae4a5c04d127d47e6c0b70e1948005b63c61198ca391b67cb40a00fd' &&
          sha256('docs/exlib2d-plank-seed-reconciliation-record.md') === '3ea2aa1d279bfd7a099e2b33fe4dfdba565dbde5c37e780c338673684e9baf7c' &&
          sha256('docs/exlib2d-plank-reconciliation-matrix.md') === '5e852982314ebbd52428b5a317388c2b88d69649e1c5c8f21b105f19f9734928' &&
          sha256('docs/exlib2c-release1-batch01-content.jsonl') === '8168fc196f89781e8a30b315f29d1c72f46afeff8edfe89d1812b0a150ece2b2' &&
          sha256('docs/exlib2c-release1-batch02-content.jsonl') === '1ddc3ab0bd92d60ef33960d82a8e0c8a2fdea1cb828d15fc9bf6a82c34305d48' &&
          sha256('docs/exlib2c-release1-batch03-content.jsonl') === 'e4fca8b632c9c9af9b7c6eece660f2042b6a4c3ef613e14c278f95cf9fcab528' &&
          sha256('docs/exlib2c-release1-batch04-content.jsonl') === 'e7def375e9b9560863796bff90746dc6ff2b2f7c4bd7735a3d53fc2cc9750568' &&
          sha256('docs/exlib2c-release1-batch05-content.jsonl') === '404722f1211e45c3b89ac8a32cceb617b958388c034b797dd2bba009aa127e5d' &&
          sha256('docs/exlib2c-release1-batch06-content.jsonl') === 'ec0760be401bb1d4c479d340369d6b6b690acf57f2f7a0f7fbeeaa2cf40ab5d7' &&
          sha256('docs/exlib2b-release1-inventory.jsonl') === 'd349110f22700a822eb427fc1dcce3e6dbcfd264b6d48ed84936b07b1ca256f5' &&
          sha256('docs/exlib2c-authoring-schema.json') === 'dddb872c7725c591e6d056e0dc73167d3c822f6245ebd2c759a045fecbd43c6e' &&
          sha256('supabase/migrations/025_exlib_equipment_vocabulary_support.sql') === 'fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c' &&
          sha256('docs/exlib1b1-review-ledger.jsonl') === 'aa4fe77c0c633510661eede94b40e9bae4aca90a7d8c2794abde92c83c6f7b7b'
      })())
    check('A2: live migration boundary — exactly ONE numbered migration 026 with the exact candidate filename, NO 027, and exactly 26 numbered files forming the contiguous sequence 001-026',
      (() => {
        const files = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).sort()
        if (files.length !== 26) return false
        if (files.filter((f) => f.startsWith('026')).length !== 1) return false
        if (!files.includes('026_exlib_plank_seed_reconciliation.sql')) return false
        if (files.some((f) => f.startsWith('027'))) return false
        const prefixes = files.map((f) => parseInt((f.match(/^(\d{3})_/) ?? [])[1], 10))
        return JSON.stringify(prefixes) === JSON.stringify(Array.from({ length: 26 }, (_, i) => i + 1))
      })())
    check('A3: the reviewed docs proposal is retained byte-identical to its promoted EXLIB-2E fingerprint (32,500 B) — not moved, not deleted, not edited',
      existsSync(PROPOSAL) && readFileSync(PROPOSAL).length === 32500 && sha256(PROPOSAL) === PROPOSAL_SHA)
    check('A4: mechanical construction — after excluding ONLY the maximal leading blank/comment prefix from BOTH files, the candidate\'s executable SQL is byte-identical to the reviewed proposal\'s executable SQL, and the candidate\'s leading header truthfully states the apply-prep status, reviewed source commit, reviewed proposal SHA-256, NOT-APPLIED posture, Joseph/ChatGPT-only application, and the separately gated follow-ups',
      (() => {
        if (stripLeadingCommentary(cand) !== stripLeadingCommentary(prop)) return false
        const bodyStart = cand.indexOf(stripLeadingCommentary(cand))
        const header = cand.slice(0, bodyStart)
        return ['EXLIB-2F APPLY-PREP CANDIDATE', EXLIB2E_TIP, PROPOSAL_SHA,
          'PREPARED FOR LATER EXPLICIT APPLICATION - NOT APPLIED',
          'NOT applied to any hosted or persistent database',
          'Joseph/ChatGPT-only', 'never performed by Claude',
          'seed module edit', 'Plank instructional content authoring',
          'inventory seed_link_compatible flip', 'catalog loading',
          'delivery to users'].every((pin) => header.includes(pin))
      })())
  }

  console.log('\nB. Reviewed structure re-proven on the CANDIDATE bytes')
  {
    check('B1: exactly the reviewed three functions (internal helper, delivery, rollback) and the correction table with tenant PK, composite RESTRICT FK to exercises, RESTRICT FKs to run/logical, RLS enabled with no client policies, and REVOKE ALL from client roles',
      (() => {
        const fns = Array.from(cand.matchAll(/CREATE (OR REPLACE )?FUNCTION (\w+)/g)).map((m) => m[2])
        if (JSON.stringify(fns) !== JSON.stringify(['exlib_plank_link_valid', 'deliver_catalog_exercises', 'rollback_catalog_delivery'])) return false
        return cand.includes('CREATE TABLE exercise_catalog_corrections (') &&
          cand.includes('PRIMARY KEY (user_id, exercise_id)') &&
          cand.includes('REFERENCES exercises (user_id, id) ON DELETE RESTRICT') &&
          cand.includes('REFERENCES exercise_catalog_import_runs (id) ON DELETE RESTRICT') &&
          cand.includes('REFERENCES exercise_catalog_logical (id) ON DELETE RESTRICT') &&
          cand.includes('ALTER TABLE exercise_catalog_corrections ENABLE ROW LEVEL SECURITY;') &&
          cand.includes('REVOKE ALL ON TABLE exercise_catalog_corrections\n  FROM PUBLIC, anon, authenticated;') &&
          !/CREATE POLICY[\s\S]{0,120}exercise_catalog_corrections/.test(cand)
      })())
    check('B2: helper posture unchanged — VOLATILE (the unsafe STABLE shape stays rejected), SECURITY DEFINER, pinned search_path, EXECUTE revoked from PUBLIC/anon/authenticated, and no new GRANT anywhere',
      (() => {
        const hStart = cand.indexOf('CREATE OR REPLACE FUNCTION exlib_plank_link_valid')
        const helper = cand.slice(hStart, cand.indexOf('$helper$;', hStart) + '$helper$;'.length)
        return hStart >= 0 && helper.includes('\nVOLATILE\n') && !helper.includes('\nSTABLE\n') &&
          helper.includes('SECURITY DEFINER') && helper.includes('SET search_path = public, pg_temp') &&
          cand.includes('REVOKE ALL ON FUNCTION exlib_plank_link_valid(UUID, public.exercises, UUID, UUID, TEXT, UUID)\n  FROM PUBLIC, anon, authenticated;') &&
          !/GRANT\s/.test(cand)
      })())
    check('B3: every reviewed invariant present in the candidate — strict delivering-run provenance (permissive shapes absent), the timed/exact-anatomy snapshot gate, ONE shared validation shape at both link paths under the parent lock, parent-then-child-then-read lock ordering in the helper AND the P2 predicate, the tenant-scoped P2 UPDATE, three rollback exclusions with deactivate-only semantics, and no rename mechanism',
      (() => {
        if (!cand.includes('AND p_link.import_run_id = p_run_id')) return false
        if (cand.includes('v_linked.import_run_id IS NOT NULL')) return false
        if (/EXISTS \(SELECT 1 FROM public\.exercise_catalog_import_runs r2/.test(cand)) return false
        if (!cand.includes("IS DISTINCT FROM 'timed'") ||
          !cand.includes("<> 'lower_back:tertiary,obliques:secondary'") ||
          !cand.includes('malformed Plank catalog snapshot (expected timed tracking and the approved anatomy multiset); delivery fails closed')) return false
        const deliver = fnText(cand, 'deliver_catalog_exercises(p_run_key TEXT)')
        const sites = Array.from(deliver.matchAll(/exlib_plank_link_valid\(v_uid, v_linked/g))
        if (sites.length !== 2) return false
        if (!sites.every((m) => deliver.slice(Math.max(0, (m.index ?? 0) - 500), m.index).includes('FOR UPDATE;'))) return false
        const hStart = cand.indexOf('CREATE OR REPLACE FUNCTION exlib_plank_link_valid')
        const helper = cand.slice(hStart, cand.indexOf('$helper$;', hStart) + '$helper$;'.length)
        const hLock = helper.indexOf('PERFORM 1 FROM public.exercise_muscles m')
        const hRead = helper.indexOf('INTO v_row_anat FROM public.exercise_muscles m')
        if (!(hLock > 0 && hRead > hLock && helper.slice(hLock, hRead).includes('ORDER BY m.id\n  FOR UPDATE;'))) return false
        const seedLock = deliver.indexOf('WHERE e.user_id = v_uid AND e.id = v_claim_exercise')
        const p2Lock = deliver.indexOf('PERFORM 1 FROM public.exercise_muscles m', seedLock)
        const p2Read = deliver.indexOf('INTO v_row_anat FROM public.exercise_muscles m', seedLock)
        if (!(seedLock > 0 && p2Lock > seedLock && p2Read > p2Lock)) return false
        if (!cand.includes('WHERE id = v_seed.id AND user_id = v_uid;')) return false
        const rollback = fnText(cand, 'rollback_catalog_delivery(p_run_key TEXT)')
        if ((rollback.match(/NOT EXISTS \(SELECT 1 FROM public\.exercise_catalog_corrections cc/g) ?? []).length !== 3) return false
        if (!rollback.includes('SET is_active = false') || /DELETE FROM public\.exercises/.test(rollback)) return false
        return !/UPDATE public\.exercises SET[\s\S]{0,200}?name\s*=/.test(cand)
      })())
    check('B4: report compatibility and generic behavior unchanged — 023 returns exactly its 13 keys, the candidate returns the same 13 in order plus plank_disposition ONLY, and 023\'s generic insert block plus raced-duplicate disposition are byte-present',
      (() => {
        const EXPECTED = ['run_key', 'eligible', 'inserted', 'skipped_already_delivered',
          'skipped_name_collision', 'collision_names', 'alias_inserted',
          'alias_added_to_existing', 'alias_already_delivered', 'alias_skipped_no_exercise',
          'alias_skipped_inactive_exercise', 'alias_skipped_collision', 'inserted_catalog_logical_ids']
        const d023 = fnText(m023, 'deliver_catalog_exercises(p_run_key TEXT)')
        const dCand = fnText(cand, 'deliver_catalog_exercises(p_run_key TEXT)')
        if (JSON.stringify(returnKeys(d023)) !== JSON.stringify(EXPECTED)) return false
        if (JSON.stringify(returnKeys(dCand)) !== JSON.stringify([...EXPECTED, 'plank_disposition'])) return false
        const insStart = d023.indexOf('    BEGIN\n      INSERT INTO public.exercises (')
        const genericInsert = d023.slice(insStart, d023.indexOf('    END;', insStart) + '    END;'.length)
        if (!cand.includes(genericInsert)) return false
        const genStart = dCand.indexOf('-- Concurrent duplicate delivery: already delivered.')
        return genStart > 0 && dCand.slice(genStart, genStart + 400).includes('v_skipped_existing := v_skipped_existing + 1;')
      })())
  }

  console.log('\nC. Product boundary and applied-state posture')
  {
    check('C1: no product change — the seed module is byte-identical to the promoted EXLIB-2E tip, the ledger stays 48/48 pending-null, all 26 legacy candidates stay import-ineligible, and all 126 authored records stay pending/evidence-null/import-false/unpublished',
      (() => {
        const seedNow = readFileSync('src/lib/supabase/seed-exercises.ts')
        const seedTip = execSync(`git show ${EXLIB2E_TIP}:src/lib/supabase/seed-exercises.ts`, { encoding: 'buffer' as any }) as unknown as Buffer
        if (!seedNow.equals(seedTip)) return false
        const led = parseJsonl('docs/exlib1b1-review-ledger.jsonl')
        if (led.length !== 48 || !led.every((r: any) => r.status === 'pending' && r.reviewer === null)) return false
        const cands = parseJsonl('docs/exlib1c0a-equipment-resolution.jsonl').flatMap((r: any) => r.canonical_candidates)
        if (cands.length !== 26 || !cands.every((c: any) => c.import_eligible === false)) return false
        const recs: any[] = []
        for (let i = 1; i <= 6; i += 1) recs.push(...parseJsonl(`docs/exlib2c-release1-batch0${i}-content.jsonl`))
        if (recs.length !== 126 || !recs.every((r) =>
          r.content_review.status === 'pending' && r.content_review.reviewer === null &&
          r.import_eligible === false && !Object.keys(r).some((k) => k.includes('publication')))) return false
        if (execSync("grep -rl 'weight_time' src/ || true", { encoding: 'utf8' }).trim() !== '') return false
        return !existsSync('scripts/exlib1c-import.ts') && !existsSync('src/lib/catalog-import.ts')
      })())
    check('C2: prepared but NOT claimed as applied — the candidate header and the apply-prep record both carry the NOT-APPLIED posture, no application record exists for 026, and the record states hosted application remains Joseph/ChatGPT-only',
      (() => {
        if (!cand.slice(0, 2200).includes('NOT APPLIED')) return false
        if (readdirSync('docs').some((f) => f.includes('exlib2f') && f.includes('application-record'))) return false
        return recFlat.includes('NOT APPLIED') &&
          recFlat.includes('Joseph/ChatGPT') &&
          recFlat.includes('applies NOTHING') &&
          recFlat.includes('Database A: migrations 001-025 + the reviewed docs proposal') &&
          recFlat.includes('Database B: migrations 001-026 only') &&
          recFlat.includes('never additionally sources the docs proposal')
      })())
  }

  console.log('\nD. Historical-verifier lifecycle')
  {
    check('D1: every retarget is narrow, labeled, and anchored — each of the 39 revised verifiers carries an explicit EXLIB-2F label, the EXLIB-2E verifier anchors its historical claims to the promoted tip (whose tree really holds exactly 25 migrations, no 026, and the docs proposal), the EXLIB-2E live suite still applies exactly 001-025 plus ONLY the docs proposal behind a candidate-drift gate, and the 1C0B3 live suite still applies exactly 001-025',
      (() => {
        for (const f of RETARGETED) {
          if (!read(f).includes('RETARGET (EXLIB-2F')) return false
        }
        const e2 = read('scripts/verify-exlib2e.ts')
        if (!e2.includes(`const EXLIB2E_TIP = '${EXLIB2E_TIP}'`)) return false
        if (!e2.includes('git ls-tree ${EXLIB2E_TIP} supabase/migrations/')) return false
        const tipFiles = execSync(`git ls-tree ${EXLIB2E_TIP} supabase/migrations/ --name-only`, { encoding: 'utf8' })
          .split('\n').filter((p) => p.endsWith('.sql'))
        if (tipFiles.length !== 25 || tipFiles.some((p) => p.includes('026'))) return false
        try { execSync(`git cat-file -e ${EXLIB2E_TIP}:${PROPOSAL}`, { stdio: 'pipe' }) } catch { return false }
        const e2live = read('scripts/verify-exlib2e-live.sh')
        if (!e2live.includes("case \"$f\" in supabase/migrations/02[6-9]_*) continue;; esac")) return false
        if (!e2live.includes('026 candidate executable SQL drifted from the reviewed docs proposal')) return false
        if (!e2live.includes('-f "$PROPOSAL"')) return false
        const b3live = read('scripts/verify-exlib1c0b3-live.sh')
        if ((b3live.match(/02\[6-9\]_\*\) continue/g) ?? []).length !== 2) return false
        // the 2F live suite is the ONLY suite applying the candidate, and
        // it never sources the docs proposal into its main database
        const f2live = read(LIVE)
        if (!f2live.includes('the docs proposal is never sourced')) return false
        return f2live.includes('[ "$APPLIED" = "26" ]')
      })())
    check('G1: lifecycle-safe phase boundary — the phase inventory is exactly the four new artifacts plus the 39 labeled retargets (43 paths); strict porcelain match while uncommitted, adder-anchored single-commit range once committed',
      (() => {
        try {
          const inHead = (() => {
            try { execSync(`git cat-file -e HEAD:${CANDIDATE}`, { stdio: 'pipe' }); return true } catch { return false }
          })()
          if (!inHead) {
            const entries = execSync('git status --porcelain', { encoding: 'utf8' })
              .split('\n').filter(Boolean).map((l) => l.trim()).sort()
            const expected = [...PHASE_NEW.map((f) => `?? ${f}`), ...RETARGETED.map((f) => `M ${f}`)].sort()
            if (JSON.stringify(entries) !== JSON.stringify(expected)) return false
            return execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim() === ''
          }
          const adders = new Set<string>()
          for (const p of PHASE_NEW) {
            const a = execSync(`git log --all --format=%H --diff-filter=A -- ${p}`,
              { encoding: 'utf8' }).split('\n').filter(Boolean)
            if (a.length !== 1) return false
            adders.add(a[0])
          }
          if (adders.size !== 1) return false
          const phase = Array.from(adders)[0]
          execSync(`git merge-base --is-ancestor ${phase} HEAD`)
          execSync(`git merge-base --is-ancestor ${EXLIB2E_TIP} ${phase}`)
          const range = execSync(`git diff --name-only ${EXLIB2E_TIP}..${phase}`, { encoding: 'utf8' })
            .split('\n').filter(Boolean).sort()
          return JSON.stringify(range) === JSON.stringify(PHASE_ALL)
        } catch { return false }
      })())
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
