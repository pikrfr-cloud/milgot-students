import { predicateLabelHe } from "./labels";
import type { Predicate, Rule, Sector } from "./types";

export function walkPredicates(rule: Rule, visit: (pred: Predicate) => void): void {
  if ("type" in rule) {
    visit(rule);
    return;
  }
  if (rule.op === "not") {
    walkPredicates(rule.rule, visit);
    return;
  }
  for (const child of rule.rules) walkPredicates(child, visit);
}

export function collectEligibilityLabels(rule: Rule): string[] {
  if ("type" in rule) return [predicateLabelHe(rule)];
  if (rule.op === "not") {
    const inner = collectEligibilityLabels(rule.rule);
    return inner.map((label) => `לא: ${label}`);
  }
  const inner = rule.rules.flatMap(collectEligibilityLabels);
  if (rule.labelHe) return [rule.labelHe, ...inner];
  return inner;
}

export function collectCityValues(rule: Rule): string[] {
  const cities = new Set<string>();
  walkPredicates(rule, (pred) => {
    if (pred.type === "cityIn") {
      for (const c of pred.values) cities.add(c);
    }
  });
  return [...cities];
}

export function collectSectorValues(rule: Rule): Sector[] {
  const sectors = new Set<Sector>();
  walkPredicates(rule, (pred) => {
    if (pred.type === "sectorIn") {
      for (const s of pred.values) sectors.add(s);
    }
  });
  return [...sectors];
}

export function collectInstitutionValues(rule: Rule): string[] {
  const ids = new Set<string>();
  walkPredicates(rule, (pred) => {
    if (pred.type === "institutionIn") {
      for (const id of pred.values) ids.add(id);
    }
  });
  return [...ids];
}
