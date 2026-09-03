import { amountDisplay, deadlineStatus, publicDeadlineLabelHe } from "./format";
import { walkPredicates } from "./rule-walk";
import type { Amount, Deadline, Scholarship } from "./types";

export type AmountConfidence = "approved" | "estimate" | "unpublished";

export function amountConfidence(amount: Amount): AmountConfidence {
  const hasMin = typeof amount.minIls === "number" && amount.minIls > 0;
  const hasMax = typeof amount.maxIls === "number" && amount.maxIls > 0;
  if (!hasMin && !hasMax) return "unpublished";
  if (amount.uncertain) return "estimate";
  return "approved";
}

/** ₪ chip: a number, or «לא פורסם». Estimate keeps the number; the face adds «צפי». */
export function amountChipHe(amount: Amount): string {
  if (amountConfidence(amount) === "unpublished") return "לא פורסם";
  return amountDisplay(amount).headlineHe;
}

/**
 * Deadline chip on a collapsed card.
 * Dated / rolling / opening-soon keep the public label.
 * Otherwise: «צפי» when we have a window or an uncertain estimate, else «טרם פורסם».
 */
export function deadlineChipHe(
  deadline: Deadline,
  lastVerified: string,
  asOf: Date = new Date(),
): string {
  const status = deadlineStatus(deadline, asOf);
  if (status.kind !== "unpublished") {
    return publicDeadlineLabelHe(deadline, lastVerified, asOf);
  }
  if (deadline.windowHe || deadline.uncertain) return "צפי";
  return "טרם פורסם";
}

/** Structured volunteering requirement — not free-text guessing. */
export function requiresVolunteering(s: Scholarship): boolean {
  if (s.types.includes("volunteering")) return true;
  let required = false;
  walkPredicates(s.eligibility, (pred) => {
    if (pred.type === "minVolunteerHours") required = true;
    if (pred.type === "willingToVolunteer" && pred.value !== false) required = true;
    if (pred.type === "hasPerach" && pred.value !== false) required = true;
  });
  return required;
}

export function volunteeringChipHe(s: Scholarship): string {
  return requiresVolunteering(s) ? "דורש התנדבות" : "ללא התנדבות";
}

export type FaceChips = {
  amountHe: string;
  amountConfidence: AmountConfidence;
  deadlineHe: string;
  volunteeringHe: string;
  requiresVolunteering: boolean;
};

export function faceChips(s: Scholarship, asOf: Date = new Date()): FaceChips {
  const confidence = amountConfidence(s.amounts);
  return {
    amountHe: amountChipHe(s.amounts),
    amountConfidence: confidence,
    deadlineHe: deadlineChipHe(s.deadline, s.lastVerified, asOf),
    volunteeringHe: volunteeringChipHe(s),
    requiresVolunteering: requiresVolunteering(s),
  };
}
