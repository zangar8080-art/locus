# 0001. RouteStress stack architecture

**Date**: 2026-09-18
**Status**: Accepted

## Summary

RouteStress will remain one TypeScript web application for the private alpha. Applicant data stays in the browser, curated program data stays in the repository, and deterministic domain functions compute every diagnosis and repair. This is the fastest safe route to a credible product and preserves clear seams for accounts and PostgreSQL later.

## Decision

**Chosen option**: Option 1: Local first modular monolith

Use one deployable Next.js application with a framework independent TypeScript domain layer, explicit storage interfaces, and no separate API service for the alpha. (basis: `package.json`, `docs/scope/scope.md`, monolith first, Next.js Route Handlers)

The source structure should keep these responsibilities separate:

- `app/` owns routes, layouts, and the minimum client boundaries needed for interaction.
- `src/domain/` owns pure constraint, ranking, critical path, and repair functions. It must not import React, browser storage, analytics, or graph rendering.
- `src/data/` owns Zod schemas, curated program JSON access, and storage interfaces.
- `src/features/` owns applicant facing feature composition and workspace state.
- `src/components/` owns reusable RouteStress interface components built from Tailwind CSS and Radix Primitives.

## Proposed stack

| Layer | Choice | Reason |
|---|---|---|
| Runtime | Node.js 24 LTS | One current supported baseline keeps framework and test behavior consistent. |
| Language | TypeScript 5 in strict mode | Shared types and pure functions suit deterministic rules and the installed scaffold. |
| Application pattern | Modular monolith | One deployable unit fits one developer and the private alpha, while module boundaries protect later growth. |
| Web framework | Next.js 16 App Router with React 19 | It is already installed and covers pages plus the few server endpoints the alpha may need. |
| Styling | Tailwind CSS 4 with local design tokens | It is already installed and supports fast, consistent interface work. |
| Accessible primitives | Radix Primitives | Complex controls gain proven keyboard behavior without inheriting a visual theme. |
| Runtime validation | Zod 4 | The same schemas can validate curated JSON, imports, and stored browser state. |
| Program data | Versioned repository JSON validated by Zod | Transparent curated data is reviewable in source control and needs no service in the alpha. |
| Applicant persistence | `localStorage` behind a typed storage interface | One versioned envelope keeps the alpha simple while leaving room for a future server adapter. |
| Domain engine | Pure TypeScript functions with stable rule identifiers and explicit sorting | The small dataset needs deterministic logic, not a general solver or graph database. |
| Workspace state | Feature scoped React state with a central reducer | Explicit events make propagation understandable without adding a global state package. |
| Graph presentation | React Flow through `@xyflow/react` | It provides interactive graph primitives while all business computation stays in the domain layer. |
| Dates | ISO date only strings plus small pure helpers and `date-fns` | Admissions deadlines are calendar dates, so this avoids accidental timezone shifts. |
| Server surface | No custom Route Handlers in the alpha | Domain computation and persistence need no server behavior; a later feature spec may introduce a named endpoint. |
| Unit and integration tests | Vitest | Fast tests can lock deterministic graph, ranking, repair, validation, and date rules. |
| Browser tests | Playwright | One real browser journey can prove the profile to shock to repair magic moment. |
| Hosting | Vercel deployment with Deployment Protection or an equivalent invite only gate | It matches the framework and prevents an unauthenticated alpha URL from exposing real applicant use. |
| Product analytics | Vercel Web Analytics with aggregate custom events only | It can measure journey completion without sending applicant answers. |
| Error reporting | Sentry with strict scrubbing, no replay, and no profile payloads | Client failures become visible without copying sensitive applicant state. |
| Package manager | npm with the committed lockfile | The repository already uses npm and changing it adds no product value. |

No authentication, primary database, background jobs, file storage, cache, dedicated search, or separate API service belongs in this alpha. Accounts and server persistence require a later decision. PostgreSQL remains the preferred relational destination when that need becomes real, with the storage interface providing the migration seam.

## Architecture rules

- Domain results must depend only on validated inputs, explicit rule versions, and stable sort keys.
- Every diagnosis, ranking, breakage, and repair result must carry `ruleIds`, `ruleVersions`, `inputFieldIds`, `programDataIds`, and `sortKeys` so the interface can explain its source.
- React Flow renders a result and never decides eligibility, ranking, breakage, or repair.
- Browser storage is untrusted input and must pass the same Zod schemas used for repository data.
- Local state uses one versioned Zod envelope with `schemaVersion`, `savedAt`, `profile`, `routeState`, and `progress`. Invalid or incompatible state is ignored and offers a recoverable reset.
- Every curated fact that affects computation or appears in the interface has a stable `fieldId`, `sourceUrl`, `sourceLabel`, and `lastVerified` date.
- Applicant answers, free text, program choices, route state, and identifiers must never enter analytics or error payloads.
- Analytics and error reporting may emit only journey step completion, repair acceptance, validation failure category, and error class. They must not emit applicant answers, scores, budgets, program identifiers, route details, free text, URLs containing state, or storage payloads.
- Calendar dates use `YYYY-MM-DD` values. A single explicit `planningDate` is initialized from the browser local calendar date, displayed to the applicant, passed into domain functions, and frozen in tests. Conversion to `Date` is limited to named helper functions.
- Client components should be as small as interaction requires. Data loading and static composition stay outside client boundaries where possible.
- The alpha adds no custom Route Handlers. Any later server behavior requires a feature spec that names the endpoint and its privacy boundary.
- Diagnosis, ranking, repair, validation, date, traceability, and persistence behavior must have deterministic tests before the private alpha is shared.

## Consequences

**Positive**:

- One language and one deployment keep the 72 hour build understandable and fast.
- Pure domain code can be tested without the interface and reused by later server adapters.
- Local applicant storage honors the stated privacy boundary.
- Transparent repository data makes requirement changes reviewable.

**Negative and tradeoffs**:

- Applicant plans do not sync across devices and can be lost when browser storage is cleared.
- Repository data changes require a new deployment.
- Vercel specific analytics and hosting create some platform coupling.
- Sentry and analytics require careful filtering because accidental payload capture would break the privacy promise.
- Adding accounts later will require a deliberate persistence, identity, and migration spec.

**Neutral**:

- The existing starter interface is disposable, but the installed framework and styling base remain.
- The graph renderer, domain graph, and persisted state are three separate models connected through typed adapters.

## Follow-up

- [ ] Inspect `vercel-labs/agent-skills` when registry access works and decide whether its exact Next.js or Vercel skills improve this repository.
- [ ] Decide identity, PostgreSQL persistence, and browser to server migration before enrolling account support.
- [ ] Turn the architecture level analytics allowlist into exact event names and scrubber tests in the journey measurement feature spec.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).
