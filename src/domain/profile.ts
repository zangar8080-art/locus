import { z } from "zod";
import { COUNTRY_CODES, SUBJECT_IDS } from "../data/programs/schema";

export const profileStorageKey = "routestress.profile.v1";
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => { const [y,m,d] = value.split("-").map(Number); const date = new Date(Date.UTC(y,m-1,d)); return date.getUTCFullYear() === y && date.getUTCMonth() === m-1 && date.getUTCDate() === d; }, "Use a real calendar date");
const testStatus = z.enum(["planned", "booked", "completed", "not_required", "unknown"]);
const testSchema = z.object({ testId: z.enum(["ielts_academic", "sat"]), status: testStatus, score: z.number().optional(), plannedDate: isoDate.optional() }).superRefine((value, ctx) => { if (value.score === undefined) return; const valid = value.testId === "ielts_academic" ? value.score >= 0 && value.score <= 9 && Number.isInteger(value.score * 2) : value.score >= 400 && value.score <= 1600 && Number.isInteger(value.score); if (!valid) ctx.addIssue({ code: "custom", path: ["score"], message: "Score is outside the selected test scale" }); });
export const profileSchema = z.object({
  qualification: z.object({ kind: z.literal("ib_diploma"), version: z.literal(1), totalPoints: z.number().min(0).max(45).optional(), higherLevelSubjects: z.array(z.object({ subjectId: z.string(), grade: z.number().int().min(1).max(7).optional() })) }),
  target: z.object({ subjectId: z.enum(SUBJECT_IDS), countryCodes: z.array(z.enum(COUNTRY_CODES)).min(1).max(3) }),
  budget: z.object({ annualAmount: z.number().positive().multipleOf(0.01), currency: z.enum(["GBP", "CAD", "EUR", "AUD"]) }),
  effort: z.object({ weeklyHours: z.number().min(0).max(168).multipleOf(0.1) }),
  tests: z.array(testSchema).length(2),
  timing: z.object({ targetIntake: z.string().min(1), planningDate: isoDate }),
});
export type ApplicantProfile = z.infer<typeof profileSchema>;
export const envelopeSchema = z.object({ schemaVersion: z.literal(1), savedAt: z.string().datetime(), profile: profileSchema });
export type ProfileEnvelope = z.infer<typeof envelopeSchema>;
export const emptyProfile = (): Partial<ApplicantProfile> => ({ qualification: { kind: "ib_diploma", version: 1, higherLevelSubjects: [] }, tests: [{ testId: "ielts_academic", status: "unknown" }, { testId: "sat", status: "unknown" }] });
export function validateProfile(input: unknown) { return profileSchema.safeParse(input); }
export function parseStoredProfile(input: string | null) {
  if (!input) return { kind: "empty" as const };
  try { const parsed = envelopeSchema.safeParse(JSON.parse(input)); return parsed.success ? { kind: "profile" as const, envelope: parsed.data } : { kind: "invalid" as const }; }
  catch { return { kind: "invalid" as const };
  }
}
