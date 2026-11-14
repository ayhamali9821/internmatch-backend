/** Responsibility: specify strict 100% nested-weight validation and deterministic score math. */
import { describe, expect, it } from "vitest";
import { calculateNestedMatchScore, validateNestedWeights, InvalidWeightsError, type NestedWeights } from "../../src/engine/nestedMatchCalculator";
const config: NestedWeights = { axes: [
  { axis: "technical", weight: 60, items: [{ itemId: "sql", weight: 50 }, { itemId: "api", weight: 50 }] },
  { axis: "soft", weight: 10, items: [{ itemId: "communication", weight: 100 }] },
  { axis: "behavioral", weight: 10, items: [{ itemId: "consistency", weight: 100 }] },
  { axis: "interest", weight: 10, items: [{ itemId: "interest", weight: 100 }] },
  { axis: "educational", weight: 10, items: [{ itemId: "education", weight: 100 }] },
] };
describe("nestedMatchCalculator", () => {
  it("accepts primary and per-axis child weights totaling 100", () => expect(() => validateNestedWeights(config)).not.toThrow());
  it("rejects a primary total other than 100", () => expect(() => validateNestedWeights({ ...config, axes: config.axes.map((a, i) => i === 0 ? { ...a, weight: 59 } : a) })).toThrow(InvalidWeightsError));
  it("rejects a missing primary axis", () => expect(() => validateNestedWeights({ axes: config.axes.slice(0, 4) })).toThrow(InvalidWeightsError));
  it("calculates a deterministic weighted score", () => expect(calculateNestedMatchScore(config, [
    { axis: "technical", itemId: "sql", score: 100 }, { axis: "technical", itemId: "api", score: 0 },
    { axis: "soft", itemId: "communication", score: 100 }, { axis: "behavioral", itemId: "consistency", score: 100 },
    { axis: "interest", itemId: "interest", score: 100 }, { axis: "educational", itemId: "education", score: 100 },
  ])).toBe(70));
});
