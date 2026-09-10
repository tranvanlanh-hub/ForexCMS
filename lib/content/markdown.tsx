import type { ReactNode } from "react";
import type { RenderableInternalLink } from "@/lib/internal-links";

type MarkdownBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

function parseMarkdown(markdown: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let paragraph: string[] = [];
  let listItems: string[] = [];

  function flushParagraph() {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", text: paragraph.join(" ").trim() });
      paragraph = [];
    }
  }

  function flushList() {
    if (listItems.length > 0) {
      blocks.push({ type: "list", items: listItems });
      listItems = [];
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const listMatch = line.match(/^[-*]\s+(.+)$/);
    if (listMatch) {
      flushParagraph();
      listItems.push(listMatch[1]);
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "heading",
        level: headingMatch[1].length <= 2 ? 2 : 3,
        text: headingMatch[2],
      });
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}

type InternalLinkRenderContext = {
  applied: number;
  currentWords: number;
  minWordsBetweenLinks: number;
  lastLinkedWord: number;
  links: RenderableInternalLink[];
  maxLinks: number;
  usedTargets: Set<string>;
};

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function findInternalLinkMatch(text: string, context?: InternalLinkRenderContext) {
  if (!context || context.applied >= context.maxLinks) {
    return null;
  }

  const sortedLinks = [...context.links].sort(
    (a, b) => b.anchorText.length - a.anchorText.length,
  );

  for (const link of sortedLinks) {
    if (context.usedTargets.has(link.targetPath)) {
      continue;
    }

    const match = new RegExp(
      `(^|[^\\p{L}\\p{N}])(${link.anchorText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})([^\\p{L}\\p{N}]|$)`,
      "iu",
    ).exec(text);

    if (!match) {
      continue;
    }

    const start = match.index + match[1].length;
    const wordPosition = context.currentWords + countWords(text.slice(0, start));

    if (
      context.lastLinkedWord >= 0 &&
      wordPosition - context.lastLinkedWord < context.minWordsBetweenLinks
    ) {
      continue;
    }

    return {
      end: start + match[2].length,
      link,
      start,
      wordPosition,
    };
  }

  return null;
}

function renderInlineText(
  text: string,
  context?: InternalLinkRenderContext,
): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*([^*]+)\*\*|`([^`]+)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const plainText = text.slice(lastIndex, match.index);
    const linkMatch = findInternalLinkMatch(plainText, context);

    if (linkMatch) {
      nodes.push(plainText.slice(0, linkMatch.start));
      nodes.push(
        <a
          className="font-semibold text-[#0f766e] underline decoration-[#9ccac4] underline-offset-4 hover:text-[#0b4f49]"
          href={linkMatch.link.targetPath}
          key={`internal-link-${match.index}-${linkMatch.start}`}
          title={linkMatch.link.targetTitle}
        >
          {plainText.slice(linkMatch.start, linkMatch.end)}
        </a>,
      );
      nodes.push(plainText.slice(linkMatch.end));
      if (context) {
        context.applied += 1;
        context.lastLinkedWord = linkMatch.wordPosition;
        context.usedTargets.add(linkMatch.link.targetPath);
      }
    } else if (plainText) {
      nodes.push(plainText);
    }

    if (match[2]) {
      nodes.push(
        <strong className="font-semibold text-[#111827]" key={match.index}>
          {match[2]}
        </strong>,
      );
    } else if (match[3]) {
      nodes.push(
        <code
          className="rounded border border-[#d9ded7] bg-[#fbfcfb] px-1 py-0.5 text-[0.9em]"
          key={match.index}
        >
          {match[3]}
        </code>,
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    const plainText = text.slice(lastIndex);
    const linkMatch = findInternalLinkMatch(plainText, context);

    if (linkMatch) {
      nodes.push(plainText.slice(0, linkMatch.start));
      nodes.push(
        <a
          className="font-semibold text-[#0f766e] underline decoration-[#9ccac4] underline-offset-4 hover:text-[#0b4f49]"
          href={linkMatch.link.targetPath}
          key={`internal-link-tail-${linkMatch.start}`}
          title={linkMatch.link.targetTitle}
        >
          {plainText.slice(linkMatch.start, linkMatch.end)}
        </a>,
      );
      nodes.push(plainText.slice(linkMatch.end));
      if (context) {
        context.applied += 1;
        context.lastLinkedWord = linkMatch.wordPosition;
        context.usedTargets.add(linkMatch.link.targetPath);
      }
    } else {
      nodes.push(plainText);
    }
  }

  if (context) {
    context.currentWords += countWords(text);
  }

  return nodes;
}

function slugifyAnchor(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function MarkdownContent({
  internalLinks = [],
  markdown,
}: {
  internalLinks?: RenderableInternalLink[];
  markdown: string;
}) {
  const blocks = parseMarkdown(markdown);
  const maxLinks =
    internalLinks.length > 0
      ? Math.min(
          8,
          Math.max(
            0,
            ...internalLinks.map((link) => link.maxLinksPerContent),
          ),
        )
      : 0;
  const minWordsBetweenLinks =
    internalLinks.length > 0
      ? Math.max(
          80,
          Math.min(
            ...internalLinks.map((link) => link.minWordsBetweenLinks),
          ),
        )
      : 120;
  const internalLinkContext: InternalLinkRenderContext | undefined =
    internalLinks.length > 0
      ? {
          applied: 0,
          currentWords: 0,
          lastLinkedWord: -1,
          links: internalLinks,
          maxLinks,
          minWordsBetweenLinks,
          usedTargets: new Set(),
        }
      : undefined;

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="prose-content">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const content = renderInlineText(block.text);

          if (block.level === 2) {
            return (
              <h2
                className="mt-9 text-2xl font-semibold leading-tight text-[#111827]"
                id={slugifyAnchor(block.text)}
                key={index}
              >
                {content}
              </h2>
            );
          }

          return (
            <h3
              className="mt-7 text-xl font-semibold leading-tight text-[#111827]"
              id={slugifyAnchor(block.text)}
              key={index}
            >
              {content}
            </h3>
          );
        }

        if (block.type === "list") {
          return (
            <ul
              className="mt-4 list-disc space-y-2 pl-6 text-base leading-7 text-[#374151]"
              key={index}
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  {renderInlineText(item, internalLinkContext)}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p className="mt-5 text-base leading-8 text-[#374151]" key={index}>
            {renderInlineText(block.text, internalLinkContext)}
          </p>
        );
      })}
    </div>
  );
}
