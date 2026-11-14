/** Responsibility: specify skill-intersection checks, first-strike grace, and the bounded micro-nudge. */
import { describe, expect, it } from "vitest";
import { calculateCalibration } from "../../src/engine/postInterviewCalibrator";
const base = { requestedNudge: 0.4, evaluatedSkillIds: ["ts"], opportunitySkillIds: ["ts", "sql"], studentSkillIds: ["ts", "react"] };
describe("postInterviewCalibrator", () => {
  it("applies first-strike grace", () => expect(calculateCalibration({ ...base, strikeNumber: 1 }).appliedNudge).toBe(0));
  it("caps later micro-nudges at 0.25", () => expect(calculateCalibration({ ...base, strikeNumber: 2 }).appliedNudge).toBe(0.25));
  it("rejects a skill outside OpportunitySkills intersect StudentSkills", () => expect(() => calculateCalibration({ ...base, strikeNumber: 2, evaluatedSkillIds: ["sql"] })).toThrow());
});
