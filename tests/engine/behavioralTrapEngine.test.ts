/** Responsibility: specify deterministic behavioral consistency signal behavior. */
import { describe, expect, it } from "vitest";
import { evaluateBehavioralTraps } from "../../src/engine/behavioralTrapEngine";
describe("evaluateBehavioralTraps", () => {
  it("returns the same explainable signal for identical structured answers", () => {
    const rules = [{ id: "consistency-1", expectedOptionByQuestion: { q1: "a", q2: "b" }, signalWeight: 0.5 }];
    expect(evaluateBehavioralTraps(rules, { q1: "a", q2: "b" })).toEqual(evaluateBehavioralTraps(rules, { q1: "a", q2: "b" }));
  });
});
