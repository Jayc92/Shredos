# UI-6B — Fasting Visual Rebuild

Presentation-only rebuild of `/fasting` (page, loading state, and the
four touched fasting components). Food/Nutrition, Coach, Dashboard,
fasting business libraries, APIs, and the database are untouched;
FastingStats was already clean and is byte-identical.

## Visual architecture

`max-w-6xl` wide-route composition. PageHeader owns the title with
the established honest support copy verbatim ("Fasting is a calorie
adherence tool — not magic. Calories still determine fat loss.").
ProgressSubNav stays in its established location. At `lg` the fasting
TASK surface (active timer + start/end/manual controls) is the
primary column and the supporting context (this-week stats, completed
history) forms the second column — `items-start`, natural heights.
Mobile keeps the task-first order: timer, controls, stats, history.
The loading state mirrors that geometry with no fake timer value or
history rows.

## Design-system adoption

Every legacy input alias (`bg-secondary border border-input`, 7
sites) moved to the semantic `bg-surface-interactive border
border-edge` convention; text glyphs became aria-hidden Lucide icons
(goal-reached and goal-met checkmarks -> CheckCircle2; the manual-add
ASCII plus -> Plus); the history edit/delete icons now sit in real
44px boxes and the edit/manual toggles and edit-form actions carry
`min-h-11`; the three main action buttons keep their established
`py-3` treatment. Goal states always carry text ("Reached!", "goal
met", "goal not met") — never color alone.

## Protected behavior (unchanged, byte- or behavior-anchored)

Start-fast/end-fast/manual-entry/edit/delete payloads and requests;
one-active-fast enforcement (partial unique index + 23505 mapping +
the explicit conflict copy + blank-End-means-ongoing decision);
stored start/end timestamps as true instants; elapsed/target/
completed-duration calculations (`lib/fasting.ts` byte-untouched);
the 1-second timer cadence with interval cleanup keyed on the start
instant; user-local week boundary (`startOfISOWeek(parseISO(
localTodayFromCookies()))`); bounded newest-first completed-only
history (limit 50) with the honest empty state; active-fast
restoration on every server render; failure states that keep user
input; missing-vs-zero (null End never renders as a zero timestamp;
the stats em-dash placeholder). Educational milestone thresholds and
their carefully hedged copy are byte-identical — the audit found no
overclaim to report: every note already hedges ("May support...",
"Not required for fat loss.") and repeats the calorie truth.

## Roadmap-only: future fasting opportunities

Recorded 2026-08-16; NOTHING here is implemented, scheduled, or
schema-designed in UI-6B:

- flexible fasting schedules
- optional reminders/notifications
- user-defined fasting windows
- coach interpretation based on broader context
- safety exclusions/onboarding warnings where medically appropriate

No schema, notification plumbing, medical logic, or product code
exists for any of these.
