import { BrokerFactCategory, type BrokerFact } from "@prisma/client";

export const brokerFactCategoryLabels: Record<BrokerFactCategory, string> = {
  REGULATION_LICENSE: "Regulation / license",
  MINIMUM_DEPOSIT: "Minimum deposit",
  SPREAD: "Spread",
  LEVERAGE: "Leverage",
  PLATFORM: "Platform",
  ACCOUNT_TYPE: "Account type",
  PAYMENT_METHOD: "Deposit / withdrawal",
  SUPPORT_LANGUAGE: "Support language",
  RESTRICTED_COUNTRY: "Restricted country",
  OTHER: "Other",
};

export const brokerFactCategoryExamples: Record<BrokerFactCategory, string> = {
  REGULATION_LICENSE: "REGULATION_LICENSE | License | Example regulator license |  | Broker disclosure | https://example.com/source",
  MINIMUM_DEPOSIT: "MINIMUM_DEPOSIT | Standard account minimum | 10 | USD | Broker deposits page | https://example.com/source",
  SPREAD: "SPREAD | Typical EUR/USD spread | From 0.3 | pips | Broker pricing page | https://example.com/source",
  LEVERAGE: "LEVERAGE | Maximum retail leverage | 1:30 |  | Broker margin page | https://example.com/source",
  PLATFORM: "PLATFORM | Trading platform | MetaTrader 5 |  | Broker platforms page | https://example.com/source",
  ACCOUNT_TYPE: "ACCOUNT_TYPE | Account type | Standard |  | Broker accounts page | https://example.com/source",
  PAYMENT_METHOD: "PAYMENT_METHOD | Withdrawal method | Bank transfer |  | Broker funding page | https://example.com/source",
  SUPPORT_LANGUAGE: "SUPPORT_LANGUAGE | Support language | English |  | Broker support page | https://example.com/source",
  RESTRICTED_COUNTRY: "RESTRICTED_COUNTRY | Restricted country | United States |  | Broker legal page | https://example.com/source",
  OTHER: "OTHER | Founded | 2008 |  | Broker about page | https://example.com/source",
};

export type BrokerFactLine = Pick<
  BrokerFact,
  | "category"
  | "label"
  | "value"
  | "unit"
  | "appliesTo"
  | "sourceName"
  | "sourceUrl"
  | "citationText"
  | "sourceRetrievedAt"
  | "displayOrder"
  | "isPrimary"
>;

export type BrokerFactInput = BrokerFactLine & {
  marketCode?: string | null;
};

const allowedCategories = new Set<BrokerFactCategory>(
  Object.values(BrokerFactCategory),
);

export function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function serializeBrokerFactsForForm(
  facts: Array<
    BrokerFactLine & {
      market?: { code: string } | null;
    }
  >,
) {
  return facts
    .map((fact) =>
      [
        fact.category,
        fact.label,
        fact.value,
        fact.unit ?? "",
        fact.sourceName,
        fact.sourceUrl,
        fact.market?.code ?? "",
        fact.appliesTo ?? "",
        fact.citationText ?? "",
        fact.isPrimary ? "primary" : "",
      ].join(" | "),
    )
    .join("\n");
}

export function parseBrokerFactLines(rawValue: string) {
  const facts: BrokerFactInput[] = [];
  const errors: string[] = [];
  const lines = rawValue
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  lines.forEach((line, index) => {
    const parts = line.split("|").map((part) => part.trim());
    const [
      rawCategory,
      label,
      value,
      unit,
      sourceName,
      sourceUrl,
      marketCode,
      appliesTo,
      citationText,
      flag,
    ] = parts;
    const lineNumber = index + 1;

    if (parts.length < 6) {
      errors.push(
        `Fact line ${lineNumber} needs at least category, label, value, unit, source name, and source URL.`,
      );
      return;
    }

    const category = rawCategory as BrokerFactCategory;

    if (!allowedCategories.has(category)) {
      errors.push(`Fact line ${lineNumber} has an unknown category.`);
    }

    if (!label) errors.push(`Fact line ${lineNumber} needs a label.`);
    if (!value) errors.push(`Fact line ${lineNumber} needs a value.`);
    if (!sourceName) errors.push(`Fact line ${lineNumber} needs a source name.`);
    if (!sourceUrl || !isHttpUrl(sourceUrl)) {
      errors.push(`Fact line ${lineNumber} needs a valid source URL.`);
    }

    if (
      !allowedCategories.has(category) ||
      !label ||
      !value ||
      !sourceName ||
      !sourceUrl ||
      !isHttpUrl(sourceUrl)
    ) {
      return;
    }

    facts.push({
      category,
      label,
      value,
      unit: unit || null,
      appliesTo: appliesTo || null,
      sourceName,
      sourceUrl,
      citationText: citationText || null,
      sourceRetrievedAt: null,
      displayOrder: facts.length * 10 + 10,
      isPrimary: flag?.toLowerCase() === "primary",
      marketCode: marketCode || null,
    });
  });

  return { facts, errors };
}

export function groupBrokerFactsByCategory<T extends { category: BrokerFactCategory }>(
  facts: T[],
) {
  return Object.values(BrokerFactCategory)
    .map((category) => ({
      category,
      label: brokerFactCategoryLabels[category],
      facts: facts.filter((fact) => fact.category === category),
    }))
    .filter((group) => group.facts.length > 0);
}

export function getSourcedBrokerFacts<
  T extends {
    label: string;
    sourceName: string;
    sourceUrl: string;
  },
>(facts: T[] | undefined) {
  return (facts ?? []).filter(
    (fact) => fact.sourceName.trim() && isHttpUrl(fact.sourceUrl),
  );
}

export function getSourcedBrokerFactHighlights<
  T extends {
    category: BrokerFactCategory;
    label: string;
    value: string;
    sourceName: string;
    sourceUrl: string;
  },
>(facts: T[] | undefined) {
  const sourcedFacts = getSourcedBrokerFacts(facts);
  const normalized = (value: string) => value.trim().toLowerCase();
  const findByCategory = (category: BrokerFactCategory) =>
    sourcedFacts.find((fact) => fact.category === category);
  const findByLabel = (patterns: RegExp[]) =>
    sourcedFacts.find((fact) =>
      patterns.some((pattern) => pattern.test(normalized(fact.label))),
    );
  const pros = sourcedFacts.filter((fact) => /^pro[:\s-]/i.test(fact.label));
  const cons = sourcedFacts.filter((fact) => /^con[:\s-]/i.test(fact.label));
  const rating = findByLabel([/\brating\b/, /\bscore\b/]);

  return {
    accountType: findByCategory(BrokerFactCategory.ACCOUNT_TYPE),
    cons,
    depositWithdrawal: findByCategory(BrokerFactCategory.PAYMENT_METHOD),
    minimumDeposit: findByCategory(BrokerFactCategory.MINIMUM_DEPOSIT),
    platform: findByCategory(BrokerFactCategory.PLATFORM),
    pros,
    rating,
    regulation: findByCategory(BrokerFactCategory.REGULATION_LICENSE),
    spread: findByCategory(BrokerFactCategory.SPREAD),
  };
}
