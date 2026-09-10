import { MarketStatus, type Market } from "@prisma/client";
import { normalizeSlug } from "@/lib/content";

export const supportedMarketCodes = [
  "global",
  "us",
  "uk",
  "au",
  "vn",
  "th",
] as const;

export type SupportedMarketCode = (typeof supportedMarketCodes)[number];

export type SupportedMarketDefinition = {
  code: SupportedMarketCode;
  name: string;
  languageCode: string;
  locale: string;
  countryCode: string | null;
  isGlobal: boolean;
};

export const supportedMarkets: SupportedMarketDefinition[] = [
  {
    code: "global",
    name: "Global",
    languageCode: "en",
    locale: "en",
    countryCode: null,
    isGlobal: true,
  },
  {
    code: "us",
    name: "United States",
    languageCode: "en",
    locale: "en-US",
    countryCode: "US",
    isGlobal: false,
  },
  {
    code: "uk",
    name: "United Kingdom",
    languageCode: "en",
    locale: "en-GB",
    countryCode: "GB",
    isGlobal: false,
  },
  {
    code: "au",
    name: "Australia",
    languageCode: "en",
    locale: "en-AU",
    countryCode: "AU",
    isGlobal: false,
  },
  {
    code: "vn",
    name: "Vietnam",
    languageCode: "vi",
    locale: "vi-VN",
    countryCode: "VN",
    isGlobal: false,
  },
  {
    code: "th",
    name: "Thailand",
    languageCode: "th",
    locale: "th-TH",
    countryCode: "TH",
    isGlobal: false,
  },
];

export const marketStatusLabels: Record<MarketStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

export function normalizeMarketCode(value: string) {
  return normalizeSlug(value) as SupportedMarketCode | "";
}

export function getSupportedMarketDefinition(code: string) {
  const normalizedCode = normalizeMarketCode(code);

  return supportedMarkets.find((market) => market.code === normalizedCode);
}

export function isSupportedMarketCode(code: string): code is SupportedMarketCode {
  return Boolean(getSupportedMarketDefinition(code));
}

export function marketIsActive(market: Pick<Market, "status">) {
  return market.status === MarketStatus.ACTIVE;
}
