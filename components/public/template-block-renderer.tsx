import { ContentType, type Broker, type Market } from "@prisma/client";
import { AffiliateCta } from "@/components/public/affiliate-cta";
import type { ContentBlock } from "@/lib/content/blocks";
import { MarkdownContent } from "@/lib/content/markdown";
import type { RenderableInternalLink } from "@/lib/internal-links";

type TemplateBlockRendererProps = {
  blocks: ContentBlock[];
  brokers: Pick<Broker, "slug" | "name">[];
  contentId?: string;
  contentType?: ContentType;
  internalLinks?: RenderableInternalLink[];
  market: Pick<Market, "code" | "languageCode">;
};

export function TemplateBlockRenderer({
  blocks,
  brokers,
  contentId,
  contentType,
  internalLinks = [],
  market,
}: TemplateBlockRendererProps) {
  return (
    <div className="article-blocks">
      {blocks.map((block, index) => {
        if (block.type === "intro") {
          return (
            <section className="text-lg leading-8 text-[#374151]" key={index}>
              <MarkdownContent markdown={block.markdown} />
            </section>
          );
        }

        if (block.type === "summary") {
          return (
            <section
              className="mt-7 rounded-md border border-[#b7dfca] bg-[#f0fdf6] p-5"
              key={index}
            >
              <h2 className="text-lg font-semibold text-[#123c3a]">{block.title}</h2>
              {block.items.length ? (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#166534]">
                  {block.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
                </ul>
              ) : <MarkdownContent markdown={block.markdown} />}
            </section>
          );
        }

        if (block.type === "table_of_contents") {
          return (
            <nav
              aria-label="Table of contents"
              className="mobile-article-toc mt-7 rounded-md border border-[#d9ded7] bg-[#fbfcfb] p-5"
              key={index}
            >
              <h2 className="text-base font-semibold text-[#111827]">Table of contents</h2>
              <ol className="mt-3 space-y-2 text-sm font-medium text-[#374151]">
                {block.items.map((item) => <li key={item.id}><a className="hover:text-[#0f766e]" href={`#${item.id}`}>{item.title}</a></li>)}
              </ol>
            </nav>
          );
        }

        if (block.type === "pros_cons") {
          return (
            <section className="mt-7 grid gap-4 sm:grid-cols-2" key={index}>
              <div className="rounded-md border border-[#b7dfca] bg-white p-5">
                <h2 className="text-base font-semibold text-[#166534]">Pros</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#374151]">
                  {block.pros.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
                </ul>
              </div>
              <div className="rounded-md border border-[#f0b8a8] bg-white p-5">
                <h2 className="text-base font-semibold text-[#9a3412]">Cons</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#374151]">
                  {block.cons.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
                </ul>
              </div>
            </section>
          );
        }

        if (block.type === "body") {
          return <MarkdownContent internalLinks={internalLinks} key={index} markdown={block.markdown} />;
        }

        if (block.type === "faq") {
          return (
            <section className="mt-9" key={index}>
              <h2 className="text-2xl font-semibold leading-tight text-[#111827]">FAQ</h2>
              <div className="mt-4 divide-y divide-[#d9ded7] rounded-md border border-[#d9ded7] bg-white">
                {block.items.map((item, itemIndex) => (
                  <details className="p-4" key={itemIndex}>
                    <summary className="cursor-pointer text-sm font-semibold text-[#111827]">{item.question}</summary>
                    <p className="mt-3 text-sm leading-6 text-[#374151]">{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          );
        }

        if (block.type === "cta_slot" && brokers.length && contentType !== ContentType.BROKER_REVIEW) {
          const primaryBroker = brokers[0];
          return (
            <div className="article-cta" key={index}>
              <AffiliateCta
                broker={primaryBroker.slug}
                campaign={block.campaign}
                contentId={contentId}
                language={market.languageCode}
                market={market.code}
              >
                {`Visit ${primaryBroker.name}`}
              </AffiliateCta>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
