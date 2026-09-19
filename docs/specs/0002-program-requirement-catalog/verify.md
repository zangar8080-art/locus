# Verify: Program requirement catalog · spec 0002 · updated 2026-09-18

_Steps derived from spec 0002 acceptance criteria. `/check verify` runs these. `/test` may later lock the durable checks._

## Data review

- [x] Open `src/data/programs/catalog.json`. Confirm it contains 24 programs, eight named subject definitions, three distinct institutions per subject, and all four country codes. This verifies **AC-1**.
- [x] Inspect the `coverage` object on several programs. Confirm all ten requirement keys exist even when the status is unknown or confirmed not required. Confirm every type has at least one positive example across the catalog. This verifies **AC-2**.
- [x] Inspect a known fact and an unknown fact. Confirm each has a stable field ID and official evidence with a label, URL, verification date, and applicability. This verifies **AC-3** and **AC-5**.
- [x] Inspect the Manchester, Waterloo, Imperial, and UCL pilot records. Confirm their IB totals and Higher Level requirements preserve the published values. This verifies **AC-4**.
- [x] Inspect the Manchester subject rule. Confirm Mathematics is combined with an `anyOf` science choice. Inspect the Waterloo language and UCL interview rules. Confirm unsupported conditions require manual review. This verifies **AC-10**.
- [x] Open `src/data/programs/README.md`. Confirm it documents selection, cohort, versions, updates, evidence review, and known gaps. This verifies **AC-9**.

## Value sourcing

- [x] Load the catalog twice and compare program IDs. Confirm dataset versions come from top level JSON fields and output order stays identical. This exercises dataset metadata and stable ordering from the repository data. It verifies **AC-6**.
- [x] Trace one program title, campus, language, degree level, intake, and country to its fact evidence. This exercises sourced program identity values. It verifies **AC-3**.
- [x] Trace one subject, impact, display label, and sort key to the versioned editorial policy fields rather than university evidence. This exercises editorial classifications.
- [x] Trace one known requirement value and one unknown value to their typed requirement records and evidence. This exercises requirement value sourcing. It verifies **AC-3** and **AC-5**.
- [x] Evaluate the Manchester prerequisite group as Mathematics plus one science choice. Confirm it is not flattened into five mandatory subjects. This exercises alternative rule sourcing. It verifies **AC-10**.
- [x] Inspect the Waterloo language and UCL interview conditions. Confirm both block automatic eligibility and surface manual review. This exercises evaluation safety. It verifies **AC-10**.
- [x] Compare the reported subject counts, country set, and requirement coverage with the validated program records. This exercises derived coverage values. It verifies **AC-1** and **AC-2**.
- [x] Break one field in a temporary copy and run the validator. Confirm the error names the record and field path. This exercises issue sourcing from Zod paths and stable IDs. It verifies **AC-7** and **AC-8**.
- [x] Follow one source URL from a fact. Confirm the label describes the official page and the hostname belongs to the institution allowlist. This exercises evidence review. It verifies **AC-3**.
- [x] Compare a cycle specific fact with a cycle independent fact. Confirm only applicable evidence establishes a known 2027 value. This exercises evidence applicability. It verifies **AC-5**.

## Commands

- [x] `npm run validate:catalog` prints `Catalog 2027.1.0 is valid: 24 programs, 8 subjects.` and exits successfully. This verifies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**, and **AC-10**.
- [x] `npm test` reports eight passing catalog tests. This verifies **AC-8**.
- [x] `npm run lint` exits successfully.
- [x] `npx tsc --noEmit` exits successfully.
- [x] `npm run build` runs the catalog prebuild gate and completes the Next.js production build. This verifies **AC-6** and **AC-7**.

## Acceptance criteria coverage

- **AC-1** is covered by the release shape review and catalog validation command.
- **AC-2** is covered by the coverage review and catalog validation command.
- **AC-3** is covered by fact, identity, requirement, and evidence tracing.
- **AC-4** is covered by the pilot IB record review and catalog validation command.
- **AC-5** is covered by unknown fact and evidence applicability checks.
- **AC-6** is covered by stable loading and the production build gate.
- **AC-7** is covered by invalid copy validation and the production build gate.
- **AC-8** is covered by the automated test command.
- **AC-9** is covered by the catalog README review.
- **AC-10** is covered by alternative rule and manual review checks.

## Hardening slice

- [x] Call `parseProgramRecord` with one valid program and with duplicate local requirement and field IDs. Confirm the valid record parses and the invalid record reports stable local paths. This verifies **AC-7** and **AC-8**.
- [x] Change a cycle specific evidence `intakeId` to a different intake and run `assertCatalogRelease`. Confirm the release fails with the evidence applicability path. This verifies **AC-3** and **AC-5**.
- [x] Change an IB subject ID, admissions test ID, or bounded test result to an unsupported value. Confirm structural parsing fails before release validation. This verifies **AC-7** and **AC-8**.
- [x] Replace a release program's degree or instruction language fact with an evidenced unknown. Confirm the release fails because the selected program identity is not established. This verifies **AC-1** and **AC-3**.
- [x] Add a forward requirement reference from one coverage type to a requirement in another type. Confirm the reference is accepted when the target exists and rejected when it does not. This verifies **AC-10**.
- [x] Set a deadline time to `99:99` and a time zone to an invalid name. Confirm structural parsing reports both invalid values. This verifies **AC-7**.
- [x] Load the catalog twice, attempt to mutate the first result, and confirm the cached result remains unchanged. Confirm program ordering remains subject order, program sort order, and ordinal ID order. This verifies **AC-6**.
