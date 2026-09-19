# Rationale

## Context

RouteStress needs a visual foundation before the first product screen is built. The product deals with stressful changes to scores, budgets, deadlines, and available time, so the interface must feel trustworthy without becoming a bureaucratic dashboard. It also needs to show analytical dependency and repair states clearly.

The user chose the Quiet Civic direction in Figma, then selected a modern consumer-app tone, clean geometric sans typography, restrained plus balanced color support, balanced density, soft rounding, light elevation, helpful motion, clear analytical graphs, review-before-apply scenarios, responsive reflow, balanced accessibility redundancy, direct copy, light and dark themes, and mixed icon treatment.

## Options considered

### Option 1: Quiet Civic

Light blue-gray surfaces, royal blue actions, generous whitespace, and explicit evidence treatment.

**Pros**:
- Trustworthy and calm for high-stakes planning.
- Supports both consumer polish and analytical clarity.

**Cons**:
- Requires careful contrast and state design to avoid looking generic.

### Option 2: Editorial Signal

Warm paper surfaces, ink typography, and coral accents.

**Pros**:
- Distinctive and human.

**Cons**:
- Less naturally aligned with analytical status states and dark mode.

### Option 3: Instrument Panel

Dark navy surfaces, bright cyan accents, and dense operational presentation.

**Pros**:
- Strong for monitoring changes and graph activity.

**Cons**:
- Risks making applicants feel like they are operating a diagnostic console.

## Rationale

Quiet Civic best balances emotional safety with the need to explain dependency failures. The consumer-app adjustments keep it approachable, while explicit semantic states, evidence links, and analytical graph rules preserve product credibility. Deferring page composition avoids locking the design system to a single route workflow.

## References

**Project sources**:
- `AGENTS.md` product and stack rules
- `docs/specs/0001-stack-architecture/index.md`
- Figma file `RouteStress Product Shell Concepts`, `Style Directions` page

**Practices & standards**:
- Semantic design tokens
- WCAG AA contrast and keyboard accessibility
- `prefers-reduced-motion`
