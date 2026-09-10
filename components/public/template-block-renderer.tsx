import { ContentType, type Broker, type BrokerFact, type Market } from "@prisma/client";
import { AffiliateCta } from "@/components/public/affiliate-cta";
import {
  brokerFactCategoryLabels,
  getSourcedBrokerFactHighlights,
  getSourcedBrokerFacts,
  groupBrokerFactsByCategory,
} from "@/lib/broker-facts";
import type { ContentBlock } from "@/lib/content/blocks";
import { MarkdownContent } from "@/lib/content/markdown";
import type { RenderableInternalLink } from "@/lib/internal-links";

type BrokerWithFacts = Pick<Broker, "slug" | "name"> & {
  factItems?: Array<
    Pick<
      BrokerFact,
      | "id"
      | "category"
      | "label"
      | "value"
      | "unit"
      | "appliesTo"
      | "sourceName"
      | "sourceUrl"
      | "displayOrder"
    > & {
      market?: Pick<Market, "code" | "name"> | null;
    }
  >;
};

type TemplateBlockRendererProps = {
  blocks: ContentBlock[];
  brokers: BrokerWithFacts[];
  contentId?: string;
  contentType?: ContentType;
  internalLinks?: RenderableInternalLink[];
  market: Pick<Market, "code" | "languageCode">;
};

function getVisibleBrokerFacts(broker: BrokerWithFacts, marketCode: string) {
  return getSourcedBrokerFacts(broker.factItems).filter(
    (fact) => !fact.market || fact.market.code === marketCode,
  );
}

function FactSourceLink({
  sourceName,
  sourceUrl,
}: {
  sourceName: string;
  sourceUrl: string;
}) {
  return (
    <a
      className="ml-2 font-medium text-[#0f766e] hover:underline"
      href={sourceUrl}
      rel="nofollow noopener noreferrer"
      target="_blank"
    >
      Source: {sourceName}
    </a>
  );
}

function SourcedBrokerHighlights({
  broker,
  marketCode,
}: {
  broker: BrokerWithFacts;
  marketCode: string;
}) {
  const highlights = getSourcedBrokerFactHighlights(
    getVisibleBrokerFacts(broker, marketCode),
  );
  const keyFacts = [
    ["Regulation", highlights.regulation],
    ["Rating", highlights.rating],
    ["Fees / spread", highlights.spread],
    ["Minimum deposit", highlights.minimumDeposit],
    ["Deposit / withdrawal", highlights.depositWithdrawal],
    ["Platform", highlights.platform],
    ["Account type", highlights.accountType],
  ].filter((item): item is [string, NonNullable<(typeof highlights)["spread"]>] =>
    Boolean(item[1]),
  );

  if (
    keyFacts.length === 0 &&
    highlights.pros.length === 0 &&
    highlights.cons.length === 0
  ) {
    return null;
  }

  return (
    <section className="mt-7 rounded-md border border-[#d9ded7] bg-white p-5">
      <h2 className="text-lg font-semibold text-[#111827]">
        {broker.name} sourced review snapshot
      </h2>
      {keyFacts.length > 0 ? (
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {keyFacts.map(([label, fact]) => (
            <div className="rounded-md bg-[#fbfcfb] p-3" key={`${label}-${fact.id}`}>
              <dt className="text-xs font-semibold uppercase text-[#5f6268]">
                {label}
              </dt>
              <dd className="mt-1 text-sm leading-6 text-[#374151]">
                <span className="font-semibold text-[#111827]">
                  {fact.value}
                  {fact.unit ? ` ${fact.unit}` : ""}
                </span>
                {fact.appliesTo ? (
                  <span className="ml-2 text-[#5f6268]">{fact.appliesTo}</span>
                ) : null}
                <FactSourceLink
                  sourceName={fact.sourceName}
                  sourceUrl={fact.sourceUrl}
                />
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {highlights.pros.length > 0 || highlights.cons.length > 0 ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-[#b7dfca] bg-[#f0fdf6] p-4">
            <h3 className="text-sm font-semibold text-[#166534]">Sourced pros</h3>
            <ul className="mt-3 space-y-3 text-sm leading-6 text-[#374151]">
              {highlights.pros.map((fact) => (
                <li key={fact.id}>
                  {fact.value}
                  <FactSourceLink
                    sourceName={fact.sourceName}
                    sourceUrl={fact.sourceUrl}
                  />
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-[#f0b8a8] bg-[#fff7f4] p-4">
            <h3 className="text-sm font-semibold text-[#9a3412]">Sourced cons</h3>
            <ul className="mt-3 space-y-3 text-sm leading-6 text-[#374151]">
              {highlights.cons.map((fact) => (
                <li key={fact.id}>
                  {fact.value}
                  <FactSourceLink
                    sourceName={fact.sourceName}
                    sourceUrl={fact.sourceUrl}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function BrokerFactSummary({
  broker,
  marketCode,
}: {
  broker: BrokerWithFacts;
  marketCode: string;
}) {
  const factGroups = groupBrokerFactsByCategory(
    getVisibleBrokerFacts(broker, marketCode),
  );

  if (factGroups.length === 0) {
    return null;
  }

  return (
    <section className="mt-7 rounded-md border border-[#d9ded7] bg-white p-5">
      <h2 className="text-lg font-semibold text-[#111827]">
        {broker.name} facts
      </h2>
      <div className="mt-4 divide-y divide-[#eef1ed]">
        {factGroups.map((group) => (
          <div className="py-4 first:pt-0 last:pb-0" key={group.category}>
            <h3 className="text-sm font-semibold text-[#123c3a]">
              {brokerFactCategoryLabels[group.category]}
            </h3>
            <dl className="mt-3 grid gap-3">
              {group.facts.map((fact) => (
                <div
                  className="grid gap-1 rounded-md bg-[#fbfcfb] p-3 sm:grid-cols-[170px_1fr]"
                  key={fact.id}
                >
                  <dt className="text-xs font-semibold uppercase text-[#5f6268]">
                    {fact.label}
                  </dt>
                  <dd className="text-sm leading-6 text-[#374151]">
                    <span className="font-semibold text-[#111827]">
                      {fact.value}
                      {fact.unit ? ` ${fact.unit}` : ""}
                    </span>
                    {fact.appliesTo ? (
                      <span className="ml-2 text-[#5f6268]">
                        {fact.appliesTo}
                      </span>
                    ) : null}
                    <FactSourceLink
                      sourceName={fact.sourceName}
                      sourceUrl={fact.sourceUrl}
                    />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TemplateBlockRenderer({
  blocks,
  brokers,
  contentId,
  contentType,
  internalLinks = [],
  market,
}: TemplateBlockRendererProps) {
  const primaryBroker = brokers[0];

  return (
    <div className="mt-8 border-t border-[var(--border)] pt-3">
      {contentType === ContentType.BROKER_REVIEW && primaryBroker ? (
        <>
          <SourcedBrokerHighlights
            broker={primaryBroker}
            marketCode={market.code}
          />
          <BrokerFactSummary broker={primaryBroker} marketCode={market.code} />
        </>
      ) : null}
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
              <h2 className="text-lg font-semibold text-[#123c3a]">
                {block.title}
              </h2>
              {block.items.length > 0 ? (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#166534]">
                  {block.items.map((item, itemIndex) => (
                    <li key={itemIndex}>{item}</li>
                  ))}
                </ul>
              ) : (
                <MarkdownContent markdown={block.markdown} />
              )}
            </section>
          );
        }

        if (block.type === "table_of_contents") {
          return (
            <nav
              aria-label="Table of contents"
              className="mt-7 rounded-md border border-[#d9ded7] bg-[#fbfcfb] p-5"
              key={index}
            >
              <h2 className="text-base font-semibold text-[#111827]">
                Table of contents
              </h2>
              <ol className="mt-3 space-y-2 text-sm font-medium text-[#374151]">
                {block.items.map((item) => (
                  <li key={item.id}>
                    <a className="hover:text-[#0f766e]" href={`#${item.id}`}>
                      {item.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          );
        }

        if (block.type === "pros_cons" && contentType !== ContentType.BROKER_REVIEW) {
          return (
            <section className="mt-7 grid gap-4 sm:grid-cols-2" key={index}>
              <div className="rounded-md border border-[#b7dfca] bg-white p-5">
                <h2 className="text-base font-semibold text-[#166534]">Pros</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#374151]">
                  {block.pros.map((item, itemIndex) => (
                    <li key={itemIndex}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-md border border-[#f0b8a8] bg-white p-5">
                <h2 className="text-base font-semibold text-[#9a3412]">Cons</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#374151]">
                  {block.cons.map((item, itemIndex) => (
                    <li key={itemIndex}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>
          );
        }

        if (block.type === "body") {
          return (
            <MarkdownContent
              internalLinks={internalLinks}
              key={index}
              markdown={block.markdown}
            />
          );
        }

        if (block.type === "faq") {
          return (
            <section className="mt-9" key={index}>
              <h2 className="text-2xl font-semibold leading-tight text-[#111827]">
                FAQ
              </h2>
              <div className="mt-4 divide-y divide-[#d9ded7] rounded-md border border-[#d9ded7] bg-white">
                {block.items.map((item, itemIndex) => (
                  <details className="p-4" key={itemIndex}>
                    <summary className="cursor-pointer text-sm font-semibold text-[#111827]">
                      {item.question}
                    </summary>
                    <p className="mt-3 text-sm leading-6 text-[#374151]">
                      {item.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          );
        }

        if (block.type === "cta_slot" && brokers.length > 0) {
          return (
            <div className="mt-8 border-t border-[var(--border)] pt-6" key={index}>
              <AffiliateCta
                broker={brokers[0].slug}
                campaign={block.campaign}
                contentId={contentId}
                language={market.languageCode}
                market={market.code}
              >
                {`Visit ${brokers[0].name}`}
              </AffiliateCta>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
