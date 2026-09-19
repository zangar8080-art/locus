# Program catalog

This directory contains the public program facts used by RouteStress. Applicant data does not belong here.

## Release shape

The 2027 release contains 24 English taught undergraduate programs. It has three programs from distinct institutions in each approved subject area. The catalog represents the UK, Canada, the Netherlands, and Australia.

The target cohort is an international fee paying applicant using the International Baccalaureate Diploma for standard first year entry. Transfer, foundation, exchange, domestic fee, graduate, part time, and licensed professional routes are outside this release.

## Fact states

A known fact contains its value and official evidence. An unknown fact contains an approved reason, a note, and evidence showing which official page was reviewed. Missing data must never be encoded as zero, false, an empty string, or a passed requirement.

Coverage is recorded for every requirement type on every program. A confirmed absence needs official evidence. An omitted coverage entry is invalid.

## Source review

For every fact you add or change:

1. Use an official university page over an aggregator.
2. Confirm the page applies to the program, campus, intake, applicant cohort, and entry cycle.
3. Preserve the official wording in the label or review note.
4. Record the page URL, a useful source label, and the date you checked it.
5. Use an unknown state when the 2027 value is not published.
6. Mark conditions outside the supported model for manual review.
7. Run `npm run validate:catalog` before review.

Official hostnames are allowed per institution. Subdomains are accepted. A source on another hostname needs a reviewed exception in the institution record.

## Selection policy

Programs are selected for useful variation in scores, subject prerequisites, English requirements, deadlines, costs, documents, portfolios, interviews, and application activities. Prestige is not a selection rule. Each subject uses three distinct institutions. Country coverage is enforced across the whole catalog, not within every subject.

An interdisciplinary program receives one primary subject classification under normalization policy `1.0.0`. Editorial classifications, labels, impacts, and sort keys are not represented as university claims.

## Versions

`schemaVersion` changes when readers cannot safely consume the old structure. `datasetVersion` uses a 2027 based semantic version. Change the major component for a new entry cycle, the minor component for added or materially changed coverage, and the patch component for factual corrections that do not change interpretation.

## Known gaps

Most 2027 programs do not yet publish every material value. Those values remain explicit unknowns. The first release supports the IB Diploma and IELTS Academic. Other qualifications and tests require a later schema and policy decision.

The catalog preserves unsupported conditions for manual review. It must not turn those conditions into an automatic eligibility pass.
