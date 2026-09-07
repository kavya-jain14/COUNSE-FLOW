# CounselFlow Registrar Desk

The active candidate UI uses an institutional case-file system. It is intended to feel
like a registrar's working desk: clear enough for a first-time candidate, dense enough for
a serious decision, and visibly different from a generic SaaS dashboard.

## Palette

Only this family is used:

| Token | Value | Use |
|---|---:|---|
| Registrar ink | `#172A38` | Text, strong rules, primary actions, current step |
| Muted petrol | `#456A75` | Secondary labels and numeric annotations |
| Cool docket | `#DFE7E7` | Selected rows and attention fields |
| Warm paper | `#F4F1E9` | Document surfaces |
| Archive beige | `#E5DDD0` | Table heads, decision notes, hard-limit fields |
| Desk canvas | `#E8ECEB` | Workspace background between records |

Severity is communicated with words, codes, line weight, and border style. It does not
introduce red, amber, green, purple, or rainbow status colors.

## Type

- Display: Alegreya, with Georgia as the local fallback.
- Body: Alegreya Sans, with Segoe UI as the local fallback.
- Data: Azeret Mono, with Consolas as the local fallback.

Rank, fees, distance, revisions, conflict codes, option positions, and engine metadata use
the data face with tabular numerals.

## Layout rules

- A full-width case-file masthead names the product, counselling systems and current state.
- The five-step route is a horizontal ledger below the masthead; it never consumes a
  permanent left column.
- Content is divided by hairline rules and editorial bands.
- Strategy and locked lists are ruled registers, not floating cards.
- The strategy explanation sits in a marginalia column.
- Conflict decisions read as a case file: finding, evidence, choices, recorded outcome.
- On smaller screens the route remains horizontally scrollable, while the working content
  keeps the full viewport width. Its visual scrollbar is hidden and the current step is
  automatically centred after navigation.
- Candidate-facing pages show one primary status and next action. Engine, revision and
  dataset identifiers are reserved for a collapsed saved-record details section.
- Selects use a shared listbox with explicit `SELECT` / `CLOSE` labels, keyboard navigation
  and touch-sized options. Native browser chrome is not part of the active interface.
- Range controls show a solid ink-filled track and square double-rule thumb without using
  gradients. Quota checkboxes use a matching square ink mark.
- Branch order is directly draggable on pointer and touch devices, while the same grip
  supports arrow, Home and End keys.
- Conflict records lead with a two-part current/suggested comparison; verbose evidence is
  disclosed only on request.

## Explicit exclusions

The UI does not use gradients, shadows, glass effects, decorative icon libraries, emoji,
testimonials, pricing patterns, bento grids, dot fields, radial shapes, neon, purple-black
themes, oversized rounded corners, or decorative checkmark lists. Motion is disabled in
the visual layer.

## Final acceptance gate

- The candidate shell exposes only the five product steps. The integration lab remains a
  development file and has no candidate-facing navigation.
- The active stylesheet forces flat backgrounds, square geometry, static hover states,
  zero blur, zero shadow and zero decorative animation.
- Reorder controls use written labels instead of an icon library or decorative arrows.
- Loading states use plain status copy instead of a spinner or skeleton surface.
- The landing page contains a real seven-row product specimen with two reproducible audit
  findings.
- Form submission focuses the first invalid field; list and conflict screens bring the first
  unresolved decision into the candidate's path without requiring a manual search.
- Privacy and terms links open complete, deployable notices using the same palette and type
  system.
- Brand SVGs remain monochrome and use the approved Registrar Desk palette.

## Implementation boundary

`src/styles/calm-scholar.css` is loaded after the legacy stylesheet. It owns the active
visual system without changing strategy, audit, lock, contract, or state behavior. The
file can be removed from `src/main.tsx` to return to the prior skin while keeping every
product interaction intact.

The landing specimen is generated from the golden demo profile:

- rank 12,500 CRL;
- General category and UP domicile;
- CSE, IT, ECE branch priority;
- ₹1,50,000 annual hard ceiling;
- 300 km hard distance limit from Lucknow;
- seven surviving options;
- two audit warnings: CF-01 branch priority conflict and CF-08 evidence gap.
