/** Responsibility: evaluate versioned closed-ended consistency checks as explainable deterministic signals. */
export interface TrapRule { id: string; expectedOptionByQuestion: Record<string, string>; signalWeight: number; }
export interface TrapResult { ruleId: string; triggered: boolean; matchedQuestionIds: string[]; signal: number; }
export function evaluateBehavioralTraps(rules: TrapRule[], answers: Record<string, string>): TrapResult[] {
  return rules.map((rule) => {
    const questionIds = Object.keys(rule.expectedOptionByQuestion);
    const matchedQuestionIds = questionIds.filter((id) => answers[id] === rule.expectedOptionByQuestion[id]);
    const triggered = questionIds.length > 0 && matchedQuestionIds.length === questionIds.length;
    return { ruleId: rule.id, triggered, matchedQuestionIds, signal: triggered ? Math.max(0, Math.min(1, rule.signalWeight)) : 0 };
  });
}
