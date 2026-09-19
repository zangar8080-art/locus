# Rationale for RouteStress stack architecture

## Context

> Premise note: The original product sketch allowed a separate FastAPI or Node service plus PostgreSQL. For one developer building a local first private alpha in 72 hours, that creates service, deployment, and data migration work before the product needs it. The right first boundary is a modular monolith with pure domain logic and replaceable storage.

RouteStress must make changes to exam scores, timing, budget, and available effort propagate through a visible admissions route. Results must be deterministic and explainable because a plausible but unstable recommendation would defeat the product promise.

The private alpha targets independent applicants and uses 12 to 20 curated programs across four countries. Applicant data must stay on the device. The first success measure is whether a user can complete the shock and repair journey without guidance. One developer with AI assistance owns the 72 hour build.

The repository is an untouched Next.js scaffold using TypeScript, React, Tailwind CSS, ESLint, and npm. The scope records a Skateboard approach, meaning the build should deliver the smallest complete useful route before expanding breadth.

## Options considered

### Option 1: Local first modular monolith

One Next.js application contains clear presentation, domain, and data modules. Applicant state stays in browser storage, curated program data ships as validated repository JSON, and pure TypeScript owns all decisions. (basis: current repository stack, monolith first, local data privacy, Next.js Route Handlers)

**Pros**:

- Fits the deadline and one person team.
- Keeps applicant data on the device.
- Makes deterministic behavior cheap to test.
- Leaves explicit storage and server seams for later growth.

**Cons**:

- No cross device plans or central data updates.
- A later account release must migrate local data deliberately.

### Option 2: Next.js with PostgreSQL from day one

One web application writes applicant and program data to a relational database, with a typed data layer between domain logic and storage. (basis: relational database default for connected domain data)

**Pros**:

- Supports accounts, synchronization, and an internal data editor sooner.
- Central program updates do not require a frontend deployment.

**Cons**:

- Adds infrastructure, migrations, privacy controls, and failure modes before they deliver alpha value.
- Conflicts with the chosen local applicant data boundary.

### Option 3: Next.js plus a separate API service

The web interface calls a separately deployed Node or Python API that owns domain logic and persistence. (basis: service boundaries should follow an operating or ownership need)

**Pros**:

- Enables independent backend scaling and a future public API.
- Python would make specialized optimization libraries available if they become necessary.

**Cons**:

- Duplicates contracts and deployment work for one developer.
- Creates network and service failure modes around calculations that fit in memory.
- Provides no benefit for the current dataset or local persistence rule.

### Option 4: Formal solver centered architecture

A constraint programming engine or graph platform owns feasibility and repair, with the web app acting mainly as a client. (basis: formal solvers are justified by constraint scale or optimization complexity)

**Pros**:

- Can express more complex optimization problems as the domain grows.
- May support richer explanations if every rule is modeled carefully.

**Cons**:

- Adds a second modeling language and debugging surface.
- Makes the first small dataset harder to explain and ship.
- Risks hiding product rules behind solver behavior the team cannot easily trace.

## Rationale

Option 1 wins because the main risk is product usefulness, not infrastructure scale. A complete route must work soon, applicant data must remain local, and every output must be explainable. One deployable application with pure domain modules gives the shortest path while preserving the only future seams that matter: storage, server exposure, and presentation. (basis: `docs/scope/scope.md`, Skateboard delivery, monolith first)

The runner up is Option 2. PostgreSQL is the right default once accounts, shared data editing, or cross device persistence become real, but installing it before those features would turn a product proof into an infrastructure project. A separate service and a formal solver should wait for measured constraints that the monolith cannot satisfy.

## Landscape notes

- Zod 4 provides TypeScript first runtime schemas suitable for repository JSON and browser state.
- React Flow provides interactive React graph primitives, but it should not own constraint decisions.
- Vitest protects pure domain rules, while Playwright protects the complete browser journey.
- Vercel is aligned with the installed framework and offers preview deployments plus aggregate web analytics.
- Next.js Route Handlers cover the small server surface without requiring another service.

## References

**Project sources**:

- `package.json`, installed runtime and frontend stack.
- `docs/scope/scope.md`, product boundary, privacy rule, delivery approach, and workflow depth.
- `AGENTS.md`, requirement to consult the installed Next.js documentation before code changes.

**Practices and standards**:

- Monolith first for small teams.
- Pure functional core with side effects at module boundaries.
- Runtime validation at trust boundaries.
- Data minimization for analytics and error reporting.
- Stable identifiers and ordering for deterministic systems.

**Links**:

- [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
- [Next.js backend for frontend guidance](https://nextjs.org/docs/app/guides/backend-for-frontend)
- [Zod documentation](https://zod.dev/)
- [React Flow documentation](https://reactflow.dev/)
- [Vitest guide](https://vitest.dev/guide/)
- [Playwright installation guide](https://playwright.dev/docs/intro)
- [Vercel deployment documentation](https://vercel.com/docs/deployments)
- [Vercel Web Analytics privacy guidance](https://vercel.com/docs/analytics/privacy-policy)
