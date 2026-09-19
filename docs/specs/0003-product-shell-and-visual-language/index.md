# 0003. Product shell and visual language

**Date**: 2026-09-19
**Status**: In Progress

## Summary

RouteStress will use a Quiet Civic visual language with a modern consumer app feel. The system is calm and spacious, but still supports clear analytical dependency states. This spec defines reusable visual tokens and interaction rules; final page layouts remain a later decision.

## Requirements

**User stories**:
- As an applicant, I want the interface to feel trustworthy and approachable so that stressful route changes are easy to understand.
- As an applicant, I want dependency and repair states to be explicit so that I can act without guessing.
- As a builder, I want shared tokens and primitives so that future screens remain visually consistent.

**Acceptance criteria**:
- **AC-1**: The shell uses a clean geometric sans, balanced information density, soft rounded surfaces, light elevation, and a Quiet Civic light theme.
- **AC-2**: The token system supports both light and dark themes without changing semantic names used by components.
- **AC-3**: Primary, positive, caution, breakage, focus, disabled, and evidence states use restrained blue-gray neutrals plus royal blue, teal, amber, and red, with text or icon redundancy for important states.
- **AC-4**: Shared components define default, hover, focus-visible, pressed, disabled, loading, success, warning, and error behavior where applicable.
- **AC-5**: Graph nodes and edges use readable labels and explicit state markers; color is never the only state signal.
- **AC-6**: Scenario changes are staged for review before application and use helpful, reduced-motion-safe transitions when applied.
- **AC-7**: Components reflow responsively without changing the core mental model; no required action is unavailable on small screens.
- **AC-8**: Figma styles and code tokens share stable names and values, and the chosen Quiet Civic direction is traceable to the `Style Directions` page in the RouteStress Figma file.

## Decision

**Chosen option**: Quiet Civic with modern consumer-app expression.

Use a light blue-gray foundation, royal blue primary actions, restrained teal and amber support colors, red only for route breakage, clean geometric sans typography, soft rounding, light elevation, balanced density, direct copy, and mixed icons with solid emphasis for warnings and key actions.

**Implementation skills**: `figma-use` (`openai-curated-remote/figma`, `.codex/plugins/cache/openai-curated-remote/figma/11.0.0/skills/figma-use/`) · `imprint` (`local`, `.agents/skills/imprint/`)

## Feature design

### Foundations

| Token group | Decision |
|---|---|
| Typography | Plus Jakarta Sans. Display 32/40, section 24/32, body 16/24, supporting 14/20, label 12/16. Use weight and spacing before all-caps. |
| Spacing | 4 px base grid with 8, 12, 16, 24, 32, 48, and 64 px steps. |
| Shape | 12 px controls, 16 px cards, 24 px feature surfaces, pill only for compact status tags. |
| Elevation | One subtle card shadow and one elevated overlay shadow. Prefer borders and surface contrast. |
| Icons | Rounded line icons by default. Solid icons for warnings and primary actions. Pair important status icons with text. |
| Motion | Helpful transitions for propagation and repair. Respect `prefers-reduced-motion`; reduced mode uses instant state changes. |

### Semantic color tokens

Use semantic names, not raw color names, in components. Light and dark values are paired in the theme token map.

| Token | Light intent | Dark intent |
|---|---|---|
| `surface.canvas` | `#F4F7FB` | `#0F172A` |
| `surface.panel` | `#FFFFFF` | `#162338` |
| `surface.subtle` | `#E8EEF7` | `#1E2D46` |
| `content.primary` | `#1E2A44` | `#F8FAFC` |
| `content.secondary` | `#667085` | `#A9B8CC` |
| `content.inverse` | `#FFFFFF` | `#0F172A` |
| `border.default` | `#D5DEEA` | `#334155` |
| `border.strong` | `#AEBED2` | `#52657F` |
| `action.primary` | `#3155D9` | `#6D86FF` |
| `action.primaryHover` | `#2746B8` | `#8CA0FF` |
| `state.positive` | `#0F766E` | `#2DD4BF` |
| `state.caution` | `#8A5A00` | `#F6C453` |
| `state.breakage` | `#C53030` | `#FF7B7B` |
| `state.focus` | `#3155D9` | `#9DB0FF` |
| `state.evidence` | `#3155D9` | `#8CA0FF` |
| `state.disabled` | `#98A2B3` | `#64748B` |

### Component inventory

Build primitives first: `AppShell`, `PageHeader`, `Button`, `IconButton`, `TextInput`, `Select`, `SegmentedControl`, `Card`, `StatusBadge`, `ProgressMeter`, `EvidenceLink`, `ProgramCard`, `DependencyNode`, `DependencyEdge`, `ScenarioReviewPanel`, `RepairCallout`, `TaskRow`, `Toast`, and `Modal`.

Each interactive primitive must expose keyboard focus, disabled, loading, and error states. Domain components must show stable rule or evidence labels when a result is computed.

### Layout and responsive rules

This spec does not choose final route page composition. It defines the shell contract only: persistent navigation may collapse, cards stack vertically, graph and detail panels reflow in document order, and scenario review remains reachable before apply. Use CSS grid and flex reflow before horizontal scrolling. Preserve action hierarchy and visible next action at every breakpoint. The first implementation slice is `AppShell`, `PageHeader`, `Card`, `Button`, `StatusBadge`, `EvidenceLink`, and a light or dark theme switcher.

### Content and accessibility

Copy is direct and concise. Explain breakage with the pattern `What changed. What broke. What to do next.` Important states combine color, text, and icon. Focus indicators must be visible on both themes. Text and controls must meet WCAG AA contrast targets. Graph labels must remain readable when zoomed and have a non-visual summary path.

### Figma and code handoff

Figma source: [RouteStress Product Shell Concepts](https://www.figma.com/design/zI5agQqDcbhmpZrTPNfqN8), page `Style Directions`, frame `C  QUIET CIVIC`. Figma variable names and CSS token names must match exactly. Any new component pattern is recorded in `ui-registry.md` after implementation.

**Key invariants**:
- Components consume semantic tokens only.
- Red means route breakage, not generic emphasis.
- Color never carries an important state alone.
- Scenario edits do not mutate the active route until review is confirmed.
- Layout decisions not covered here belong to the relevant page spec.

**Critical test scenarios**:
- Render light and dark themes and verify semantic token coverage, verifies **AC-1**, **AC-2**, **AC-3**.
- Tab through every primitive and trigger focus, disabled, loading, and error states, verifies **AC-4**, **AC-7**.
- Apply a scenario after review and inspect graph state labels and reduced-motion behavior, verifies **AC-5**, **AC-6**.
- Narrow the viewport and complete the next-action flow without horizontal scrolling, verifies **AC-7**.
- Compare Figma frame names with code token names and inspect the registry entry, verifies **AC-8**.

## Build plan

1. [x] Add semantic light and dark theme tokens and the geometric sans type scale, satisfies **AC-1**, **AC-2**, **AC-3**.
2. [x] Build shell primitives and interaction states, satisfies **AC-4**, **AC-7**.
3. Build graph and route-domain primitives with explicit status and evidence treatment, satisfies **AC-5**.
4. [x] Add staged scenario review motion and reduced-motion behavior, satisfies **AC-6**.
5. Document implemented patterns in `ui-registry.md` and reconcile Figma names, satisfies **AC-8**.

## Consequences

**Positive**:
- A consistent visual foundation can support multiple route layouts later.
- Light and dark mode are possible without rewriting component APIs.
- Explicit state treatment supports the product’s resilience and evidence goals.

**Negative / tradeoffs**:
- Two themes increase token and QA work in the MVP.
- Balanced density and analytical graphs require careful responsive testing.
- The design system intentionally delays final page composition.

## Follow-up

- [x] Choose final font family: Plus Jakarta Sans, with Inter as a fallback if the runtime cannot load it.
- [x] Define exact light and dark semantic token values and verify all foreground pairs against WCAG AA before implementation.
- [x] Define the first implementation slice: `AppShell`, `PageHeader`, `Card`, `Button`, `StatusBadge`, `EvidenceLink`, and theme switching.
- [ ] Create the first page-specific layout spec after the shell primitives are accepted.

## Rationale

See [rationale.md](rationale.md) for the design conversation, alternatives, and decision reasoning.
