import rawCatalog from "./catalog.json" with { type: "json" };
import { describe, expect, it } from "vitest";
import {
  CatalogValidationError,
  REQUIREMENT_TYPES,
  assertCatalogRelease,
  parseProgramRecord,
  parseProgramCatalog,
} from "./schema.ts";

// Tests deliberately corrupt validated JSON, so a mutable escape hatch is appropriate here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const copyCatalog = () => structuredClone(rawCatalog) as Record<string, any>;

const issuesFor = (input: unknown, release = false) => {
  try {
    if (release) assertCatalogRelease(input);
    else parseProgramCatalog(input);
    return [];
  } catch (error) {
    expect(error).toBeInstanceOf(CatalogValidationError);
    return (error as CatalogValidationError).issues;
  }
};

describe("program catalog", () => {
  it("loads the release catalog in stable order", () => {
    const catalog = assertCatalogRelease(copyCatalog());
    expect(catalog.programs).toHaveLength(24);
    expect(catalog.subjects).toHaveLength(8);
    expect(new Set(catalog.institutions.map((item) => item.country.state === "known" && item.country.value))).toEqual(
      new Set(["GB", "CA", "NL", "AU"]),
    );
    expect(catalog.programs.map((item) => item.programId)).toEqual(
      [...catalog.programs]
        .sort(
          (left, right) =>
            left.classification.subjectSortKey - right.classification.subjectSortKey ||
            left.classification.programSortKey - right.classification.programSortKey ||
            (left.programId < right.programId ? -1 : left.programId > right.programId ? 1 : 0),
        )
        .map((item) => item.programId),
    );
    REQUIREMENT_TYPES.forEach((type) => {
      expect(catalog.programs.some((program) => ["required", "optional", "conditional"].includes(program.coverage[type].status))).toBe(true);
    });
  });

  it("rejects duplicate program identifiers", () => {
    const catalog = copyCatalog();
    catalog.programs[1].programId = catalog.programs[0].programId;
    expect(issuesFor(catalog, true).some((issue) => issue.message.includes("Duplicate program ID"))).toBe(true);
  });

  it("rejects impossible calendar dates", () => {
    const catalog = copyCatalog();
    catalog.programs[0].intakeStartDate = {
      fieldId: "intake_start_date",
      state: "known",
      value: "2027-02-30",
      evidence: catalog.programs[0].programTitle.evidence,
    };
    expect(issuesFor(catalog).some((issue) => issue.path.includes("intakeStartDate"))).toBe(true);
  });

  it("rejects facts without evidence", () => {
    const catalog = copyCatalog();
    catalog.programs[0].programTitle.evidence = [];
    expect(issuesFor(catalog).some((issue) => issue.path.includes("programTitle.evidence"))).toBe(true);
  });

  it("rejects malformed unknown facts", () => {
    const catalog = copyCatalog();
    delete catalog.programs[0].intakeStartDate.reason;
    expect(issuesFor(catalog).some((issue) => issue.path.includes("intakeStartDate"))).toBe(true);
  });

  it("rejects invalid IELTS score increments", () => {
    const catalog = copyCatalog();
    catalog.programs[1].coverage.language_test.requirements[0].overallScore.value = 6.3;
    expect(issuesFor(catalog).some((issue) => issue.message.includes("IELTS scores use 0.5 steps"))).toBe(true);
  });

  it("rejects unapproved source hostnames", () => {
    const catalog = copyCatalog();
    catalog.programs[0].programTitle.evidence[0].sourceUrl = "https://example.com/program";
    expect(issuesFor(catalog, true).some((issue) => issue.message.includes("not approved"))).toBe(true);
  });

  it("requires manual review for unsupported conditions", () => {
    const catalog = copyCatalog();
    catalog.programs[1].coverage.language_test.requirements[0].evaluation = "automatic";
    expect(issuesFor(catalog).some((issue) => issue.message.includes("manual review"))).toBe(true);
  });

  it("rejects evidence for a different intake", () => {
    const catalog = copyCatalog();
    catalog.programs[0].programTitle.evidence[0].applicability.intakeId = "september_2028";
    expect(issuesFor(catalog, true).some((issue) => issue.message.includes("must match program intake"))).toBe(true);
  });

  it("rejects unsupported subject and admissions test identifiers", () => {
    const catalog = copyCatalog();
    catalog.programs[0].coverage.subject_prerequisite.requirements[0].subjectId = "made_up_subject";
    expect(issuesFor(catalog).some((issue) => issue.path.includes("subjectId"))).toBe(true);

    const admissions = copyCatalog();
    const admissionsProgram = admissions.programs.find(
      (program: { coverage: { admissions_test: { requirements: Array<{ testId: string }> } } }) =>
        program.coverage.admissions_test.requirements.length > 0,
    ) as { coverage: { admissions_test: { requirements: Array<{ testId: string }> } } };
    admissionsProgram.coverage.admissions_test.requirements[0].testId = "made_up_test";
    expect(issuesFor(admissions).some((issue) => issue.path.includes("testId"))).toBe(true);
  });

  it("requires release identity facts", () => {
    const catalog = copyCatalog();
    catalog.programs[0].degreeLevel = {
      fieldId: "degree_level",
      state: "unknown",
      reason: "not_found_on_reviewed_sources",
      note: "Missing",
      evidence: catalog.programs[0].programTitle.evidence,
    };
    expect(issuesFor(catalog, true).some((issue) => issue.path.includes("degreeLevel"))).toBe(true);
  });

  it("validates a single record and rejects duplicate local identifiers", () => {
    const catalog = copyCatalog();
    const program = catalog.programs[0];
    const coverage = program.coverage.academic_threshold;
    coverage.requirements.push(structuredClone(coverage.requirements[0]));
    expect(() => parseProgramRecord(program)).toThrow(CatalogValidationError);
  });

  it("rejects invalid deadline times and time zones", () => {
    const catalog = copyCatalog();
    const deadline = catalog.programs.find(
      (program: { coverage: { deadline: { requirements: unknown[] } } }) =>
        program.coverage.deadline.requirements.length > 0,
    )?.coverage.deadline.requirements[0] as
      | { type: string; localDate: { evidence: unknown[] }; localTime?: unknown; timeZone?: unknown }
      | undefined;
    if (!deadline || deadline.type !== "deadline") throw new Error("Expected a deadline fixture");
    deadline.localTime = {
      fieldId: "deadline_time",
      state: "known",
      value: "99:99",
      evidence: deadline.localDate.evidence,
    };
    deadline.timeZone = {
      fieldId: "deadline_timezone",
      state: "known",
      value: "made_up_zone",
      evidence: deadline.localDate.evidence,
    };
    expect(issuesFor(catalog).some((issue) => issue.path.includes("localTime"))).toBe(true);
    expect(issuesFor(catalog).some((issue) => issue.path.includes("timeZone"))).toBe(true);
  });

  it("accepts forward references and rejects missing references", () => {
    const catalog = copyCatalog();
    const program = catalog.programs.find(
      (candidate: { programId: string }) => candidate.programId === "manchester_computer_science_2027",
    );
    program.coverage.academic_threshold.ruleGroups = [
      {
        groupId: "forward_reference_group",
        operator: "allOf",
        children: [{ kind: "requirement", requirementId: "math_aa_hl_7" }],
      },
    ];
    expect(() => parseProgramRecord(program)).not.toThrow();
    program.coverage.academic_threshold.ruleGroups[0].children[0].requirementId = "missing_requirement";
    expect(() => parseProgramRecord(program)).toThrow(CatalogValidationError);
  });
});
