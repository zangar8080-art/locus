# 0002. Program requirement catalog

**Date**: 2026-09-18
**Status**: In Progress

## Summary

RouteStress will keep a small, versioned catalog of 24 undergraduate programs in repository JSON. Zod schemas will validate every record before use. Each fact will remain traceable to official university evidence, and missing facts will stay explicitly unknown.

## Requirements

**User stories**:

1. As an applicant, I want program requirements to use consistent categories so that later recommendations compare meaningful facts.
2. As an applicant, I want every material fact to show where it came from so that I can verify it.
3. As a curator, I want invalid or incomplete records rejected with precise issue paths so that catalog errors do not reach applicants.

**Acceptance criteria**:

1. **AC-1**: The release catalog contains exactly 24 English taught undergraduate programs for 2027 entry, with three programs from three distinct institutions in each named subject area and representation across the UK, Canada, the Netherlands, and Australia.
2. **AC-2**: Every program records a reviewed coverage state for all ten requirement types. The release catalog includes at least one positively established, applicable requirement of each type.
3. **AC-3**: Every curated fact has a stable field identifier, an official source URL, a source label, and an ISO verification date.
4. **AC-4**: Academic requirements use the International Baccalaureate Diploma baseline, including total points and Higher Level subject constraints where the official source publishes them.
5. **AC-5**: Missing 2027 facts are represented as explicit unknown values with an enumerated reason and evidence of the page reviewed. They are never treated as a passed requirement or as a confirmed absence.
6. **AC-6**: A deterministic loader validates the full dataset at the repository boundary and returns typed, stable order output.
7. **AC-7**: A validation command fails for invalid data and reports actionable record and field paths.
8. **AC-8**: Automated checks cover valid loading, duplicate identifiers, malformed dates, missing evidence, invalid unknown values, and requirement specific validation.
9. **AC-9**: One catalog README explains the format, selection policy, applicant cohort, update process, version policy, known gaps, and source review checklist.
10. **AC-10**: Alternative and conditional rules preserve official meaning through explicit rule groups. Any condition outside the supported model is marked for manual review and cannot produce an automatic eligibility pass.

## Decision

**Chosen option**: Option 1: Typed repository JSON with manual curation

Use versioned repository JSON, a Zod 4 schema, and a deterministic loader. Keep the program catalog public and read only at runtime. Separate sourced university facts from editorial classifications and normalization policy.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

## Feature design

**Data model sketch**:

| Entity | Key fields | Relationships and constraints |
|---|---|---|
| `ProgramCatalog` | `schemaVersion`, `datasetVersion`, `entryCycle`, `normalizationPolicyVersion`, `subjects`, `institutions`, `programs` | The release catalog contains exactly 24 unique programs. `schemaVersion` is the supported integer literal. `datasetVersion` follows semantic versioning. `entryCycle` is `2027`. |
| `SubjectDefinition` | `subjectId`, `displayLabel`, `sortKey` | The eight IDs are `computer_science`, `engineering`, `business_management`, `economics_finance`, `natural_sciences`, `social_sciences`, `humanities`, and `design_architecture`. Sort keys are 10 through 80 in that order. |
| `Institution` | `institutionId`, sourced name and country facts, `officialHostnames` | Hostnames form an exact allowlist. A source hostname must equal an allowed hostname or be its subdomain. Exceptions require an editorial review note. |
| `Program` | `programId`, `institutionId`, `courseId`, `campusId`, `intakeId`, sourced identity facts, `classification`, `coverage` | Identity is institution plus course plus campus plus intake. Each program has one editorial subject classification. IDs are immutable and are not regenerated when titles change. |
| `ProgramClassification` | `subjectId`, `subjectSortKey`, `programSortKey`, `policyVersion`, `editorialNote` | This is editorial metadata, not a sourced university fact. An interdisciplinary program receives exactly one primary subject under the named policy version. Sort keys are integers from 0 through 9999. |
| `CuratedFact<T>` | `fieldId`, `state`, known value or unknown reason, `evidence` | `fieldId` is unique within a program. Only externally supported values use this wrapper. Known and unknown are a discriminated union. |
| `Evidence` | `sourceUrl`, `sourceLabel`, `lastVerified`, `applicability` | `lastVerified` is a real ISO calendar date. Applicability is cycle specific or cycle independent and names the intake and applicant cohort when relevant. |
| `RequirementCoverage` | one entry for each requirement type, `status`, `requirements`, `reviewNote` | Status is `required`, `optional`, `conditional`, `confirmed_not_required`, `unknown`, or `not_applicable`. Omission is invalid. Positive coverage requires at least one applicable requirement record. |
| `Requirement` | `requirementId`, `type`, `classification`, `officialLabel`, typed facts, `evaluation` | `classification` contains editorial impact, sort key, and policy version. `officialLabel` and values are sourced facts. Evaluation is automatic or manual review. |
| `RequirementGroup` | `groupId`, `operator`, `children` | Operator is `allOf` or `anyOf`. Children are requirement IDs or nested groups. Cycles and empty groups are invalid. |
| `AcademicThreshold` | IB qualification, total point range, optional Higher Level total range | IB total bounds are integers from 0 through 45. Higher Level totals are integers from 0 through 28. Minimum cannot exceed maximum. |
| `SubjectPrerequisite` | normalized IB subject ID, IB level, grade range | Level is `HL` or `SL`. Grades are integers from 1 through 7. Subject IDs come from a versioned registry with official aliases preserved as facts. |
| `LanguageTest` | IELTS Academic overall score and optional component scores | Components are listening, reading, writing, and speaking. Scores are from 0 through 9 in increments of 0.5. An absent published component minimum and an unpublished minimum are different states. |
| `AdmissionsTest` | registry test ID, requirement status, optional result scale and date | Each test registry entry defines its result unit and valid bounds. Unknown results remain explicit facts. |
| `Deadline` | stage, round, cohort, local date, optional local time and timezone | Stages are standard application, early application, scholarship, portfolio, supporting documents, and acceptance. No time or timezone is inferred. Published zones use IANA names. |
| `Cost` | category, amount in minor units, currency, academic year, fee period, fee basis, cohort | Categories are tuition, application fee, deposit, materials, and living estimate. Currencies are GBP, CAD, EUR, or AUD. Fee basis is annual, per credit, total program, or one time. No conversion is stored. |
| `Document` | normalized document type, requirement status | Types are transcript, predicted grades, diploma, personal statement, reference, passport, English test result, portfolio, CV, or other. Source wording is retained. |
| `Portfolio` | requirement status, optional format fact | Used for portfolio or work sample requirements. Applicable but unpublished format details are explicit unknowns. |
| `Interview` | requirement status, optional mode | Modes are online live, in person, recorded, or officially unspecified. |
| `ActivityExperience` | normalized activity kind, requirement status, optional duration | Kinds are work experience, extracurricular, volunteering, competition, research, or other. Duration uses a positive integer and hours, weeks, months, or years. |

The target applicant cohort is an international fee paying applicant using the IB Diploma for standard first year entry. Transfer, foundation, domestic fee, exchange, graduate, part time, and licensed professional pathways are outside the first catalog. Programs must be English taught and use the primary campus named by the record. Each subject has three distinct institutions. Country balance is enforced across the whole catalog, not within every subject.

A requirement condition that can be expressed by the supported cohort, intake, IB subject, test, or application stage fields may use structured conditions. Other conditions preserve official wording, set evaluation to manual review, and block an automatic eligibility pass. Published offer ranges use inclusive minimum and maximum values. A single threshold uses equal bounds.

Known sourced program identity facts are institution name, country, official program title, campus name, degree level, instruction language, intake label, and intake start date when published. Structural IDs, normalized subject IDs, classifications, policy versions, impact, display labels, and sort keys are editorial metadata. Editorial values carry their policy version and do not pretend to be university claims.

Unknown reasons are `unpublished_for_cycle`, `not_found_on_reviewed_sources`, `conflicting_official_sources`, `source_unavailable`, and `unsupported_condition`. A structurally inapplicable subfield is omitted. An applicable but unavailable value uses an unknown fact. A confirmed absence uses the coverage status `confirmed_not_required` with supporting evidence.

There is no persistence migration. JSON files are the source of truth. TypeScript types are inferred from the Zod schemas so the runtime and compile time models cannot drift.

**API surface**:

| Surface | Kind | Inputs | Outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `loadProgramCatalog` | Server side function | None | Release validated `ProgramCatalog` in stable order | Not applicable | Throws `CatalogValidationError` with stable issue paths when bundled data is invalid |
| `parseProgramRecord` | Pure structural function | Unknown input | One typed program or structured issues | Not applicable | Invalid JSON shape, duplicate local IDs, invalid fact shape, bad dates, unsupported values |
| `validateCatalogRelease` | Pure coverage function | Structurally valid catalog | Coverage report or stable ordered issues | Not applicable | Wrong count, subject or country gaps, missing type coverage, duplicate global IDs |
| `npm run validate:catalog` | Build command | Repository catalog files | Human readable validation result and process exit code | Local developer access | File path errors for unreadable or malformed JSON, then record and field paths for schema or coverage issues |

No custom Route Handler is added. Later domain features consume `loadProgramCatalog` through TypeScript imports.

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Load catalog | Dataset and schema versions | Top level repository JSON fields |
| Load catalog | Program identity | Program curated facts with applicable official evidence |
| Load catalog | Subject, impact, labels, and ordering | Versioned editorial classification and normalization policy |
| Load catalog | Requirement values and impact | Typed requirement records with curated facts |
| Evaluate a requirement | Required, alternative, or conditional meaning | Coverage status plus `allOf` or `anyOf` groups and supported structured conditions |
| Decide automatic evaluation safety | Automatic result or manual review block | Requirement evaluation mode and supported condition registry |
| Validate coverage | Program count, subject counts, country set, requirement type coverage | Derived from validated program records |
| Report an invalid record | Program path, field path, message | Zod issue path plus stable program and field identifiers when available |
| Review a fact | Source label, URL, and verification date | Evidence embedded in the curated fact |
| Check 2027 applicability | Whether evidence may establish a known value | Evidence cycle, intake, and applicant cohort applicability |

**Key invariants**:

1. The catalog always contains 24 programs and exactly three programs per subject area.
2. All four agreed countries appear in the catalog. Each subject contains three distinct institutions.
3. Program IDs are globally unique. Requirement IDs and field IDs are unique within each program. IDs are immutable. Downstream references use the program ID plus the local requirement or field ID.
4. Every material value is a known or unknown curated fact. Plain nullable values cannot represent missing evidence.
5. Every curated fact has applicable official evidence and a verification date. Official source hostnames pass the institution allowlist or an explicit reviewed exception.
6. Requirement types, statuses, unknown reasons, vocabularies, and units use closed unions or versioned registries. Unsupported values fail validation.
7. Catalog order is stable by numeric subject sort key, numeric program sort key, numeric requirement sort key, then ordinal string ID comparison.
8. Older cycle evidence may be retained as context but cannot become a known 2027 value. Cycle independent evidence must be explicitly marked.
9. Costs retain the published currency and fee period. The catalog performs no conversion.
10. Program country selection is a hard filter in later recommendation work. An insufficient match count must stay visible.
11. Every program has an explicit coverage state for every requirement type. Unknown and manual review states cannot produce an automatic eligibility pass.
12. Requirement groups are acyclic, nonempty, and reference requirements in the same program.
13. `schemaVersion` changes for structural incompatibility. `datasetVersion` uses major for a new entry cycle, minor for added or materially changed coverage, and patch for factual corrections that do not change interpretation.
14. Structural fixtures may contain fewer than 24 programs. Production loading and the release gate always enforce full coverage.

**Security model**:

The catalog contains public university facts and ships with the application. Runtime access is read only. Curator writes happen through repository review. The feature reads and stores no applicant data, secrets, or credentials.

**Critical test scenarios**:

1. Happy path: all 24 records load in stable order with eight subjects, four countries, ten requirement types, and traceable evidence, verifying **AC-1**, **AC-2**, **AC-3**, and **AC-6**.
2. Academic path: an IB threshold with Higher Level subject constraints validates and remains typed, verifying **AC-4**.
3. Unknown path: an unavailable 2027 fact validates only with a reason and reviewed official evidence, verifying **AC-5**.
4. Conditional path: an alternative IB subject rule preserves `anyOf` meaning, while an unsupported condition forces manual review and cannot pass automatically, verifying **AC-10**.
5. Failure path: duplicate IDs, impossible calendar dates, disallowed source hostnames, missing evidence, malformed JSON, unreadable files, or invalid type details make the command fail with stable ordered paths, verifying **AC-7** and **AC-8**.
6. Documentation path: a curator can follow the documented process to understand selection and review rules, verifying **AC-9**.

## Build plan

1. Create the versioned vocabularies, structural schemas, known and unknown fact model, evidence applicability, editorial metadata, typed requirement union, group semantics, deterministic ordering, and small fixtures, satisfying **AC-3**, **AC-5**, **AC-6**, **AC-8**, and **AC-10**.
2. Pilot difficult records before broad research. Cover an IB alternative, a conditional requirement, a cohort specific deadline, a fee basis, an explicit confirmed absence, and an unsupported condition that requires manual review, satisfying **AC-2**, **AC-4**, **AC-5**, **AC-8**, and **AC-10**.
3. Add one program for each subject and cover every requirement type with at least one positively established example. Confirm evidence and normalization policies before scaling curation, satisfying **AC-2**, **AC-3**, and **AC-4**.
4. Complete the selection matrix and curate the remaining programs until the release dataset reaches 24 with three distinct institutions per subject and all four countries represented, satisfying **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, and **AC-10**.
5. Add separate structural and release validators, the repository command, stable errors, official hostname checks, and a `prebuild` release gate that runs `npm run validate:catalog`, satisfying **AC-6**, **AC-7**, and **AC-8**.
6. Write one catalog README with the format, selection policy, cohort, version rules, update checklist, known gaps, and evidence review process, satisfying **AC-9**.

## Consequences

**Positive**:

1. Later eligibility and repair rules receive consistent typed inputs.
2. Every result can point back to stable facts and official evidence.
3. Invalid catalog changes fail before deployment.

**Negative and tradeoffs**:

1. Manual research and verification dominate the cost of this feature.
2. Three programs per subject cannot guarantee three matches after a narrow country filter.
3. Repository updates require a deployment.
4. The IB baseline does not support applicants using other qualifications yet.
5. Conditional rules outside the supported model block automatic evaluation and require later review.

**Neutral**:

1. The catalog records published currencies without comparing purchasing power.
2. Applicant facing catalog presentation remains part of later interface features.

## Follow-up

1. Add other academic qualification systems only after the IB path works end to end.
2. Decide the internal editing and review workflow before catalog updates move outside source control.
3. Design assisted extraction only after manual curation exposes the repeated review work worth automating.
