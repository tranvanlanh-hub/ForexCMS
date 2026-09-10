import {
  buildAffiliateClickHref,
  type AffiliateToken,
} from "@/lib/affiliate";
import { resolveCachedAffiliateUrl } from "@/lib/cache/public";

type AffiliateCtaProps = AffiliateToken & {
  children?: string;
  className?: string;
  contentId?: string;
};

export async function AffiliateCta({
  broker,
  campaign,
  children,
  className,
  contentId,
  language,
  market,
}: AffiliateCtaProps) {
  const resolved = await resolveCachedAffiliateUrl({
    broker,
    campaign,
    language,
    market,
  });

  if (!resolved) {
    return null;
  }

  return (
    <a
      className={
        className ??
        "inline-flex h-11 items-center rounded-md bg-[#123c3a] px-4 text-sm font-semibold text-white transition hover:bg-[#0b4f49]"
      }
      data-affiliate-link-id={resolved.affiliateLinkId}
      data-affiliate-campaign={resolved.campaign}
      href={buildAffiliateClickHref({
        affiliateLinkId: resolved.affiliateLinkId,
        contentId,
      })}
      rel={resolved.rel}
      target="_blank"
    >
      {children ?? `Visit ${resolved.brokerName}`}
    </a>
  );
}
