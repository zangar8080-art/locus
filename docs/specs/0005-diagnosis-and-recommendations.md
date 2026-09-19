# 0005. Diagnosis and recommendations

**Date**: 2026-09-19
**Status**: In Progress

## Summary

This feature turns a saved applicant profile into a plain language diagnosis and ranked program recommendations. It uses the future constraint graph engine for eligibility, feasibility, resilience, and ranking, then presents the complete traceable result in the workspace. Results stay in reducer memory and never become a second source of domain truth.

## Context

RouteStress must help an applicant understand the main strengths and blockers in a route before the shock and repair flow. The profile and program catalog already define the input facts, but the constraint graph and route repair decision is not yet specified. This feature therefore defines the applicant facing result contract and requires that engine contract before implementation begins.

> ⚠️ Premise note: This feature depends on the constraint graph and route repair decision, which has no spec yet. Building this feature before that decision would create a second eligibility and ranking engine. The constraint graph spec should be accepted first, or this feature must remain limited to its result contract and presentation adapter.

The feature is a client side web feature in the existing local first modular monolith. The applicant uses the latest explicitly saved profile. Catalog data and a pinned planning exchange rate dataset are validated before evaluation. No account, server endpoint, new persistence layer, or remote computation is needed.

## Requirements

**User stories**:

• As an applicant, I want a plain language diagnosis before seeing recommendations so that I understand what is helping or blocking my route.

• As an applicant, I want ranked programs whose eligibility and feasibility are explicit so that I do not mistake a fragile option for a safe one.

• As an applicant, I want every reason to trace to my profile, a curated program fact, and a named rule so that I can inspect the evidence.

• As an applicant, I want to choose one qualified program as my active route so that later shock and repair work has a clear target.

**Acceptance criteria**:

• **AC-1**: After an explicitly saved valid profile is available, the workspace computes a diagnosis from the selected subject, target intake, selected countries, the validated catalog, the validated exchange rate dataset, the explicit planning date, and the versioned evaluation policy.

• **AC-2**: The result distinguishes eligibility as `eligible`, `conditional`, `blocked`, or `insufficient_data`, and feasibility as `feasible`, `tight`, `infeasible`, or `insufficient_data`.

• **AC-3**: The candidate pool contains only programs matching the saved subject, the catalog undergraduate degree level, the exact saved intake identifier, and the selected countries. Preferences are never broadened silently. Unsupported qualification kinds produce `unavailable`.

• **AC-4**: Every relevant catalog requirement receives an evaluation with an outcome of `pass`, `conditional`, `blocker`, `insufficient_data`, `manual_review`, or `not_applicable`, with stable rule, input, program data, evidence, and sort identifiers.

• **AC-5**: Qualified recommendations are candidates with eligibility `eligible` or `conditional` and feasibility `feasible` or `tight`. The workspace shows the top three when at least three qualify, shows all available qualified candidates when fewer than three qualify, and provides a deterministic control to reveal every qualified result.

• **AC-6**: Ranking is deterministic. It orders qualified candidates by closed integer ordinals for engine supplied resilience, feasibility, academic fit, and stable catalog order, represented as an explicit lexicographic ranking tuple and final rank. Unqualified candidates have no qualified rank but retain a deterministic diagnostic order.

• **AC-7**: The workspace shows overall strengths, blockers, and uncertainties before recommendations. Each finding and recommendation initially shows its three decisive reasons, with all evaluated requirements available through an accessible detail disclosure.

• **AC-8**: Every displayed reason can be traced to applicant input field identifiers, catalog program or requirement identifiers, evidence entries from the recorded catalog dataset, and a stable rule identifier and version.

• **AC-9**: The applicant can select one qualified recommendation as the active route. Selection is accepted only for the current result and is cleared if a new result makes the program blocked, infeasible, or insufficient data.

• **AC-10**: When fewer than three candidates qualify, or none qualify, the workspace explains the shortage from a structured candidate pool summary and candidate outcomes, distinguishing preference filtering, blockers, feasibility failures, applicant unknowns, and catalog unknowns, without presenting an unqualified candidate as a recommendation.

• **AC-11**: Unknown facts and unsupported or manual review requirements never become automatic passes. They remain explicit uncertainty and are ranked below confirmed results.

• **AC-12**: A new saved profile, catalog version, policy version, or exchange rate dataset replaces the complete diagnosis run atomically. A monotonic request identifier and input revision reject stale completions, and partial results are never shown.

• **AC-13**: Invalid profile, catalog, policy, or exchange rate input returns a stable `unavailable` issue with a recoverable retry or reset path. The last complete result remains visible when one exists.

• **AC-14**: The feature keeps result and active route state in the central reducer only. It adds no browser persistence, analytics payload, error payload, server endpoint, account, or new credential.

• **AC-15**: The diagnosis workspace reflows across phone and desktop widths, keeps the next action reachable, exposes visible keyboard focus, uses text and icons in addition to color, and supports accessible evidence disclosure.

## Decision

**Chosen option**: A deterministic client side diagnosis adapter over the constraint graph engine.

The future constraint graph domain engine owns eligibility, feasibility, resilience, rule evaluation, and ranking. This feature owns the typed result contract, reducer integration, diagnosis findings, recommendation presentation, evidence disclosure, and active route selection. The public domain entry point is one pure `diagnoseAndRecommend` function composed from smaller internal evaluators.

Use the saved profile, validated catalog, pinned repository exchange rate dataset, explicit planning date, and versioned policy as inputs. Keep every filtered candidate evaluation in memory, derive the visible top three from it, and preserve unknown and manual review outcomes. Use one atomic reducer event for a complete replacement. Keep results and selection out of browser persistence until the later progress and local persistence feature defines the whole workspace envelope.

**Implementation skills**: none beyond the project workflow and stack conventions already recorded in `AGENTS.md`.

## Feature design

**Data model sketch**:

• `DiagnosisRun` is the current in memory immutable run. It contains a monotonic `requestId`, an `inputRevision`, the exact validated profile, catalog, policy, and exchange dataset references used for presentation, and one `DiagnosisResult`. It is not persisted and is the only source for resolving result identifiers.

• `DiagnosisResult` contains required `schemaVersion`, `evaluationPolicyVersion`, `profileSchemaVersion`, `catalogDatasetVersion`, `exchangeRateDatasetVersion`, `planningDate`, `candidatePoolSummary`, `candidateEvaluations`, `findings`, and `rankedQualifiedProgramIds`. It does not become a second domain truth.

• `CandidatePoolSummary` records filter counts and stable exclusion reasons for subject, degree, intake, and country matching, plus shortage reasons for blockers, feasibility failures, applicant unknowns, and catalog unknowns.

• `CandidateEvaluation` is unique by `programId` within a result. It contains `eligibilityBand`, `feasibilityBand`, `resilienceBand`, `academicFitBand`, `isQualified`, nullable `rank`, `rankingTuple`, `decisiveEvaluationIds`, and all relevant requirement and group evaluations.

• `RequirementGroupEvaluation` has a stable `groupEvaluationId`, `groupId`, operator, outcome, child evaluation identifiers, rule identifiers, and sort key. It prevents an unmet `anyOf` branch from becoming a blocker when another branch passes.

• `RequirementEvaluation` has a stable derived `evaluationId`, a typed program scoped `requirementId` or coverage reference, `requirementType`, `outcome`, `impact`, `ruleId`, `ruleVersion`, `inputFieldIds`, `programDataIds`, typed `evidenceRefs`, `explanationCode`, `explanationParams`, and `sortKey`.

• `DiagnosisFinding` has a stable `findingId`, `category` (`strength`, `blocker`, or `uncertainty`), `priority`, `explanationCode`, `explanationParams`, arrays of affected `programIds` and `evaluationIds`, source identifiers, rule identifiers, and `sortKey`. One finding may summarize several programs.

• `ActiveRouteSelection` is an optional in memory singleton with `programId`, `diagnosisRunId`, `catalogDatasetVersion`, and `evaluationPolicyVersion`. It references exactly one qualified candidate in the current run.

• `PlanningExchangeRateDataset` is validated repository data identified by `datasetVersion`. It contains `schemaVersion`, `effectiveDate`, euro as base currency, exact decimal rates for every supported currency, source evidence, a maximum age policy, and a declared round half up conversion in integer minor units. Missing or stale rates produce `unavailable`.

There are no server foreign keys. A run has one result. A result has one pool summary, many candidates, and many findings. A candidate has many requirement and group evaluations. A finding may reference many candidates and evaluations. The active route references one candidate and one current run. Result, candidate, group evaluation, requirement evaluation, and finding identifiers are unique within the current run. A visible recommendation is a derived view, not another entity.

**State transitions**:

The workspace moves through `empty`, `computing`, `ready`, `unavailableWithPrevious`, and `unavailableWithoutPrevious`. A valid saved profile starts `computing`. A complete run enters `ready`. A boundary or configuration failure enters an unavailable state while labeling any preserved run as previous and keeping current route actions disabled. A newer run replaces the previous run atomically. Active route selection moves from `none` to `selected` only for a qualified candidate in the current run, and returns to `none` when invalidated.

**API surface**:

| Surface | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `diagnoseAndRecommend` | Pure function call | validated profile, catalog, exchange rates, explicit `planningDate`, evaluation policy | complete `DiagnosisResult` | private local workspace | typed boundary issue before call, internal invariant failure during development |
| Diagnosis boundary adapter | Client function | saved profile envelope, catalog data, exchange rate data, validated policy object | `ready` run or `unavailable` issue list | none | invalid profile, invalid catalog, invalid rates, unsupported qualification, policy mismatch |
| Atomic diagnosis reducer event | Client action | complete run, request identifier, input revision | replaced run and preserved or cleared active route | none | stale completion is discarded |
| Active route selection event | Client action | current `programId` | `ActiveRouteSelection` or unchanged state | none | unknown program, unqualified program, stale result |
| Evidence disclosure | Client action | evaluation or evidence reference from current run | source label, verification date, applicability, official URL | none | broken reference violates the run invariant and enters `unavailable` |

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Build candidate pool | subject, degree level, intake, country filters | saved profile target and catalog program classification |
| Evaluate eligibility | profile facts, requirement values, applicability, outcome | saved profile, catalog requirements, rule policy |
| Evaluate feasibility | budget, dates, effort, task constraints, exchange conversion, missing values | saved profile, catalog facts, pinned exchange dataset, constraint graph engine |
| Rank candidates | resilience, feasibility, academic fit, catalog order, rank tuple | constraint graph engine result and catalog sort keys |
| Build findings | strengths, blockers, uncertainties, affected programs, explanation parameters | candidate and requirement evaluations |
| Show evidence | source label, URL, verification date, applicability | catalog evidence referenced by field and requirement identifiers |
| Show shortage | qualified count, missing and blocking causes | candidate evaluations and deterministic filter counts |
| Select active route | selected program and current version tuple | qualified candidate in current reducer result |
| Show loading and error state | state label and stable issue code | reducer state and validated boundary outcome |

**Engine contract required before implementation**:

The constraint graph spec must provide a validated policy object and a pure result contract before this feature is built. It must define exact mappings for coverage status, leaf and group outcomes, band aggregation, optional and manual review behavior, feasibility inputs, resilience and academic fit bands, ranking ordinals, reason priority, and unsupported qualifications. Version compatibility between profile, catalog, policy, and exchange data is required. The first feasibility slice is limited to complete academic and language checks, directly supported deadlines, and complete normalized annual costs. Effort, resilience margins, and broader route feasibility remain `insufficient_data` until their task and shock inputs are specified.

**Key invariants**:

• The domain function receives validated values and an explicit `planningDate`; it never reads the clock.

• Components consume semantic result states and never compute eligibility, feasibility, ranking, or repair.

• Every run carries the exact validated input references used to resolve every displayed value. Stable profile field IDs, catalog evidence IDs, program scoped requirement IDs, rule IDs, and canonical derived ID formulas are mandatory.

• Unknown, unsupported, and manual review requirements never become automatic passes.

• A qualified candidate must have eligibility `eligible` or `conditional` and feasibility `feasible` or `tight`.

• The candidate pool never broadens the applicant's subject, intake, or country choices silently.

• All candidates are evaluated in deterministic catalog order before ranking. Ties resolve through explicit tuple fields and stable program sort keys.

• A stale computation cannot replace a newer result. An active route must reference a qualified candidate in the current run and includes the current run identifier.

• Currency conversion uses exact decimal rates, integer minor units, round half up at the final converted amount, and the pinned exchange dataset. No runtime exchange request is permitted.

• Derived runs are not persisted by this feature. An unavailable state labels any previous run and disables current selection actions.

• Findings are selected by a versioned priority tuple, grouped by explanation code and source set, and show up to three reasons without padding. The complete ordered list remains inspectable.

• The interface uses native disclosure semantics or an equivalent button and region pair, restores focus after recomputation or error, exposes state changes through a live status region, labels every status with text and icon, and names one next action for ready, shortage, and unavailable states.

**Security model**:

The result is private to the local browser workspace. There are no roles, accounts, tenants, server writes, or remote reads. Profile data, scores, budgets, dates, program identifiers, route details, free text, and storage payloads must not enter analytics or error reporting. Browser state and repository data are untrusted at their boundaries and pass Zod validation. Evidence links are external navigation only and cannot change computed results.

**Configuration required**:

None. No environment variables, credentials, or third party runtime services are required. The validated catalog, policy, and exchange dataset are statically imported or passed as a validated serialized snapshot from the server boundary. The implementation must choose one of these two equivalent delivery forms before coding.

**Critical test scenarios**:

• Happy path: save a valid profile, compute the complete result, inspect the diagnosis, view three qualified recommendations, and select one active route, verifies **AC-1**, **AC-5**, **AC-7**, **AC-9**.

• Traceability path: open a decisive reason and verify its input fields, program data, rule, evidence label, verification date, and URL, verifies **AC-4**, **AC-8**.

• Unknown path: leave a relevant fact unknown or use a manual review requirement and verify the result remains explicit uncertainty, verifies **AC-2**, **AC-4**, **AC-11**.

• Shortage path: use a profile with fewer than three qualified candidates and verify the explanation names the blocking or missing inputs without promoting an unqualified program, verifies **AC-5**, **AC-10**.

• Currency path: compare a non euro budget with a program cost using exact rates, integer minor units, final round half up, and dataset version traceability, verifies **AC-1**, **AC-8**.

• Replacement path: submit two saved profile computations in quick succession and verify the stale completion is discarded and no partial result is visible, verifies **AC-12**.

• Invalid configuration path: provide malformed catalog or exchange data and verify `unavailable`, stable issue details, recoverable retry or reset, and preservation of the last complete result, verifies **AC-13**.

• Responsive accessibility path: complete diagnosis and evidence inspection with keyboard focus at phone and desktop widths, verifies **AC-7**, **AC-15**.

## Build plan

1. Accept the constraint graph and route repair spec, or a diagnosis engine child spec, including policy objects, group evaluation, band aggregation, feasibility limits, resilience and academic fit definitions, ranking ordinals, reason priority, traceability IDs, and unsupported qualification handling. This is a prerequisite for **AC-2**, **AC-4**, **AC-6**, **AC-8**, and **AC-11**.

2. Add the pinned exchange rate, evaluation policy, profile field registry, and catalog evidence identifier schemas with exact conversion and compatibility validation, satisfies **AC-1**, **AC-8**, and **AC-13**.

3. Define the diagnosis run, result, candidate pool summary, group evaluation, candidate evaluation, finding schemas, stable outcome vocabularies, canonical identifiers, version tuple, deterministic sort keys, and boundary adapter, satisfies **AC-1**, **AC-2**, **AC-4**, **AC-10**, **AC-11**, **AC-13**.

4. Implement the pure `diagnoseAndRecommend` composition over the constraint graph engine, retaining all candidate evaluations and deriving qualified recommendations, findings, shortage explanations, and ranking, satisfies **AC-3**, **AC-5**, **AC-6**, **AC-7**, **AC-10**.

5. Add reducer events for atomic run replacement, request and input revision checks, stale completion rejection, previous run labeling, and qualified active route selection, satisfies **AC-9**, **AC-12**, **AC-13**, and **AC-14**.

6. Build the diagnosis workspace with summary findings, top three recommendation cards, expanded result views, active route selection, shortage states, loading states, unavailable states, and evidence disclosure using the 0003 visual language, satisfies **AC-7**, **AC-8**, **AC-9**, **AC-10**, **AC-13**, and **AC-15**.

7. Add deterministic unit, integration, and browser coverage for ranking, unknowns, manual review, currency conversion, stale replacement, invalid configuration, traceability, keyboard use, and responsive behavior, satisfies **AC-1** through **AC-15**.

## Consequences

**Positive**:

• Applicants receive an understandable diagnosis before choosing a route.

• Every result remains reproducible, inspectable, and linked to curated evidence.

• The constraint engine stays the one source of domain truth, while the UI remains a renderer of typed output.

• Pinned exchange rates preserve deterministic behavior and avoid runtime dependency failure.

**Negative and tradeoffs**:

• The feature cannot be built safely until the constraint graph and route repair contract is accepted.

• A repository exchange snapshot can become stale and requires curator review and deployment to update.

• Keeping every candidate evaluation increases in memory result size, though the 24 program alpha catalog is small.

• Conditional and insufficient results require more explanation than a simple pass or fail list.

**Neutral**:

• Result persistence remains intentionally deferred to the progress and local persistence feature.

## Follow-up

• [ ] Design and accept the constraint graph and route repair spec, or a diagnosis engine child spec, before implementation.

• [ ] Define the exact engine supplied resilience band, feasibility inputs, task estimates, ranking tuple, group truth tables, reason priority, and unsupported qualification policy in that prerequisite spec.

• [ ] Confirm the official exchange rate snapshot review process, repository file, maximum age, euro base, exact rate precision, and rounding policy in the prerequisite or catalog maintenance decision.

• [ ] Reconcile the scope wording so “at least three” permits fewer than three when the filtered candidate pool has fewer than three qualified programs.

• [ ] Choose whether validated static data is imported in the client bundle or serialized from the server boundary.

• [ ] Enroll this spec in the scope row and add the build milestones after confirmation.

## Rationale

The chosen design keeps the applicant experience simple while preserving the product promise of deterministic, traceable route advice. A single pure entry point makes the feature easy to test and keeps the constraint graph as the only place where domain rules live. Retaining all candidate evaluations allows honest shortage explanations and later inspection without persisting derived data prematurely.

## Options considered

### Option 1: Domain engine result contract with a thin workspace adapter

The constraint engine computes domain facts and the diagnosis feature renders and organizes them.

The benefit is one source of truth, deterministic tests, and a clean boundary between rules and presentation. The cost is a dependency on the separate constraint graph decision.

### Option 2: Feature local evaluator

The diagnosis feature computes eligibility, feasibility, and ranking itself.

The benefit is a faster isolated prototype. The cost is duplicated rules that will disagree with shock and repair behavior and become difficult to reconcile.

### Option 3: Server diagnosis service

The browser sends a profile to a server service for evaluation.

The benefit is centralized computation and future multi device reuse. The cost is a privacy boundary change, new infrastructure, and unnecessary network failure for a small private alpha.

## Rationale detail

Option 1 fits the local first modular monolith, the privacy promise, and the need for shock and repair to use the same rules. Option 2 creates the known failure mode of competing eligibility logic. Option 3 solves a future account and multi device problem that is explicitly out of scope for this release.
