# 0006. Constraint graph engine

**Status**: Assumed
**Date**: 2026-09-19
**Authorized by**: engineer, during /develop diagnosis and recommendations

## Owed decision

Define the constraint graph engine contract for eligibility, feasibility, resilience, ranking, requirement groups, traceability, and unsupported data.

## Assumption built on

For the urgent MVP slice, use pure TypeScript functions over the validated saved profile and repository catalog. Evaluate directly supported academic and language requirements, preserve unknown and manual review outcomes, use deterministic catalog ordering, and return insufficient data for unsupported feasibility or resilience inputs. Do not infer admission probability.

## Code area

`src/domain/diagnosis/`, `src/data/`, `app/page.tsx`, and related tests.

## Requirements

The diagnosis must produce stable eligibility and feasibility bands, explicit requirement outcomes, traceability identifiers, deterministic ordering, and a qualified recommendation list when supported by known inputs.

## Ratify

This decision was recorded by /develop, not deliberated. Run `/architect constraint graph and route repair` to deliberate and ratify it. Until then it stays flagged as an owed decision and does not block the build.
