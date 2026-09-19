# 0006. Constraint graph and route repair

**Date**: 2026-09-19
**Status**: In Progress

## Summary

This spec defines the deterministic engine behind RouteStress diagnosis, shocks, and repair. Pure TypeScript functions transform a validated profile and curated catalog into a traceable route graph, feasibility bands, breakages, ranked repairs, and one immediate action. The engine stays local, predictable, and separate from React and graph rendering.

## Context

RouteStress must show what changes when an applicant’s assumptions change. The MVP currently uses a narrow diagnosis assumption, but the shock and repair lab needs one shared rule engine so diagnosis and repair never disagree. The engine must remain understandable for a small curated catalog and must not predict admission probability.

## Requirements

**Acceptance criteria**:

• **AC-1**: Given a validated saved profile, validated catalog, explicit planning date, and versioned policy, the engine returns a complete route result with nodes, dependency edges, eligibility, feasibility, breakages, traceability, and stable sort keys.

• **AC-2**: Every program receives eligibility `eligible`, `conditional`, `blocked`, or `insufficient_data`, and feasibility `feasible`, `tight`, `infeasible`, or `insufficient_data`.

• **AC-3**: The graph represents profile facts, program requirements, tasks, timing constraints, cost constraints, and dependency edges as typed records. React Flow only renders this result.

• **AC-4**: Requirement groups use explicit `allOf` and `anyOf` truth rules. A failed branch of an `anyOf` group never becomes a blocker when another branch satisfies the group.

• **AC-5**: Unknown facts, unsupported conditions, and manual review requirements remain explicit and never become automatic passes.

• **AC-6**: The first shock scenarios support IELTS score changes and IELTS timing delays. The model provides a typed extension point for budget, effort, and other future variables.

• **AC-7**: Applying a shock recomputes all affected nodes and programs from the changed scenario without mutating the saved profile or active route until the applicant confirms it.

• **AC-8**: A breakage identifies what changed, what broke, the affected program or task, the rule that caused it, and the source profile and catalog fields involved.

• **AC-9**: Repairs are ranked deterministically by smallest change, restored feasibility, applicant effort, and stable action order. The result names one immediate feasible action.

• **AC-10**: The same validated inputs, planning date, policy version, and shock always produce the same result, ordering, identifiers, and repair action.

• **AC-11**: No engine result contains admission probability or an implied chance of acceptance. Feasibility describes route mechanics only.

• **AC-12**: Invalid input, incompatible versions, missing required policy data, or unsupported shocks return stable issues and never produce a partial route result.

• **AC-13**: Domain code has no React, browser storage, analytics, error reporting, graph renderer, network, or clock imports.

• **AC-14**: Engine results contain `ruleIds`, `ruleVersions`, `inputFieldIds`, `programDataIds`, `evidenceRefs`, and explicit sort keys for every computed decision.

## Decision

**Chosen option**: A pure deterministic constraint graph engine with a named shock adapter and ranked repair planner.

Use one public `computeRouteResult` function for the baseline route and one public `applyRouteShock` function for a scenario copy. Internally separate validation, candidate filtering, leaf requirement evaluation, group aggregation, graph construction, band aggregation, breakage detection, and repair ranking. Use integer ordinals and canonical identifier formulas for all ordering and identity decisions.

The first feasibility slice evaluates complete academic and language requirements, directly supported deadlines, and complete normalized annual costs. Effort estimates, resilience margins, and broader route feasibility return `insufficient_data` until the repository contains their task and shock data. IELTS score changes and timing delays are first class shocks. Budget and effort shocks use the same typed interface later.

**Normative policy**:

Leaf outcomes are `pass`, `conditional`, `blocker`, `insufficient_data`, `manual_review`, and `not_applicable`. An `allOf` group ignores `not_applicable` and uses precedence `blocker`, `manual_review`, `insufficient_data`, `conditional`, `pass`. All children not applicable yields `not_applicable`. An `anyOf` group ignores `not_applicable` and uses precedence `pass`, `conditional`, `manual_review`, `insufficient_data`, `blocker`. All children not applicable yields `not_applicable`.

Coverage maps as follows. `confirmed_not_required` is an evidenced pass. `not_applicable` is not applicable. `required` has hard impact. `optional` has advisory impact. `conditional` evaluates its supported condition, false becomes not applicable, and an unsupported condition becomes manual review. Coverage `unknown` becomes insufficient data. Manual review or insufficient data on a mandatory material requirement produces program insufficient data, not blocked.

Eligibility is `blocked` when a known mandatory hard blocker exists. Otherwise it is `insufficient_data` when mandatory material review or missing data remains. Otherwise it is `conditional` when a mandatory conditional remains. Otherwise it is `eligible`.

Feasibility is `infeasible` for a known failed supported deadline or a complete normalized annual cost above budget. It is `insufficient_data` for unknown required cost or timing, or unsupported effort and resilience dimensions. It is `feasible` when every in scope supported constraint passes. `tight` is reserved until a later policy adds exact cost headroom and day margin thresholds.

IELTS overall scores use half bands represented as integer band halves from 0 through 18. Only a completed score is evidence of a pass. Planned or booked tests may support a conditional result, never an achieved score. A timing shock adds exactly 42 calendar days to the planned date. A versioned policy supplies a 14 calendar day result buffer before a deadline comparison.

Repair generation is finite. It creates only known threshold or date targets from evaluated requirements. A repair must restore at least one hard blocker and add no new hard blocker. Its tuple is `restoresActiveRoute`, remaining hard blockers, remaining unknowns, change magnitude, effort ordinal, action ordinal, and stable target identifier. A repair target describes a route restoring condition, not the probability that an applicant can achieve it.

The input key is a canonical serialization of schema versions, profile schema version, catalog dataset version, exchange dataset version, policy version, planning date, scenario variable, and scenario value. It excludes applicant values from logs and telemetry. Structural identifiers use program and requirement identifiers, relation kind, and escaped ASCII components. The same logical node keeps its identifier across baseline and scenario results.

Issues use a closed registry: `invalid_input`, `incompatible_version`, `missing_policy_entry`, `unsupported_qualification`, `unsupported_shock`, `stale_baseline`, and `broken_reference`. Each issue has a dot path, source enum, retryable flag, and deterministic path then code order. Valid curated unknowns and manual review are complete result states, not issues.

**Implementation skills**: none beyond the project workflow and stack conventions in `AGENTS.md`.

## Feature design

**Data model sketch**:

• `EngineInput` contains the validated profile, catalog, exchange dataset, explicit `planningDate`, policy object, and optional `scenario`.

• `Scenario` is either `baseline` or a typed override with `variableId`, original value, changed value, and reason. The first variable IDs are `ielts_overall_score` and `ielts_planned_date`.

• `RouteResult` contains schema and policy versions, `inputKey`, `candidatePoolSummary`, `graphNodes`, `graphEdges`, `programResults`, `criticalPath`, `breakages`, `repairs`, and `nextAction`.

• `GraphNode` has a stable `nodeId`, node kind (`profile_fact`, `requirement`, `task`, `deadline`, `cost`, or `program`), status, labels, source identifiers, and sort key.

• `GraphEdge` has a stable `edgeId`, source node, target node, relation kind, rule identifiers, and sort key.

• `RequirementEvaluation` has program scoped `requirementId` or coverage reference, outcome, impact, rule ID and version, input field IDs, program data IDs, evidence references, explanation code, and sort key.

• `RequirementGroupEvaluation` has `groupId`, operator, outcome, child evaluation IDs, and rule trace.

• `ProgramResult` has `programId`, eligibility band, feasibility band, resilience band when supported, academic fit band when supported, evaluated requirements, decisive reasons, and rank tuple.

• `Breakage` has `breakageId`, changed source, affected node IDs, affected program IDs, severity, explanation code, rule trace, source identifiers, and sort key.

• `Repair` has `repairId`, action type, changed variable, from value, to value, restored constraints, remaining hard blockers, remaining unknowns, effort ordinal, rank tuple, and one immediate action code with parameters.

• `EngineIssue` has stable code, path, source, retryability, and deterministic order. No partial `RouteResult` is returned with issues.

There is no database migration. All entities are in memory value objects. IDs are unique within one result. A route result has one candidate pool summary, many nodes, edges, program results, breakages, and repairs, and one critical path. Edges reference nodes in the same result. Repairs reference breakages and changed variables in the same scenario.

The candidate pool includes programs matching the saved subject, catalog undergraduate degree, exact intake identifier, and selected countries. Excluded programs are represented only by filter counts and stable exclusion reasons. Graph node statuses are `pass`, `conditional`, `blocker`, `unknown`, `manual_review`, and `not_applicable`. Edge directions point from source fact or task to the requirement or program it constrains. The critical path is the ordered set of blocking or tight timing and cost nodes with the greatest dependency depth; when timing data is incomplete it is `insufficient_data`.

**State transitions**:

The scenario state moves from `baseline` to `staged` when an override is edited, then to `applied` only after explicit confirmation. Cancel returns to `baseline`. A shock never mutates the saved profile. A failed computation leaves the last complete baseline or scenario result visible and labels it as previous.

**API surface**:

| Surface | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `computeRouteResult` | Pure function | validated profile, catalog, exchange data, planning date, policy | complete baseline `RouteResult` | local only | invalid input, incompatible version, missing policy data |
| `applyRouteShock` | Pure function | baseline result, validated scenario, same policy and input references | complete scenario `RouteResult` with breakages and repairs | local only | unsupported shock, stale baseline, invalid override |
| `confirmScenario` | Reducer action | scenario result and explicit confirmation | updated active route state | local only | no staged result, invalid route |
| `selectRepair` | Reducer action | current repair ID and result key | selected repair action | local only | unknown repair, stale result |

**Value sourcing**:

| Action | Value | Source |
|---|---|---|
| Filter programs | subject, intake, countries, degree | saved profile and catalog classification |
| Evaluate requirements | applicant value, requirement value, applicability | profile, catalog, policy |
| Evaluate groups | child outcomes and operator | requirement evaluations and catalog rule groups |
| Build timing constraints | planning date, intake date, deadline, test date | profile timing, catalog dates, scenario override |
| Build cost constraints | annual budget, fee amount, currency, rate | profile budget, catalog cost facts, pinned exchange dataset |
| Build graph | nodes, edges, labels, statuses | evaluated constraints and policy relation rules |
| Compute bands | eligibility and feasibility | leaf outcomes, group outcomes, constraint aggregation truth tables |
| Detect breakage | changed variable, affected constraints, reason | baseline result, scenario result, dependency edges |
| Rank repairs | change size, restored feasibility, effort, action order | repair candidates, policy ordinals, stable action keys |
| Show next action | one feasible action | highest ranked repair with no unresolved hard blocker |
| Trace result | rules, inputs, program data, evidence | policy, profile field registry, catalog identifiers, evidence records |

**Key invariants**:

• Domain code receives `planningDate` explicitly and never reads the clock.

• Unknown and manual review outcomes never become automatic passes.

• `anyOf` groups pass when one child passes and produce conditional or insufficient data only under the named truth table.

• A scenario is immutable after computation. Confirmation changes reducer state, not the engine result.

• All comparisons use exact decimal or integer representations. Locale dependent string ordering is forbidden.

• Every result is sorted by explicit numeric or ordinal keys, then stable identifiers.

• Every computed value has stable rule, version, input, program, evidence, and sort references.

• Repair ranking never uses admission probability.

• Unsupported shock variables return a stable issue rather than a guessed result.

**Security model**:

The engine runs locally and receives validated browser state. It has no user roles, server authority, network calls, analytics, or error reporting. Results must not be sent outside the device. The engine must not log profile values, scores, budgets, program identifiers, or free text.

**Configuration required**:

None. Policy and exchange data are versioned repository inputs. No secrets or runtime services are required.

**Critical test scenarios**:

• Baseline route computation produces stable graph nodes, edges, bands, and trace identifiers, verifies **AC-1**, **AC-3**, **AC-10**, **AC-14**.

• An `anyOf` group with one passing branch does not create a blocker, verifies **AC-4**.

• Unknown and manual review requirements remain explicit, verifies **AC-5**, **AC-12**.

• IELTS score moves from 7.0 to 6.0 and affected language requirements, programs, and breakages change, verifies **AC-6**, **AC-7**, **AC-8**.

• IELTS timing moves six weeks later and affected deadline dependencies change, verifies **AC-6**, **AC-7**, **AC-8**.

• The top repair is stable and names one immediate action, verifies **AC-9**, **AC-10**, **AC-11**.

• An unsupported shock or incompatible policy returns ordered issues without a partial result, verifies **AC-12**.

## Build plan

1. Define Zod schemas for policy, scenarios, route results, graph nodes and edges, evaluations, breakages, repairs, and issues, satisfies **AC-1**, **AC-3**, **AC-12**, **AC-14**.

2. Implement deterministic requirement and group evaluation with explicit truth tables and traceability, satisfies **AC-2**, **AC-4**, **AC-5**, **AC-14**.

3. Implement graph construction, supported timing and cost constraints, and band aggregation, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-10**.

4. Implement IELTS score and timing shocks, dependency breakage detection, repair candidates, and deterministic repair ranking, satisfies **AC-6**, **AC-7**, **AC-8**, **AC-9**, **AC-11**.

5. Integrate the engine with the diagnosis and workspace reducer, keeping staged scenarios separate from saved profile state, satisfies **AC-7**, **AC-12**, **AC-13**.

6. Add unit and browser coverage for truth tables, deterministic ordering, shocks, repairs, unknowns, invalid inputs, privacy boundaries, and accessibility, satisfies **AC-1** through **AC-14**.

## Consequences

**Positive**:

• Diagnosis and shock repair share one domain truth.

• Every breakage and repair remains explainable and reproducible.

• Local pure functions are easy to test and do not require a server.

**Negative and tradeoffs**:

• The first release returns insufficient data for unsupported effort and resilience inputs.

• Truth tables and stable identifiers require more upfront modeling than a direct score calculation.

• Curated task and cost data must grow before broader feasibility becomes useful.

**Neutral**:

• React Flow remains a renderer. It does not own graph decisions.

## Follow-up

• [ ] Add versioned task effort estimates before enabling effort shocks.

• [ ] Add named resilience margins before displaying a resilience band beyond insufficient data.

• [ ] Ratify the exchange rate snapshot and cost normalization policy with the catalog maintenance work.

## Rationale

The pure graph engine is the smallest architecture that can support diagnosis and shock repair without duplicating rules. Named IELTS shocks give the Beta feature a concrete proof while the typed scenario interface keeps future variables extensible. Returning insufficient data is safer than inventing effort or resilience estimates.

## Options considered

### Option 1: Pure deterministic graph engine

One local domain engine computes baseline routes, shocks, breakages, and repairs. It is simple to test and preserves privacy, but it requires explicit truth tables and curated inputs.

### Option 2: Numeric route score

A single score ranks programs and repairs quickly. It is easy to display, but it hides why a route breaks and cannot support traceable dependency repair.

### Option 3: Remote solver service

A server or general solver computes routes. It could support larger models later, but it adds privacy, network, and operational costs that the private alpha does not need.

## Rationale detail

Option 1 fits the current catalog size, local first architecture, and requirement for deterministic explanations. Option 2 would make the product look precise without making its reasoning inspectable. Option 3 is deferred until accounts or scale create a real need.
