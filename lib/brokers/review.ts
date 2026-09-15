import type { BrokerReviewAssessment, Prisma } from "@prisma/client";

export const BROKER_REVIEW_METHODOLOGY_VERSION = "broker-review-v1";
export const BROKER_REVIEW_SCORE_MAX = 5;
export const BROKER_REVIEW_RATIONALE_MAX_LENGTH = 500;

export const brokerReviewCriteria = [
  {
    key: "regulationTrust",
    label: "Regulation & trust",
    scoreField: "regulationTrustScore",
    rationaleField: "regulationTrustRationale",
    description: "Regulatory status, client safeguards, transparency, and risk controls.",
  },
  {
    key: "costs",
    label: "Costs",
    scoreField: "costsScore",
    rationaleField: "costsRationale",
    description: "Spreads, commissions, funding costs, and clarity of pricing.",
  },
  {
    key: "tradingExperience",
    label: "Trading experience",
    scoreField: "tradingExperienceScore",
    rationaleField: "tradingExperienceRationale",
    description: "Platforms, tools, account experience, and practical usability.",
  },
  {
    key: "depositsWithdrawals",
    label: "Deposits & withdrawals",
    scoreField: "depositsWithdrawalsScore",
    rationaleField: "depositsWithdrawalsRationale",
    description: "Funding options, withdrawal terms, and process clarity.",
  },
  {
    key: "supportEducation",
    label: "Support & education",
    scoreField: "supportEducationScore",
    rationaleField: "supportEducationRationale",
    description: "Support access, educational material, and client guidance.",
  },
] as const;

export type BrokerReviewCriterionKey = (typeof brokerReviewCriteria)[number]["key"];
type BrokerReviewScoreField = (typeof brokerReviewCriteria)[number]["scoreField"];
type BrokerReviewRationaleField = (typeof brokerReviewCriteria)[number]["rationaleField"];

type ReviewAssessmentFields = Pick<
  BrokerReviewAssessment,
  BrokerReviewScoreField | BrokerReviewRationaleField | "reviewerName" | "reviewedAt" | "methodologyVersion"
>;

export type BrokerReviewScoreSummary = {
  average: number | null;
  assessedCount: number;
  totalCriteria: number;
};

export function toReviewScore(value: Prisma.Decimal | number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= BROKER_REVIEW_SCORE_MAX
    ? Math.round(parsed * 10) / 10
    : null;
}

export function getBrokerReviewScoreSummary(
  assessment: ReviewAssessmentFields | null | undefined,
): BrokerReviewScoreSummary {
  const scores = brokerReviewCriteria
    .map((criterion) => toReviewScore(assessment?.[criterion.scoreField]))
    .filter((score): score is number => score !== null);

  return {
    average: scores.length
      ? Math.round((scores.reduce((total, score) => total + score, 0) / scores.length) * 10) / 10
      : null,
    assessedCount: scores.length,
    totalCriteria: brokerReviewCriteria.length,
  };
}

export function getBrokerReviewCriterionDisplay(
  assessment: ReviewAssessmentFields | null | undefined,
) {
  return brokerReviewCriteria.map((criterion) => ({
    ...criterion,
    rationale: assessment?.[criterion.rationaleField]?.trim() || null,
    score: toReviewScore(assessment?.[criterion.scoreField]),
  }));
}

export function validateBrokerReviewAssessment(input: {
  scores: Record<BrokerReviewScoreField, string>;
  rationales: Record<BrokerReviewRationaleField, string>;
  reviewerName: string;
  reviewedAt: string;
}) {
  const errors: string[] = [];
  let hasScore = false;

  for (const criterion of brokerReviewCriteria) {
    const value = input.scores[criterion.scoreField].trim();
    const rationale = input.rationales[criterion.rationaleField].trim();

    if (rationale.length > BROKER_REVIEW_RATIONALE_MAX_LENGTH) {
      errors.push(`${criterion.label} rationale must be ${BROKER_REVIEW_RATIONALE_MAX_LENGTH} characters or less.`);
    }
    if (!value) continue;

    hasScore = true;
    if (!/^\d(?:\.\d)?$/.test(value) || Number(value) > BROKER_REVIEW_SCORE_MAX) {
      errors.push(`${criterion.label} score must be between 0 and 5 with at most one decimal place.`);
    }
  }

  if (hasScore && !input.reviewerName.trim()) {
    errors.push("Reviewer name is required when an assessment score is entered.");
  }
  if (hasScore && !parseReviewDate(input.reviewedAt)) {
    errors.push("Review date is required when an assessment score is entered.");
  }

  return errors;
}

export function parseReviewDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value
    ? null
    : parsed;
}

const coreReviewHeadings = [
  "regulation & safety",
  "fees",
  "platforms",
  "deposits & withdrawals",
] as const;

function normalizeHeading(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getBrokerReviewStructureWarnings(markdown: string) {
  const headings = new Set(
    [...markdown.matchAll(/^##\s+(.+)$/gm)].map((match) => normalizeHeading(match[1])),
  );

  return coreReviewHeadings
    .filter((heading) => !headings.has(heading))
    .map((heading) => `Add ## ${heading.replace(/\b\w/g, (letter) => letter.toUpperCase())} for the recommended review structure.`);
}

export type BrokerReviewMarkdownSections = {
  analysisMarkdown: string;
  depositsWithdrawalsMarkdown: string;
  feesMarkdown: string;
  platformsMarkdown: string;
  regulationSafetyMarkdown: string;
};

const reviewSectionAliases: Record<keyof Omit<BrokerReviewMarkdownSections, "analysisMarkdown">, string[]> = {
  depositsWithdrawalsMarkdown: ["deposits & withdrawals", "deposits and withdrawals"],
  feesMarkdown: ["fees"],
  platformsMarkdown: ["platforms"],
  regulationSafetyMarkdown: ["regulation & safety", "regulation and safety"],
};

function isFaqHeading(value: string) {
  return ["faq", "faqs", "frequently asked questions"].includes(normalizeHeading(value));
}

export function getBrokerReviewMarkdownSections(markdown: string): BrokerReviewMarkdownSections {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const sections: Array<{ heading: string | null; lines: string[] }> = [];
  let current = { heading: null as string | null, lines: [] as string[] };

  function flush() {
    if (current.heading || current.lines.some((line) => line.trim())) sections.push(current);
    current = { heading: null, lines: [] };
  }

  for (const line of lines) {
    const heading = line.match(/^##\s+(.+)$/)?.[1];
    if (heading) {
      flush();
      current = { heading: heading.trim(), lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  flush();

  const output: BrokerReviewMarkdownSections = {
    analysisMarkdown: "",
    depositsWithdrawalsMarkdown: "",
    feesMarkdown: "",
    platformsMarkdown: "",
    regulationSafetyMarkdown: "",
  };
  const analysis: string[] = [];

  for (const section of sections) {
    if (section.heading && isFaqHeading(section.heading)) continue;
    const key = section.heading
      ? (Object.entries(reviewSectionAliases).find(([, aliases]) => aliases.includes(normalizeHeading(section.heading!)))?.[0] as keyof Omit<BrokerReviewMarkdownSections, "analysisMarkdown"> | undefined)
      : undefined;
    const body = section.lines.join("\n").trim();

    if (key) {
      output[key] = body;
      continue;
    }

    if (section.heading) analysis.push(`## ${section.heading}\n${body}`.trim());
    else if (body) analysis.push(body);
  }

  output.analysisMarkdown = analysis.join("\n\n").trim();
  return output;
}

export const brokerReviewMethodology = {
  version: BROKER_REVIEW_METHODOLOGY_VERSION,
  title: "How MarketGB reviews brokers",
  description:
    "MarketGB scores the evidence available for this market. Scores are editorial assessments, not broker-supplied claims or investment advice.",
  evidenceRule:
    "Factual claims shown in this review link to sources. Market-specific evidence takes priority over a matching global claim.",
  affiliateDisclosure:
    "Some links may be affiliate links. Commercial relationships do not change the assessment methodology.",
} as const;
