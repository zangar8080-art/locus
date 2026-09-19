# Rationale: Program requirement catalog

## Context

The diagnosis and repair features need comparable program facts. University pages express the same requirement in different language, apply facts to different entry cycles, and often omit values that applicants expect to compare. If these differences are flattened into loose text, later eligibility and repair results cannot be deterministic or explained.

The first release must cover eight subject areas and four countries while remaining feasible to curate manually. It must support several recommendations per subject, but it cannot promise three results after every country filter. It must preserve the distinction between absent evidence and a confirmed absence of a requirement.

This feature stores public university facts only. It does not store applicant data, predict admission probability, convert currencies, or expose a network API.

## Options considered

### Option 1: Typed repository JSON with manual curation

Store program records in versioned JSON. Validate them with discriminated Zod schemas and load them through one repository module.

**Pros**:

1. The data is transparent in source control and deploys with the application.
2. Typed requirement records can feed deterministic rules without text parsing.
3. The approach needs no database, service, credentials, or runtime extraction.

**Cons**:

1. Curating 24 programs is significant manual work.
2. University changes require a review and application deployment.
3. Repeated evidence metadata makes records larger.

### Option 2: Flexible JSON documents with text requirements

Store mostly free text requirements with a small common program header.

**Pros**:

1. Initial data entry is faster.
2. Source wording can be copied with little interpretation.

**Cons**:

1. Later rules would need fragile text parsing or manual special cases.
2. Missing and conflicting facts would be hard to distinguish.
3. Deterministic comparison would not be credible.

### Option 3: Database backed catalog with an editor

Put normalized records in PostgreSQL and build an internal editing workflow.

**Pros**:

1. Curators could update data without a code deployment.
2. Relational constraints could enforce parts of the model.

**Cons**:

1. It adds hosting, migrations, access control, and an editing interface before the data model is proven.
2. It conflicts with the accepted local first alpha architecture.

## Rationale

Later constraint rules need structured values, stable identifiers, and explicit unknown states. Typed JSON provides those properties while preserving direct human review. It also fits the accepted modular monolith and avoids building catalog operations before the product proves the requirement model.

The runner up is flexible JSON because it shortens curation. It is rejected because it moves normalization into the rule engine, where inconsistency would become harder to detect and explain.
