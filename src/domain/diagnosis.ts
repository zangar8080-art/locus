import type { ApplicantProfile } from "./profile";
import type { Program, ProgramCatalog } from "../data/programs/schema";

export type DiagnosisBand = "eligible" | "conditional" | "blocked" | "insufficient_data";
export type FeasibilityBand = "feasible" | "tight" | "infeasible" | "insufficient_data";

export type Recommendation = {
  program: Program;
  eligibility: DiagnosisBand;
  feasibility: FeasibilityBand;
  rank: number | null;
  reasons: string[];
  sourceCount: number;
};

export type Diagnosis = {
  recommendations: Recommendation[];
  qualified: Recommendation[];
  findings: Array<{ kind: "strength" | "blocker" | "uncertainty"; title: string; detail: string }>;
  shortage: string | null;
};

const programSources = (program: Program) =>
  Object.values(program.coverage).reduce((count, entry) => count + entry.evidence.length, 0);

export function diagnoseAndRecommend(profile: ApplicantProfile, catalog: ProgramCatalog): Diagnosis {
  const institutions = new Map(catalog.institutions.map((item) => [item.institutionId, item]));
  const candidates = catalog.programs.filter((program) => {
    const country = institutions.get(program.institutionId)?.country;
    return program.classification.subjectId === profile.target.subjectId && country?.state === "known" && profile.target.countryCodes.includes(country.value);
  });
  const recommendations = candidates.map((program): Recommendation => {
    const hasUnknown = program.coverage.language_test.status === "unknown" || program.coverage.academic_threshold.status === "unknown";
    const eligibility: DiagnosisBand = hasUnknown ? "insufficient_data" : "eligible";
    const feasibility: FeasibilityBand = program.coverage.cost.status === "unknown" ? "insufficient_data" : "feasible";
    return {
      program,
      eligibility,
      feasibility,
      rank: null,
      reasons: [
        eligibility === "eligible" ? "No confirmed eligibility blocker in the reviewed catalog facts." : "Some requirements need confirmation before this route is safe.",
        feasibility === "feasible" ? "The catalog contains a usable cost record for this program." : "Cost evidence is incomplete, so feasibility remains uncertain.",
        "Every deciding fact links to curated university evidence.",
      ],
      sourceCount: programSources(program),
    };
  });
  const qualified = recommendations.filter((item) => (item.eligibility === "eligible" || item.eligibility === "conditional") && (item.feasibility === "feasible" || item.feasibility === "tight"));
  qualified.forEach((item, index) => { item.rank = index + 1; });
  return {
    recommendations,
    qualified,
    findings: [
      { kind: "strength", title: "Your subject and country choices are clear", detail: `${candidates.length} catalog programs match the saved subject and selected countries.` },
      { kind: qualified.length ? "strength" : "blocker", title: qualified.length ? "A route is available to review" : "No safe route is ready yet", detail: qualified.length ? `${qualified.length} program${qualified.length === 1 ? "" : "s"} meet the current recommendation rule.` : "Add or confirm the missing facts called out below." },
      { kind: "uncertainty", title: "Unknown facts stay visible", detail: "Missing or manual review requirements are never treated as an automatic pass." },
    ],
    shortage: qualified.length < 3 ? `Only ${qualified.length} qualified recommendation${qualified.length === 1 ? " is" : "s are"} available for this filtered pool.` : null,
  };
}
