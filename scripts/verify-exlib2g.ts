// EXLIB-2G verifier — Plank content authoring and
// coordinated-activation design (LOCAL-ONLY; adjudicated resequencing
// after the fail-closed stop of the original seed-edit attempt).
//
// Proves: the exact source commit/tag and frozen EXLIB-2F evidence;
// the seed Plank UNCHANGED (bodyweight, old anatomy, byte-identical
// module); seed_link_compatible still false with the inventory
// byte-frozen; no runtime delivery wiring and no migration 027; the
// adjudication record carrying every accepted and rejected option,
// the discovered facts, the milestone order, and a staged-rollout
// state machine that covers rolling deployments, old clients,
// fail-closed behavior, and rollback; exactly ONE new Plank content
// record with the authoritative identity, timed mode, derived
// mobility type, and the exact two-entry anatomy, conforming to the
// promoted schema, R-rules, and style standard, still
// pending/evidence-null/import-ineligible/unpublished; the corpus,
// ledger, and eligibility artifacts untouched; the operator backup
// timestamp recorded as recovery evidence only; and the exact
// three-path phase inventory. Performs NO hosted contact.
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
// RETARGET (EXLIB-2N review-decision application): the Dead bug
// (batch02 line 12) and Ab wheel rollout (batch04 line 5) records
// were pending through the promoted EXLIB-2N tip; the approved human
// decisions are applied to exactly those two records after it. This
// suite's byte-frozen claims for those two files are anchored to that
// exact promoted tip, where they were true; every other file remains
// a live claim.
const TIP_2N_RETARGET = 'c9c1afd7df35f2870430da3a8d1295ff7e48e11d'
const readAt2N = (p: string): Buffer =>
  execSync(`git cat-file blob ${TIP_2N_RETARGET}:${p}`, { maxBuffer: 1 << 26 })
const sha256At2N = (p: string): string =>
  createHash('sha256').update(readAt2N(p)).digest('hex')
const parseJsonlAt2N = (p: string): any[] => readAt2N(p).toString('utf8').split('\n')
  .filter((l) => l.trim() && !l.trim().startsWith('#')).map((l) => JSON.parse(l))
const norm = (s: string): string => s.trim().toLowerCase()

const RECORD = 'docs/exlib2g-plank-content-activation-design.md'
const CONTENT = 'docs/exlib2g-plank-content.jsonl'
const VERIFIER = 'scripts/verify-exlib2g.ts'
const SOURCE_TIP = 'f17757a633ac9e06a244ff71cbcb3120096adb64'
const PHASE_NEW = [RECORD, CONTENT, VERIFIER].sort()

const rec = read(RECORD)
const recFlat = rec.replace(/\s+/g, ' ')
const inv = parseJsonl('docs/exlib2b-release1-inventory.jsonl')
const corpus: any[] = []
// RETARGET (EXLIB-2N review-decision application): corpus batches 2
// and 4 anchored to the promoted 2N tip (pending there); the other
// four remain live claims.
for (let i = 1; i <= 6; i += 1) {
  const parse = (i === 2 || i === 4) ? parseJsonlAt2N : parseJsonl
  corpus.push(...parse(`docs/exlib2c-release1-batch0${i}-content.jsonl`))
}
const plankRecs = existsSync(CONTENT) ? parseJsonl(CONTENT) : []
const p = plankRecs[0] ?? {}
const proseOf = (r: any): string => [
  ...(r.setup_steps ?? []), ...(r.execution_steps ?? []), ...(r.common_mistakes ?? []),
  r.breathing_cue ?? '', r.safety_guidance ?? '', r.equipment_setup ?? '',
  r.accessibility_alternative ?? ''].join(' ')

async function main(): Promise<void> {
  console.log('EXLIB-2G verification (Plank content + activation design; adjudicated resequencing)')

  console.log('\nA. Source posture and standing boundaries')
  {
    check('A1: exact source — the application-evidence tag object peels to the source tip (an ancestor of HEAD), migration 026 and the EXLIB-2F evidence stay byte-frozen, and every protected fingerprint holds',
      (() => {
        try {
          if (execSync('git rev-parse exlib2f-migration-026-application-evidence-stable^{}',
            { encoding: 'utf8' }).trim() !== SOURCE_TIP) return false
          execSync(`git merge-base --is-ancestor ${SOURCE_TIP} HEAD`, { stdio: 'pipe' })
        } catch { return false }
        return sha256('supabase/migrations/026_exlib_plank_seed_reconciliation.sql') === '620185b62c589c55fb30a237589589f46002a9d6c391b9ab936e07a6641cf4bc' &&
          sha256('docs/exlib2f-migration-026-application-record.md') === 'dc6e6188f013eb02ad2028339d0515ea180ab1016b119eb15ee523db83358b2a' &&
          // RETARGET (EXLIB-2M migration-027 apply-prep): the 2F application
          // verifier was narrowly retargeted for the prepared 027 (its
          // migration-inventory boundary extended to exactly-27); the pin
          // follows those exact retargeted bytes.
          // RETARGET (EXLIB-2N review-decision application), second order:
          // that same 2F application verifier carries batch02/04 members of
          // the 126-record pending sweep, so applying the two approved human
          // decisions forced its own labeled retarget and changed its bytes.
          // The pin is anchored to the promoted 2N tip, where these exact
          // bytes were the canonical ones; the assertion is unchanged in
          // strength (still an exact full-file SHA-256 over a named commit).
          sha256At2N('scripts/verify-exlib2f-application.ts') === '20d5b2e3cb897c29b624e8156528f1af9f5ab4f51fcda5c5f4774e74573db1dd' &&
          sha256('docs/exlib2e-migration-026-proposal.sql') === 'a6696066d178ced7e53bf81e7106cce64a87e2c73d9b342464d930a2fe3c2108' &&
          sha256('docs/exlib2d-plank-seed-reconciliation-record.md') === '3ea2aa1d279bfd7a099e2b33fe4dfdba565dbde5c37e780c338673684e9baf7c' &&
          sha256('docs/exlib2c-release1-batch01-content.jsonl') === '8168fc196f89781e8a30b315f29d1c72f46afeff8edfe89d1812b0a150ece2b2' &&
          sha256At2N('docs/exlib2c-release1-batch02-content.jsonl') === '1ddc3ab0bd92d60ef33960d82a8e0c8a2fdea1cb828d15fc9bf6a82c34305d48' &&
          sha256('docs/exlib2c-release1-batch03-content.jsonl') === 'e4fca8b632c9c9af9b7c6eece660f2042b6a4c3ef613e14c278f95cf9fcab528' &&
          sha256At2N('docs/exlib2c-release1-batch04-content.jsonl') === 'e7def375e9b9560863796bff90746dc6ff2b2f7c4bd7735a3d53fc2cc9750568' &&
          sha256('docs/exlib2c-release1-batch05-content.jsonl') === '404722f1211e45c3b89ac8a32cceb617b958388c034b797dd2bba009aa127e5d' &&
          sha256('docs/exlib2c-release1-batch06-content.jsonl') === 'ec0760be401bb1d4c479d340369d6b6b690acf57f2f7a0f7fbeeaa2cf40ab5d7' &&
          sha256('docs/exlib2b-release1-inventory.jsonl') === 'd349110f22700a822eb427fc1dcce3e6dbcfd264b6d48ed84936b07b1ca256f5' &&
          sha256('docs/exlib2c-authoring-schema.json') === 'dddb872c7725c591e6d056e0dc73167d3c822f6245ebd2c759a045fecbd43c6e' &&
          sha256('docs/exlib1b1-review-ledger.jsonl') === 'aa4fe77c0c633510661eede94b40e9bae4aca90a7d8c2794abde92c83c6f7b7b'
      })())
    check('A2: the current seed Plank is UNCHANGED — the seed module is byte-identical to the source tip, and the Plank entry still reads tracking_mode bodyweight with anatomy exactly {(obliques, secondary)}',
      (() => {
        const seedNow = readFileSync('src/lib/supabase/seed-exercises.ts')
        const seedTip = execSync(`git show ${SOURCE_TIP}:src/lib/supabase/seed-exercises.ts`, { encoding: 'buffer' as any }) as unknown as Buffer
        if (!seedNow.equals(seedTip)) return false
        const seed = seedNow.toString('utf8')
        const line = seed.split('\n').findIndex((l) => l.includes('name: "Plank"'))
        if (line < 0) return false
        const block = seed.split('\n').slice(line, line + 2).join('\n')
        return block.includes('tracking_mode: "bodyweight"') &&
          block.includes('muscle_targets: [{ muscle: "obliques", role: "secondary" }]') &&
          !block.includes('lower_back') && !block.includes('"timed"')
      })())
    check('A3: seed_link_compatible remains FALSE in the authoritative inventory, which is byte-frozen (so no other inventory identity changed either)',
      (() => {
        const plank = inv.filter((r: any) => r.proposed_canonical_name === 'Plank')
        if (plank.length !== 1 || plank[0].seed_link_compatible !== false) return false
        return sha256('docs/exlib2b-release1-inventory.jsonl') === 'd349110f22700a822eb427fc1dcce3e6dbcfd264b6d48ed84936b07b1ca256f5'
      })())
    check('A4: no runtime delivery wiring (zero src references to deliver_catalog_exercises), and the seeding call sites are unchanged — RETARGET (EXLIB-2M migration-027 apply-prep): the no-migration-027/exactly-26 inventory is anchored to the promoted EXLIB-2G tip (b9af2a4), where it was true; EXLIB-2M later prepares (never applies) 027',
      (() => {
        if (execSync("grep -rln 'deliver_catalog_exercises' src/ || true", { encoding: 'utf8' }).trim() !== '') return false
        const TIP_2G = 'b9af2a40607c23ee57c04cdbdb9581b01a4f4f9a'
        const files = execSync(`git ls-tree ${TIP_2G} supabase/migrations/ --name-only`, { encoding: 'utf8' })
          .split('\n').filter((f) => f.endsWith('.sql'))
        if (files.length !== 26 || files.some((f) => f.includes('/027'))) return false
        const callers = execSync("grep -rln 'seedExercisesIfNeeded' src/ || true", { encoding: 'utf8' })
          .split('\n').filter(Boolean).sort()
        return JSON.stringify(callers) === JSON.stringify([
          'src/app/(app)/workouts/exercises/page.tsx', 'src/app/(app)/workouts/page.tsx',
          'src/app/api/exercises/route.ts', 'src/lib/supabase/seed-exercises.ts'])
      })())
    check('A5: the adjudication record carries every accepted and rejected option verbatim, the discovered facts, and the adjudicated milestone order A-F',
      recFlat.includes('REJECT the early Plank seed edit') &&
      recFlat.includes('REJECT flipping seed_link_compatible now') &&
      recFlat.includes('REJECT amending migration 026 or creating migration 027') &&
      recFlat.includes('REJECT accepting the P5/two-Plank outcome') &&
      recFlat.includes('Preserve the current bodyweight pristine seed until the final coordinated delivery-activation release') &&
      recFlat.includes('Reorder the work so Plank content and activation architecture are prepared before any seed/runtime/hosted mutation') &&
      recFlat.includes('tracking_mode = bodyweight; anatomy = {(obliques, secondary)}') &&
      recFlat.includes('tracking_mode = timed') &&
      recFlat.includes('derived exercise_type = mobility') &&
      recFlat.includes('{(obliques, secondary), (lower_back, tertiary)}') &&
      recFlat.includes('INTENTIONALLY recognizes only the OLD pristine bodyweight seed shape') &&
      recFlat.includes('unlinked timed seed rows') &&
      recFlat.includes('seed_link_compatible cannot truthfully become true in that state') &&
      // REVISED (EXLIB-2G activation review): D/E now carry the
      // corrected non-deliverable-staging and activation-event wording.
      ['A. Plank instructional content', 'B. Catalog snapshot/loading package',
        'C. Runtime delivery activation designed',
        'D. Hosted catalog loading may occur only in a database state the delivery function REJECTS',
        'E. Final coordinated activation', 'F. Delivery to users remains a separate explicit operator gate']
        .every((s) => recFlat.includes(s)))
  }

  console.log('\nB. The authored Plank content record')
  {
    check('B1: exactly ONE new Plank content record exists, in the new EXLIB-2G artifact — never inserted into any byte-frozen historical batch (batch fingerprints proven in A1)',
      plankRecs.length === 1 && p.proposed_canonical_name === 'Plank' &&
      existsSync(CONTENT))
    check('B2: authoritative identity exact — timed tracking (with the repository deriving mobility from timed), primary abs, anatomy EXACTLY {(obliques, secondary), (lower_back, tertiary)} with no other muscle or role, and every metadata field equal to the authoritative inventory identity',
      (() => {
        if (p.tracking_mode !== 'timed') return false
        // the repository derivation: deriveLegacyExerciseType('timed') === 'mobility'
        if (!read('src/lib/exercise-validation.ts').includes("case 'timed': return 'mobility'")) return false
        const anat = (p.muscle_targets ?? []).map((m: any) => `${m.muscle}:${m.role}`).sort().join(',')
        if (anat !== 'lower_back:tertiary,obliques:secondary') return false
        if ((p.muscle_targets ?? []).length !== 2) return false
        const invPlank = inv.find((r: any) => r.proposed_canonical_name === 'Plank')
        return p.primary_muscle === 'abs' && invPlank.primary_muscle === 'abs' &&
          p.equipment === invPlank.equipment && p.tracking_mode === invPlank.tracking_mode &&
          p.laterality === invPlank.laterality && p.movement_pattern === invPlank.movement_pattern &&
          p.training_role === invPlank.training_role && p.difficulty === invPlank.difficulty &&
          p.availability === invPlank.availability && invPlank.exercise_type_derived === 'mobility'
      })())
    check('B3: REVISED (RETARGET (EXLIB-2I human review decision)) — the AS-AUTHORED review state is anchored to the promoted EXLIB-2G tip (b9af2a4), where the record was pending with null evidence; the LIVE record still holds every standing lock (review_status proposed, import_eligible false, no source fields, no publication key), and the live decided state is owned by scripts/verify-exlib2i.ts',
      (() => {
        const p2g = JSON.parse(execSync('git show b9af2a40607c23ee57c04cdbdb9581b01a4f4f9a:docs/exlib2g-plank-content.jsonl', { encoding: 'utf8' })
          .split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'))[0])
        if (!(p2g.content_review.status === 'pending' && p2g.content_review.reviewer === null &&
          p2g.content_review.reviewed_at === null && p2g.content_review.rationale === null)) return false
        // RETARGET (EXLIB-2J R6 eligibility admission): the ineligible
        // lock was last live-true at the promoted EXLIB-2I tip; the live
        // eligibility state is owned by scripts/verify-exlib2j.ts.
        const pDec = JSON.parse(execSync('git show 73231e928748c7499172c28445a1958b13eace12:docs/exlib2g-plank-content.jsonl', { encoding: 'utf8' })
          .split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'))[0])
        if (pDec.import_eligible !== false) return false
        return p.review_status === 'proposed' &&
          p.deferred === false && p.deferred_reason === null &&
          p.provenance === 'forgefitos_original' &&
          !('source_url' in p) && !('source_page' in p) && !('retrieved_at' in p) &&
          !Object.keys(p).some((k) => k.includes('publication'))
      })())
    check('B4: schema, R-rule, and style conformance — exact required-field set, step/length bounds, normalized-unique non-colliding aliases, R3-resolvable relationship targets that avoid deferred identities, no self-reference, no medical/attribution language, stop language present, the breath rule, timed hold/duration language with no rep or per-side phrasing, no sentence copied from the promoted corpus, ASCII-only',
      (() => {
        const schema = JSON.parse(read('docs/exlib2c-authoring-schema.json'))
        const req: string[] = schema.required
        if (JSON.stringify(Object.keys(p).sort()) !== JSON.stringify([...req].sort())) return false
        const steps: string[] = [...p.setup_steps, ...p.execution_steps, ...p.common_mistakes]
        if (!steps.every((s) => s.length >= 10 && s.length <= 240 && s.trim())) return false
        if (p.setup_steps.length < 1 || p.setup_steps.length > 5) return false
        if (p.execution_steps.length < 2 || p.execution_steps.length > 6) return false
        if (p.common_mistakes.length < 1 || p.common_mistakes.length > 4) return false
        if (p.breathing_cue.length < 10 || p.breathing_cue.length > 240) return false
        if (p.safety_guidance.length < 10 || p.safety_guidance.length > 400) return false
        const corpusNorm = new Set(inv.map((r: any) => r.normalized_name))
        const aliasSeen = new Set<string>()
        for (const r of corpus) for (const a of r.aliases) aliasSeen.add(norm(a))
        for (const a of p.aliases) {
          if (corpusNorm.has(norm(a)) || aliasSeen.has(norm(a)) || norm(a) === 'plank') return false
        }
        if (new Set(p.aliases.map(norm)).size !== p.aliases.length) return false
        const deferredNames = new Set(inv.filter((r: any) => r.deferred === true).map((r: any) => r.normalized_name))
        for (const f of ['substitutions', 'regressions', 'progressions'] as const) {
          for (const t of p[f]) {
            if (!corpusNorm.has(norm(t)) || norm(t) === 'plank' || deferredNames.has(norm(t))) return false
          }
        }
        const text = proseOf(p)
        if (/\b(diagnos\w*|treat(s|ed|ment)?\b|rehabilitat\w*|prescri\w*|cure\w*|therap\w*|pain-free|guarantee\w*)/i.test(text)) return false
        if (/(according to|adapted from|source:|courtesy|credit(ed)? to|strengthlog)/i.test(text)) return false
        if (/hold your breath/i.test(text) && !/never/i.test(text)) return false
        const safety = (p.safety_guidance + ' ' + p.common_mistakes.join(' ')).toLowerCase()
        if (!/(stop|come out of|end(ing)? the (session|hold))/.test(safety)) return false
        if (!/hold/i.test(text) || !/duration/i.test(text)) return false
        if (/\brep(s|etition)?\b/i.test(text)) return false
        if (/per[- ]side|each side|one side at a time/i.test(text)) return false
        const seen = new Set<string>()
        for (const r of corpus) {
          for (const s of [...r.setup_steps, ...r.execution_steps, ...r.common_mistakes, r.breathing_cue, r.safety_guidance]) seen.add(s.trim())
        }
        for (const s of [...p.setup_steps, ...p.execution_steps, ...p.common_mistakes, p.breathing_cue, p.safety_guidance]) {
          if (seen.has(s.trim())) return false
        }
        return read(CONTENT).split('').every((c) => c.charCodeAt(0) < 128)
      })())
    check('B5: nothing else moved — all 126 promoted records stay pending/evidence-null/import-false/unpublished (batch bytes frozen in A1), the ledger stays 48/48 pending-null, all 26 legacy candidates stay import-ineligible, zero weight_time in src, and no importer or backup artifact was added',
      (() => {
        if (corpus.length !== 126 || !corpus.every((r) =>
          r.content_review.status === 'pending' && r.content_review.reviewer === null &&
          r.import_eligible === false && !Object.keys(r).some((k) => k.includes('publication')))) return false
        const led = parseJsonl('docs/exlib1b1-review-ledger.jsonl')
        if (led.length !== 48 || !led.every((r: any) => r.status === 'pending' && r.reviewer === null)) return false
        const cands = parseJsonl('docs/exlib1c0a-equipment-resolution.jsonl').flatMap((r: any) => r.canonical_candidates)
        if (cands.length !== 26 || !cands.every((c: any) => c.import_eligible === false)) return false
        if (execSync("grep -rl 'weight_time' src/ || true", { encoding: 'utf8' }).trim() !== '') return false
        if (existsSync('scripts/exlib1c-import.ts') || existsSync('src/lib/catalog-import.ts')) return false
        return !readdirSync('docs').some((f) => /\.(dump|backup|sql\.gz)$/.test(f))
      })())
  }

  console.log('\nC. Activation design and evidence posture')
  {
    check('C1: REVISED (EXLIB-2G activation review) — the corrected state machine is complete: canonical 7-step order, states S0-S7 with the protected activation event and post-S7 fail-closed rule, staged rollout behind an OFF flag with the seed still bodyweight, rolling-deployment and old-client analysis, two-regime rollback with mixed-fleet analysis, explicitly rejected invalid orderings, and NO claim of cross-system atomicity',
      ['S0 CURRENT', 'S1 CONTENT-READY', 'S2 LOAD-PACKAGE-READY', 'S3 RUNTIME-DEPLOYED-GATE-OFF',
        'S4 HOSTED-STAGED-NON-DELIVERABLE', 'S5 PROTECTED-ACTIVATION', 'S6 DELIVERY-ENABLED',
        'S7 FUTURE-SEED', 'POST-S7 FAIL-CLOSED RULE', 'The safe order (canonical):',
        'INVALID ORDERINGS', 'rolling deployment', 'Old-client analysis', 'MIXED-FLEET ANALYSIS',
        'No cross-system atomicity between Git, Vercel, and Supabase is', 'exlib_revoke_run_delivery']
        .every((s) => rec.includes(s)) &&
      recFlat.includes('safe only if every client changes instantaneously is invalid') &&
      recFlat.includes('the seed-flip event, formerly S4c'))
    check('C2: the operator backup timestamp 2026-09-01 13:09:47 UTC is recorded ONLY as operator recovery evidence — explicitly not repository-generated and never downloaded into the repository — and the record states no hosted contact occurred in this milestone',
      rec.includes('2026-09-01 13:09:47 UTC') &&
      recFlat.includes('NOT repository-generated') &&
      recFlat.includes('never downloaded into or fingerprinted by this repository') &&
      recFlat.includes('no hosted contact, no catalog snapshot/run/approval/seal/load/publication/delivery'))
    check('C3: ADMISSION (EXLIB-2G activation review) — the corrected design enforces: no sealed-but-inactive claim; runtime flags do not protect the authenticated RPC; the pre-activation hosted posture is rejected by the delivery predicate; approving/sealing an ELIGIBLE UNSEALED run is the protected activation event (revocation is permanent - a revoked run is never reactivated; a new decision requires a NEW run); no direct-RPC exposure window is accepted; post-S7 delivery failure fails closed with no timed fallback seeding; pre-S7 and post-S7 rollback are distinct regimes; post-S7 rollback restores the bodyweight seed plus seed_link_compatible=false fleet-wide BEFORE legacy seeding returns; mixed-fleet rollback is analyzed; and the accepted Plank content record is byte-identical',
      (() => {
        if (/sealed[- ]but[- ]inactive/i.test(recFlat.replace('No claim of "sealed-but-inactive" appears anywhere in this design', ''))) return false
        if (!recFlat.includes('An application runtime flag CANNOT protect the database')) return false
        if (!recFlat.includes('approved_for_delivery = true AND dry_run = false AND sealed_at IS NOT NULL AND revoked_at IS NULL')) return false
        // REVISED (EXLIB-2G transition precision): the staged posture is
        // the promotable one - dry_run false, unapproved, unsealed,
        // unrevoked, evidence populated, members review-audited.
        if (!recFlat.includes('dry_run = false, approved_for_delivery = false, sealed_at = NULL, revoked_at = NULL')) return false
        if (!recFlat.includes('structurally NON-DELIVERABLE (the predicate still requires approved_for_delivery = true and a non-null sealed_at)')) return false
        if (!recFlat.includes('approval/sealing is NEVER staging: it is the protected delivery-activation event itself')) return false
        if (!recFlat.includes('no authenticated direct-RPC exposure window is accepted')) return false
        if (!recFlat.includes('MUST FAIL CLOSED for zero-exercise users')) return false
        if (!recFlat.includes('CANNOT call seedExercisesIfNeeded while the timed seed definition is live')) return false
        if (!recFlat.includes('temporary inability to initialize exercises is safer than creating an unlinked timed Plank')) return false
        if (!recFlat.includes('Turning the application flag OFF after S7 does NOT restore S0')) return false
        if (!recFlat.includes('BEFORE S7 (seed still bodyweight)')) return false
        if (!recFlat.includes('AFTER S7 (timed seed live)')) return false
        if (!recFlat.includes('revert the seed definition to bodyweight AND move seed_link_compatible back to false in the same reviewed repository state')) return false
        if (!recFlat.includes('deploy that revert across the ENTIRE server fleet and verify fleet completion plus the restored old seed fingerprint')) return false
        if (!recFlat.includes('only then may delivery be disabled and bodyweight legacy seeding re-enabled')) return false
        if (!recFlat.includes('revoke FIRST - initialization then fails closed for new users until steps (1)-(2) complete')) return false
        if (!recFlat.includes('NO instance bare-seeds during the mixed window')) return false
        // RETARGET (EXLIB-2I human review decision): the accepted content
        // bytes are anchored to the promoted EXLIB-2G tip; the live record
        // later gained ONLY the human review decision (verify-exlib2i.ts).
        const buf = execSync('git show b9af2a40607c23ee57c04cdbdb9581b01a4f4f9a:docs/exlib2g-plank-content.jsonl', { encoding: 'buffer' as any }) as unknown as Buffer
        if (buf.length !== 2729) return false
        return createHash('sha256').update(buf).digest('hex') === 'a8cb6a5ed54bfa20f296d0624ccd29b20936f1f5b1c48ae201c4c44c2914a30a'
      })())
    check('C4: ADMISSION (EXLIB-2G transition precision) — proven from the migration-023 bytes: exlib_approve_and_seal_run() sets ONLY approved_for_delivery=true and sealed_at=NOW() (it never touches dry_run or approval evidence); the freeze trigger raises the dry-run sealing rejection and demands complete evidence plus fully review-audited members; the selected staged posture (dry_run=false, unapproved, unsealed, unrevoked, evidence populated) is rejected by the delivery predicate yet DIRECTLY promotable, and the approve/seal transition is recorded as the exact moment direct authenticated RPC becomes deliverable; the accepted content record stays byte-identical and the post-S7/rollback rules remain intact',
      (() => {
        const m023 = read('supabase/migrations/023_exlib_catalog_and_delivery_contract.sql')
        const fnStart = m023.indexOf('CREATE OR REPLACE FUNCTION exlib_approve_and_seal_run')
        const fnBody = m023.slice(fnStart, m023.indexOf('$$;', fnStart) + 3)
        // 1-2: the ONLY mutation is the two-field UPDATE; dry_run and evidence untouched
        if (!fnBody.includes('SET approved_for_delivery = true,\n      sealed_at             = NOW()')) return false
        if ((fnBody.match(/UPDATE public\.exercise_catalog_import_runs/g) ?? []).length !== 1) return false
        if (fnBody.includes('dry_run')) return false
        if (/SET[\s\S]{0,200}(product_approved|legal_approved|approval_rationale)/.test(fnBody)) return false
        // 3: the trigger's dry-run sealing rejection + evidence + member-audit demands
        if (!m023.includes("'exercise_catalog_import_runs: dry runs cannot be sealed'")) return false
        if (!m023.includes('sealing requires complete, non-blank product + legal approval evidence')) return false
        if (!m023.includes('are not approved, active, and fully review-audited')) return false
        if (!m023.includes('an empty membership cannot be sealed')) return false
        // pre-seal writability of staging fields (unsealed regime restricts only the seal/approval/revocation trio)
        if (!m023.includes('runs are born unsealed, unapproved, and unrevoked')) return false
        // 4-5: the record's selected posture
        if (!recFlat.includes('dry_run = false, approved_for_delivery = false, sealed_at = NULL, revoked_at = NULL')) return false
        if (!recFlat.includes('membership fully loaded and fully review-audited')) return false
        if (!recFlat.includes('product/legal approval evidence populated')) return false
        if (!recFlat.includes('writable while the run is unapproved and unsealed')) return false
        // 6: predicate rejection of the staged posture
        if (!recFlat.includes('structurally NON-DELIVERABLE (the predicate still requires approved_for_delivery = true and a non-null sealed_at)')) return false
        // 7: prerequisites recorded verbatim
        if (!recFlat.includes('requires complete non-blank product + legal approval evidence')) return false
        if (!recFlat.includes('not approved, active, and fully review-audited')) return false
        // 8: legality + the exact deliverable moment + the preparation transition + no false claims about the function
        if (!recFlat.includes('DIRECTLY promotable by one call to exlib_approve_and_seal_run()')) return false
        if (!recFlat.includes('it does NOT change dry_run and does NOT populate approval evidence')) return false
        if (!recFlat.includes('the exact moment authenticated direct RPC becomes deliverable')) return false
        if (!recFlat.includes('(1) while still unapproved and unsealed, set dry_run = false and populate the required approval evidence')) return false
        if (!recFlat.includes('sets ONLY approved_for_delivery = true and sealed_at = NOW()')) return false
        // REVISED (EXLIB-2G lifecycle wording): revocation permanence,
        // proven from the 023 bytes plus a design-wide verb scan.
        if (!m023.includes("'exercise_catalog_import_runs: revocation is one-way and permanent'")) return false
        if (!m023.includes('-- revoked_at is ONE-WAY: NULL -> non-null on a sealed run, never')) return false
        const rvStart = m023.indexOf('CREATE OR REPLACE FUNCTION exlib_revoke_run_delivery')
        const rvBody = m023.slice(rvStart, m023.indexOf('$$;', rvStart) + 3)
        // idempotent for an already-revoked run: reports, never re-updates
        if (!rvBody.includes("'already_revoked', true")) return false
        if (!rvBody.includes('IF v_run.revoked_at IS NOT NULL THEN')) return false
        if ((rvBody.match(/UPDATE public\.exercise_catalog_import_runs/g) ?? []).length !== 1) return false
        if (!rvBody.includes('SET revoked_at = NOW()')) return false
        // the design never claims a run can be unrevoked or reactivated:
        // no unrevoke-verb form and no reactivation claim outside the
        // explicit prohibition sentences; the adjective "unrevoked" is
        // valid only as the predicate state revoked_at IS NULL.
        if (/unrevok(?:ing|e\b)/.test(rec)) return false
        if (/\breactivat/i.test(recFlat.replace(/can NEVER be reactivated or unrevoked/g, ''))) return false
        if (!recFlat.includes('the approval/seal transition of an ELIGIBLE UNSEALED run is the activation event')) return false
        if (!recFlat.includes('Revocation is PERMANENT: migration 023 makes revoked_at one-way and never clearable')) return false
        if (!recFlat.includes('idempotent for an already-revoked run and reports the original revocation')) return false
        if (!recFlat.includes('any later delivery decision requires a NEW run')) return false
        if (!recFlat.includes('means only the predicate state revoked_at IS NULL, never a transition')) return false
        // 9: accepted content byte-identical
        // RETARGET (EXLIB-2I human review decision): anchored to the
        // promoted EXLIB-2G tip (see C3's note).
        const buf = execSync('git show b9af2a40607c23ee57c04cdbdb9581b01a4f4f9a:docs/exlib2g-plank-content.jsonl', { encoding: 'buffer' as any }) as unknown as Buffer
        if (buf.length !== 2729 ||
          createHash('sha256').update(buf).digest('hex') !== 'a8cb6a5ed54bfa20f296d0624ccd29b20936f1f5b1c48ae201c4c44c2914a30a') return false
        // 10: previously corrected post-S7 + rollback rules intact
        return recFlat.includes('MUST FAIL CLOSED for zero-exercise users') &&
          recFlat.includes('CANNOT call seedExercisesIfNeeded while the timed seed definition is live') &&
          recFlat.includes('AFTER S7 (timed seed live)') &&
          recFlat.includes('NO instance bare-seeds during the mixed window')
      })())
    check('G1: lifecycle-safe phase boundary — exactly the three new artifacts (design record, content record, this verifier); strict porcelain while uncommitted, adder-anchored single-commit range once committed; no historical verifier needed a retarget this phase (the corpus files the battery reads are all byte-frozen and untouched)',
      (() => {
        try {
          const inHead = (() => {
            try { execSync(`git cat-file -e HEAD:${CONTENT}`, { stdio: 'pipe' }); return true } catch { return false }
          })()
          if (!inHead) {
            const entries = execSync('git status --porcelain', { encoding: 'utf8' })
              .split('\n').filter(Boolean).map((l) => l.trim()).sort()
            const expected = PHASE_NEW.map((f) => `?? ${f}`).sort()
            if (JSON.stringify(entries) !== JSON.stringify(expected)) return false
            return execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim() === ''
          }
          const adders = new Set<string>()
          for (const pth of PHASE_NEW) {
            const a = execSync(`git log --all --format=%H --diff-filter=A -- "${pth}"`,
              { encoding: 'utf8' }).split('\n').filter(Boolean)
            if (a.length !== 1) return false
            adders.add(a[0])
          }
          if (adders.size !== 1) return false
          const phase = Array.from(adders)[0]
          execSync(`git merge-base --is-ancestor ${phase} HEAD`)
          execSync(`git merge-base --is-ancestor ${SOURCE_TIP} ${phase}`)
          const range = execSync(`git diff --name-only ${SOURCE_TIP}..${phase}`, { encoding: 'utf8' })
            .split('\n').filter(Boolean).sort()
          return JSON.stringify(range) === JSON.stringify(PHASE_NEW)
        } catch { return false }
      })())
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
