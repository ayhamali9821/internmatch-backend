/** Responsibility: validate strict nested percentage weights and calculate a deterministic weighted score. */
import { MATCH_AXES, type MatchAxis } from "../config/constants";
export interface WeightedItem { itemId: string; weight: number; }
export interface WeightedAxis { axis: MatchAxis; weight: number; items: WeightedItem[]; }
export interface NestedWeights { axes: WeightedAxis[]; }
export interface ItemScore { axis: MatchAxis; itemId: string; score: number; }
export class InvalidWeightsError extends Error { constructor(message: string) { super(message); this.name = "InvalidWeightsError"; } }
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
function validPercent(n: number): boolean { return Number.isFinite(n) && n >= 0 && n <= 100 && Math.round(n * 100) / 100 === n; }
const sumBasisPoints = (values: number[]) => values.reduce((total, value) => total + Math.round(value * 100), 0);
export function validateNestedWeights(config: NestedWeights): void {
  if (!config.axes.length) throw new InvalidWeightsError("At least one axis is required");
  const seen = new Set<string>();
  for (const row of config.axes) {
    if (!(MATCH_AXES as readonly string[]).includes(row.axis)) throw new InvalidWeightsError(`Unknown axis: ${row.axis}`);
    if (seen.has(row.axis)) throw new InvalidWeightsError(`Duplicate axis: ${row.axis}`);
    seen.add(row.axis);
    if (!validPercent(row.weight)) throw new InvalidWeightsError(`Invalid primary weight for ${row.axis}`);
    if (!row.items.length) throw new InvalidWeightsError(`Axis ${row.axis} must contain at least one item`);
    if (row.items.some((item) => !validPercent(item.weight))) throw new InvalidWeightsError(`Invalid sub-item weight for ${row.axis}`);
    if (new Set(row.items.map((item) => item.itemId)).size !== row.items.length) throw new InvalidWeightsError(`Duplicate sub-item in ${row.axis}`);
    if (sumBasisPoints(row.items.map((item) => item.weight)) !== 10_000) throw new InvalidWeightsError(`Sub-item weights for ${row.axis} must sum to 100`);
  }
  if (sumBasisPoints(config.axes.map((axis) => axis.weight)) !== 10_000) throw new InvalidWeightsError("Primary axis weights must sum to 100");
}
export function calculateNestedMatchScore(config: NestedWeights, scores: ItemScore[]): number {
  validateNestedWeights(config);
  const scoreMap = new Map(scores.map((entry) => [`${entry.axis}:${entry.itemId}`, entry.score]));
  let total = 0;
  for (const axis of config.axes) {
    const axisScore = axis.items.reduce((subtotal, item) => {
      const score = scoreMap.get(`${axis.axis}:${item.itemId}`);
      if (score === undefined || !Number.isFinite(score) || score < 0 || score > 100) throw new Error(`Missing or invalid score for ${axis.axis}/${item.itemId}`);
      return subtotal + (item.weight / 100) * score;
    }, 0);
    total += (axis.weight / 100) * axisScore;
  }
  return Number(total.toFixed(6));
}
