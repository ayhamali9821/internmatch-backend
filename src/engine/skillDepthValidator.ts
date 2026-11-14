/** Responsibility: validate structured self-reported skill levels against configured evidence/depth rules. */
export interface SkillDepthInput { skillId: string; level: number; evidenceOptionIds: string[]; }
export interface SkillDepthRule { skillId: string; minLevel: number; maxLevel: number; requiredEvidenceCount: number; }
export interface SkillDepthResult { skillId: string; valid: boolean; reasons: string[]; }
export function validateSkillDepth(input: SkillDepthInput, rule: SkillDepthRule): SkillDepthResult {
  const reasons: string[] = [];
  if (input.skillId !== rule.skillId) reasons.push("SKILL_MISMATCH");
  if (!Number.isInteger(input.level) || input.level < rule.minLevel || input.level > rule.maxLevel) reasons.push("LEVEL_OUT_OF_RANGE");
  if (new Set(input.evidenceOptionIds).size < rule.requiredEvidenceCount) reasons.push("INSUFFICIENT_STRUCTURED_EVIDENCE");
  return { skillId: input.skillId, valid: reasons.length === 0, reasons };
}
