// Round-1 auto-filter (README Phase 2 / ADR-003): a lightweight rule check
// against submission metadata, evaluated at submit time so an obvious
// rule-break never reaches peer voting. Deliberately generic — the actual
// rule set is seller-authored per campaign (checklistCriteria), not fixed
// in code.

export interface ChecklistCriteria {
  maxDurationSeconds?: number;
  minDurationSeconds?: number;
  requiredHashtag?: string;
}

export interface SubmissionMetadata {
  durationSeconds?: number;
  caption?: string;
}

export interface ChecklistResult {
  passed: boolean;
  violations: string[];
}

export function evaluateChecklist(
  criteria: ChecklistCriteria,
  metadata: SubmissionMetadata,
): ChecklistResult {
  const violations: string[] = [];

  if (
    criteria.maxDurationSeconds !== undefined &&
    metadata.durationSeconds !== undefined &&
    metadata.durationSeconds > criteria.maxDurationSeconds
  ) {
    violations.push(
      `duration ${metadata.durationSeconds}s exceeds max ${criteria.maxDurationSeconds}s`,
    );
  }

  if (
    criteria.minDurationSeconds !== undefined &&
    metadata.durationSeconds !== undefined &&
    metadata.durationSeconds < criteria.minDurationSeconds
  ) {
    violations.push(
      `duration ${metadata.durationSeconds}s is under min ${criteria.minDurationSeconds}s`,
    );
  }

  if (
    criteria.requiredHashtag &&
    !(metadata.caption ?? "").toLowerCase().includes(criteria.requiredHashtag.toLowerCase())
  ) {
    violations.push(`missing required hashtag ${criteria.requiredHashtag}`);
  }

  return { passed: violations.length === 0, violations };
}
