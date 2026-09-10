import { BrokerFactCategory } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/public/site-chrome";
import { notFound } from "next/navigation";
import { AffiliateCta } from "@/components/public/affiliate-cta";
import { brokerFactCategoryLabels, getSourcedBrokerFactHighlights, groupBrokerFactsByCategory, } from "@/lib/broker-facts";
import { getBrokerComparisonByRoute } from "@/lib/routing/broker-comparison";
import { absoluteUrl, buildBreadcrumbJsonLd, buildItemListJsonLd, stringifyJsonLd, } from "@/lib/seo";
export const dynamic = "force-dynamic";
type BrokerComparisonPageProps = {
    params: Promise<{
        market: string;
        pair: string;
    }>;
};
type ComparisonData = NonNullable<Awaited<ReturnType<typeof getBrokerComparisonByRoute>>>;
type ComparedBroker = ComparisonData["brokers"][number];
function getComparisonCategories(brokers: ComparedBroker[]) {
    const categories = new Set<BrokerFactCategory>();
    brokers.forEach((broker) => {
        broker.factItems
            .filter((fact) => fact.sourceName && fact.sourceUrl)
            .forEach((fact) => categories.add(fact.category));
    });
    return Object.values(brokerFactCategoryLabels)
        .map((label, index) => ({
        category: Object.values(BrokerFactCategory)[index],
        label,
    }))
        .filter((item) => categories.has(item.category));
}
function BrokerFactCell({ broker, category, }: {
    broker: ComparedBroker;
    category: BrokerFactCategory;
}) {
    const facts = groupBrokerFactsByCategory(broker.factItems.filter((fact) => fact.category === category && fact.sourceName && fact.sourceUrl))[0]?.facts;
    if (!facts || facts.length === 0) {
        return <span className="text-[#8a8f98]">No sourced data yet</span>;
    }
    return (<ul className="space-y-3">
      {facts.map((fact) => (<li className="leading-6" key={fact.id}>
          <span className="font-semibold text-[#111827]">{fact.label}: </span>
          <span>
            {fact.value}
            {fact.unit ? ` ${fact.unit}` : ""}
          </span>
          {fact.appliesTo ? (<span className="text-[#5f6268]"> ({fact.appliesTo})</span>) : null}
          <a className="ml-2 font-medium text-[#0f766e] hover:underline" href={fact.sourceUrl} rel="nofollow noopener noreferrer" target="_blank">
            Source
          </a>
        </li>))}
    </ul>);
}
function ComparisonSnapshot({ broker, }: {
    broker: ComparedBroker;
}) {
    const highlights = getSourcedBrokerFactHighlights(broker.factItems);
    const rows = [
        ["Regulation", highlights.regulation],
        ["Rating", highlights.rating],
        ["Fees / spread", highlights.spread],
        ["Minimum deposit", highlights.minimumDeposit],
        ["Deposit / withdrawal", highlights.depositWithdrawal],
        ["Platform", highlights.platform],
    ].filter((item): item is [
        string,
        NonNullable<(typeof highlights)["spread"]>
    ] => Boolean(item[1]));
    if (rows.length === 0) {
        return null;
    }
    return (<dl className="mt-5 grid gap-3">
      {rows.map(([label, fact]) => (<div className="rounded-md bg-[#fbfcfb] p-3" key={`${broker.id}-${label}`}>
          <dt className="text-xs font-semibold uppercase text-[#5f6268]">
            {label}
          </dt>
          <dd className="mt-1 text-sm leading-6 text-[#374151]">
            <span className="font-semibold text-[#111827]">
              {fact.value}
              {fact.unit ? ` ${fact.unit}` : ""}
            </span>
            <a className="ml-2 font-medium text-[#0f766e] hover:underline" href={fact.sourceUrl} rel="nofollow noopener noreferrer" target="_blank">
              Source
            </a>
          </dd>
        </div>))}
    </dl>);
}
export async function generateMetadata({ params, }: BrokerComparisonPageProps): Promise<Metadata> {
    const routeParams = await params;
    const comparison = await getBrokerComparisonByRoute(routeParams);
    if (!comparison) {
        return {
            title: "Broker comparison not found",
            robots: {
                index: false,
                follow: false,
            },
        };
    }
    const [brokerA, brokerB] = comparison.brokers;
    const title = `${brokerA.name} vs ${brokerB.name} comparison`;
    return {
        title,
        description: "Compare broker account features, trading conditions and available source information.",
        alternates: {
            canonical: absoluteUrl(comparison.canonicalPath),
        },
        robots: {
            index: true,
            follow: true,
        },
    };
}
export default async function BrokerComparisonPage({ params, }: BrokerComparisonPageProps) {
    const routeParams = await params;
    const comparison = await getBrokerComparisonByRoute(routeParams);
    if (!comparison) {
        notFound();
    }
    const [brokerA, brokerB] = comparison.brokers;
    const categories = getComparisonCategories(comparison.brokers);
    const title = `${brokerA.name} vs ${brokerB.name}`;
    const breadcrumbItems = [
        { name: "Home", path: "/" },
        { name: comparison.market.name, path: `/${comparison.market.code}/` },
        { name: "Compare", path: `/${comparison.market.code}/compare/` },
        { name: title, path: comparison.canonicalPath },
    ];
    const jsonLdSchemas = [
        buildBreadcrumbJsonLd(breadcrumbItems),
        buildItemListJsonLd({
            canonicalPath: comparison.canonicalPath,
            name: `${title} broker comparison`,
            items: comparison.brokers.map((broker) => ({
                name: broker.name,
                path: `/${comparison.market.code}/brokers/${broker.slug}/`,
            })),
        }),
    ];
    return (<div className="public-site">
      <SiteHeader />

      <main className="site-container py-10">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm font-medium text-[#5f6268]">
          {breadcrumbItems.map((item, index) => (<span key={item.path}>
              {index > 0 ? <span className="mx-2">/</span> : null}
              <Link className="hover:text-[#123c3a]" href={item.path}>
                {item.name}
              </Link>
            </span>))}
        </nav>

        <section className="border-b border-[#d9ded7] pb-7">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f766e]">
            {comparison.market.code} / Broker comparison
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-[#111827] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#5f6268]">
            Compare account features and trading conditions side by side.
            Check the linked sources and current broker terms before deciding.
          </p>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          {comparison.brokers.map((broker) => (<div className="rounded-md border border-[#d9ded7] bg-white p-5" key={broker.id}>
              <h2 className="text-xl font-semibold text-[#111827]">
                {broker.name}
              </h2>
              {broker.description ? (<p className="mt-3 text-sm leading-6 text-[#5f6268]">
                  {broker.description}
                </p>) : null}
              <ComparisonSnapshot broker={broker}/>
              <div className="mt-5">
                <AffiliateCta broker={broker.slug} campaign="review_top_cta" language={comparison.market.languageCode} market={comparison.market.code}>
                  {`Visit ${broker.name}`}
                </AffiliateCta>
              </div>
            </div>))}
        </section>

        <section className="mt-8 overflow-hidden rounded-md border border-[#d9ded7] bg-white">
          {categories.length === 0 ? (<div className="p-6">
              <h2 className="text-base font-semibold text-[#111827]">
                No sourced facts yet
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#5f6268]">
                Detailed information is not available yet. Please consult each broker’s official terms.
              </p>
            </div>) : (<div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="border-b border-[#d9ded7] bg-[#fbfcfb] text-xs uppercase tracking-[0.1em] text-[#5f6268]">
                  <tr>
                    <th className="w-56 px-4 py-3 font-semibold">Fact</th>
                    <th className="px-4 py-3 font-semibold">{brokerA.name}</th>
                    <th className="px-4 py-3 font-semibold">{brokerB.name}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eef1ed]">
                  {categories.map((item) => (<tr className="align-top" key={item.category}>
                      <th className="bg-[#fbfcfb] px-4 py-4 font-semibold text-[#123c3a]">
                        {item.label}
                      </th>
                      <td className="px-4 py-4 text-[#374151]">
                        <BrokerFactCell broker={brokerA} category={item.category}/>
                      </td>
                      <td className="px-4 py-4 text-[#374151]">
                        <BrokerFactCell broker={brokerB} category={item.category}/>
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>)}
        </section>

        {jsonLdSchemas.map((schema, index) => (<script dangerouslySetInnerHTML={{ __html: stringifyJsonLd(schema) }} key={index} type="application/ld+json"/>))}
      </main>
      <SiteFooter />
    </div>);
}
