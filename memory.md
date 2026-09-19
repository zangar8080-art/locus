# Memory: RouteStress MVP and constraint graph

Last updated: 2026-09-19

## What was built

The RouteStress MVP diagnosis workspace is in `app/page.tsx`, with styling in `app/globals.css` and the pure diagnosis helper in `src/domain/diagnosis.ts`.

The constraint graph engine is in `src/domain/constraint-graph.ts`. It provides deterministic route results, candidate filtering, requirement outcomes, eligibility and feasibility bands, graph nodes and edges, critical path output, IELTS score shocks, breakages, repair suggestions, and stable issue results.

The architecture and product decisions are documented in `docs/specs/0006-constraint-graph-engine-assumed.md`, and the release scope is updated in `docs/scope/scope.md`.

## Decisions made

The engine is local and pure. React Flow remains a renderer only. Applicant state stays on the device. Results use stable identifiers, explicit sort keys, traceable requirement outputs, and explicit planning dates. Unsupported or unknown values remain visible rather than becoming automatic passes.

The initial supported shock variables are `ielts_overall_score` and `ielts_planned_date`. Repair ranking is deterministic and does not predict admission probability.

## Problems solved

The repository was initialized, connected to the GitHub remote, and pushed. The latest pushed commit is `9d84365 Implement constraint graph route engine`.

The engine type errors were fixed and the production build now passes. Catalog validation also passes.

## Current state

GitHub is up to date and the working tree is clean. The engine milestones for schemas, baseline evaluation, graph output, shocks, breakages, and repairs are marked complete in scope.

The diagnosis page is still a narrow MVP and is not yet wired to the full constraint graph result. Reducer integration, browser coverage, accessibility verification, and a fuller profile driven scenario flow remain open.

The existing lint command still reports pre existing issues in `app/profile/page.tsx`, including state updates inside an effect and plain anchor navigation. These should be fixed before final verification.

## Next session starts with

Run `/remember restore`, then run `/develop constraint graph and route repair` or continue directly by integrating `computeRouteResult` and `applyRouteShock` into the workspace reducer and UI. Add focused unit tests for truth tables, deterministic ordering, IELTS shocks, repairs, invalid input, and privacy boundaries. Then run `/check verify` and `/test`.

## Open questions

Decide whether to finish reducer and UI integration before presentation work. The presentation can be created after the full route and repair flow is verified.
