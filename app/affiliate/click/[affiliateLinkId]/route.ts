import { NextResponse } from "next/server";
import { recordAffiliateClickEvent } from "@/lib/affiliate";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ affiliateLinkId: string }>;
  },
) {
  const { affiliateLinkId } = await params;
  const url = new URL(request.url);
  const contentItemId = url.searchParams.get("contentId");
  const tracked = await recordAffiliateClickEvent({
    affiliateLinkId,
    contentItemId,
    referrer: request.headers.get("referer"),
  });

  if (!tracked) {
    return NextResponse.json(
      { error: "Affiliate link not found." },
      {
        headers: { "Cache-Control": "no-store" },
        status: 404,
      },
    );
  }

  const response = NextResponse.redirect(tracked.destinationUrl, 302);
  response.headers.set("Cache-Control", "no-store");

  return response;
}
