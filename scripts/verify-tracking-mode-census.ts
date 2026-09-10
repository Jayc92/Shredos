// ============================================================
// ForgeFitOS — tracking-mode CENSUS + GUARD
// (W1 of docs/weight-time-coordinated-implementation-plan.md:
//  §3.1 "the exhaustive switch is not the worklist", §12.4 "guard
//  before repair", §16 W1.)
//
// WHAT IT DOES
//   Enumerates, mechanically, every place under src/ where code
//   branches on a tracking-mode literal
//     'weight_reps' | 'bodyweight' | 'cardio' | 'timed' | 'weight_time'
//   — switch case labels, equality comparisons, Record<TrackingMode,…>
//   keys, mode lists/sets, union-type members, options lists,
//   includes()/has() membership tests — and groups them into DECISION
//   SITES. For every site it demands an EXPLICIT decision about the
//   fifth mode. A site is OK when either
//     * it handles 'weight_time' itself (a literal arm / key / member), or
//     * it carries, on its own line(s) directly above the site, the marker
//         // tracking-mode-census: allowlist — <rationale>
//       or
//         // tracking-mode-census: exempt — <rationale>
//       declaring that it needs no fifth arm and WHY (for example a
//       positive allowlist that excludes unlisted modes by construction).
//   A site with neither is MISSING. Exit 1 if any site is MISSING.
//
// WHY IT EXISTS
//   Widening the TrackingMode union breaks the build in exactly ONE
//   place (deriveLegacyExerciseType's exhaustive switch). Every other
//   consumer keeps compiling and fails silently or at runtime. The type
//   system will not find this work, so this script's output IS the
//   worklist.
//
// EXPECTED-PENDING PIN (drift detection)
//   EXPECTED_PENDING_SITES is the number of sites the committed tree is
//   KNOWN to leave pending. The script exits 0 only when the measured
//   pending count equals the pin; fewer OR more exits 1 as DRIFT, so an
//   accidental new branch site, or a site resolved without updating the
//   pin, is caught at once. Every W-step commit that changes sites
//   updates the pin in the same commit. Pin history: after W3 = 57;
//   after W4 = 47 (the seed module's inline union is deliberately left
//   PENDING — 22 evidence suites pin that module blob-identical; see
//   verify-weight-time-w4-vocabulary.ts A3).
//
// CLASSIFICATION (printed per site)
//   HANDLES_WEIGHT_TIME                 — an explicit 'weight_time' arm/key/member
//   EXCLUDES_WEIGHT_TIME_INTENTIONALLY  — a marker whose executable semantics
//                                         exclude unlisted modes by construction
//   PENDING                             — no decision yet (counted against the pin)
//
// WHAT IT DOES NOT DO
//   It never edits anything and never contacts any service. It does not
//   judge whether a site's logic is correct — only whether the fifth
//   mode was decided explicitly rather than by fallthrough.
//
// DISAMBIGUATION
//   'weight_reps', 'timed' and 'weight_time' occur only in the
//   tracking-mode vocabulary. 'bodyweight' and 'cardio' are ALSO
//   exercise_type values ('strength' | 'bodyweight' | 'cardio' |
//   'mobility'). Each ambiguous literal is classified by the TypeScript
//   type checker (the type of its comparison partner, switch
//   discriminant, containing collection, or contextual type). When the
//   type is any/string, the partner expression's NAME decides
//   (/tracking_?mode/i => mode, /exercise_?type|\btype\b/i => exercise
//   type). A union, list, or key set that ALSO carries values from
//   neither vocabulary (e.g. 'barbell', 'compound', 'measurements') is
//   some OTHER vocabulary — equipment, category, weigh-in kind — that
//   merely reuses the word, and is excluded. Anything still unresolved
//   is treated as a mode literal (fail closed) and flagged. Excluded
//   literals are printed so nothing is silently dropped.
//
//   Options lists ([{ value: 'timed', label }, ...]) are recognised only
//   through a property named value/key/id, so seed DATA rows that carry
//   `tracking_mode: 'weight_reps'` are listed as non-branch values, not
//   decision sites — adding a mode does not require touching seed rows.
//
// SELF-TEST (oracle check, runs first)
//   The classifier runs against a synthetic fixture whose every line is
//   tagged with its expected verdict. If any verdict is wrong the script
//   exits 2 WITHOUT printing a census — a broken oracle must not produce
//   a worklist.
//
// Run from the repository root:
//   npx tsx scripts/verify-tracking-mode-census.ts
//   npx tsx scripts/verify-tracking-mode-census.ts --json
// Exit codes: 0 = pending count equals EXPECTED_PENDING_SITES (0 when the
//                 work is complete); 1 = DRIFT from the pin, in either
//                 direction; 2 = self-test or setup failure.
// ============================================================

import ts from 'typescript'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { execSync } from 'node:child_process'

// ── Vocabulary ─────────────────────────────────────────────────────────

const MODE_VOCABULARY: ReadonlySet<string> = new Set(['weight_reps', 'bodyweight', 'cardio', 'timed', 'weight_time'])
/** Strings that exist ONLY in the tracking-mode vocabulary. */
const UNAMBIGUOUS_MODE_LITERALS: ReadonlySet<string> = new Set(['weight_reps', 'timed', 'weight_time'])
/** Strings that exist ONLY in the exercise_type vocabulary. */
const EXERCISE_TYPE_ONLY_LITERALS: ReadonlySet<string> = new Set(['strength', 'mobility'])
const EXERCISE_TYPE_VOCABULARY: ReadonlySet<string> = new Set(['strength', 'bodyweight', 'cardio', 'mobility'])
/** Property names through which an options list carries its machine value. */
const OPTION_VALUE_PROPERTY_NAMES: ReadonlySet<string> = new Set(['value', 'key', 'id'])
const NEW_MODE_LITERAL = 'weight_time'
/**
 * Sites the committed tree is KNOWN to leave pending. Updated in the same
 * commit as any change to decision sites. History: W3 = 57, W4 = 47.
 */
const EXPECTED_PENDING_SITES = 47
const MARKER_PATTERN = /tracking-mode-census:\s*(allowlist|exempt)\s*(?:—|–|-)+\s*(\S[^\n]*)/

// ── Result types ───────────────────────────────────────────────────────

/** 'other' = a third vocabulary (equipment, category, weigh-in kind, …) that reuses the word. */
type LiteralKind = 'mode' | 'exercise_type' | 'other' | 'unresolved'
const EXCLUDED_KINDS: ReadonlySet<LiteralKind> = new Set<LiteralKind>(['exercise_type', 'other'])
type LiteralContext =
  | 'case-label' | 'equality' | 'object-key' | 'type-map-key' | 'mode-list'
  | 'options-list' | 'type-union' | 'membership' | 'value'
type SiteVerdict = 'OK' | 'MISSING'
type SiteClassification = 'HANDLES_WEIGHT_TIME' | 'EXCLUDES_WEIGHT_TIME_INTENTIONALLY' | 'PENDING'

interface LiteralOccurrence {
  file: string
  line: number
  column: number
  text: string
  context: LiteralContext
  kind: LiteralKind
  basis: string
  /** Set for branch contexts only; value literals have no site. */
  siteKey?: string
}

interface DecisionSite {
  key: string
  file: string
  line: number
  shape: string
  literals: string[]
  contexts: string[]
  verdict: SiteVerdict
  classification: SiteClassification
  satisfiedBy: 'arm' | 'marker' | 'none'
  markerRationale?: string
}

interface CensusResult {
  literals: LiteralOccurrence[]
  sites: DecisionSite[]
}

// ── Small AST helpers ──────────────────────────────────────────────────

const BRANCH_CONTEXTS: ReadonlySet<LiteralContext> = new Set<LiteralContext>([
  'case-label', 'equality', 'object-key', 'type-map-key', 'mode-list', 'options-list', 'type-union', 'membership',
])

function isStatementLike(node: ts.Node): boolean {
  switch (node.kind) {
    case ts.SyntaxKind.VariableStatement:
    case ts.SyntaxKind.ExpressionStatement:
    case ts.SyntaxKind.ReturnStatement:
    case ts.SyntaxKind.IfStatement:
    case ts.SyntaxKind.SwitchStatement:
    case ts.SyntaxKind.ForStatement:
    case ts.SyntaxKind.ForOfStatement:
    case ts.SyntaxKind.ForInStatement:
    case ts.SyntaxKind.WhileStatement:
    case ts.SyntaxKind.DoStatement:
    case ts.SyntaxKind.ThrowStatement:
    case ts.SyntaxKind.TryStatement:
    case ts.SyntaxKind.FunctionDeclaration:
    case ts.SyntaxKind.ClassDeclaration:
    case ts.SyntaxKind.TypeAliasDeclaration:
    case ts.SyntaxKind.InterfaceDeclaration:
    case ts.SyntaxKind.EnumDeclaration:
    case ts.SyntaxKind.ExportAssignment:
    case ts.SyntaxKind.ExportDeclaration:
    case ts.SyntaxKind.ImportDeclaration:
    case ts.SyntaxKind.ModuleDeclaration:
    case ts.SyntaxKind.LabeledStatement:
    case ts.SyntaxKind.SourceFile:
      return true
    default:
      return false
  }
}

function nearestStatementLike(node: ts.Node): ts.Node {
  let current: ts.Node = node
  while (current.parent && !isStatementLike(current)) current = current.parent
  return current
}

function isEqualityOperator(kind: ts.SyntaxKind): boolean {
  return kind === ts.SyntaxKind.EqualsEqualsEqualsToken
    || kind === ts.SyntaxKind.ExclamationEqualsEqualsToken
    || kind === ts.SyntaxKind.EqualsEqualsToken
    || kind === ts.SyntaxKind.ExclamationEqualsToken
}

/** All string-literal values reachable through a (possibly union) type. */
function literalValuesOfType(type: ts.Type | undefined): Set<string> {
  const values = new Set<string>()
  if (!type) return values
  const seen = new Set<ts.Type>()
  const visit = (candidate: ts.Type): void => {
    if (seen.has(candidate)) return
    seen.add(candidate)
    if (candidate.isUnion()) { candidate.types.forEach(visit); return }
    if (candidate.isStringLiteral()) values.add(candidate.value)
  }
  visit(type)
  return values
}

function kindFromLiteralValues(values: Iterable<string>): LiteralKind {
  const observed = Array.from(new Set(values))
  if (Array.from(UNAMBIGUOUS_MODE_LITERALS).some((value) => observed.includes(value))) return 'mode'
  if (Array.from(EXERCISE_TYPE_ONLY_LITERALS).some((value) => observed.includes(value))) return 'exercise_type'
  // Values from NEITHER vocabulary mean this is some other vocabulary that reuses 'bodyweight'/'cardio'.
  if (observed.some((value) => !MODE_VOCABULARY.has(value) && !EXERCISE_TYPE_VOCABULARY.has(value))) return 'other'
  return 'unresolved'
}

function kindFromType(type: ts.Type | undefined): LiteralKind {
  return kindFromLiteralValues(literalValuesOfType(type))
}

function kindFromName(expressionText: string): LiteralKind {
  if (/tracking_?mode/i.test(expressionText)) return 'mode'
  if (/exercise_?type|\btype\b/i.test(expressionText)) return 'exercise_type'
  return 'unresolved'
}

function safeContextualType(checker: ts.TypeChecker, node: ts.Expression): ts.Type | undefined {
  try { return checker.getContextualType(node) } catch { return undefined }
}

function safeTypeAt(checker: ts.TypeChecker, node: ts.Node): ts.Type | undefined {
  try { return checker.getTypeAtLocation(node) } catch { return undefined }
}

/** Element type of a Set<T>/Array<T>/ReadonlyArray<T>-like collection type. */
function elementTypeOfCollection(checker: ts.TypeChecker, collectionType: ts.Type | undefined): ts.Type | undefined {
  if (!collectionType) return undefined
  try {
    const numberIndexType = checker.getIndexTypeOfType(collectionType, ts.IndexKind.Number)
    if (numberIndexType) return numberIndexType
    const isReference = (collectionType.flags & ts.TypeFlags.Object) !== 0
      && ((collectionType as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference) !== 0
    if (isReference) {
      const typeArguments = checker.getTypeArguments(collectionType as ts.TypeReference)
      if (typeArguments.length > 0) return typeArguments[0]
    }
  } catch { /* fall through */ }
  return undefined
}

/** Property names of an object type, e.g. the keys of Record<TrackingMode, X>. */
function propertyNamesOfType(checker: ts.TypeChecker, type: ts.Type | undefined): string[] {
  if (!type) return []
  try { return checker.getPropertiesOfType(type).map((symbol) => symbol.getName()) } catch { return [] }
}

function propertyNameText(name: ts.PropertyName | undefined): string | undefined {
  if (!name) return undefined
  if (ts.isIdentifier(name) || ts.isStringLiteralLike(name)) return name.text
  return undefined
}

/**
 * For a literal used as an object-literal property VALUE under a property
 * named value/key/id, the enclosing options list if at least one sibling
 * option carries a string value through the same property.
 */
function optionsListContaining(literal: ts.Node): { arrayLiteral: ts.ArrayLiteralExpression; propertyName: string } | undefined {
  const propertyAssignment = literal.parent
  if (!propertyAssignment || !ts.isPropertyAssignment(propertyAssignment) || propertyAssignment.initializer !== literal) return undefined
  const propertyName = propertyNameText(propertyAssignment.name)
  if (!propertyName || !OPTION_VALUE_PROPERTY_NAMES.has(propertyName)) return undefined
  const objectLiteral = propertyAssignment.parent
  if (!ts.isObjectLiteralExpression(objectLiteral)) return undefined
  const arrayLiteral = objectLiteral.parent
  if (!ts.isArrayLiteralExpression(arrayLiteral)) return undefined
  const siblingCarriesValue = arrayLiteral.elements.some((element) =>
    element !== objectLiteral && ts.isObjectLiteralExpression(element) && element.properties.some((property) =>
      ts.isPropertyAssignment(property) && propertyNameText(property.name) === propertyName && ts.isStringLiteralLike(property.initializer)))
  return siblingCarriesValue ? { arrayLiteral, propertyName } : undefined
}

/** Every string value carried by the option-value property across an options list. */
function optionValuesInArray(arrayLiteral: ts.ArrayLiteralExpression, propertyName: string): string[] {
  const values: string[] = []
  for (const element of arrayLiteral.elements) {
    if (!ts.isObjectLiteralExpression(element)) continue
    for (const property of element.properties) {
      if (ts.isPropertyAssignment(property) && propertyNameText(property.name) === propertyName && ts.isStringLiteralLike(property.initializer)) {
        values.push(property.initializer.text)
      }
    }
  }
  return values
}

/** Every string-literal element of a plain list (['a', 'b'] / as const / new Set([...])). */
function stringElementsOfArray(arrayLiteral: ts.ArrayLiteralExpression): string[] {
  const values: string[] = []
  for (const element of arrayLiteral.elements) if (ts.isStringLiteralLike(element)) values.push(element.text)
  return values
}

// ── Classification of one occurrence ───────────────────────────────────

interface Classification {
  context: LiteralContext
  kind: LiteralKind
  basis: string
  /** The node the decision site is derived from (differs from the literal for keys). */
  anchor: ts.Node
}

function classifyLiteral(literal: ts.StringLiteralLike, checker: ts.TypeChecker): Classification {
  const text = literal.text
  const parent = literal.parent
  const unambiguous = UNAMBIGUOUS_MODE_LITERALS.has(text)
  const decide = (typeKind: LiteralKind, nameSource: string | undefined, typeBasis: string): { kind: LiteralKind; basis: string } => {
    if (unambiguous) return { kind: 'mode', basis: 'literal is tracking-mode-only' }
    if (typeKind !== 'unresolved') return { kind: typeKind, basis: typeBasis }
    if (nameSource !== undefined) {
      const byName = kindFromName(nameSource)
      if (byName !== 'unresolved') return { kind: byName, basis: `name heuristic on "${nameSource.slice(0, 60)}"` }
    }
    return { kind: 'unresolved', basis: 'no type or name evidence (fail closed: treated as mode)' }
  }

  // 1. switch (...) { case 'x': }
  if (ts.isCaseClause(parent) && parent.expression === literal) {
    const switchStatement = parent.parent.parent as ts.SwitchStatement
    const discriminant = switchStatement.expression
    const { kind, basis } = decide(kindFromType(safeTypeAt(checker, discriminant)), discriminant.getText(), 'type of switch discriminant')
    return { context: 'case-label', kind, basis, anchor: switchStatement }
  }

  // 2. a === 'x'  /  a !== 'x'  /  'x' in obj
  if (ts.isBinaryExpression(parent)) {
    if (isEqualityOperator(parent.operatorToken.kind)) {
      const partner = parent.left === literal ? parent.right : parent.left
      const { kind, basis } = decide(kindFromType(safeTypeAt(checker, partner)), partner.getText(), 'type of comparison partner')
      return { context: 'equality', kind, basis, anchor: parent }
    }
    if (parent.operatorToken.kind === ts.SyntaxKind.InKeyword && parent.left === literal) {
      const objectType = safeTypeAt(checker, parent.right)
      const { kind, basis } = decide(kindFromLiteralValues(propertyNamesOfType(checker, objectType)), parent.right.getText(), 'property names of `in` target')
      return { context: 'membership', kind, basis, anchor: parent }
    }
  }

  // 3. Quoted object key: { 'x': ... }
  if (ts.isPropertyAssignment(parent) && parent.name === literal && ts.isObjectLiteralExpression(parent.parent)) {
    return classifyObjectKey(text, parent.parent, checker, decide)
  }

  // 4. Quoted type-map key: { 'x': T }
  if (ts.isPropertySignature(parent) && parent.name === literal && ts.isTypeLiteralNode(parent.parent)) {
    return classifyTypeMapKey(text, parent.parent, decide)
  }

  // 5. Type position: 'x' inside a union / alias / annotation
  if (ts.isLiteralTypeNode(parent)) {
    const union = ts.isUnionTypeNode(parent.parent) ? parent.parent : undefined
    const siblingValues: string[] = []
    if (union) {
      for (const member of union.types) {
        if (ts.isLiteralTypeNode(member) && ts.isStringLiteralLike(member.literal)) siblingValues.push(member.literal.text)
      }
    } else {
      siblingValues.push(text)
    }
    let owner: ts.Node = parent
    while (owner.parent && !ts.isTypeAliasDeclaration(owner) && !ts.isParameter(owner) && !ts.isPropertySignature(owner)
      && !ts.isPropertyDeclaration(owner) && !ts.isVariableDeclaration(owner) && !ts.isTypeParameterDeclaration(owner)
      && !ts.isInterfaceDeclaration(owner) && !isStatementLike(owner)) {
      owner = owner.parent
    }
    const ownerName = ts.isTypeAliasDeclaration(owner) || ts.isParameter(owner) || ts.isPropertySignature(owner)
      || ts.isPropertyDeclaration(owner) || ts.isVariableDeclaration(owner)
      ? owner.name.getText() : undefined
    const { kind, basis } = decide(kindFromLiteralValues(siblingValues), ownerName, 'sibling members of the union type')
    return { context: 'type-union', kind, basis, anchor: owner }
  }

  // 6. Array element: ['x', ...]  (mode list, as-const vocabulary, new Set([...]))
  if (ts.isArrayLiteralExpression(parent)) {
    let kindByCollection = kindFromLiteralValues(stringElementsOfArray(parent))
    if (kindByCollection === 'unresolved') kindByCollection = kindFromType(elementTypeOfCollection(checker, safeContextualType(checker, parent)))
    const { kind, basis } = decide(kindByCollection, nearestStatementLike(parent).getText().slice(0, 80), 'sibling elements / contextual element type')
    return { context: 'mode-list', kind, basis, anchor: parent }
  }

  // 7. Options list: [{ value: 'x', label }, ...]
  const optionsList = optionsListContaining(literal)
  if (optionsList) {
    const optionValues = optionValuesInArray(optionsList.arrayLiteral, optionsList.propertyName)
    const { kind, basis } = decide(kindFromLiteralValues(optionValues), nearestStatementLike(optionsList.arrayLiteral).getText().slice(0, 80), `sibling "${optionsList.propertyName}" option values`)
    return { context: 'options-list', kind, basis, anchor: optionsList.arrayLiteral }
  }

  // 8. Membership call: set.has('x')  /  list.includes('x')
  if (ts.isCallExpression(parent) && parent.arguments.includes(literal as ts.Expression)
    && ts.isPropertyAccessExpression(parent.expression)
    && (parent.expression.name.text === 'has' || parent.expression.name.text === 'includes')) {
    const collection = parent.expression.expression
    const { kind, basis } = decide(kindFromType(elementTypeOfCollection(checker, safeTypeAt(checker, collection))), collection.getText(), 'element type of the collection')
    return { context: 'membership', kind, basis, anchor: parent }
  }

  // 9. Anything else is a VALUE (default, argument, JSX attribute, return value): listed, not guarded.
  const contextual = safeContextualType(checker, literal)
  let nameSource: string | undefined
  if (ts.isPropertyAssignment(parent)) nameSource = parent.name.getText()
  else if (ts.isVariableDeclaration(parent)) nameSource = parent.name.getText()
  else if (ts.isJsxAttribute(parent)) nameSource = parent.name.getText()
  const { kind, basis } = decide(kindFromType(contextual), nameSource, 'contextual type of the value')
  return { context: 'value', kind, basis, anchor: literal }
}

function classifyObjectKey(
  keyText: string,
  objectLiteral: ts.ObjectLiteralExpression,
  checker: ts.TypeChecker,
  decide: (typeKind: LiteralKind, nameSource: string | undefined, typeBasis: string) => { kind: LiteralKind; basis: string },
): Classification {
  const siblingKeys: string[] = []
  for (const property of objectLiteral.properties) {
    if ((ts.isPropertyAssignment(property) || ts.isShorthandPropertyAssignment(property) || ts.isMethodDeclaration(property)) && property.name) {
      if (ts.isIdentifier(property.name) || ts.isStringLiteralLike(property.name)) siblingKeys.push(property.name.text)
    }
  }
  const contextualKeys = propertyNamesOfType(checker, safeContextualType(checker, objectLiteral))
  let kindByShape = kindFromLiteralValues(contextualKeys)
  if (kindByShape === 'unresolved') kindByShape = kindFromLiteralValues(siblingKeys)
  const unambiguous = UNAMBIGUOUS_MODE_LITERALS.has(keyText)
  const { kind, basis } = unambiguous
    ? { kind: 'mode' as LiteralKind, basis: 'literal is tracking-mode-only' }
    : decide(kindByShape, nearestStatementLike(objectLiteral).getText().slice(0, 80), 'contextual Record keys / sibling keys')
  return { context: 'object-key', kind, basis, anchor: objectLiteral }
}

function classifyTypeMapKey(
  keyText: string,
  typeLiteral: ts.TypeLiteralNode,
  decide: (typeKind: LiteralKind, nameSource: string | undefined, typeBasis: string) => { kind: LiteralKind; basis: string },
): Classification {
  const siblingKeys: string[] = []
  for (const member of typeLiteral.members) {
    if (ts.isPropertySignature(member) && member.name && (ts.isIdentifier(member.name) || ts.isStringLiteralLike(member.name))) siblingKeys.push(member.name.text)
  }
  const unambiguous = UNAMBIGUOUS_MODE_LITERALS.has(keyText)
  const { kind, basis } = unambiguous
    ? { kind: 'mode' as LiteralKind, basis: 'literal is tracking-mode-only' }
    : decide(kindFromLiteralValues(siblingKeys), nearestStatementLike(typeLiteral).getText().slice(0, 80), 'sibling type-map keys')
  return { context: 'type-map-key', kind, basis, anchor: nearestStatementLike(typeLiteral) }
}

// ── Decision-site derivation ───────────────────────────────────────────

interface SiteNode { node: ts.Node; shape: string }

function outermostElseIfRoot(ifStatement: ts.IfStatement): ts.IfStatement {
  let root: ts.IfStatement = ifStatement
  while (root.parent && ts.isIfStatement(root.parent) && root.parent.elseStatement === root) root = root.parent
  return root
}

function deriveSite(classification: Classification): SiteNode {
  const { context, anchor } = classification

  if (context === 'case-label') return { node: anchor, shape: 'switch' }
  if (context === 'object-key') return { node: anchor, shape: 'object-literal' }
  if (context === 'type-map-key') return { node: anchor, shape: 'type-map' }
  if (context === 'type-union') {
    if (ts.isTypeAliasDeclaration(anchor)) return { node: anchor, shape: 'type-alias' }
    if (ts.isParameter(anchor)) return { node: anchor, shape: 'parameter-type' }
    if (ts.isPropertySignature(anchor) || ts.isPropertyDeclaration(anchor)) return { node: anchor, shape: 'property-type' }
    if (ts.isVariableDeclaration(anchor)) return { node: anchor, shape: 'variable-type' }
    return { node: nearestStatementLike(anchor), shape: 'type-annotation' }
  }

  // equality / membership / mode-list / options-list: climb toward the statement, noting JSX and if-conditions.
  let current: ts.Node = anchor
  let innermostJsx: ts.Node | undefined
  while (current.parent && !isStatementLike(current)) {
    if (!innermostJsx && (ts.isJsxExpression(current) || ts.isJsxAttribute(current))) innermostJsx = current
    current = current.parent
  }
  const statement = current
  if (innermostJsx) return { node: innermostJsx, shape: 'jsx-expression' }
  if (ts.isIfStatement(statement)) {
    // Only group into the if-chain when the literal sits in a CONDITION, not in a branch body.
    let probe: ts.Node = anchor
    let inCondition = false
    while (probe && probe !== statement) {
      if (ts.isIfStatement(probe.parent) && probe.parent.expression === probe) { inCondition = true; break }
      probe = probe.parent
    }
    if (inCondition) return { node: outermostElseIfRoot(statement), shape: 'if-chain' }
  }
  if (context === 'mode-list') return { node: statement, shape: 'mode-list' }
  if (context === 'options-list') return { node: statement, shape: 'options-list' }
  return { node: statement, shape: shapeOfStatement(statement) }
}

/** Human label for a statement-like site. (ts.SyntaxKind[...] is ambiguous — FirstStatement aliases VariableStatement.) */
function shapeOfStatement(statement: ts.Node): string {
  if (ts.isVariableStatement(statement)) return 'variable'
  if (ts.isReturnStatement(statement)) return 'return'
  if (ts.isExpressionStatement(statement)) return 'expression'
  if (ts.isIfStatement(statement)) return 'if'
  if (ts.isFunctionDeclaration(statement)) return 'function'
  if (ts.isExportAssignment(statement)) return 'export'
  return 'statement'
}

function siteHasNewModeArm(site: ts.Node): boolean {
  let found = false
  const visit = (node: ts.Node): void => {
    if (found) return
    if (ts.isStringLiteralLike(node) && node.text === NEW_MODE_LITERAL) { found = true; return }
    if ((ts.isPropertyAssignment(node) || ts.isPropertySignature(node) || ts.isShorthandPropertyAssignment(node) || ts.isMethodDeclaration(node))
      && node.name && ts.isIdentifier(node.name) && node.name.text === NEW_MODE_LITERAL) { found = true; return }
    ts.forEachChild(node, visit)
  }
  visit(site)
  return found
}

function siteMarker(site: ts.Node, sourceFile: ts.SourceFile): string | undefined {
  // The site's full text includes its leading trivia (comments directly above it) and interior comments.
  const ownText = site.getFullText(sourceFile)
  const ownMatch = MARKER_PATTERN.exec(ownText)
  if (ownMatch) return `${ownMatch[1]} — ${ownMatch[2].trim()}`
  // A marker above the enclosing statement also covers a nested site (e.g. an object literal on the right of `=`).
  const statement = nearestStatementLike(site)
  if (statement !== site) {
    const statementMatch = MARKER_PATTERN.exec(statement.getFullText(sourceFile))
    if (statementMatch) return `${statementMatch[1]} — ${statementMatch[2].trim()}`
  }
  return undefined
}

// ── Census over one source file ────────────────────────────────────────

function censusOfSourceFile(sourceFile: ts.SourceFile, checker: ts.TypeChecker, displayPath: string, into: CensusResult, siteIndex: Map<string, DecisionSite>): void {
  const record = (nameNode: ts.Node, text: string, classification: Classification): void => {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(nameNode.getStart(sourceFile))
    const occurrence: LiteralOccurrence = {
      file: displayPath, line: line + 1, column: character + 1, text,
      context: classification.context, kind: classification.kind, basis: classification.basis,
    }
    // exercise_type / other-vocabulary literals are excluded from sites; unresolved ones are treated as mode (fail closed).
    if (!EXCLUDED_KINDS.has(classification.kind) && BRANCH_CONTEXTS.has(classification.context)) {
      const site = deriveSite(classification)
      const siteLine = sourceFile.getLineAndCharacterOfPosition(site.node.getStart(sourceFile)).line + 1
      const key = `${displayPath}:${site.node.getStart(sourceFile)}`
      occurrence.siteKey = key
      let entry = siteIndex.get(key)
      if (!entry) {
        const marker = siteMarker(site.node, sourceFile)
        const hasArm = siteHasNewModeArm(site.node)
        entry = {
          key, file: displayPath, line: siteLine, shape: site.shape, literals: [], contexts: [],
          verdict: hasArm || marker ? 'OK' : 'MISSING',
          classification: hasArm ? 'HANDLES_WEIGHT_TIME' : marker ? 'EXCLUDES_WEIGHT_TIME_INTENTIONALLY' : 'PENDING',
          satisfiedBy: hasArm ? 'arm' : marker ? 'marker' : 'none',
          markerRationale: marker,
        }
        siteIndex.set(key, entry)
        into.sites.push(entry)
      }
      if (!entry.literals.includes(text)) entry.literals.push(text)
      if (!entry.contexts.includes(classification.context)) entry.contexts.push(classification.context)
    }
    into.literals.push(occurrence)
  }

  const visit = (node: ts.Node): void => {
    if (ts.isStringLiteralLike(node) && MODE_VOCABULARY.has(node.text)) {
      record(node, node.text, classifyLiteral(node, checker))
    } else if ((ts.isPropertyAssignment(node) || ts.isShorthandPropertyAssignment(node) || ts.isMethodDeclaration(node))
      && node.name && ts.isIdentifier(node.name) && MODE_VOCABULARY.has(node.name.text) && ts.isObjectLiteralExpression(node.parent)) {
      // Unquoted Record key: { weight_reps: ... }
      const decide = (typeKind: LiteralKind, nameSource: string | undefined, typeBasis: string) => {
        if (typeKind !== 'unresolved') return { kind: typeKind, basis: typeBasis }
        if (nameSource !== undefined) {
          const byName = kindFromName(nameSource)
          if (byName !== 'unresolved') return { kind: byName, basis: `name heuristic on "${nameSource.slice(0, 60)}"` }
        }
        return { kind: 'unresolved' as LiteralKind, basis: 'no type or name evidence (fail closed: treated as mode)' }
      }
      record(node.name, node.name.text, classifyObjectKey(node.name.text, node.parent, checker, decide))
    } else if (ts.isPropertySignature(node) && node.name && ts.isIdentifier(node.name) && MODE_VOCABULARY.has(node.name.text) && ts.isTypeLiteralNode(node.parent)) {
      // Unquoted type-map key: { weight_reps: T }
      const decide = (typeKind: LiteralKind, nameSource: string | undefined, typeBasis: string) => {
        if (typeKind !== 'unresolved') return { kind: typeKind, basis: typeBasis }
        if (nameSource !== undefined) {
          const byName = kindFromName(nameSource)
          if (byName !== 'unresolved') return { kind: byName, basis: `name heuristic on "${nameSource.slice(0, 60)}"` }
        }
        return { kind: 'unresolved' as LiteralKind, basis: 'no type or name evidence (fail closed: treated as mode)' }
      }
      record(node.name, node.name.text, classifyTypeMapKey(node.name.text, node.parent, decide))
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
}

// ── Self-test fixture (oracle check) ───────────────────────────────────
// Every line carrying a vocabulary literal is tagged with the verdict the
// census MUST produce for it. Untagged lines must produce nothing.

const FIXTURE_LINES: string[] = [
  `type TrackingMode = 'weight_reps' | 'bodyweight' | 'cardio' | 'timed' // EXPECT:MISSING`,
  `type ExerciseType = 'strength' | 'bodyweight' | 'cardio' | 'mobility' // EXPECT:EXCLUDED`,
  `declare const mode: TrackingMode`,
  `declare const ex: { exercise_type: ExerciseType; tracking_mode: TrackingMode }`,
  `declare const anyRow: any`,
  `export function f1() { if (mode === 'cardio' || mode === 'timed') return 0; return 1 } // EXPECT:MISSING`,
  `// tracking-mode-census: allowlist — strength-only; unlisted modes are excluded by construction`,
  `export const f2 = mode === 'weight_reps' || mode === 'bodyweight' // EXPECT:OK`,
  `export function f3() { switch (mode) { case 'weight_reps': return 1; case 'bodyweight': return 2; case 'cardio': return 3; case 'timed': return 4 } } // EXPECT:MISSING`,
  `export function f4(m: TrackingMode | 'weight_time') { switch (m) { case 'weight_reps': return 1; case 'bodyweight': return 2; case 'cardio': return 3; case 'timed': return 4; case 'weight_time': return 5 } } // EXPECT:OK,OK`,
  `export const f5: Record<TrackingMode, number> = { weight_reps: 1, bodyweight: 2, cardio: 3, timed: 4 } // EXPECT:MISSING`,
  `export const f6: TrackingMode = 'weight_reps' // EXPECT:VALUE`,
  `export function f7() { return ex.exercise_type === 'cardio' } // EXPECT:EXCLUDED`,
  `export function f8() { return anyRow.tracking_mode === 'cardio' } // EXPECT:MISSING`,
  `export const f9 = ['weight_reps', 'bodyweight', 'cardio', 'timed'] as const // EXPECT:MISSING`,
  `export const f10 = [{ value: 'weight_reps', label: 'a' }, { value: 'timed', label: 'b' }] // EXPECT:MISSING`,
  `export type LocalMode = 'weight_reps' | 'bodyweight' | 'cardio' | 'timed' // EXPECT:MISSING`,
  `export const f12 = new Set<TrackingMode>(['cardio', 'timed']).has(mode) // EXPECT:MISSING`,
  `// tracking-mode-census: exempt — fixture: marker above the statement must cover the object literal on its right`,
  `export const f13: Record<TrackingMode, string> = { weight_reps: 'a', bodyweight: 'b', cardio: 'c', timed: 'd' } // EXPECT:OK`,
  `export function f14(x: string) { return x === 'cardio' ? 1 : 2 } // EXPECT:UNRESOLVED`,
  `export const f15 = (mode === 'timed') ? <div /> : null // EXPECT:MISSING`,
  `export type Equipment = 'barbell' | 'dumbbell' | 'bodyweight' // EXPECT:EXCLUDED`,
  `export const f16 = ['barbell', 'dumbbell', 'bodyweight'] as const // EXPECT:EXCLUDED`,
  `export const f17 = [{ value: 'barbell', label: 'Barbell' }, { value: 'bodyweight', label: 'Bodyweight' }] // EXPECT:EXCLUDED`,
  `export const f18 = [{ value: 'weight_reps', label: 'Weight & Reps' }, { value: 'cardio', label: 'Cardio' }] // EXPECT:MISSING`,
  `export const f19 = [{ name: 'Squat', tracking_mode: 'weight_reps' }, { name: 'Plank', tracking_mode: 'timed' }] // EXPECT:VALUE`,
  `declare const weighIn: { kind: 'bodyweight' | 'measurements' } // EXPECT:EXCLUDED`,
  `declare const lonely: { kind: 'bodyweight' } // EXPECT:UNRESOLVED`,
]

function runSelfTest(): string[] {
  const fixturePath = path.join(process.cwd(), 'src', '__tracking_mode_census_fixture__.tsx')
  const fixtureCode = `import React from 'react'\n` + FIXTURE_LINES.join('\n') + '\n'
  const options: ts.CompilerOptions = {
    strict: true, noEmit: true, jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, skipLibCheck: true,
    lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
  }
  const host = ts.createCompilerHost(options)
  const originalGetSourceFile = host.getSourceFile.bind(host)
  host.getSourceFile = (fileName, languageVersionOrOptions, onError, shouldCreateNewSourceFile) =>
    fileName === fixturePath
      ? ts.createSourceFile(fixturePath, fixtureCode, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX)
      : originalGetSourceFile(fileName, languageVersionOrOptions, onError, shouldCreateNewSourceFile)
  const originalFileExists = host.fileExists.bind(host)
  host.fileExists = (fileName) => fileName === fixturePath || originalFileExists(fileName)
  const originalReadFile = host.readFile.bind(host)
  host.readFile = (fileName) => (fileName === fixturePath ? fixtureCode : originalReadFile(fileName))

  const program = ts.createProgram({ rootNames: [fixturePath], options, host })
  const sourceFile = program.getSourceFile(fixturePath)
  if (!sourceFile) return ['fixture source file missing from program']
  const result: CensusResult = { literals: [], sites: [] }
  censusOfSourceFile(sourceFile, program.getTypeChecker(), 'FIXTURE', result, new Map())

  const failures: string[] = []
  // Fixture line numbers are offset by 1 for the import line.
  FIXTURE_LINES.forEach((lineText, index) => {
    const lineNumber = index + 2
    const tagMatch = /\/\/ EXPECT:([A-Z,]+)\s*$/.exec(lineText)
    const sitesHere = result.sites.filter((site) => site.line === lineNumber).map((site) => site.verdict).sort()
    const literalsHere = result.literals.filter((literal) => literal.line === lineNumber)
    const modeValues = literalsHere.filter((literal) => literal.kind === 'mode' && literal.context === 'value')
    const excluded = literalsHere.filter((literal) => EXCLUDED_KINDS.has(literal.kind))
    const unresolved = literalsHere.filter((literal) => literal.kind === 'unresolved')
    const describe = `fixture line ${lineNumber} "${lineText.slice(0, 70)}"`
    if (!tagMatch) {
      if (sitesHere.length || literalsHere.length) failures.push(`${describe}: expected nothing, got sites=${JSON.stringify(sitesHere)} literals=${literalsHere.length}`)
      return
    }
    const expectation = tagMatch[1]
    if (expectation === 'VALUE') {
      if (sitesHere.length || modeValues.length === 0) failures.push(`${describe}: expected a non-branch mode VALUE only, got sites=${JSON.stringify(sitesHere)} values=${modeValues.length}`)
    } else if (expectation === 'EXCLUDED') {
      if (sitesHere.length || excluded.length === 0 || literalsHere.length !== excluded.length) failures.push(`${describe}: expected only EXCLUDED (exercise_type / other-vocabulary) literals, got sites=${JSON.stringify(sitesHere)} excluded=${excluded.length}/${literalsHere.length}`)
    } else if (expectation === 'UNRESOLVED') {
      if (unresolved.length === 0 || sitesHere.join(',') !== 'MISSING') failures.push(`${describe}: expected an UNRESOLVED literal counted as a MISSING site (fail closed), got sites=${JSON.stringify(sitesHere)} unresolved=${unresolved.length}`)
    } else {
      const expectedVerdicts = expectation.split(',').sort()
      if (JSON.stringify(sitesHere) !== JSON.stringify(expectedVerdicts)) failures.push(`${describe}: expected sites ${JSON.stringify(expectedVerdicts)}, got ${JSON.stringify(sitesHere)}`)
    }
  })
  return failures
}

// ── Main ───────────────────────────────────────────────────────────────

function main(): number {
  const wantJson = process.argv.includes('--json')
  const repositoryRoot = process.cwd()
  if (!existsSync(path.join(repositoryRoot, 'package.json')) || !existsSync(path.join(repositoryRoot, 'src')) || !existsSync(path.join(repositoryRoot, 'tsconfig.json'))) {
    console.error(`setup failure: run from the repository root (cwd=${repositoryRoot} lacks package.json/src/tsconfig.json)`)
    return 2
  }
  let headSha = '(git unavailable)'
  try { headSha = execSync(`git -C "${repositoryRoot}" rev-parse HEAD`, { encoding: 'utf8' }).trim() } catch { /* keep placeholder */ }

  const selfTestFailures = runSelfTest()
  if (selfTestFailures.length > 0) {
    console.error('SELF-TEST FAILED — the census oracle is broken; no worklist is printed.')
    for (const failure of selfTestFailures) console.error(`  ${failure}`)
    return 2
  }

  const configFile = ts.readConfigFile(path.join(repositoryRoot, 'tsconfig.json'), ts.sys.readFile)
  if (configFile.error) { console.error('setup failure: cannot read tsconfig.json'); return 2 }
  const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, repositoryRoot)
  const srcPrefix = path.join(repositoryRoot, 'src') + path.sep
  const sourceFileNames = parsed.fileNames
    .filter((fileName) => fileName.startsWith(srcPrefix) && /\.tsx?$/.test(fileName) && !fileName.endsWith('.d.ts'))
    .sort()
  const program = ts.createProgram({ rootNames: sourceFileNames, options: { ...parsed.options, noEmit: true, incremental: false, tsBuildInfoFile: undefined } })
  const checker = program.getTypeChecker()

  const result: CensusResult = { literals: [], sites: [] }
  const siteIndex = new Map<string, DecisionSite>()
  for (const fileName of sourceFileNames) {
    const sourceFile = program.getSourceFile(fileName)
    if (!sourceFile) continue
    censusOfSourceFile(sourceFile, checker, path.relative(repositoryRoot, fileName), result, siteIndex)
  }
  result.sites.sort((a, b) => (a.file === b.file ? a.line - b.line : a.file.localeCompare(b.file)))
  result.literals.sort((a, b) => (a.file === b.file ? a.line - b.line || a.column - b.column : a.file.localeCompare(b.file)))

  const modeLiterals = result.literals.filter((literal) => literal.kind === 'mode')
  const excludedLiterals = result.literals.filter((literal) => EXCLUDED_KINDS.has(literal.kind))
  const unresolvedLiterals = result.literals.filter((literal) => literal.kind === 'unresolved')
  const valueLiterals = result.literals.filter((literal) => !EXCLUDED_KINDS.has(literal.kind) && literal.context === 'value')
  const missingSites = result.sites.filter((site) => site.verdict === 'MISSING')
  const okSites = result.sites.filter((site) => site.verdict === 'OK')
  const filesWithSites = new Set(result.sites.map((site) => site.file))

  const summary = {
    root: repositoryRoot,
    head: headSha,
    filesScanned: sourceFileNames.length,
    literalOccurrences: result.literals.length,
    modeLiterals: modeLiterals.length,
    excludedLiterals: excludedLiterals.length,
    unresolvedLiterals: unresolvedLiterals.length,
    nonBranchValueLiterals: valueLiterals.length,
    decisionSites: result.sites.length,
    filesWithDecisionSites: filesWithSites.size,
    okSites: okSites.length,
    handledSites: okSites.filter((site) => site.classification === 'HANDLES_WEIGHT_TIME').length,
    excludedSites: okSites.filter((site) => site.classification === 'EXCLUDES_WEIGHT_TIME_INTENTIONALLY').length,
    pendingSites: missingSites.length,
    expectedPendingSites: EXPECTED_PENDING_SITES,
    drift: missingSites.length - EXPECTED_PENDING_SITES,
  }
  const exitCode = summary.drift === 0 ? 0 : 1

  if (wantJson) {
    console.log(JSON.stringify({ summary, sites: result.sites, literals: result.literals }, null, 2))
    return exitCode
  }

  console.log(`Tracking-mode census + guard (W1) — pin: ${EXPECTED_PENDING_SITES} site(s) expected pending on this committed tree`)
  console.log(`root=${repositoryRoot}`)
  console.log(`HEAD=${headSha}`)
  console.log(`self-test: ${FIXTURE_LINES.length}-line fixture, all expectations met`)
  console.log(`files scanned under src/: ${summary.filesScanned}`)
  console.log(`literal occurrences: ${summary.literalOccurrences}  (mode ${summary.modeLiterals}, excluded exercise_type/other ${summary.excludedLiterals}, unresolved ${summary.unresolvedLiterals}; non-branch values ${summary.nonBranchValueLiterals})`)
  console.log(`decision sites: ${summary.decisionSites} in ${summary.filesWithDecisionSites} files  (HANDLES_WEIGHT_TIME ${summary.handledSites}, EXCLUDES_WEIGHT_TIME_INTENTIONALLY ${summary.excludedSites}, PENDING ${summary.pendingSites}; pin ${EXPECTED_PENDING_SITES})`)

  const width = Math.max(...result.sites.map((site) => `${site.file}:${site.line}`.length), 10)
  console.log(`\nPENDING sites — THE WORKLIST (${missingSites.length}):`)
  for (const site of missingSites) {
    console.log(`  ${`${site.file}:${site.line}`.padEnd(width)}  ${site.shape.padEnd(16)}  ${site.literals.join(',')}  [${site.contexts.join(',')}]`)
  }
  console.log(`\nDECIDED sites (${okSites.length}):`)
  for (const site of okSites) {
    console.log(`  ${`${site.file}:${site.line}`.padEnd(width)}  ${site.shape.padEnd(16)}  ${site.classification}  ${site.literals.join(',')}${site.markerRationale ? ` (${site.markerRationale})` : ''}`)
  }
  if (unresolvedLiterals.length > 0) {
    console.log(`\nUNRESOLVED literals (counted as mode, fail closed — review each) (${unresolvedLiterals.length}):`)
    for (const literal of unresolvedLiterals) console.log(`  ${literal.file}:${literal.line}:${literal.column}  '${literal.text}'  ${literal.context}  ${literal.basis}`)
  }
  console.log(`\nNon-branch VALUE literals (listed, not guarded) (${valueLiterals.length}):`)
  for (const literal of valueLiterals) console.log(`  ${literal.file}:${literal.line}:${literal.column}  '${literal.text}'  ${literal.basis}`)
  console.log(`\nEXCLUDED literals — exercise_type or another vocabulary reusing the word (${excludedLiterals.length}):`)
  for (const literal of excludedLiterals) console.log(`  ${literal.file}:${literal.line}:${literal.column}  '${literal.text}'  ${literal.kind}  ${literal.context}  ${literal.basis}`)

  if (summary.drift === 0) {
    console.log(missingSites.length > 0
      ? `\nRESULT: AS PINNED — ${missingSites.length} site(s) pending, exactly EXPECTED_PENDING_SITES. Exit 0.`
      : `\nRESULT: GREEN — every decision site decides '${NEW_MODE_LITERAL}' explicitly and the pin is 0. Exit 0.`)
  } else {
    console.log(`\nRESULT: DRIFT — ${missingSites.length} site(s) pending but EXPECTED_PENDING_SITES = ${EXPECTED_PENDING_SITES} (${summary.drift > 0 ? '+' : ''}${summary.drift}). ${summary.drift > 0 ? 'An undecided site appeared.' : 'Sites were decided without updating the pin.'} Exit 1.`)
  }
  return exitCode
}

process.exit(main())
