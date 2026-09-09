import { resolveAffiliateUrl, type AffiliateToken } from "@/lib/affiliate";

type AffiliateCtaProps = AffiliateToken & {
  children?: string;
  className?: string;
};

export async function AffiliateCta({
  broker,
  campaign,
  children,
  className,
  language,
  market,
}: AffiliateCtaProps) {
  const resolved = await resolveAffiliateUrl({
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
      href={resolved.destinationUrl}
      rel={resolved.rel}
      target="_blank"
    >
      {children ?? `Visit ${resolved.brokerName}`}
    </a>
  );
}
