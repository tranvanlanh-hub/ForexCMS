import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type DemoAffiliateToken = {
  broker: string;
  market: string;
  language: string;
  campaign: string;
};

export type DemoPilotDraft = {
  id: string;
  title: string;
  slug: string;
  market: string;
  language: string;
  contentType: string;
  template: string;
  status: string;
  targetKeyword: string;
  seoTitle: string;
  metaDescription: string;
  canonicalPath: string;
  topicCluster: string;
  schemaTypes: string[];
  faq: Array<{ question: string; answer: string }>;
  internalLinkTargets: string[];
  affiliateTokens: DemoAffiliateToken[];
  brokerMentions: string[];
  body: string;
};

export async function getDemoPilotDrafts() {
  try {
    const file = await readFile(
      join(process.cwd(), "data", "ai-content", "pilot-50-drafts.json"),
      "utf8",
    );

    return JSON.parse(file) as DemoPilotDraft[];
  } catch {
    return [];
  }
}

export function countDemoBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

export function getDemoMarkets(drafts: DemoPilotDraft[]) {
  return Object.entries(countDemoBy(drafts, (draft) => draft.market)).map(
    ([code, contentCount]) => {
      const draft = drafts.find((item) => item.market === code);

      return {
        code,
        contentCount,
        language: draft?.language ?? "",
        locale:
          code === "global"
            ? "en"
            : code === "vn"
              ? "vi-VN"
              : `en-${code.toUpperCase()}`,
        name:
          {
            au: "Australia",
            global: "Global",
            uk: "United Kingdom",
            us: "United States",
            vn: "Vietnam",
          }[code] ?? code,
      };
    },
  );
}

export function getDemoAffiliateRows(drafts: DemoPilotDraft[]) {
  const rows = new Map<string, DemoAffiliateToken & { contentCount: number }>();

  for (const draft of drafts) {
    for (const token of draft.affiliateTokens) {
      const key = `${token.market}:${token.language}:${token.broker}:${token.campaign}`;
      const existing = rows.get(key);

      rows.set(key, {
        ...token,
        contentCount: (existing?.contentCount ?? 0) + 1,
      });
    }
  }

  return [...rows.values()];
}

export function getDemoBrokerRows(drafts: DemoPilotDraft[]) {
  const rows = new Map<string, { slug: string; contentCount: number; tokenCount: number }>();

  for (const draft of drafts) {
    for (const broker of draft.brokerMentions) {
      const existing = rows.get(broker);
      rows.set(broker, {
        slug: broker,
        contentCount: (existing?.contentCount ?? 0) + 1,
        tokenCount: existing?.tokenCount ?? 0,
      });
    }

    for (const token of draft.affiliateTokens) {
      const existing = rows.get(token.broker);
      rows.set(token.broker, {
        slug: token.broker,
        contentCount: existing?.contentCount ?? 0,
        tokenCount: (existing?.tokenCount ?? 0) + 1,
      });
    }
  }

  return [...rows.values()];
}
