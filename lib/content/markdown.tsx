import type { ReactNode } from "react";

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

function renderInlineText(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*([^*]+)\*\*|`([^`]+)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
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
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

export function MarkdownContent({ markdown }: { markdown: string }) {
  const blocks = parseMarkdown(markdown);

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
                key={index}
              >
                {content}
              </h2>
            );
          }

          return (
            <h3
              className="mt-7 text-xl font-semibold leading-tight text-[#111827]"
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
                <li key={itemIndex}>{renderInlineText(item)}</li>
              ))}
            </ul>
          );
        }

        return (
          <p className="mt-5 text-base leading-8 text-[#374151]" key={index}>
            {renderInlineText(block.text)}
          </p>
        );
      })}
    </div>
  );
}
