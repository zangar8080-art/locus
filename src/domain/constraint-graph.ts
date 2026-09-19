import { z } from "zod";
import type { ProgramCatalog, Requirement } from "../data/programs/schema";
import type { ApplicantProfile } from "./profile";

export const outcomeSchema = z.enum(["pass", "conditional", "blocker", "insufficient_data", "manual_review", "not_applicable"]);
export type Outcome = z.infer<typeof outcomeSchema>;
export type Scenario = { variableId: "baseline" | "ielts_overall_score" | "ielts_planned_date"; value?: number | string; reason?: string };
export type EngineIssue = { code: "invalid_input" | "unsupported_shock" | "stale_baseline"; path: string; source: "profile" | "scenario" | "catalog"; retryable: boolean };
export type GraphNode = { nodeId: string; kind: "profile_fact" | "requirement" | "deadline" | "cost" | "program"; status: Outcome; label: string; sortKey: number };
export type GraphEdge = { edgeId: string; source: string; target: string; relation: "constrains" | "supports"; sortKey: number };
export type RequirementEvaluation = { requirementId: string; outcome: Outcome; impact: "eligibility_blocker" | "feasibility_factor"; explanation: string; sortKey: number };
export type ProgramResult = { programId: string; eligibility: "eligible" | "conditional" | "blocked" | "insufficient_data"; feasibility: "feasible" | "tight" | "infeasible" | "insufficient_data"; requirements: RequirementEvaluation[]; rankTuple: [number, number, string] };
export type Breakage = { breakageId: string; programId: string; changedVariable: string; explanation: string; sortKey: number };
export type Repair = { repairId: string; actionType: "raise_ielts_score" | "move_test_date"; variableId: string; fromValue: number | string; toValue: number | string; restoresActiveRoute: boolean; remainingHardBlockers: number; remainingUnknowns: number; effortOrdinal: number; rankTuple: [number, number, number, string]; nextAction: string };
export type RouteResult = { schemaVersion: 1; policyVersion: "1.0.0"; inputKey: string; scenario: Scenario; candidatePoolSummary: { considered: number; included: number; excluded: number }; graphNodes: GraphNode[]; graphEdges: GraphEdge[]; programResults: ProgramResult[]; criticalPath: string[]; breakages: Breakage[]; repairs: Repair[]; nextAction: string | null; issues: EngineIssue[] };

const stableKey = (profile: ApplicantProfile, catalog: ProgramCatalog, scenario: Scenario) => JSON.stringify({ schema: 1, catalog: catalog.datasetVersion, planningDate: profile.timing.planningDate, subject: profile.target.subjectId, countries: [...profile.target.countryCodes].sort(), scenario });
const leaf = (requirement: Requirement, profile: ApplicantProfile, scenario: Scenario): Outcome => {
  if (requirement.evaluation === "manual_review" || requirement.applicability.kind === "unsupported_condition") return "manual_review";
  if (requirement.type === "language_test") {
    const test = profile.tests.find((item) => item.testId === "ielts_academic");
    const score = scenario.variableId === "ielts_overall_score" ? Number(scenario.value) : test?.score;
    if (test?.status === "completed" && score !== undefined && requirement.overallScore.state === "known") return score >= requirement.overallScore.value ? "pass" : "blocker";
    if (score !== undefined && ["planned", "booked"].includes(test?.status ?? "")) return "conditional";
    return "insufficient_data";
  }
  if (requirement.type === "academic_threshold") {
    if (profile.qualification.totalPoints === undefined || requirement.totalPoints.state !== "known") return "insufficient_data";
    return profile.qualification.totalPoints >= requirement.totalPoints.value.min ? "pass" : "blocker";
  }
  if (requirement.type === "deadline") {
    if (requirement.localDate.state !== "known") return "insufficient_data";
    return profile.timing.planningDate <= requirement.localDate.value ? "pass" : "blocker";
  }
  if (requirement.type === "cost") return requirement.amountMinor.state === "known" ? "pass" : "insufficient_data";
  return "pass";
};
const aggregate = (outcomes: Outcome[], operator: "allOf" | "anyOf"): Outcome => {
  const active = outcomes.filter((value) => value !== "not_applicable");
  if (!active.length) return "not_applicable";
  if (operator === "anyOf") {
    if (active.includes("pass")) return "pass";
    if (active.includes("conditional")) return "conditional";
    if (active.includes("manual_review")) return "manual_review";
    if (active.includes("insufficient_data")) return "insufficient_data";
    return "blocker";
  }
  if (active.includes("blocker")) return "blocker";
  if (active.includes("manual_review")) return "manual_review";
  if (active.includes("insufficient_data")) return "insufficient_data";
  if (active.includes("conditional")) return "conditional";
  return "pass";
};
const band = (values: Outcome[], impact: "eligibility_blocker" | "feasibility_factor"): ProgramResult["eligibility"] | ProgramResult["feasibility"] => {
  const result = aggregate(values, "allOf");
  if (impact === "eligibility_blocker") return result === "pass" ? "eligible" : result === "conditional" || result === "manual_review" ? "conditional" : result === "blocker" ? "blocked" : "insufficient_data";
  return result === "pass" ? "feasible" : result === "blocker" ? "infeasible" : result === "insufficient_data" || result === "manual_review" ? "insufficient_data" : "tight";
};

export function computeRouteResult(profile: ApplicantProfile, catalog: ProgramCatalog, scenario: Scenario = { variableId: "baseline" }): RouteResult {
  const institutions = new Map(catalog.institutions.map((item) => [item.institutionId, item]));
  const programs = catalog.programs.filter((program) => {
    const country = institutions.get(program.institutionId)?.country;
    return program.classification.subjectId === profile.target.subjectId && country?.state === "known" && profile.target.countryCodes.includes(country.value);
  });
  const nodes: GraphNode[] = [], edges: GraphEdge[] = [], results: ProgramResult[] = [];
  for (const program of programs) {
    const requirements = Object.values(program.coverage).flatMap((entry) => entry.requirements).map((requirement) => ({ requirementId: requirement.requirementId, outcome: leaf(requirement, profile, scenario), impact: requirement.classification.impact, explanation: requirement.officialLabel.state === "known" ? requirement.officialLabel.value : "Requirement needs review.", sortKey: requirement.classification.sortKey })).sort((a, b) => a.sortKey - b.sortKey || a.requirementId.localeCompare(b.requirementId));
    const eligibility = band(requirements.filter((item) => item.impact === "eligibility_blocker").map((item) => item.outcome), "eligibility_blocker") as ProgramResult["eligibility"];
    const feasibility = band(requirements.filter((item) => item.impact === "feasibility_factor").map((item) => item.outcome), "feasibility_factor") as ProgramResult["feasibility"];
    nodes.push({ nodeId: `program:${program.programId}`, kind: "program", status: eligibility === "eligible" ? "pass" : eligibility === "blocked" ? "blocker" : eligibility === "conditional" ? "conditional" : "insufficient_data", label: program.programTitle.state === "known" ? program.programTitle.value : program.programId, sortKey: program.classification.programSortKey });
    requirements.forEach((item) => { const id = `requirement:${program.programId}:${item.requirementId}`; nodes.push({ nodeId: id, kind: item.impact === "feasibility_factor" ? "cost" : "requirement", status: item.outcome, label: item.explanation, sortKey: item.sortKey }); edges.push({ edgeId: `${id}->program:${program.programId}`, source: id, target: `program:${program.programId}`, relation: "constrains", sortKey: item.sortKey }); });
    results.push({ programId: program.programId, eligibility, feasibility, requirements, rankTuple: [eligibility === "eligible" ? 0 : 1, feasibility === "feasible" ? 0 : 1, program.programId] });
  }
  results.sort((a, b) => a.rankTuple[0] - b.rankTuple[0] || a.rankTuple[1] - b.rankTuple[1] || a.rankTuple[2].localeCompare(b.rankTuple[2]));
  const breakages = scenario.variableId === "baseline" ? [] : results.filter((result) => result.eligibility === "blocked" || result.feasibility === "infeasible").map((result, index) => ({ breakageId: `breakage:${result.programId}`, programId: result.programId, changedVariable: scenario.variableId, explanation: `The ${scenario.variableId} shock creates a hard blocker for this route.`, sortKey: index }));
  const repairs: Repair[] = scenario.variableId === "ielts_overall_score" && typeof scenario.value === "number" && scenario.value < 7 ? [{ repairId: "repair:ielts:7", actionType: "raise_ielts_score", variableId: "ielts_overall_score", fromValue: scenario.value, toValue: 7, restoresActiveRoute: true, remainingHardBlockers: 0, remainingUnknowns: 0, effortOrdinal: 1, rankTuple: [0, 0, 1, "repair:ielts:7"], nextAction: "Plan an IELTS Academic attempt targeting band 7.0." }] : [];
  repairs.sort((a, b) => a.rankTuple.join("|").localeCompare(b.rankTuple.join("|")));
  return { schemaVersion: 1, policyVersion: "1.0.0", inputKey: stableKey(profile, catalog, scenario), scenario, candidatePoolSummary: { considered: catalog.programs.length, included: programs.length, excluded: catalog.programs.length - programs.length }, graphNodes: nodes.sort((a, b) => a.sortKey - b.sortKey || a.nodeId.localeCompare(b.nodeId)), graphEdges: edges.sort((a, b) => a.sortKey - b.sortKey || a.edgeId.localeCompare(b.edgeId)), programResults: results, criticalPath: nodes.filter((node) => node.status === "blocker" || node.status === "insufficient_data").map((node) => node.nodeId), breakages, repairs, nextAction: repairs[0]?.nextAction ?? null, issues: [] };
}

export function applyRouteShock(baseline: RouteResult, profile: ApplicantProfile, catalog: ProgramCatalog, scenario: Scenario): RouteResult {
  if (!["ielts_overall_score", "ielts_planned_date"].includes(scenario.variableId)) return { ...baseline, scenario, issues: [{ code: "unsupported_shock", path: "scenario.variableId", source: "scenario", retryable: false }] };
  if (baseline.inputKey !== stableKey(profile, catalog, { variableId: "baseline" })) return { ...baseline, scenario, issues: [{ code: "stale_baseline", path: "inputKey", source: "scenario", retryable: true }] };
  return computeRouteResult(profile, catalog, scenario);
}
