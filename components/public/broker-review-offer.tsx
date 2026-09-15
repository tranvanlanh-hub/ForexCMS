import { buildAffiliateClickHref } from "@/lib/affiliate";
import { resolveCachedAffiliateUrl } from "@/lib/cache/public";

export const brokerReviewOfferCampaigns = [
  "review_top_cta",
  "review_middle_cta",
  "review_bottom_cta",
] as const;

type BrokerReviewOfferProps = {
  broker: string;
  brokerName: string;
  campaign: string;
  className?: string;
  contentId: string;
  language: string;
  market: string;
  placement: "top" | "middle" | "bottom";
};

export async function resolveBrokerReviewOffer(input: {
  broker: string;
  campaign: string;
  language: string;
  market: string;
}) {
  const campaigns = [input.campaign, ...brokerReviewOfferCampaigns].filter(
    (value, index, values) => values.indexOf(value) === index,
  );

  for (const candidate of campaigns) {
    const resolved = await resolveCachedAffiliateUrl({
      broker: input.broker,
      campaign: candidate,
      language: input.language,
      market: input.market,
    });
    if (resolved) return resolved;
  }

  return null;
}

export async function BrokerReviewOffer({
  broker,
  brokerName,
  campaign,
  className,
  contentId,
  language,
  market,
  placement,
}: BrokerReviewOfferProps) {
  const resolved = await resolveBrokerReviewOffer({
    broker,
    campaign,
    language,
    market,
  });

  if (!resolved) return null;

  const isRequestedCampaign = resolved.campaign === campaign;
  return (
    <div className={`broker-review-offer broker-review-offer-${placement}`}>
      <a
        className={className ?? "button button-dark affiliate-button"}
        data-affiliate-campaign={resolved.campaign}
        data-affiliate-link-id={resolved.affiliateLinkId}
        href={buildAffiliateClickHref({
          affiliateLinkId: resolved.affiliateLinkId,
          contentId,
        })}
        rel={resolved.rel}
        target="_blank"
      >
        {isRequestedCampaign ? `Visit ${brokerName}` : "View current offer"}
      </a>
    </div>
  );
}
