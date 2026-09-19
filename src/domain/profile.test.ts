import { describe, expect, it } from "vitest";
import { emptyProfile, parseStoredProfile, profileSchema, validateProfile } from "./profile";

const valid = { ...emptyProfile(), target: { subjectId: "computer_science", countryCodes: ["NL"] }, budget: { annualAmount: 24000, currency: "EUR" }, effort: { weeklyHours: 8 }, timing: { targetIntake: "2027", planningDate: "2026-09-19" } };

describe("applicant profile", () => {
  it("accepts the smallest useful profile with unknown tests", () => { expect(validateProfile({ ...valid, tests: [{ testId: "ielts_academic", status: "unknown" }, { testId: "sat", status: "unknown" }] }).success).toBe(true); });
  it("rejects unsupported countries and duplicate country overflow", () => { expect(profileSchema.safeParse({ ...valid, target: { subjectId: "computer_science", countryCodes: ["US"] } }).success).toBe(false); expect(profileSchema.safeParse({ ...valid, target: { subjectId: "computer_science", countryCodes: ["NL", "NL", "GB", "AU"] } }).success).toBe(false); });
  it("rejects invalid scores and dates", () => { expect(profileSchema.safeParse({ ...valid, tests: [{ testId: "ielts_academic", status: "completed", score: 7.3 }, { testId: "sat", status: "unknown" }] }).success).toBe(false); expect(profileSchema.safeParse({ ...valid, timing: { targetIntake: "2027", planningDate: "not-a-date" } }).success).toBe(false); });
  it("distinguishes valid stored envelopes from corrupt storage", () => { const envelope = { schemaVersion: 1, savedAt: "2026-09-19T00:00:00.000Z", profile: { ...valid, tests: [{ testId: "ielts_academic", status: "unknown" }, { testId: "sat", status: "unknown" }] } }; expect(parseStoredProfile(JSON.stringify(envelope)).kind).toBe("profile"); expect(parseStoredProfile("{").kind).toBe("invalid"); });
});
