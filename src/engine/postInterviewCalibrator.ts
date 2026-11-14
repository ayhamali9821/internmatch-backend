/** Responsibility: produce a bounded pure calibration decision from approved structured evaluation data. */
import { MAX_MICRO_NUDGE } from "../config/constants";
export interface CalibrationInput { strikeNumber: number; requestedNudge: number; evaluatedSkillIds: string[]; opportunitySkillIds: string[]; studentSkillIds: string[]; }
export interface CalibrationDecision { eligibleSkillIds: string[]; firstStrikeGraceApplied: boolean; appliedNudge: number; }
export function calculateCalibration(input: CalibrationInput): CalibrationDecision {
  if (!Number.isInteger(input.strikeNumber) || input.strikeNumber < 1) throw new Error("strikeNumber must be a positive integer");
  const opportunity = new Set(input.opportunitySkillIds);
  const student = new Set(input.studentSkillIds);
  const allowed = new Set([...opportunity].filter((id) => student.has(id)));
  const invalid = input.evaluatedSkillIds.filter((id) => !allowed.has(id));
  if (invalid.length) throw new Error(`Evaluated skills are outside OpportunitySkills ∩ StudentSkills: ${invalid.join(",")}`);
  if (!Number.isFinite(input.requestedNudge) || input.requestedNudge < 0) throw new Error("requestedNudge must be a non-negative number");
  const firstStrikeGraceApplied = input.strikeNumber === 1;
  const appliedNudge = firstStrikeGraceApplied ? 0 : Math.min(input.requestedNudge, MAX_MICRO_NUDGE);
  return { eligibleSkillIds: [...new Set(input.evaluatedSkillIds)], firstStrikeGraceApplied, appliedNudge };
}
