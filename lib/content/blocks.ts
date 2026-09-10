import type { Prisma, Template } from "@prisma/client";

export type TableOfContentsItem = {
  id: string;
  title: string;
};

export type FaqBlockItem = {
  question: string;
  answer: string;
};

export type ContentBlock =
  | { type: "intro"; markdown: string }
  | { type: "summary"; title: string; items: string[]; markdown: string }
  | { type: "table_of_contents"; items: TableOfContentsItem[] }
  | { type: "body"; markdown: string }
  | { type: "faq"; items: FaqBlockItem[] }
  | { type: "pros_cons"; pros: string[]; cons: string[] }
  | { type: "cta_slot"; slot: string; campaign: string };

export type StructuredContentBody = {
  format: "markdown";
  markdown: string;
  blocks: ContentBlock[];
};

type MarkdownSection = {
  heading: string;
  id: string;
  lines: string[];
};

const summaryHeadings = new Set(["summary", "key takeaways", "takeaways"]);
const faqHeadings = new Set(["faq", "faqs", "frequently asked questions"]);
const prosConsHeadings = new Set(["pros and cons", "pros / cons", "pros & cons"]);

function slugifyAnchor(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeHeading(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function stripTopLevelTitle(markdown: string) {
  return markdown
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((line, index) => !(index === 0 && /^#\s+/.test(line.trim())))
    .join("\n")
    .trim();
}

function parseListItems(lines: string[]) {
  return lines
    .map((line) => line.trim().match(/^[-*]\s+(.+)$/)?.[1]?.trim())
    .filter((item): item is string => Boolean(item));
}

function splitMarkdownSections(markdown: string) {
  const lines = stripTopLevelTitle(markdown).split("\n");
  const introLines: string[] = [];
  const sections: MarkdownSection[] = [];
  let current: MarkdownSection | null = null;

  for (const rawLine of lines) {
    const headingMatch = rawLine.match(/^##\s+(.+)$/);

    if (headingMatch) {
      current = {
        heading: headingMatch[1].trim(),
        id: slugifyAnchor(headingMatch[1]),
        lines: [],
      };
      sections.push(current);
      continue;
    }

    if (current) {
      current.lines.push(rawLine);
    } else {
      introLines.push(rawLine);
    }
  }

  return {
    introMarkdown: introLines.join("\n").trim(),
    sections,
  };
}

function extractFaqItems(section: MarkdownSection): FaqBlockItem[] {
  const items: FaqBlockItem[] = [];
  let currentQuestion = "";
  let answerLines: string[] = [];

  function flushQuestion() {
    const answer = answerLines.join(" ").replace(/\s+/g, " ").trim();

    if (currentQuestion && answer) {
      items.push({ question: currentQuestion, answer });
    }

    currentQuestion = "";
    answerLines = [];
  }

  for (const rawLine of section.lines) {
    const line = rawLine.trim();
    const questionMatch = line.match(/^#{3,6}\s+(.+)$/);

    if (questionMatch) {
      flushQuestion();
      currentQuestion = questionMatch[1].trim().replace(/\?*$/, "?");
      continue;
    }

    if (currentQuestion && line) {
      answerLines.push(line.replace(/^[-*]\s+/, ""));
    }
  }

  flushQuestion();

  return items;
}

function extractProsCons(sections: MarkdownSection[]) {
  const pros: string[] = [];
  const cons: string[] = [];

  for (const section of sections) {
    const heading = normalizeHeading(section.heading);

    if (heading === "pros") {
      pros.push(...parseListItems(section.lines));
    }

    if (heading === "cons") {
      cons.push(...parseListItems(section.lines));
    }

    if (prosConsHeadings.has(heading)) {
      let target: "pros" | "cons" | null = null;

      for (const rawLine of section.lines) {
        const subheading = rawLine.match(/^#{3,6}\s+(.+)$/)?.[1];

        if (subheading) {
          const normalizedSubheading = normalizeHeading(subheading);
          target =
            normalizedSubheading === "pros"
              ? "pros"
              : normalizedSubheading === "cons"
                ? "cons"
                : null;
          continue;
        }

        const item = rawLine.trim().match(/^[-*]\s+(.+)$/)?.[1]?.trim();

        if (target && item) {
          if (target === "pros") pros.push(item);
          if (target === "cons") cons.push(item);
        }
      }
    }
  }

  return { pros, cons };
}

function asStringArray(value: Prisma.JsonValue | undefined) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function buildTemplateContentBlocks(input: {
  markdown: string;
  template?: Pick<Template, "allowedBlocks" | "ctaSlots"> | null;
}) {
  const allowedBlocks = new Set(asStringArray(input.template?.allowedBlocks));
  const allowsAll = allowedBlocks.size === 0;
  const ctaSlots = asStringArray(input.template?.ctaSlots);
  const { introMarkdown, sections } = splitMarkdownSections(input.markdown);
  const blocks: ContentBlock[] = [];
  const tocItems: TableOfContentsItem[] = [];
  const mainSectionMarkdown: string[] = [];
  const faqItems: FaqBlockItem[] = [];
  const prosCons = extractProsCons(sections);
  let summaryBlock: ContentBlock | null = null;

  function isAllowed(type: ContentBlock["type"], legacyName?: string) {
    return allowsAll || allowedBlocks.has(type) || Boolean(legacyName && allowedBlocks.has(legacyName));
  }

  if (introMarkdown && isAllowed("intro")) {
    blocks.push({ type: "intro", markdown: introMarkdown });
  }

  for (const section of sections) {
    const normalizedHeading = normalizeHeading(section.heading);

    if (summaryHeadings.has(normalizedHeading) && isAllowed("summary")) {
      summaryBlock = {
        type: "summary",
        title: section.heading,
        items: parseListItems(section.lines),
        markdown: section.lines.join("\n").trim(),
      };
      continue;
    }

    if (faqHeadings.has(normalizedHeading) && isAllowed("faq")) {
      faqItems.push(...extractFaqItems(section));
      continue;
    }

    if (
      (prosConsHeadings.has(normalizedHeading) ||
        normalizedHeading === "pros" ||
        normalizedHeading === "cons") &&
      isAllowed("pros_cons", "pros_cons")
    ) {
      continue;
    }

    tocItems.push({ id: section.id, title: section.heading });
    mainSectionMarkdown.push(`## ${section.heading}\n${section.lines.join("\n").trim()}`.trim());
  }

  if (summaryBlock) {
    blocks.push(summaryBlock);
  }

  if (tocItems.length > 1 && isAllowed("table_of_contents", "toc")) {
    blocks.push({ type: "table_of_contents", items: tocItems });
  }

  if ((prosCons.pros.length > 0 || prosCons.cons.length > 0) && isAllowed("pros_cons")) {
    blocks.push({ type: "pros_cons", pros: prosCons.pros, cons: prosCons.cons });
  }

  if (mainSectionMarkdown.length > 0 && isAllowed("body")) {
    blocks.push({ type: "body", markdown: mainSectionMarkdown.join("\n\n") });
  }

  if (faqItems.length > 0 && isAllowed("faq")) {
    blocks.push({ type: "faq", items: faqItems });
  }

  for (const slot of ctaSlots) {
    if (isAllowed("cta_slot", "cta")) {
      blocks.push({
        type: "cta_slot",
        slot,
        campaign: slot === "top" ? "review_top_cta" : `review_${slot}_cta`,
      });
    }
  }

  if (blocks.length === 0 && input.markdown.trim()) {
    blocks.push({ type: "body", markdown: stripTopLevelTitle(input.markdown) });
  }

  return blocks;
}

export function toStructuredContentBody(input: {
  markdown: string;
  template?: Pick<Template, "allowedBlocks" | "ctaSlots"> | null;
}): StructuredContentBody {
  const markdown = input.markdown.trim();

  return {
    format: "markdown",
    markdown,
    blocks: buildTemplateContentBlocks({ markdown, template: input.template }),
  };
}

export function getContentBlocks(
  body: Prisma.JsonValue | null | undefined,
  template?: Pick<Template, "allowedBlocks" | "ctaSlots"> | null,
) {
  if (
    body &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    "blocks" in body &&
    Array.isArray(body.blocks)
  ) {
    return body.blocks as ContentBlock[];
  }

  const markdown =
    body &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    "markdown" in body &&
    typeof body.markdown === "string"
      ? body.markdown
      : "";

  return buildTemplateContentBlocks({ markdown, template });
}

export function getFaqItemsFromBlocks(blocks: ContentBlock[]) {
  return blocks.flatMap((block) => (block.type === "faq" ? block.items : []));
}

export function getKeySectionsFromBlocks(blocks: ContentBlock[]) {
  const tocSections = blocks.flatMap((block) =>
    block.type === "table_of_contents" ? block.items.map((item) => item.title) : [],
  );
  const summaryItems = blocks.flatMap((block) =>
    block.type === "summary" ? block.items : [],
  );

  return [...new Set([...tocSections, ...summaryItems])];
}

export function validateRequiredTemplateBlocks(input: {
  markdown: string;
  requiredBlocks: Prisma.JsonValue;
  template?: Pick<Template, "allowedBlocks" | "ctaSlots"> | null;
}) {
  const requiredBlocks = asStringArray(input.requiredBlocks);
  const blocks = buildTemplateContentBlocks({
    markdown: input.markdown,
    template: input.template,
  });
  const presentBlocks = new Set(blocks.map((block) => block.type));
  const missingBlocks = requiredBlocks.filter((block) => {
    if (block === "cta") return !presentBlocks.has("cta_slot");
    if (block === "toc") return !presentBlocks.has("table_of_contents");

    return !presentBlocks.has(block as ContentBlock["type"]);
  });

  return missingBlocks.map((block) => `Template block is required: ${block}.`);
}
