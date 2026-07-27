import type { ClassificationResult, ParsedInvoiceData } from "./types";
import { classificationRules, unknownClassification } from "./rules";
import { classifyByPattern } from "./patternClassifier";
import { enrichFromRegistry, type SupplierRegistryEntry } from "./patternClassifier";

export async function classifyInvoiceText(
  text: string,
  parsed: ParsedInvoiceData,
  registryEntry: SupplierRegistryEntry | null = null
): Promise<ClassificationResult> {
  // First try specific rules (high confidence for known suppliers)
  const rule = classificationRules.find((candidate) => candidate.match(text));
  if (rule) {
    const result = rule.classify(text, parsed);
    // Enrich with registry if available
    if (registryEntry) {
      return enrichFromRegistry(result, registryEntry);
    }
    return result;
  }

  // Fall back to generic pattern-based classification
  const patternResult = classifyByPattern(parsed);

  // Enrich with registry if available
  if (registryEntry) {
    return enrichFromRegistry(patternResult, registryEntry);
  }

  return patternResult;
}
