# EXLIB-1C0 — Legal/Product Approval Packet (decision preparation only)

**THIS PACKET APPROVES NOTHING.** It prepares the decision. Approval
must be affirmative, dated, attributable, and scoped — **silence is
not approval**, a recommendation is not approval, and the packet's
existence authorizes no import, no ledger approval, and no EXLIB-1C
implementation.

**This is not legal advice and cannot substitute for qualified
counsel.** Claude is not a lawyer; nothing below speculates about
what the law conclusively permits. Where a question requires legal
judgment, it is routed to the counsel handoff section.

## 1. What is being decided — TWO INDEPENDENT GATES

Whether the StrengthLog-derived FACTUAL manifest
(`docs/exlib1a-discovery-manifest.jsonl`, 395 records, SHA-256
`336cd4253f747cdb3ba73ffa2af5a63e255c7c87cc452d4c43ed59a654673dfa`)
may be used as the source for ForgeFitOS's INTERNAL catalog-import
process (the applied migration 023/024 machinery), and under what
conditions.

This decision has TWO independently required gates, and BOTH must
close before any internal catalog loading or production delivery:

- **Gate L1 — qualified counsel determination.** A determination by
  qualified legal counsel: affirmative, dated, attributable, and
  scoped to the exact manifest fingerprint above and the exact
  approved fields (section 4). Joseph CANNOT supply this gate; a
  product-owner choice is not a legal determination.
- **Gate L2 — Joseph's separate product decision.** Made only AFTER
  reviewing counsel's result, choosing a product outcome within
  whatever counsel's determination permits.

Neither gate substitutes for the other; each must be independently
recorded.

### Terms-of-Service evidence gap (fail-closed)

The source site's applicable Terms of Service were NOT collected or
characterized during discovery, and this packet deliberately does
not research or characterize them. This is an EVIDENCE GAP for Gate
L1: counsel must be provided the applicable terms, or an explicit
dated record that they could not be established, before the
counsel determination can close. This requirement is a fail-closed
gate in the review guide's gate matrix.

## 2. Authoritative repository inputs (mechanical inventory)

| Input | Path | Role |
|---|---|---|
| Discovery notes | docs/exlib1a-exercise-library-discovery-notes.md | provenance record: page URL, retrieval date 2026-08-20, HTTP 200, response-byte SHA, normalization rules, licensing/access boundary |
| Manifest (395) | docs/exlib1a-discovery-manifest.jsonl | the compiled factual dataset under decision |
| Human-review queue | docs/exlib1a-human-review-queue.md | the 48 human_review_required records |
| Architecture notes | docs/exlib1b1-architecture-and-review-notes.md | approved Option A+ contract, migration 023/024 records, application history |
| Review ledger (48) | docs/exlib1b1-review-ledger.jsonl | AUTHORITATIVE pending review state — unchanged by this packet |
| Migration 023 (applied) | supabase/migrations/023_exlib_catalog_and_delivery_contract.sql | catalog/delivery machinery, sha 0991448c..., history 20260824135804 |
| Migration 024 (applied) | supabase/migrations/024_exlib_post_application_hardening.sql | hardening, sha 190550ec..., history 20260824174252 |
| Hardening audit | docs/exlib1b3-post-application-hardening-audit.md | applied-state records; catalog content counts 0/0/0/0 |
| Closeout/roadmap | docs/ui-overhaul-closeout.md | backlog context only |

Category separation (deliberately not collapsed):

- **A. Source facts:** exercise names, directory category placement,
  per-exercise URLs, the directory page URL, and the retrieval date.
  Nothing else was collected.
- **B. ForgeFitOS-generated classifications and recommendations:**
  proposed names, anatomy/equipment/laterality/tracking mappings,
  confidence and eligibility labels, dedup dispositions, and the
  EXLIB-1C0 per-record recommendations
  (docs/exlib1c0-human-review-proposals.jsonl). These are OUR
  judgments layered on the facts, not source content.
- **C. Already-approved architecture:** Option A+ catalog/delivery
  contract; migrations 023 Revision H and 024 (both reviewed,
  fingerprint-approved, applied, and recorded). Architecture
  approval says nothing about content rights.
- **D. Still-unapproved decisions:** the dataset-level legal/product
  outcome (this packet), all 48 ledger resolutions, the anatomy
  vocabulary questions, tracking/laterality product calls, the final
  content manifest, and any Supabase loading authorization.

## 3. Boundary statements (binding on any approval)

1. `robots.txt` addresses CRAWLER ACCESS ONLY. It does not grant
   copyright, database-right, contractual, trademark, endorsement,
   redistribution, or commercial-use rights of any kind.
2. Only exercise names, category placement, and source URLs were
   collected. No source descriptions, instructions, cues, images, or
   videos were collected, and none may EVER be copied.
3. StrengthLog does not endorse ForgeFitOS, and nothing may imply it
   does.
4. The manifest is currently an INTERNAL research/review artifact —
   "not for external redistribution" (EXLIB-1A boundary).
5. Repository presence and technical readiness (applied migrations,
   green harnesses) do NOT authorize production import.
6. Even where individual exercise names may be generic facts, the
   COMPILED dataset — its selection, arrangement, and the
   provenance method used to gather it — still requires an explicit
   product/legal determination. That determination is exactly what
   this packet requests; it is not assumed here.

## 4. What an approval must identify, exactly

An approval that does not answer ALL of the following is incomplete
and does not open the EXLIB-1C gate:

1. **Source-fact fields** approved for use (names / category
   placement / URLs / retrieval date — which of these, exactly).
2. **Normalization** approved (the exlib1a-norm-v1 rules; the
   lower(text) namespace rule).
3. **Provenance retention** — whether per-record source URLs and the
   retrieval date are stored in the production catalog
   (`source_url`, `source_page`, `retrieved_at` are NOT NULL in the
   applied schema; rejecting provenance retention therefore requires
   a schema decision, not silence).
4. **Internal catalog use** — populating the closed, client-invisible
   catalog tables.
5. **Production delivery** — delivering per-user copies to real
   users via the sealed-run machinery.
6. **Redistribution or public display, if any** — the current
   boundary is NONE; any change must be explicit.
7. **Attribution requirements, if any** — whether the product or
   documentation must attribute StrengthLog, and in what form.
8. **Prohibited content** — reaffirming that descriptions,
   instructions, cues, images, and videos remain prohibited.

Form of approval: affirmative, dated, attributable (named person or
reviewer identity), and scoped to a manifest fingerprint. The
sealed-run machinery then enforces that scope mechanically.

## 5. Decision table (no outcome is chosen here)

The counsel handoff (Gate L1) is ALWAYS executed first — it is not
one selectable outcome among others, and choosing any row below can
never supply the legal determination. The table describes Joseph's
PRODUCT decision (Gate L2), available only within whatever counsel's
determination permits:

| # | Product outcome (Gate L2, AFTER Gate L1 closes) | Consequence if chosen |
|---|---|---|
| 1 | Approved as proposed | 48-record resolution proceeds; EXLIB-1C gates continue |
| 2 | Approved with attribution/provenance conditions | conditions become gate items; product surfaces and docs updated before import |
| 3 | Approved only after independent factual re-verification from non-StrengthLog sources | a re-verification phase precedes any import; the manifest fingerprint changes and re-enters review |
| 4 | Approved only for internal research, not production | catalog stays empty; EXLIB-1C production import remains blocked indefinitely |
| 5 | Rejected | manifest remains an archived research artifact; EXLIB-1C is closed |
| 6 | Blocked pending further counsel input | the counsel handoff is re-executed with the open questions; Gate L2 stays open |

## 6. Legal review versus product-owner decision

- **Gate L1 — qualified legal counsel (never Joseph, never
  ChatGPT-as-reviewer, never Claude):** the compiled dataset
  determination (section 3 item 6); redistribution/public display;
  attribution obligations; trademark/nominative use of the
  "StrengthLog" name in provenance fields; database/collection
  rights in the source directory; the Terms-of-Service evidence gap
  (section 1).
- **Gate L2 — product-owner decision (Joseph), only after Gate L1
  closes:** whether to import at all;
  which fields; normalization; vocabulary changes (neck/tibialis);
  tracking-mode and laterality handling; naming/collision outcomes;
  equipment assignments where none could be inferred; delivery and
  rollout policy.
- **Qualified strength-and-conditioning reviewer:** the contested
  anatomy mappings (see the review guide's batches).

## 7. Counsel handoff — exact factual questions for a qualified attorney

1. May ForgeFitOS use a compilation of exercise NAMES, directory
   CATEGORY placements, and per-exercise URLS, gathered from a
   public directory page (single retrieval, 2026-08-20, standard
   crawler access), to seed an internal product database?
2. Does storing the source URL and retrieval date per record
   (internal provenance, not displayed to end users) create any
   obligation or risk that omitting them would not?
3. If the catalog is later used to deliver per-user copies of the
   NAMES ONLY (no source prose, media, or instructions) inside a
   commercial product, does that change the analysis?
4. Is any attribution to the source site required, advisable, or
   inadvisable (implied-endorsement risk) for internal use and for
   production delivery respectively?
5. Does the source site's terms-of-service or any database right in
   its directory arrangement restrict this use, given that only
   facts (names, placements, URLs) were taken?
6. Are there jurisdictional considerations (user base location,
   operator location) that change any answer above?

The attorney should be given: the discovery notes (provenance
record), the manifest, this packet, the EXLIB-1A licensing boundary
text, AND the source site's applicable Terms of Service — or, if
they cannot be established, an explicit dated record of that fact
(the section-1 evidence gap). Nothing in this packet predicts
counsel's answers.

## 8. Zero-approval confirmation

As of this packet: BOTH dataset gates (L1 counsel, L2 product) are
UNMADE and OPEN; all 48 ledger
records remain pending with null reviewer fields; all 48 proposals
are `unapproved` with `import_eligible: false`; catalog content
tables remain 0/0/0/0; no migration 025 exists; no EXLIB-1C
implementation exists. The gate matrix in
`docs/exlib1c0-human-review-guide.md` defines what must close before
EXLIB-1C implementation may start.
