# 0004. Guided applicant profile

**Date**: 2026-09-19
**Status**: Accepted

## Summary

RouteStress will collect the smallest useful set of facts for an initial route review. The first guided flow supports an IB baseline, one subject, up to three countries, annual budget, weekly effort, IELTS, SAT, target intake, and planning date. Edits remain in memory until the applicant explicitly saves, and every result must distinguish missing information from a passing requirement.

## Context

The first release needs enough applicant information to compare programs without pretending to know more than the applicant has provided. The current catalog is centered on international IB applicants and keeps unknown university facts explicit. The profile must fit that catalog while leaving a clean path for other qualifications, richer document readiness, and application preferences later.

This feature handles applicant supplied data only. It does not create accounts, send data to a server, or infer admissions probability. The profile is a local, reviewable input to later deterministic domain functions.

## Requirements

**User stories**:

- As an applicant, I want a short guided profile so that I can reach a useful route review without completing an entire admissions application.
- As an applicant, I want to know why each fact matters so that I can answer confidently.
- As an applicant, I want to review and correct my answers before saving so that my route is based on information I approve.
- As an applicant, I want incomplete facts to be clearly separated from blockers so that missing data is never presented as a false pass.

**Acceptance criteria**:

- **AC-1**: The applicant can complete a guided short form covering IB academic baseline, one subject, up to three countries, annual budget and currency, weekly available hours, IELTS status, SAT status, target intake, and planning date.
- **AC-2**: The profile supports IB Diploma values now and has a versioned qualification field that can support additional qualification systems later without changing the saved envelope shape.
- **AC-3**: The form validates field types, ranges, required values, country count, supported countries, score increments, currency, and real calendar dates with stable field level errors.
- **AC-4**: Critical facts block route review when missing or invalid. Optional or unavailable facts remain explicit unknown states with an explanation of what is missing and why it matters.
- **AC-5**: The applicant can navigate backward, revise answers, and reach a concise review summary with editable sections before saving.
- **AC-6**: No applicant profile value is written to browser storage or sent to analytics or error reporting before explicit Save confirmation.
- **AC-7**: Save writes a versioned local profile envelope only after confirmation. Reset clears the in memory draft and any saved profile through an explicit user action.
- **AC-8**: IELTS Academic and SAT use a shared test status shape with planned, booked, completed, not required, and unknown states. Completed scores and planned dates are optional until required by a selected route.
- **AC-9**: The profile passes an explicit `planningDate` in `YYYY-MM-DD` form to later domain functions. Domain code never reads the clock implicitly.
- **AC-10**: The guided flow reflows to phone and desktop widths, exposes keyboard focus, and keeps the next action available without horizontal scrolling.

## Options considered

### Option 1: Short guided profile with explicit save

Collect only the core route facts in steps, keep edits in memory, then save a validated versioned envelope after review.

**Pros**:

- Smallest useful journey for the private alpha.
- Clear privacy boundary and easy recovery from invalid drafts.
- Maps directly to the existing catalog cohort.

**Cons**:

- Later features must add document and preference sections.
- Applicants with non IB qualifications cannot receive a fully automatic result yet.

### Option 2: Comprehensive admissions profile

Collect academic, document, activity, preference, and testing information before the first review.

**Pros**:

- Richer first result.
- Less redesign if the full application record is known early.

**Cons**:

- Higher completion burden and more validation surface.
- Encourages collecting facts before the product knows they are needed.

### Option 3: Partial profile with no explicit save

Allow route review from incomplete edits and persist every change automatically.

**Pros**:

- Fastest apparent flow.
- Lower risk of losing an edit during navigation.

**Cons**:

- Easy to confuse unknown information with a valid result.
- Weakens the stated local privacy and review boundary.

## Decision

**Chosen option**: Option 1: Short guided profile with explicit save.

Use a client side guided flow with a central reducer, Zod validation at every boundary, and a versioned local storage adapter used only after explicit Save. The first qualification is IB Diploma, while the profile envelope uses a discriminated qualification model so later qualifications can be added deliberately.

## Rationale

The short flow matches the skateboard delivery approach and keeps the first route useful without collecting an entire application. Explicit Save respects the local privacy promise and gives the applicant a meaningful review checkpoint. Severity based validation preserves safety: a missing critical fact blocks comparison, while an unavailable or optional fact remains visibly unknown rather than being converted into a pass.

## Feature design

**Data model sketch**:

| Entity | Key fields | Constraints |
|---|---|---|
| `ApplicantProfileDraft` | `qualificationSystem`, `academic`, `target`, `budget`, `effort`, `tests`, `timing`, `completedSteps` | In memory only until Save. All fields are validated through the profile schema. |
| `ApplicantProfile` | `schemaVersion`, `savedAt`, `profile` | Versioned local envelope. One saved profile per browser workspace. |
| `AcademicProfile` | `system`, `ibTotalPoints`, `higherLevelSubjects` | IB values use 0 to 45 total points, HL grades 1 to 7, and explicit unknown states where a value is not available. |
| `TargetProfile` | `subjectId`, `countryCodes` | One supported subject and one to three values from the catalog country registry. |
| `BudgetProfile` | `annualAmount`, `currency` | Positive finite amount and supported currency. Original currency is preserved. |
| `EffortProfile` | `weeklyHours` | Nonnegative finite number with a defined practical upper bound of 168 hours. |
| `TestProfile` | `testId`, `status`, `score`, `plannedDate` | `testId` is `ielts_academic` or `sat`; score and date are optional unless the status and route require them. |
| `TimingProfile` | `targetIntake`, `planningDate` | Planning date is a real ISO calendar date and is passed explicitly to domain functions. |

Relationships are nested value objects. There are no server foreign keys. `programId`, `fieldId`, and `requirementId` references appear only in later computed route results, not as arbitrary applicant input.

**State transitions**:

`empty` → `editing` → `reviewing` → `saved`. Any edit from `reviewing` returns to `editing`. An explicit Reset returns to `empty`. Invalid drafts remain in `editing` and cannot enter `reviewing` until critical validation errors are resolved.

**API surface**:

| Surface | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| Profile step reducer | Client action | typed field update, step navigation | validated draft state and field errors | None | stable validation issues |
| Profile review | Client action | draft profile | completeness summary, blockers, unknowns, editable sections | None | invalid critical fields |
| Profile save | Client action | confirmed reviewed draft | versioned local profile envelope | None | schema mismatch, storage unavailable |
| Profile load | Client adapter | local storage key | parsed profile or empty state | None | invalid or incompatible envelope is ignored and reset is offered |
| Profile reset | Client action | explicit confirmation | empty draft and cleared saved profile | None | storage unavailable |

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Render academic step | IB total, HL subjects, grades, unknown state | Applicant draft fields and IB schema |
| Render target step | Subject and country choices | Catalog subject and country registries |
| Render budget step | Amount and currency | Applicant input and supported currency registry |
| Render effort step | Weekly hours | Applicant numeric input |
| Render test step | IELTS or SAT status, score, planned date | Applicant test object and test registry |
| Render timing step | Intake and planning date | Applicant timing object |
| Review profile | Completeness, blockers, and unknowns | Pure validation result derived from the draft and criticality policy |
| Save profile | `schemaVersion` and `savedAt` | Profile envelope version and explicit save action; `savedAt` is generated only at save time |
| Later route evaluation | Eligibility and feasibility inputs | Validated saved profile plus catalog facts and explicit `planningDate` |

**Key invariants**:

- Draft values are never treated as saved values.
- Criticality is defined by the profile policy, not by whether a field happens to be empty.
- Unknown values remain distinguishable from false, zero, and not required.
- Country count is one to three and all values belong to the supported catalog registry.
- Test scores are validated against the selected test registry and never compared across tests without a named conversion rule.
- Every saved envelope passes the same Zod schema used for draft validation.
- Applicant answers, scores, budgets, dates, free text, and storage payloads never enter analytics or error reporting.
- Domain functions receive `planningDate` as an explicit ISO date and never read the clock implicitly.

**Security model**:

The profile is private to the local browser workspace. There is no account, server write, or remote read in this feature. Browser storage is treated as untrusted input and is parsed with the same schema before use. Reset removes the local profile through an explicit user action. No new credentials or regulated data processing are introduced.

**Normative field contract**:

| Field | Contract |
|---|---|
| Qualification | `qualification: { kind: "ib_diploma", version: 1, totalPoints?: number, higherLevelSubjects: Array<{ subjectId: IB_SUBJECT_IDS, grade?: 1..7 }> }`. Total points use 0 to 45. Missing values use an explicit unknown state, not zero. |
| Target subject | `subjectId` comes from `SUBJECT_IDS` in the catalog schema. It means intended university subject, not an IB subject. |
| Countries | `countryCodes` comes from `COUNTRY_CODES` in the catalog schema, currently `GB`, `CA`, `NL`, and `AU`. Values are unique and stored in catalog order. |
| Budget | `annualAmount` is the applicant's total annual study budget, including tuition and living costs, in the selected `GBP`, `CAD`, `EUR`, or `AUD` currency. It is a positive number with at most two decimal places. |
| Effort | `weeklyHours` is the hours available for admissions work each week. It is a nonnegative number with at most one decimal place and a maximum of 168. |
| IELTS | Overall score uses 0 to 9 in 0.5 increments. Component bands are optional and use the same scale. |
| SAT | Total score uses the current 400 to 1600 scale in integer points. Section scores are optional. |
| Test status | `planned`, `booked`, `completed`, `not_required`, or `unknown`. Applicant entered `not_required` is an untrusted claim and never creates a program pass. |
| Test date | `plannedDate` is required for `planned` and `booked`, optional for `completed`, and absent for `not_required` and `unknown`. Dates use real `YYYY-MM-DD` values. |
| Intake | `targetIntake` is a stable catalog `intakeId`, not free text. |
| Planning date | Applicant entered `planningDate` is required, real, and stored as `YYYY-MM-DD`. The form may offer the browser local calendar date as a suggestion, but domain code never reads the clock. |

**Criticality and unknown policy**:

The field policy is declarative and versioned as `profile_policy_version: 1.0.0`. Critical for first route review are qualification kind, target subject, at least one country, annual budget, weekly hours, target intake, and planning date. IELTS and SAT can be unknown unless a selected program later makes one relevant. A field error blocks review when its field is critical. An unknown noncritical value produces a stable reason code and direct explanation copy. Save requires a structurally valid profile, but may preserve noncritical unknowns.

**Validation and persistence contract**:

Validation errors use stable codes such as `profile.required`, `profile.range`, `profile.enum`, `profile.date`, `profile.duplicate`, and `profile.unknown`. Each issue has a dot path, code, and deterministic order by path then code. Use shared leaf schemas with separate `ApplicantProfileDraftSchema` and strict `ApplicantProfileSchema`; a draft may be incomplete, while a saved profile must satisfy all critical fields. The saved envelope is `{ schemaVersion: 1, savedAt: string, profile }`, stored under `routestress.profile.v1`. `savedAt` is a UTC ISO instant injected by the save adapter. Incompatible or malformed stored bytes are left untouched, ignored for loading, and surfaced with a recoverable Reset action. Loading a saved profile seeds a new editable draft. `completedSteps` is derived from validation and is not persisted.

**Transition rules**:

`empty` starts a draft. A valid step advances to the next step. The final step enters `reviewing` only when critical fields are valid. Save moves `reviewing` to `saved` and writes the envelope. Editing a saved profile creates an `editing` draft without changing the saved copy. Reset requires one explicit confirmation, clears the draft, and attempts to remove the saved key. If storage removal fails, the draft still resets and the UI reports that saved data could not be cleared.

**Critical test scenarios**:

- Happy path: complete all core steps, review the summary, save, reload, and recover the validated profile, verifies **AC-1**, **AC-5**, **AC-7**.
- Validation path: enter an invalid score, duplicate country, impossible date, or missing critical fact and confirm stable field errors and a blocked review, verifies **AC-3**, **AC-4**.
- Unknown path: leave a noncritical test date or unpublished academic value unresolved and confirm an explicit unknown state, verifies **AC-4**, **AC-8**.
- Privacy path: inspect analytics and error payload boundaries while editing and saving, confirming no profile values are emitted, verifies **AC-6**.
- Planning path: change the planning date and confirm the saved ISO date is passed to later domain interfaces without implicit clock access, verifies **AC-9**.
- Responsive path: complete the flow by keyboard at narrow and wide viewports without horizontal scrolling, verifies **AC-10**.

## Build plan

1. [x] Define versioned profile schemas, registries, criticality policy, reducer events, and stable validation errors, satisfies **AC-2**, **AC-3**, **AC-4**, **AC-8**, **AC-9**.
2. [x] Build the guided short form for academic, target, budget, effort, tests, and timing steps with accessible explanations and responsive layout, satisfies **AC-1**, **AC-10**.
3. [x] Build the review summary, edit transitions, explicit Save action, versioned local storage adapter, load recovery, and Reset action, satisfies **AC-5**, **AC-6**, **AC-7**.
4. [x] Add unit and browser coverage for validation, unknown states, privacy boundaries, date passing, save recovery, keyboard flow, and responsive behavior, satisfies **AC-3**, **AC-4**, **AC-6**, **AC-9**, **AC-10**.

## Consequences

**Positive**:

- Applicants reach a useful route review with a small burden.
- The local privacy promise is explicit and testable.
- The profile can grow to other qualifications and richer readiness data without replacing the saved envelope.
- Later deterministic domain work receives typed, traceable inputs.

**Negative / tradeoffs**:

- Applicants using qualifications other than IB will have limited automatic evaluation in the first slice.
- Explicit Save adds one deliberate step and does not protect unsaved edits after a full tab close.
- SAT support increases catalog and validation coverage work even where programs do not use it.

## Follow-up

- [ ] Add document readiness fields after the core profile is verified.
- [ ] Add application preference fields after recommendation behavior is defined.
- [ ] Design support for additional qualification systems before enrolling them in the automatic evaluation path.

## References

**Project sources**:

- `docs/specs/0001-stack-architecture/index.md`, local first modular monolith and privacy boundaries
- `docs/specs/0002-program-requirement-catalog/index.md`, IB cohort, test registry, evidence model, and explicit unknown states
- `docs/scope/scope.md`, guided applicant profile acceptance seed and skateboard approach

**Practices & standards**:

- Zod validation at trust boundaries
- WCAG 2.2 AA keyboard and focus expectations
- Data minimization and local first privacy design
