<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Product

RouteStress is a private alpha for independent international university applicants. It stress tests an admissions route when scores, timing, budget, or available effort change, then explains the breakage and proposes a deterministic repair. Success means an applicant completes the profile to shock to repair journey without guidance. Applicant state stays on the device. Curated program facts stay transparent and traceable. Product scope lives in `docs/scope/scope.md`.

## Stack

- **Runtime and language**: Node.js 24 LTS, TypeScript 5 in strict mode, npm.
- **Application**: Next.js 16 App Router, React 19, one modular monolith. No custom Route Handlers in the alpha.
- **UI**: Tailwind CSS 4, Radix Primitives, React Flow. React Flow renders domain output and never computes it.
- **Data and state**: Zod 4, versioned repository JSON, versioned `localStorage`, React state with a central reducer, ISO date only strings, `date-fns`.
- **Quality and operations**: Vitest, Playwright, protected Vercel deployment, aggregate Vercel Web Analytics, scrubbed Sentry errors.

## Build approach

**Skateboard**: ship the smallest complete route a real applicant can use, then grow its depth. The default workflow is Alpha, so `/check verify` follows `/develop`; Beta tagged features also run `/test`.

## Commands

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Rules

- Read the relevant current guide in `node_modules/next/dist/docs/` before changing Next.js code.
- Keep domain rules in `src/domain/` as pure TypeScript with no React, storage, analytics, or graph renderer imports.
- Validate repository data and browser state with Zod at every trust boundary.
- Give computed results stable rule identifiers, rule versions, source field identifiers, and explicit sort keys.
- Give every curated fact a source URL, source label, stable field identifier, and last verified date.
- Pass `planningDate` explicitly as `YYYY-MM-DD`; never let domain functions read the clock implicitly.
- Never send applicant answers, scores, budgets, program identifiers, route details, free text, or storage payloads to analytics or error reporting.
- Keep client components as small as interaction requires and keep graph presentation separate from graph decisions.

## Workflow skills

- [`scope`](.agents/skills/scope/) owns the living feature plan. [`architect`](.agents/skills/architect/) owns stack, product, and technical decision specs.
- [`audit`](.agents/skills/audit/) bootstraps context files. [`sync`](.agents/skills/sync/) keeps them current after completed changes.
- [`develop`](.agents/skills/develop/) implements approved specs. [`debug`](.agents/skills/debug/) isolates and fixes defects without adding features.
- [`check`](.agents/skills/check/) verifies real behavior and performs fresh model review. [`test`](.agents/skills/test/) adds regression coverage.
- [`document`](.agents/skills/document/) writes release, change, pull request, and incident prose from repository evidence.

## Specs and tools

Specs live in `docs/specs/`. The accepted foundation is `docs/specs/0001-stack-architecture/index.md`. The Sites connector is available for deployment work, but a private alpha deployment needs access protection.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
