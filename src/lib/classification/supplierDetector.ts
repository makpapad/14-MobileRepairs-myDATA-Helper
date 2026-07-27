import { classificationRules } from "./rules";

export function detectSupplier(text: string) {
  const rule = classificationRules.find((candidate) => candidate.match(text));
  return rule ? { ruleId: rule.id, label: rule.label } : null;
}
