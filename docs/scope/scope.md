# Scope: RouteStress

RouteStress helps independent applicants build an international university admissions route that still works when scores, money, deadlines, or available time change. The first release is a private alpha with a guided profile, transparent program data, deterministic repair, and local progress.

**Build approach:** Skateboard (ship the smallest complete route a real applicant can use, then grow its depth).
**Workflow:** Alpha (`/check verify` after `/develop`). The project default level of rigor. `/architect` is the recommended first stop for a feature with a real decision, but you may skip it when you already know the build. Any feature can carry its own workflow tag to use more or less rigor.

_These are recommendations to keep your build orderly, not requirements. You may skip anything that does not fit. You decide when a feature is `done`._

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| A | Application scaffold | Existing groundwork | existing |
| 1 | Program requirement catalog | Release 1 | in-progress |
| 2 | Constraint graph and route repair | Release 1 | planned |
| 3 | Product shell and visual language | Release 1 | in-progress |
| 4 | Guided applicant profile | Release 1 | done |
| 5 | Diagnosis and recommendations | Release 1 | planned |
| 6 | Shock and repair lab | Release 1 | planned |
| 7 | Program comparison | Release 2 | planned |
| 8 | Admissions roadmap | Release 2 | planned |
| 9 | Progress and local persistence | Release 2 | planned |
| 10 | Journey measurement and error signals | Release 2 | planned |

## Existing groundwork

### A. Application scaffold · existing
A runnable typed web application scaffold with styling and lint support is already present. It is still the generated starter and contains no RouteStress behavior. code in `app/`

## Release 1: Smallest usable resilient route

### 1. Program requirement catalog · in-progress
Define a reviewable requirement schema and curate 24 programs across eight subject areas and four countries. Cover deadlines, prerequisites, language tests, costs, documents, academics, and activities, with official evidence recorded for each material fact.
**Done when:** the repository contains valid transparent data for every selected program, covers the 10 normalized requirement types, preserves conditional meaning and unknown facts, and makes source evidence visible for review.
- [x] Design it (spec): [0002](../specs/0002-program-requirement-catalog/index.md)
- [x] Build it: `/develop program requirement catalog`
  - [x] Build the versioned schema, vocabularies, evidence model, rule groups, and difficult pilot records (AC-3, AC-4, AC-5, AC-6, AC-8, AC-10)
  - [x] Curate and validate eight subject representatives with all requirement types covered (AC-2, AC-3, AC-4)
  - [x] Complete the 24 program release catalog across four countries (AC-1, AC-2, AC-3, AC-4, AC-5, AC-10)
  - [x] Add the release gate, stable validation errors, and curator documentation (AC-6, AC-7, AC-8, AC-9)
- code in `src/data/programs/` and `scripts/validate-program-catalog.ts`
- [x] Verify it: `/check verify program requirement catalog`

### 2. Constraint graph and route repair · planned · needs a decision · Beta
Represent profile facts, program requirements, tasks, timing, and costs as explicit constraints. Compute eligibility and route feasibility bands, the critical path, breakages, deterministic ranking, and the smallest useful repair without predicting admission probability.
**Done when:** the same inputs always produce the same diagnosis and order; changing an important variable propagates through dependencies, removes infeasible programs, and returns a valid repaired route when one exists.
- [x] Design it (assumed spec): [0006](../specs/0006-constraint-graph-engine-assumed.md)

### 3. Product shell and visual language · planned · needs a decision
Create the coherent private alpha frame and reusable visual language for profile input, program cards, status, tasks, and dependency states. Make every graph state understandable without relying on color or the graph alone.
**Done when:** the core workspace adapts to phone and desktop widths, supports keyboard and visible focus use, and establishes a WCAG 2.2 AA target for the whole journey.
- [x] Design it (spec): [0003](../specs/0003-product-shell-and-visual-language/index.md)
- [x] Build it: `/develop product shell and visual language`
  - [x] Add semantic light and dark tokens and responsive foundations
  - [x] Build the shell, route overview, cards, buttons, status badges, and theme switcher
  - [x] Add staged scenario control and reduced motion support
- code in `app/page.tsx` and `app/globals.css`

### 4. Guided applicant profile · done
Let an applicant enter the facts that drive route feasibility, including academic background, target countries, budget, available weekly time, exam plans, and timing. Explain why each important input matters.
**Done when:** an applicant can complete, review, and revise a useful profile, validation identifies missing critical facts, and no sensitive profile data leaves the device.
- [x] Design it (spec): [0004](../specs/0004-guided-applicant-profile.md)
- [x] Build it: `/develop guided applicant profile`
  - [x] Define versioned profile schemas, registries, criticality policy, reducer events, and stable validation errors (AC-2, AC-3, AC-4, AC-8, AC-9)
  - [x] Build the guided short form with accessible explanations and responsive layout (AC-1, AC-10)
  - [x] Build review, explicit Save, local storage recovery, and Reset (AC-5, AC-6, AC-7)
  - [x] Add validation, privacy, date, keyboard, and responsive coverage (AC-3, AC-4, AC-6, AC-9, AC-10)
- [x] Verify it: `/check verify guided applicant profile`

### 5. Diagnosis and recommendations · in-progress
Turn the profile into a plain language diagnosis and at least three ranked program recommendations. Show the deciding requirements, evidence, eligibility band, feasibility band, and reasons for each result.
**Done when:** an applicant can understand the main strengths and blockers, inspect at least three qualified recommendations, and trace every reason to profile facts and curated requirements.
- [x] Design it (spec): [0005](../specs/0005-diagnosis-and-recommendations.md)
- [ ] Build it: `/develop diagnosis and recommendations`
  - [ ] Accept the constraint graph result contract and define the versioned evaluation policy, group truth tables, ranking ordinals, and traceability identifiers (AC-2, AC-4, AC-6, AC-8, AC-11)
  - [ ] Add validated exchange rate and diagnosis run schemas, deterministic domain composition, and atomic reducer replacement (AC-1, AC-3, AC-5, AC-9, AC-12, AC-13, AC-14)
  - [ ] Build the diagnosis workspace with findings, recommendations, shortage states, evidence disclosure, and active route selection (AC-7, AC-8, AC-9, AC-10, AC-15)
  - [ ] Add deterministic, traceability, currency, stale result, invalid configuration, keyboard, and responsive coverage (AC-1, AC-4, AC-6, AC-8, AC-11, AC-12, AC-13, AC-15)
- [ ] Verify it: `/check verify diagnosis and recommendations`

### 6. Shock and repair lab · planned · needs a decision · Beta
Deliver the magic moment on the same workspace. Let the applicant perturb IELTS score or exam timing, watch affected dependencies and programs change, and see a repaired route with one immediate action.
**Done when:** moving IELTS from 7.0 to 6.0 or delaying it by six weeks visibly breaks the graph, drops affected programs, explains why, and presents a feasible repair plus one immediate action; any edited important variable recomputes the visible route.
- [ ] Design it (spec): `/architect shock and repair lab`

## Release 2: Complete private alpha

### 7. Program comparison · planned · needs a decision
Let the applicant compare recommended programs by resilience, feasibility, requirements, timing, and cost. Keep missing data and hard blockers explicit.
**Done when:** the applicant can compare at least three programs on the factors that change route viability and can return to the chosen route without losing profile or scenario state.
- [ ] Design it (spec): `/architect program comparison`

### 8. Admissions roadmap · planned · needs a decision
Expand a repaired route into a dated plan covering exams, documents, application deadlines, academic work, and relevant activities. Highlight the critical path and make the next action unmistakable.
**Done when:** the selected route produces an ordered roadmap with dependencies and deadlines, identifies the critical path, and always names one immediate feasible action.
- [ ] Design it (spec): `/architect admissions roadmap`

### 9. Progress and local persistence · planned · needs a decision
Let the applicant complete roadmap tasks and return to the same plan on the same device. Keep profile, scenario, route, and progress state consistent after any important input changes.
**Done when:** task completion and the current plan survive refresh and browser restart, stale results are recomputed after profile changes, and the applicant can reset the local workspace.
- [ ] Design it (spec): `/architect progress and local persistence`

### 10. Journey measurement and error signals · planned · needs a decision
Measure whether people reach the shock and repair moment and capture client failures without collecting identifying profile values. Keep measurement subordinate to the local privacy boundary.
**Done when:** the product records the main journey stages and repair completion, reports client errors with useful context, and excludes profile answers and other identifying content.
- [ ] Design it (spec): `/architect journey measurement and error signals`

## Deferred

Out of scope for this build pass, kept so the plan stays honest.

- **Accounts and server persistence**: let an applicant securely use the same plan across devices · needs a decision · GA
- **Several applicant profiles**: create and switch among multiple saved applicants · needs a decision
- **Requirement extraction assistance**: extract structured requirements from cited university pages for human review · needs a decision · Beta
- **Program data editor**: review and update the catalog through an internal interface · needs a decision
- **Public launch pages**: add marketing content, search metadata, social cards, and public onboarding · needs a decision
- **Additional languages**: translate the product and support locale aware dates and content · needs a decision
- **Billing**: introduce a paid plan only after the resilience loop proves useful · needs a decision · GA

## Legend

**The decision box.** A feature that needs a real product or technical choice starts with `/architect`. If you already know the decision, you may go directly to `/develop` and record the assumption.

**Feature lifecycle:** `planned` becomes `in-progress`, then `done`. `existing` describes work that predates this workflow. `dropped` keeps the history of removed scope.

**Next step:** the first unticked checkbox in a feature is its next recommended action. After a spec is captured, `/architect` expands the feature with a build command and a small milestone rollup from the spec.

**Workflow:** Alpha normally runs `/check verify` after `/develop`. A Beta tag adds `/test`. A GA tag also adds fresh model review and human facing documentation. A Prototype tag relies on the build time checks in `/develop`.

**Pointers:** a spec pointer appears after `/architect` captures one. A code pointer appears after `/develop` builds the feature.
