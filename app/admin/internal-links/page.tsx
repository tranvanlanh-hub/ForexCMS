import {
  InternalLinkRuleMode,
  InternalLinkRuleStatus,
  InternalLinkSuggestionStatus,
} from "@prisma/client";
import Link from "next/link";
import {
  createInternalLinkRuleAction,
  generateInternalLinkSuggestionsAction,
  updateInternalLinkSuggestionStatusAction,
} from "@/app/admin/internal-links/actions";
import { DemoModeBanner } from "@/components/admin/demo-mode-banner";
import { CsrfField } from "@/components/admin/csrf-field";
import { contentTypeLabels } from "@/lib/content";
import { prisma } from "@/lib/db";
import { getDemoPilotDrafts } from "@/lib/demo/content-scale";
import {
  internalLinkRuleModeLabels,
  internalLinkSuggestionStatusLabels,
} from "@/lib/internal-links";

export const dynamic = "force-dynamic";

type InternalLinkAdminData = Awaited<ReturnType<typeof getInternalLinkData>>;

async function getInternalLinkData() {
  const [suggestions, rules, clusters, anchors, contentItems, markets] =
    await Promise.all([
      prisma.internalLinkSuggestion.findMany({
        orderBy: [{ status: "asc" }, { score: "desc" }, { updatedAt: "desc" }],
        include: {
          market: true,
          rule: true,
          sourceContentItem: { include: { market: true } },
          targetContentItem: { include: { market: true } },
        },
        take: 100,
      }),
      prisma.internalLinkRule.findMany({
        orderBy: [{ priority: "asc" }, { updatedAt: "desc" }],
        include: {
          market: true,
          topicCluster: true,
          targetContentItem: true,
        },
        take: 50,
      }),
      prisma.topicCluster.findMany({
        orderBy: [{ priority: "asc" }, { updatedAt: "desc" }],
        include: {
          market: true,
          priorityContentItem: true,
          _count: { select: { topics: true, anchorTexts: true } },
        },
        take: 50,
      }),
      prisma.anchorText.findMany({
        orderBy: [{ priority: "asc" }, { updatedAt: "desc" }],
        include: {
          market: true,
          topicCluster: true,
          targetContentItem: true,
        },
        take: 100,
      }),
      prisma.contentItem.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { updatedAt: "desc" },
        include: { market: true },
        take: 100,
      }),
      prisma.market.findMany({
        where: { status: "ACTIVE" },
        orderBy: { code: "asc" },
      }),
    ]);

  return { anchors, clusters, contentItems, markets, rules, suggestions };
}

function statusClass(status: InternalLinkSuggestionStatus) {
  if (status === InternalLinkSuggestionStatus.ACCEPTED) {
    return "border-[#b7dfca] bg-[#f0fdf6] text-[#166534]";
  }

  if (
    status === InternalLinkSuggestionStatus.REJECTED ||
    status === InternalLinkSuggestionStatus.ARCHIVED
  ) {
    return "border-[#d8dadd] bg-[#f4f4f5] text-[#52525b]";
  }

  return "border-[#f4d28c] bg-[#fffbeb] text-[#92400e]";
}

function ruleStatusClass(status: InternalLinkRuleStatus) {
  if (status === InternalLinkRuleStatus.ACTIVE) {
    return "border-[#b7dfca] bg-[#f0fdf6] text-[#166534]";
  }

  if (
    status === InternalLinkRuleStatus.PAUSED ||
    status === InternalLinkRuleStatus.ARCHIVED
  ) {
    return "border-[#d8dadd] bg-[#f4f4f5] text-[#52525b]";
  }

  return "border-[#f4d28c] bg-[#fffbeb] text-[#92400e]";
}

export default async function AdminInternalLinksPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const params = await searchParams;
  let data: InternalLinkAdminData = {
    anchors: [],
    clusters: [],
    contentItems: [],
    markets: [],
    rules: [],
    suggestions: [],
  };
  let isDatabaseReady = true;

  try {
    data = await getInternalLinkData();
  } catch {
    isDatabaseReady = false;
  }

  if (!isDatabaseReady) {
    const demoDrafts = await getDemoPilotDrafts();
    const demoLinks = demoDrafts.flatMap((draft) =>
      draft.internalLinkTargets.map((target) => ({
        source: draft,
        target,
      })),
    );

    return (
      <div className="flex flex-col gap-6">
        <DemoModeBanner module="Internal Link Manager" />
        <section className="grid gap-4 sm:grid-cols-4">
          {[
            ["Demo drafts", demoDrafts.length],
            ["Internal targets", demoLinks.length],
            ["Markets", new Set(demoDrafts.map((draft) => draft.market)).size],
            ["Audit warnings", 0],
          ].map(([label, value]) => (
            <div
              className="rounded-lg border border-[#d9ded7] bg-white p-4"
              key={label}
            >
              <p className="text-sm font-medium text-[#5f6268]">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-[#111827]">
                {value}
              </p>
            </div>
          ))}
        </section>
        <section className="overflow-hidden rounded-lg border border-[#d9ded7] bg-white">
          <div className="border-b border-[#d9ded7] px-5 py-4">
            <h2 className="text-base font-semibold text-[#111827]">
              Demo internal link map
            </h2>
          </div>
          <div className="divide-y divide-[#eef1ed]">
            {demoLinks.slice(0, 50).map((link) => (
              <div
                className="grid gap-2 px-5 py-4 text-sm md:grid-cols-[1fr_1fr_100px]"
                key={`${link.source.id}-${link.target}`}
              >
                <Link
                  className="font-semibold text-[#123c3a] hover:underline"
                  href={`/demo/content-scale/${link.source.id}/`}
                >
                  {link.source.title}
                </Link>
                <p className="break-words text-[#5f6268]">{link.target}</p>
                <p className="font-medium text-[#123c3a]">
                  {link.source.market}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="border-b border-[#d9ded7] pb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f766e]">
          Internal Link Manager
        </p>
        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold leading-tight text-[#111827]">
              Internal Links
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5f6268]">
              Generate controlled internal link suggestions from topic clusters,
              anchor text, active rules, and market-safe published content.
            </p>
          </div>
          <form
            action={generateInternalLinkSuggestionsAction}
            className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-xl"
          >
            <CsrfField />
            <select
              className="h-10 min-w-0 flex-1 rounded-md border border-[#cbd5ce] bg-white px-3 text-sm outline-none transition focus:border-[#0f766e]"
              name="contentItemId"
              required
            >
              <option value="">Choose source content</option>
              {data.contentItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.market.code} / {contentTypeLabels[item.contentType]} /{" "}
                  {item.title}
                </option>
              ))}
            </select>
            <button
              className="h-10 rounded-md bg-[#123c3a] px-4 text-sm font-semibold text-white transition hover:bg-[#0b4f49]"
              type="submit"
            >
              Generate
            </button>
          </form>
        </div>
      </section>

      {params.error ? (
        <div className="rounded-md border border-[#f0b8a8] bg-[#fff7f4] px-4 py-3 text-sm font-medium leading-6 text-[#9a3412]">
          {params.error}
        </div>
      ) : null}

      {params.saved ? (
        <div className="rounded-md border border-[#b7dfca] bg-[#f0fdf6] px-4 py-3 text-sm font-medium leading-6 text-[#166534]">
          {params.saved}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-4">
        {[
          ["Clusters", data.clusters.length],
          ["Anchors", data.anchors.length],
          ["Rules", data.rules.length],
          [
            "Pending",
            data.suggestions.filter(
              (item) => item.status === InternalLinkSuggestionStatus.PENDING,
            ).length,
          ],
        ].map(([label, value]) => (
          <div
            className="rounded-lg border border-[#d9ded7] bg-white p-4"
            key={label}
          >
            <p className="text-sm font-medium text-[#5f6268]">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-[#111827]">
              {value}
            </p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-lg border border-[#d9ded7] bg-white">
        <div className="border-b border-[#d9ded7] px-5 py-4">
          <h2 className="text-base font-semibold text-[#111827]">
            Suggestions
          </h2>
        </div>
        {data.suggestions.length === 0 ? (
          <div className="p-6">
            <p className="text-sm leading-6 text-[#5f6268]">
              No suggestions yet. Add published content plus anchor/rule seed
              data, then generate suggestions for a source article.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="border-b border-[#d9ded7] bg-[#fbfcfb] text-xs uppercase tracking-[0.1em] text-[#5f6268]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Source</th>
                  <th className="px-4 py-3 font-semibold">Anchor</th>
                  <th className="px-4 py-3 font-semibold">Target</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Score</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef1ed]">
                {data.suggestions.map((suggestion) => (
                  <tr className="align-top" key={suggestion.id}>
                    <td className="px-4 py-4">
                      <Link
                        className="font-semibold text-[#123c3a] hover:underline"
                        href={`/admin/content/${suggestion.sourceContentItem.id}/edit`}
                      >
                        {suggestion.sourceContentItem.title}
                      </Link>
                      <p className="mt-1 text-xs text-[#5f6268]">
                        {suggestion.sourceContentItem.market.code} /{" "}
                        {suggestion.languageCode}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-[#374151]">
                      {suggestion.anchorText}
                      <p className="mt-1 max-w-xs text-xs leading-5 text-[#5f6268]">
                        {suggestion.reason ?? "Same market and language."}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        className="font-semibold text-[#123c3a] hover:underline"
                        href={suggestion.targetContentItem.canonicalPath}
                      >
                        {suggestion.targetContentItem.title}
                      </Link>
                      <p className="mt-1 text-xs text-[#5f6268]">
                        {suggestion.targetContentItem.canonicalPath}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={[
                          "inline-flex rounded-md border px-2 py-1 text-xs font-semibold",
                          statusClass(suggestion.status),
                        ].join(" ")}
                      >
                        {internalLinkSuggestionStatusLabels[suggestion.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[#374151]">
                      {suggestion.score}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <form action={updateInternalLinkSuggestionStatusAction}>
                          <CsrfField />
                          <input
                            name="suggestionId"
                            type="hidden"
                            value={suggestion.id}
                          />
                          <input
                            name="status"
                            type="hidden"
                            value={InternalLinkSuggestionStatus.ACCEPTED}
                          />
                          <button
                            className="h-8 rounded-md border border-[#b7dfca] bg-[#f0fdf6] px-3 text-xs font-semibold text-[#166534]"
                            type="submit"
                          >
                            Accept
                          </button>
                        </form>
                        <form action={updateInternalLinkSuggestionStatusAction}>
                          <CsrfField />
                          <input
                            name="suggestionId"
                            type="hidden"
                            value={suggestion.id}
                          />
                          <input
                            name="status"
                            type="hidden"
                            value={InternalLinkSuggestionStatus.REJECTED}
                          />
                          <button
                            className="h-8 rounded-md border border-[#d8dadd] bg-[#f4f4f5] px-3 text-xs font-semibold text-[#52525b]"
                            type="submit"
                          >
                            Reject
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-[#d9ded7] bg-white p-5">
        <h2 className="text-base font-semibold text-[#111827]">
          Create semi-auto rule
        </h2>
        <form
          action={createInternalLinkRuleAction}
          className="mt-4 grid gap-3 lg:grid-cols-4"
        >
          <CsrfField />
          <input
            className="h-10 rounded-md border border-[#cbd5ce] px-3 text-sm outline-none focus:border-[#0f766e]"
            name="name"
            placeholder="Rule name"
            required
          />
          <select
            className="h-10 rounded-md border border-[#cbd5ce] bg-white px-3 text-sm outline-none focus:border-[#0f766e]"
            name="marketId"
            required
          >
            <option value="">Market</option>
            {data.markets.map((market) => (
              <option key={market.id} value={market.id}>
                {market.code} / {market.languageCode}
              </option>
            ))}
          </select>
          <input
            className="h-10 rounded-md border border-[#cbd5ce] px-3 text-sm outline-none focus:border-[#0f766e]"
            name="languageCode"
            placeholder="Language, e.g. en"
            required
          />
          <select
            className="h-10 rounded-md border border-[#cbd5ce] bg-white px-3 text-sm outline-none focus:border-[#0f766e]"
            name="topicClusterId"
          >
            <option value="">Any topic cluster</option>
            {data.clusters.map((cluster) => (
              <option key={cluster.id} value={cluster.id}>
                {cluster.market.code} / {cluster.languageCode} / {cluster.name}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-[#cbd5ce] bg-white px-3 text-sm outline-none focus:border-[#0f766e]"
            name="targetContentItemId"
          >
            <option value="">No priority target</option>
            {data.contentItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.market.code} / {item.title}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-[#cbd5ce] bg-white px-3 text-sm outline-none focus:border-[#0f766e]"
            name="sourceContentType"
          >
            <option value="">Any source type</option>
            {Object.entries(contentTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-[#cbd5ce] bg-white px-3 text-sm outline-none focus:border-[#0f766e]"
            name="targetContentType"
          >
            <option value="">Any target type</option>
            {Object.entries(contentTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-[#cbd5ce] bg-white px-3 text-sm outline-none focus:border-[#0f766e]"
            name="mode"
            required
          >
            <option value={InternalLinkRuleMode.SUGGEST_ONLY}>Suggest only</option>
            <option value={InternalLinkRuleMode.AUTO_APPROVE}>Auto approve</option>
          </select>
          <select
            className="h-10 rounded-md border border-[#cbd5ce] bg-white px-3 text-sm outline-none focus:border-[#0f766e]"
            name="status"
            required
          >
            <option value={InternalLinkRuleStatus.ACTIVE}>Active</option>
            <option value={InternalLinkRuleStatus.DRAFT}>Draft</option>
          </select>
          <input
            className="h-10 rounded-md border border-[#cbd5ce] px-3 text-sm outline-none focus:border-[#0f766e]"
            defaultValue={6}
            max={8}
            min={1}
            name="maxLinksPerContent"
            type="number"
          />
          <input
            className="h-10 rounded-md border border-[#cbd5ce] px-3 text-sm outline-none focus:border-[#0f766e]"
            defaultValue={120}
            min={80}
            name="minWordsBetweenLinks"
            type="number"
          />
          <input
            className="h-10 rounded-md border border-[#cbd5ce] px-3 text-sm outline-none focus:border-[#0f766e]"
            defaultValue={100}
            min={1}
            name="priority"
            type="number"
          />
          <button
            className="h-10 rounded-md bg-[#123c3a] px-4 text-sm font-semibold text-white transition hover:bg-[#0b4f49]"
            type="submit"
          >
            Save rule
          </button>
        </form>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-[#d9ded7] bg-white p-5">
          <h2 className="text-base font-semibold text-[#111827]">
            Topic clusters
          </h2>
          <div className="mt-4 space-y-4">
            {data.clusters.slice(0, 6).map((cluster) => (
              <div className="border-t border-[#eef1ed] pt-3" key={cluster.id}>
                <p className="font-semibold text-[#111827]">{cluster.name}</p>
                <p className="mt-1 text-xs leading-5 text-[#5f6268]">
                  {cluster.market.code} / {cluster.languageCode} /{" "}
                  {cluster._count.topics} topics / {cluster._count.anchorTexts}{" "}
                  anchors
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-[#d9ded7] bg-white p-5">
          <h2 className="text-base font-semibold text-[#111827]">Rules</h2>
          <div className="mt-4 space-y-4">
            {data.rules.slice(0, 6).map((rule) => (
              <div className="border-t border-[#eef1ed] pt-3" key={rule.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-[#111827]">{rule.name}</p>
                  <span
                    className={[
                      "inline-flex rounded-md border px-2 py-1 text-xs font-semibold",
                      ruleStatusClass(rule.status),
                    ].join(" ")}
                  >
                    {rule.status}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-[#5f6268]">
                  {rule.market.code} / {rule.languageCode} /{" "}
                  {internalLinkRuleModeLabels[rule.mode]}
                  {rule.mode === InternalLinkRuleMode.AUTO_APPROVE
                    ? " / explicit render rule"
                    : ""}
                </p>
                <p className="mt-1 text-xs leading-5 text-[#5f6268]">
                  Max {rule.maxLinksPerContent} links / spacing{" "}
                  {rule.minWordsBetweenLinks} words
                  {rule.topicCluster ? ` / ${rule.topicCluster.name}` : ""}
                  {rule.targetContentItem
                    ? ` / target ${rule.targetContentItem.title}`
                    : ""}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-[#d9ded7] bg-white p-5">
          <h2 className="text-base font-semibold text-[#111827]">Anchor text</h2>
          <div className="mt-4 space-y-4">
            {data.anchors.slice(0, 8).map((anchor) => (
              <div className="border-t border-[#eef1ed] pt-3" key={anchor.id}>
                <p className="font-semibold text-[#111827]">{anchor.text}</p>
                <p className="mt-1 text-xs leading-5 text-[#5f6268]">
                  {anchor.market.code} / {anchor.languageCode}
                  {anchor.targetContentItem
                    ? ` / ${anchor.targetContentItem.title}`
                    : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
