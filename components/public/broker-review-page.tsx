import Image from "next/image";
import type {
  Broker,
  BrokerFact,
  BrokerReviewAssessment,
  ContentItem,
  Market,
  MediaAsset,
} from "@prisma/client";
import {
  BrokerReviewOffer,
  resolveBrokerReviewOffer,
} from "@/components/public/broker-review-offer";
import {
  getReviewScopedBrokerFacts,
} from "@/lib/broker-facts";
import {
  brokerReviewCriteria,
  brokerReviewMethodology,
  getBrokerReviewCriterionDisplay,
  getBrokerReviewMarkdownSections,
  getBrokerReviewScoreSummary,
} from "@/lib/brokers/review";
import { MarkdownContent } from "@/lib/content/markdown";
import type { FaqBlockItem } from "@/lib/content/blocks";
import type { RenderableInternalLink } from "@/lib/internal-links";
import { buildMediaPublicUrl } from "@/lib/storage";

type ReviewFact = Pick<
  BrokerFact,
  | "id"
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
  | "updatedAt"
> & {
  market?: Pick<Market, "code"> | null;
};

type ReviewBroker = Pick<
  Broker,
  | "name"
  | "slug"
  | "description"
  | "legalName"
  | "websiteUrl"
  | "foundedYear"
  | "headquartersCountry"
> & {
  logoMedia?: Pick<MediaAsset, "storageKey" | "altText"> | null;
  factItems: ReviewFact[];
  reviewAssessments: BrokerReviewAssessment[];
};

type ReviewContent = Pick<
  ContentItem,
  | "id"
  | "title"
  | "summary"
  | "authorName"
  | "reviewerName"
  | "updatedAt"
>;

type BrokerReviewPageProps = {
  broker?: ReviewBroker;
  content: ReviewContent;
  faqItems: FaqBlockItem[];
  internalLinks: RenderableInternalLink[];
  market: Pick<Market, "code" | "languageCode" | "locale" | "name">;
  markdown: string;
};

const sectionCategories = {
  deposits: ["PAYMENT_METHOD", "MINIMUM_DEPOSIT"],
  fees: ["SPREAD", "LEVERAGE"],
  platforms: ["PLATFORM", "ACCOUNT_TYPE"],
  regulation: ["REGULATION_LICENSE", "RESTRICTED_COUNTRY"],
} as const;

function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime())
    ? "Unavailable"
    : date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
}

function FactSource({ fact }: { fact: ReviewFact }) {
  return (
    <a
      className="broker-review-source"
      href={fact.sourceUrl}
      rel="nofollow noopener noreferrer"
      target="_blank"
    >
      {fact.sourceName}
    </a>
  );
}

function FactValue({ fact }: { fact: ReviewFact }) {
  return (
    <>
      <span className="font-semibold text-[#07162f]">
        {fact.value}
        {fact.unit ? ` ${fact.unit}` : ""}
      </span>
      {fact.appliesTo ? <span className="text-[#53657c]"> · {fact.appliesTo}</span> : null}
      <FactSource fact={fact} />
    </>
  );
}

function FactSection({
  facts,
  internalLinks,
  markdown,
  title,
}: {
  facts: ReviewFact[];
  internalLinks: RenderableInternalLink[];
  markdown: string;
  title: string;
}) {
  return (
    <section className="broker-review-evidence" id={title.toLowerCase().replace(/[^a-z]+/g, "-") }>
      <h2>{title}</h2>
      {markdown ? <MarkdownContent internalLinks={internalLinks} markdown={markdown} /> : null}
      {facts.length ? (
        <dl>
          {facts.map((fact) => (
            <div key={fact.id}>
              <dt>{fact.label}</dt>
              <dd><FactValue fact={fact} /></dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="broker-review-unavailable">Not independently verified for this market.</p>
      )}
    </section>
  );
}

function SourceList({
  sections,
}: {
  sections: Array<{ facts: ReviewFact[]; title: string }>;
}) {
  const usedUrls = new Set<string>();
  const groups = sections
    .map((section) => ({
      ...section,
      facts: section.facts.filter((fact) => {
        if (usedUrls.has(fact.sourceUrl)) return false;
        usedUrls.add(fact.sourceUrl);
        return true;
      }),
    }))
    .filter((section) => section.facts.length);

  if (!groups.length) return null;

  return (
    <section className="broker-review-sources" id="sources">
      <h2>Sources</h2>
      {groups.map((group) => (
        <div className="broker-review-source-group" key={group.title}>
          <h3>{group.title}</h3>
          <ol>
            {group.facts.map((fact) => (
              <li key={fact.sourceUrl}>
                <a href={fact.sourceUrl} rel="nofollow noopener noreferrer" target="_blank">
                  {fact.sourceName}
                </a>
                {fact.citationText ? <span> — {fact.citationText}</span> : null}
                {fact.sourceRetrievedAt ? <small> Retrieved {formatDate(fact.sourceRetrievedAt)}</small> : null}
              </li>
            ))}
          </ol>
        </div>
      ))}
    </section>
  );
}

export async function BrokerReviewPage({
  broker,
  content,
  faqItems,
  internalLinks,
  market,
  markdown,
}: BrokerReviewPageProps) {
  if (!broker) {
    return (
      <section className="broker-review-missing">
        <p>Broker review · {market.name}</p>
        <h1>{content.title}</h1>
        {content.summary ? <p className="broker-review-missing-verdict">{content.summary}</p> : null}
        <h2>Broker details are being reviewed</h2>
        <MarkdownContent internalLinks={internalLinks} markdown={markdown} />
      </section>
    );
  }

  const facts = getReviewScopedBrokerFacts(broker.factItems, market.code);
  const assessment = broker.reviewAssessments[0] ?? null;
  const scoreSummary = getBrokerReviewScoreSummary(assessment);
  const criteria = getBrokerReviewCriterionDisplay(assessment);
  const regulationFacts = facts.filter((fact) => sectionCategories.regulation.includes(fact.category as never));
  const feeFacts = facts.filter((fact) => sectionCategories.fees.includes(fact.category as never));
  const platformFacts = facts.filter((fact) => sectionCategories.platforms.includes(fact.category as never));
  const depositFacts = facts.filter((fact) => sectionCategories.deposits.includes(fact.category as never));
  const highlights = facts.filter((fact) => ["REGULATION_LICENSE", "SPREAD", "MINIMUM_DEPOSIT", "PLATFORM", "PAYMENT_METHOD"].includes(fact.category)).slice(0, 6);
  const pros = facts.filter((fact) => /^pro[:\s-]/i.test(fact.label));
  const cons = facts.filter((fact) => /^con[:\s-]/i.test(fact.label));
  const logoUrl = broker.logoMedia ? buildMediaPublicUrl(broker.logoMedia.storageKey) : null;
  const hasAssessment = scoreSummary.average !== null;
  const markdownSections = getBrokerReviewMarkdownSections(markdown);
  const [topOffer, middleOffer, bottomOffer] = await Promise.all([
    resolveBrokerReviewOffer({ broker: broker.slug, campaign: "review_top_cta", language: market.languageCode, market: market.code }),
    resolveBrokerReviewOffer({ broker: broker.slug, campaign: "review_middle_cta", language: market.languageCode, market: market.code }),
    resolveBrokerReviewOffer({ broker: broker.slug, campaign: "review_bottom_cta", language: market.languageCode, market: market.code }),
  ]);
  const hasOffer = Boolean(topOffer || middleOffer || bottomOffer);

  return (
    <div className="broker-review">
      <header className="broker-review-hero">
        <div className="broker-review-identity">
          {logoUrl ? <Image alt={broker.logoMedia?.altText || `${broker.name} logo`} height={74} src={logoUrl} unoptimized width={74} /> : <span aria-hidden="true">{broker.name.slice(0, 1)}</span>}
          <div>
            <p>Broker review · {market.name}</p>
            <h1>{content.title}</h1>
            {broker.legalName || broker.foundedYear || broker.headquartersCountry ? <small>{[broker.legalName, broker.foundedYear ? `Founded ${broker.foundedYear}` : null, broker.headquartersCountry].filter(Boolean).join(" · ")}</small> : null}
          </div>
        </div>
        <p className="broker-review-byline">Updated {formatDate(content.updatedAt)}{content.authorName ? ` · Written by ${content.authorName}` : ""}{content.reviewerName ? ` · Content reviewed by ${content.reviewerName}` : ""}</p>
      </header>

      <section className="broker-review-verdict" id="verdict">
        <div>
          <h2>Verdict</h2>
          <p>{content.summary || `${broker.name} is under editorial review for ${market.name}.`}</p>
        </div>
        {topOffer ? <BrokerReviewOffer broker={broker.slug} brokerName={broker.name} campaign="review_top_cta" contentId={content.id} language={market.languageCode} market={market.code} placement="top" /> : null}
        {!hasOffer ? <p className="broker-review-no-offer">MarketGB may not have a current offer for this broker in {market.name}. Review evidence and terms before choosing a broker.</p> : null}
      </section>

      <section className="broker-review-key-facts" id="key-facts">
        <h2>Key facts</h2>
        {highlights.length ? <dl>{highlights.map((fact) => <div key={fact.id}><dt>{fact.label}</dt><dd><FactValue fact={fact} /></dd></div>)}</dl> : <p className="broker-review-unavailable">Not independently verified for this market.</p>}
      </section>

      <section className="broker-review-scorecard" id="scorecard">
        <div className="broker-review-scorecard-heading">
          <div><h2>MarketGB scorecard</h2><p>Editorial assessment for {market.name}. Broker claims and evidence appear separately below.</p>{assessment?.reviewerName && assessment.reviewedAt ? <p className="broker-review-assessment-meta">Assessed by {assessment.reviewerName} on {formatDate(assessment.reviewedAt)}.</p> : null}</div>
          {hasAssessment ? <strong>{scoreSummary.average?.toFixed(1)}<small>/ 5</small><span>{scoreSummary.assessedCount} of {scoreSummary.totalCriteria} criteria assessed</span></strong> : null}
        </div>
        {hasAssessment ? <div className="broker-review-criteria">{criteria.map((criterion) => <article key={criterion.key}><div><h3>{criterion.label}</h3><b>{criterion.score === null ? "—" : `${criterion.score.toFixed(1)} / 5`}</b></div><p>{criterion.rationale || "Editorial rationale is unavailable for this criterion."}</p></article>)}</div> : <p className="broker-review-unavailable">MarketGB has not published a scorecard for this market.</p>}
      </section>

      <section className="broker-review-analysis" id="detailed-analysis">
        <h2>Detailed analysis</h2>
        <MarkdownContent internalLinks={internalLinks} markdown={markdownSections.analysisMarkdown} />
      </section>

      {middleOffer ? <BrokerReviewOffer broker={broker.slug} brokerName={broker.name} campaign="review_middle_cta" contentId={content.id} language={market.languageCode} market={market.code} placement="middle" /> : null}

      <section className="broker-review-pros-cons" id="pros-cons">
        <div><h2>Pros</h2>{pros.length ? <ul>{pros.map((fact) => <li key={fact.id}><FactValue fact={fact} /></li>)}</ul> : <p className="broker-review-unavailable">No sourced advantages are available for this market.</p>}</div>
        <div><h2>Cons</h2>{cons.length ? <ul>{cons.map((fact) => <li key={fact.id}><FactValue fact={fact} /></li>)}</ul> : <p className="broker-review-unavailable">No sourced limitations are available for this market.</p>}</div>
      </section>

      <FactSection facts={regulationFacts} internalLinks={internalLinks} markdown={markdownSections.regulationSafetyMarkdown} title="Regulation & safety" />
      <FactSection facts={feeFacts} internalLinks={internalLinks} markdown={markdownSections.feesMarkdown} title="Fees" />
      <FactSection facts={platformFacts} internalLinks={internalLinks} markdown={markdownSections.platformsMarkdown} title="Platforms" />
      <FactSection facts={depositFacts} internalLinks={internalLinks} markdown={markdownSections.depositsWithdrawalsMarkdown} title="Deposits & withdrawals" />

      <section className="broker-review-methodology" id="methodology">
        <h2>{brokerReviewMethodology.title}</h2>
        <p>{brokerReviewMethodology.description}</p>
        <ul>{brokerReviewCriteria.map((criterion) => <li key={criterion.key}><strong>{criterion.label}.</strong> {criterion.description}</li>)}</ul>
        <p>{brokerReviewMethodology.evidenceRule}</p>
        <p>{brokerReviewMethodology.affiliateDisclosure}</p>
      </section>

      <SourceList sections={[
        { facts: highlights, title: "Key facts" },
        { facts: pros, title: "Pros" },
        { facts: cons, title: "Cons" },
        { facts: regulationFacts, title: "Regulation & safety" },
        { facts: feeFacts, title: "Fees" },
        { facts: platformFacts, title: "Platforms" },
        { facts: depositFacts, title: "Deposits & withdrawals" },
      ]} />

      {faqItems.length ? <section className="broker-review-faq" id="faq"><h2>FAQ</h2>{faqItems.map((item, index) => <details key={`${item.question}-${index}`}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section> : null}

      {bottomOffer ? <BrokerReviewOffer broker={broker.slug} brokerName={broker.name} campaign="review_bottom_cta" contentId={content.id} language={market.languageCode} market={market.code} placement="bottom" /> : null}

      {facts.length ? <p className="broker-review-data-note">Facts shown are sourced records applicable to {market.name}; market-specific entries override matching global records.</p> : null}
    </div>
  );
}
