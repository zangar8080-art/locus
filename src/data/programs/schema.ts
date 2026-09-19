import { z } from "zod";

export const COUNTRY_CODES = ["GB", "CA", "NL", "AU"] as const;
export const SUBJECT_IDS = [
  "computer_science",
  "engineering",
  "business_management",
  "economics_finance",
  "natural_sciences",
  "social_sciences",
  "humanities",
  "design_architecture",
] as const;
export const REQUIREMENT_TYPES = [
  "academic_threshold",
  "subject_prerequisite",
  "language_test",
  "admissions_test",
  "deadline",
  "cost",
  "document",
  "portfolio",
  "interview",
  "activity_experience",
] as const;

export const IB_SUBJECT_IDS = [
  "mathematics",
  "mathematics_analysis_approaches",
  "physics",
  "chemistry",
  "biology",
  "computer_science",
] as const;

export const ADMISSIONS_TEST_REGISTRY = {
  esat: { unit: "score", min: 0, max: 9 },
} as const;

const identifierSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/, "Use a stable snake case identifier");

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return (
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day
    );
  }, "Use a real calendar date");

const httpsUrlSchema = z.url().refine((value) => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}, "Use an HTTPS URL");

const evidenceApplicabilitySchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("cycle_specific"),
    entryCycle: z.literal("2027"),
    intakeId: identifierSchema,
    applicantCohort: z.literal("international_ib_standard_entry"),
  }),
  z.object({ kind: z.literal("cycle_independent") }),
]);

export const evidenceSchema = z.object({
  sourceUrl: httpsUrlSchema,
  sourceLabel: z.string().trim().min(1),
  lastVerified: isoDateSchema,
  applicability: evidenceApplicabilitySchema,
});

const unknownReasonSchema = z.enum([
  "unpublished_for_cycle",
  "not_found_on_reviewed_sources",
  "conflicting_official_sources",
  "source_unavailable",
  "unsupported_condition",
]);

const factSchema = <T extends z.ZodType>(valueSchema: T) =>
  z.discriminatedUnion("state", [
    z.object({
      fieldId: identifierSchema,
      state: z.literal("known"),
      value: valueSchema,
      evidence: z.array(evidenceSchema).min(1),
    }),
    z.object({
      fieldId: identifierSchema,
      state: z.literal("unknown"),
      reason: unknownReasonSchema,
      note: z.string().trim().min(1),
      evidence: z.array(evidenceSchema).min(1),
    }),
  ]);

const stringFactSchema = factSchema(z.string().trim().min(1));
const dateFactSchema = factSchema(isoDateSchema);
const requirementImpactSchema = z.enum([
  "eligibility_blocker",
  "feasibility_factor",
]);

const requirementClassificationSchema = z.object({
  impact: requirementImpactSchema,
  sortKey: z.number().int().min(0).max(9999),
  policyVersion: z.literal("1.0.0"),
  displayLabel: z.string().trim().min(1),
});

const requirementApplicabilitySchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("always") }),
  z.object({
    kind: z.literal("supported_condition"),
    field: z.enum([
      "applicant_cohort",
      "intake_id",
      "ib_subject_id",
      "test_id",
      "application_stage",
    ]),
    operator: z.enum(["equals", "includes"]),
    value: z.string().trim().min(1),
  }),
  z.object({
    kind: z.literal("unsupported_condition"),
    sourceText: stringFactSchema,
  }),
]);

const ibRangeSchema = z
  .object({ min: z.number().int(), max: z.number().int() })
  .refine(({ min, max }) => min <= max, "Minimum cannot exceed maximum");

const requirementBaseShape = {
  requirementId: identifierSchema,
  classification: requirementClassificationSchema,
  officialLabel: stringFactSchema,
  evaluation: z.enum(["automatic", "manual_review"]),
  applicability: requirementApplicabilitySchema,
};

const academicThresholdSchema = z.object({
  ...requirementBaseShape,
  type: z.literal("academic_threshold"),
  qualification: z.literal("ib_diploma"),
  totalPoints: factSchema(
    ibRangeSchema.refine(
      ({ min, max }) => min >= 0 && max <= 45,
      "IB total points must be between 0 and 45",
    ),
  ),
  higherLevelTotal: factSchema(
    ibRangeSchema.refine(
      ({ min, max }) => min >= 0 && max <= 28,
      "IB Higher Level total must be between 0 and 28",
    ),
  ).optional(),
});

const subjectPrerequisiteSchema = z.object({
  ...requirementBaseShape,
  type: z.literal("subject_prerequisite"),
  subjectId: z.enum(IB_SUBJECT_IDS),
  level: z.enum(["HL", "SL"]),
  grade: factSchema(z.number().int().min(1).max(7)),
});

const ieltsScoreSchema = z
  .number()
  .min(0)
  .max(9)
  .refine((value) => Number.isInteger(value * 2), "IELTS scores use 0.5 steps");

const languageTestSchema = z.object({
  ...requirementBaseShape,
  type: z.literal("language_test"),
  testId: z.literal("ielts_academic"),
  overallScore: factSchema(ieltsScoreSchema),
  componentScores: z
    .object({
      listening: factSchema(ieltsScoreSchema),
      reading: factSchema(ieltsScoreSchema),
      writing: factSchema(ieltsScoreSchema),
      speaking: factSchema(ieltsScoreSchema),
    })
    .optional(),
});

const admissionsTestSchema = z.object({
  ...requirementBaseShape,
  type: z.literal("admissions_test"),
  testId: z.enum(["esat"]),
  result: factSchema(z.number().finite().min(0).max(9)).optional(),
  sittingDate: dateFactSchema.optional(),
});

const deadlineSchema = z.object({
  ...requirementBaseShape,
  type: z.literal("deadline"),
  stage: z.enum([
    "standard_application",
    "early_application",
    "scholarship",
    "portfolio",
    "supporting_documents",
    "acceptance",
  ]),
  round: stringFactSchema.optional(),
  localDate: dateFactSchema,
  localTime: factSchema(
    z.string().regex(/^\d{2}:\d{2}$/).refine((value) => {
      const [hours, minutes] = value.split(":").map(Number);
      return hours <= 23 && minutes <= 59;
    }, "Use a valid local time"),
  ).optional(),
  timeZone: factSchema(
    z.string().trim().min(1).refine((value) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: value }).format();
        return value.includes("/") || value === "UTC";
      } catch {
        return false;
      }
    }, "Use an IANA time zone"),
  ).optional(),
});

const costSchema = z.object({
  ...requirementBaseShape,
  type: z.literal("cost"),
  category: z.enum([
    "tuition",
    "application_fee",
    "deposit",
    "materials",
    "living_estimate",
  ]),
  amountMinor: factSchema(z.number().int().nonnegative()),
  currency: z.enum(["GBP", "CAD", "EUR", "AUD"]),
  academicYear: factSchema(z.string().regex(/^\d{4}-\d{2}$/)),
  feePeriod: factSchema(z.string().trim().min(1)),
  feeBasis: z.enum(["annual", "per_credit", "total_program", "one_time"]),
  cohort: z.literal("international"),
});

const documentSchema = z.object({
  ...requirementBaseShape,
  type: z.literal("document"),
  documentType: z.enum([
    "transcript",
    "predicted_grades",
    "diploma",
    "personal_statement",
    "reference",
    "passport",
    "english_test_result",
    "portfolio",
    "cv",
    "other",
  ]),
});

const portfolioSchema = z.object({
  ...requirementBaseShape,
  type: z.literal("portfolio"),
  format: stringFactSchema.optional(),
});

const interviewSchema = z.object({
  ...requirementBaseShape,
  type: z.literal("interview"),
  mode: factSchema(
    z.enum(["online_live", "in_person", "recorded", "officially_unspecified"]),
  ).optional(),
});

const activityExperienceSchema = z.object({
  ...requirementBaseShape,
  type: z.literal("activity_experience"),
  activityKind: z.enum([
    "work_experience",
    "extracurricular",
    "volunteering",
    "competition",
    "research",
    "other",
  ]),
  duration: factSchema(
    z.object({
      value: z.number().int().positive(),
      unit: z.enum(["hours", "weeks", "months", "years"]),
    }),
  ).optional(),
});

export const requirementSchema = z.discriminatedUnion("type", [
  academicThresholdSchema,
  subjectPrerequisiteSchema,
  languageTestSchema,
  admissionsTestSchema,
  deadlineSchema,
  costSchema,
  documentSchema,
  portfolioSchema,
  interviewSchema,
  activityExperienceSchema,
]);

export type RequirementGroup = {
  groupId: string;
  operator: "allOf" | "anyOf";
  children: Array<
    | { kind: "requirement"; requirementId: string }
    | { kind: "group"; group: RequirementGroup }
  >;
};

const requirementGroupSchema: z.ZodType<RequirementGroup> = z.lazy(() =>
  z.object({
    groupId: identifierSchema,
    operator: z.enum(["allOf", "anyOf"]),
    children: z
      .array(
        z.discriminatedUnion("kind", [
          z.object({ kind: z.literal("requirement"), requirementId: identifierSchema }),
          z.object({ kind: z.literal("group"), group: requirementGroupSchema }),
        ]),
      )
      .min(1),
  }),
);

const coverageStatusSchema = z.enum([
  "required",
  "optional",
  "conditional",
  "confirmed_not_required",
  "unknown",
  "not_applicable",
]);

const coverageEntrySchema = z
  .object({
    status: coverageStatusSchema,
    reviewNote: z.string().trim().min(1),
    evidence: z.array(evidenceSchema).min(1),
    requirements: z.array(requirementSchema),
    ruleGroups: z.array(requirementGroupSchema).default([]),
  })
  .superRefine((entry, context) => {
    const positive = ["required", "optional", "conditional"].includes(entry.status);
    if (positive && entry.requirements.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["requirements"],
        message: "Positive coverage needs at least one requirement",
      });
    }
    if (!positive && entry.requirements.length > 0) {
      context.addIssue({
        code: "custom",
        path: ["requirements"],
        message: "Nonpositive coverage cannot contain requirements",
      });
    }
    if (entry.status === "conditional" && entry.ruleGroups.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["ruleGroups"],
        message: "Conditional coverage needs a rule group",
      });
    }
  });

const coverageSchema = z.object(
  Object.fromEntries(REQUIREMENT_TYPES.map((type) => [type, coverageEntrySchema])) as Record<
    (typeof REQUIREMENT_TYPES)[number],
    typeof coverageEntrySchema
  >,
);

const subjectDefinitionSchema = z.object({
  subjectId: z.enum(SUBJECT_IDS),
  displayLabel: z.string().trim().min(1),
  sortKey: z.number().int().min(0).max(9999),
});

const institutionSchema = z.object({
  institutionId: identifierSchema,
  name: stringFactSchema,
  country: factSchema(z.enum(COUNTRY_CODES)),
  officialHostnames: z.array(z.string().trim().min(1)).min(1),
  sourceExceptions: z
    .array(
      z.object({ hostname: z.string().trim().min(1), reviewNote: z.string().trim().min(1) }),
    )
    .default([]),
});

const programSchema = z
  .object({
    programId: identifierSchema,
    institutionId: identifierSchema,
    courseId: identifierSchema,
    campusId: identifierSchema,
    intakeId: identifierSchema,
    programTitle: stringFactSchema,
    campusName: stringFactSchema,
    degreeLevel: factSchema(z.literal("undergraduate")),
    instructionLanguage: factSchema(z.literal("English")),
    intakeLabel: stringFactSchema,
    intakeStartDate: dateFactSchema,
    classification: z.object({
      subjectId: z.enum(SUBJECT_IDS),
      subjectSortKey: z.number().int().min(0).max(9999),
      programSortKey: z.number().int().min(0).max(9999),
      policyVersion: z.literal("1.0.0"),
      editorialNote: z.string().trim().min(1),
    }),
    coverage: coverageSchema,
  })
  .superRefine((program, context) => {
    for (const type of REQUIREMENT_TYPES) {
      const entry = program.coverage[type];
      entry.requirements.forEach((requirement, index) => {
        if (requirement.type !== type) {
          context.addIssue({
            code: "custom",
            path: ["coverage", type, "requirements", index, "type"],
            message: `Requirement type must match coverage key ${type}`,
          });
        }
        if (
          requirement.applicability.kind === "unsupported_condition" &&
          requirement.evaluation !== "manual_review"
        ) {
          context.addIssue({
            code: "custom",
            path: ["coverage", type, "requirements", index, "evaluation"],
            message: "Unsupported conditions require manual review",
          });
        }
      });
    }
  });

export const programCatalogSchema = z.object({
  schemaVersion: z.literal(1),
  datasetVersion: z.string().regex(/^2027\.\d+\.\d+$/),
  entryCycle: z.literal("2027"),
  normalizationPolicyVersion: z.literal("1.0.0"),
  subjects: z.array(subjectDefinitionSchema).length(8),
  institutions: z.array(institutionSchema).min(1),
  programs: z.array(programSchema).min(1),
});

export type ProgramCatalog = z.infer<typeof programCatalogSchema>;
export type Program = z.infer<typeof programSchema>;
export type Requirement = z.infer<typeof requirementSchema>;

export type CatalogIssue = {
  path: string;
  message: string;
};

const ordinalCompare = (left: string, right: string) =>
  left < right ? -1 : left > right ? 1 : 0;

const pathToString = (path: PropertyKey[]) =>
  path
    .map((part) => (typeof part === "symbol" ? part.description ?? part.toString() : String(part)))
    .join(".");

const sortedIssues = (issues: CatalogIssue[]) =>
  [...issues].sort(
    (left, right) =>
      left.path.localeCompare(right.path, "en") ||
      left.message.localeCompare(right.message, "en"),
  );

export class CatalogValidationError extends Error {
  readonly issues: CatalogIssue[];

  constructor(issues: CatalogIssue[]) {
    super(`Program catalog validation failed with ${issues.length} issue(s)`);
    this.name = "CatalogValidationError";
    this.issues = sortedIssues(issues);
  }
}

export const parseProgramCatalog = (input: unknown): ProgramCatalog => {
  const result = programCatalogSchema.safeParse(input);
  if (!result.success) {
    throw new CatalogValidationError(
      result.error.issues.map((issue) => ({
        path: pathToString(issue.path),
        message: issue.message,
      })),
    );
  }
  const localIssues = result.data.programs.flatMap((program, index) =>
    validateProgramStructure(program, `programs.${index}`),
  );
  if (localIssues.length > 0) throw new CatalogValidationError(localIssues);
  return result.data;
};

export const parseProgramRecord = (input: unknown): Program => {
  const result = programSchema.safeParse(input);
  if (!result.success) {
    throw new CatalogValidationError(
      result.error.issues.map((issue) => ({
        path: pathToString(issue.path),
        message: issue.message,
      })),
    );
  }
  const issues = validateProgramStructure(result.data, "program");
  if (issues.length > 0) throw new CatalogValidationError(issues);
  return result.data;
};

const evidenceHostnameAllowed = (
  sourceUrl: string,
  officialHostnames: string[],
  exceptionHostnames: string[],
) => {
  const hostname = new URL(sourceUrl).hostname.toLowerCase();
  return [...officialHostnames, ...exceptionHostnames].some((allowed) => {
    const normalized = allowed.toLowerCase();
    return hostname === normalized || hostname.endsWith(`.${normalized}`);
  });
};

const collectFacts = (value: unknown, output: Array<Record<string, unknown>>) => {
  if (Array.isArray(value)) {
    value.forEach((item) => collectFacts(item, output));
    return;
  }
  if (!value || typeof value !== "object") return;
  const record = value as Record<string, unknown>;
  if (typeof record.fieldId === "string" && Array.isArray(record.evidence)) {
    output.push(record);
  }
  Object.values(record).forEach((item) => collectFacts(item, output));
};

const collectEvidence = (value: unknown, output: Array<z.infer<typeof evidenceSchema>>) => {
  if (Array.isArray(value)) {
    value.forEach((item) => collectEvidence(item, output));
    return;
  }
  if (!value || typeof value !== "object") return;
  const record = value as Record<string, unknown>;
  if (
    typeof record.sourceUrl === "string" &&
    typeof record.sourceLabel === "string" &&
    typeof record.lastVerified === "string"
  ) {
    output.push(record as z.infer<typeof evidenceSchema>);
    return;
  }
  Object.values(record).forEach((item) => collectEvidence(item, output));
};

const validateProgramStructure = (program: Program, path: string): CatalogIssue[] => {
  const issues: CatalogIssue[] = [];
  const facts: Array<Record<string, unknown>> = [];
  collectFacts(program, facts);
  const fieldIds = new Set<string>();
  facts.forEach((fact) => {
    const fieldId = String(fact.fieldId);
    if (fieldIds.has(fieldId)) {
      issues.push({ path, message: `Duplicate field ID ${fieldId}` });
    }
    fieldIds.add(fieldId);
  });

  const requirementIds = new Set<string>();
  REQUIREMENT_TYPES.forEach((type) => {
    program.coverage[type].requirements.forEach((requirement) => {
      if (requirementIds.has(requirement.requirementId)) {
        issues.push({
          path: `${path}.coverage.${type}`,
          message: `Duplicate requirement ID ${requirement.requirementId}`,
        });
      }
      requirementIds.add(requirement.requirementId);
    });
  });

  REQUIREMENT_TYPES.forEach((type) => {
    program.coverage[type].ruleGroups.forEach((group, groupIndex) =>
      validateRequirementGroups(
        group,
        requirementIds,
        new Set(),
        `${path}.coverage.${type}.ruleGroups.${groupIndex}`,
        issues,
      ),
    );
  });
  return issues;
};

const validateRequirementGroups = (
  group: RequirementGroup,
  requirementIds: Set<string>,
  seenGroupIds: Set<string>,
  path: string,
  issues: CatalogIssue[],
) => {
  if (seenGroupIds.has(group.groupId)) {
    issues.push({ path: `${path}.groupId`, message: `Duplicate or cyclic group ID ${group.groupId}` });
    return;
  }
  seenGroupIds.add(group.groupId);
  group.children.forEach((child, index) => {
    if (child.kind === "requirement" && !requirementIds.has(child.requirementId)) {
      issues.push({
        path: `${path}.children.${index}.requirementId`,
        message: `Unknown requirement reference ${child.requirementId}`,
      });
    }
    if (child.kind === "group") {
      validateRequirementGroups(
        child.group,
        requirementIds,
        seenGroupIds,
        `${path}.children.${index}.group`,
        issues,
      );
    }
  });
  seenGroupIds.delete(group.groupId);
};

export const validateCatalogRelease = (catalog: ProgramCatalog): CatalogIssue[] => {
  const issues: CatalogIssue[] = [];
  const institutionById = new Map(catalog.institutions.map((item) => [item.institutionId, item]));
  const programIds = new Set<string>();
  const institutionIds = new Set<string>();

  catalog.institutions.forEach((institution, index) => {
    if (institutionIds.has(institution.institutionId)) {
      issues.push({
        path: `institutions.${index}.institutionId`,
        message: `Duplicate institution ID ${institution.institutionId}`,
      });
    }
    institutionIds.add(institution.institutionId);
    const evidence: Array<z.infer<typeof evidenceSchema>> = [];
    collectEvidence(institution, evidence);
    evidence.forEach((item) => {
      if (
        !evidenceHostnameAllowed(
          item.sourceUrl,
          institution.officialHostnames,
          institution.sourceExceptions.map((exception) => exception.hostname),
        )
      ) {
        issues.push({
          path: `institutions.${index}.evidence`,
          message: `Source hostname is not approved for ${institution.institutionId}`,
        });
      }
    });
  });

  const expectedSubjects = new Map(SUBJECT_IDS.map((subject, index) => [subject, (index + 1) * 10]));
  catalog.subjects.forEach((subject, index) => {
    const expectedSortKey = expectedSubjects.get(subject.subjectId);
    if (expectedSortKey !== subject.sortKey) {
      issues.push({
        path: `subjects.${index}.sortKey`,
        message: `Subject ${subject.subjectId} must use sort key ${expectedSortKey}`,
      });
    }
  });
  if (new Set(catalog.subjects.map((subject) => subject.subjectId)).size !== SUBJECT_IDS.length) {
    issues.push({ path: "subjects", message: "Each approved subject must appear exactly once" });
  }

  if (catalog.programs.length !== 24) {
    issues.push({ path: "programs", message: "Release catalog must contain exactly 24 programs" });
  }

  for (const subject of SUBJECT_IDS) {
    const programs = catalog.programs.filter((item) => item.classification.subjectId === subject);
    if (programs.length !== 3) {
      issues.push({ path: "programs", message: `Subject ${subject} must contain exactly 3 programs` });
    }
    if (new Set(programs.map((item) => item.institutionId)).size !== programs.length) {
      issues.push({ path: "programs", message: `Subject ${subject} must use distinct institutions` });
    }
  }

  const representedCountries = new Set(
    catalog.programs
      .map((program) => institutionById.get(program.institutionId)?.country)
      .filter((fact) => fact?.state === "known")
      .map((fact) => (fact as { value: string }).value),
  );
  COUNTRY_CODES.forEach((country) => {
    if (!representedCountries.has(country)) {
      issues.push({ path: "programs", message: `Country ${country} must be represented` });
    }
  });

  const positiveTypeCoverage = new Set<string>();
  catalog.programs.forEach((program, programIndex) => {
    if (programIds.has(program.programId)) {
      issues.push({
        path: `programs.${programIndex}.programId`,
        message: `Duplicate program ID ${program.programId}`,
      });
    }
    programIds.add(program.programId);

    const institution = institutionById.get(program.institutionId);
    if (!institution) {
      issues.push({
        path: `programs.${programIndex}.institutionId`,
        message: `Unknown institution ID ${program.institutionId}`,
      });
      return;
    }

    if (program.degreeLevel.state !== "known") {
      issues.push({
        path: `programs.${programIndex}.degreeLevel`,
        message: "Release programs must establish an undergraduate degree level",
      });
    }
    if (program.instructionLanguage.state !== "known") {
      issues.push({
        path: `programs.${programIndex}.instructionLanguage`,
        message: "Release programs must establish English instruction",
      });
    }
    const expectedSubjectSortKey = expectedSubjects.get(program.classification.subjectId);
    if (program.classification.subjectSortKey !== expectedSubjectSortKey) {
      issues.push({
        path: `programs.${programIndex}.classification.subjectSortKey`,
        message: `Program subject sort key must be ${expectedSubjectSortKey}`,
      });
    }

    const facts: Array<Record<string, unknown>> = [];
    collectFacts(program, facts);
    const fieldIds = new Set<string>();
    facts.forEach((fact) => {
      const fieldId = String(fact.fieldId);
      if (fieldIds.has(fieldId)) {
        issues.push({
          path: `programs.${programIndex}`,
          message: `Duplicate field ID ${fieldId}`,
        });
      }
      fieldIds.add(fieldId);
    });

    const programEvidence: Array<z.infer<typeof evidenceSchema>> = [];
    collectEvidence(program, programEvidence);
    programEvidence.forEach((evidence, evidenceIndex) => {
      if (
        evidence.applicability.kind === "cycle_specific" &&
        evidence.applicability.intakeId !== program.intakeId
      ) {
        issues.push({
          path: `programs.${programIndex}.evidence.${evidenceIndex}.applicability.intakeId`,
          message: `Evidence intake must match program intake ${program.intakeId}`,
        });
      }
      if (
        !evidenceHostnameAllowed(
          evidence.sourceUrl,
          institution.officialHostnames,
          institution.sourceExceptions.map((item) => item.hostname),
        )
      ) {
        issues.push({
          path: `programs.${programIndex}.evidence`,
          message: `Source hostname is not approved for ${institution.institutionId}`,
        });
      }
    });

    for (const type of REQUIREMENT_TYPES) {
      const entry = program.coverage[type];
      if (["required", "optional", "conditional"].includes(entry.status)) {
        positiveTypeCoverage.add(type);
      }
    }
  });

  REQUIREMENT_TYPES.forEach((type) => {
    if (!positiveTypeCoverage.has(type)) {
      issues.push({ path: "programs", message: `Requirement type ${type} needs a positive example` });
    }
  });

  return sortedIssues(issues);
};

export const assertCatalogRelease = (input: unknown): ProgramCatalog => {
  const catalog = parseProgramCatalog(input);
  const issues = validateCatalogRelease(catalog);
  if (issues.length > 0) throw new CatalogValidationError(issues);
  catalog.subjects.sort((left, right) => left.sortKey - right.sortKey || ordinalCompare(left.subjectId, right.subjectId));
  catalog.institutions.sort((left, right) => ordinalCompare(left.institutionId, right.institutionId));
  catalog.programs.sort(
    (left, right) =>
      left.classification.subjectSortKey - right.classification.subjectSortKey ||
      left.classification.programSortKey - right.classification.programSortKey ||
      ordinalCompare(left.programId, right.programId),
  );
  catalog.programs.forEach((program) => {
    REQUIREMENT_TYPES.forEach((type) => {
      program.coverage[type].requirements.sort(
        (left, right) =>
          left.classification.sortKey - right.classification.sortKey ||
          ordinalCompare(left.requirementId, right.requirementId),
      );
    });
  });
  return catalog;
};
