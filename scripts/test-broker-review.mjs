import assert from "node:assert/strict";
import test from "node:test";
import { BrokerFactCategory } from "@prisma/client";
import {
  getReviewScopedBrokerFacts,
  isPlaceholderSourceUrl,
} from "../lib/broker-facts/index.ts";
import { getBrokerReviewScoreSummary } from "../lib/brokers/review.ts";

const marketFact = (overrides = {}) => ({
  category: BrokerFactCategory.SPREAD,
  displayOrder: 10,
  id: "global",
  isPrimary: false,
  label: "Typical spread",
  market: null,
  sourceName: "Broker terms",
  sourceUrl: "https://broker-data.examplebroker.com/terms",
  updatedAt: new Date("2026-01-01"),
  ...overrides,
});

test("market-scoped fact overrides matching global fact", () => {
  const selected = getReviewScopedBrokerFacts([
    marketFact(),
    marketFact({ id: "vn", market: { code: "vn" }, value: "0.2" }),
  ], "vn");

  assert.equal(selected.length, 1);
  assert.equal(selected[0].id, "vn");
});

test("primary fact wins within matching market scope", () => {
  const selected = getReviewScopedBrokerFacts([
    marketFact({ id: "later", displayOrder: 50, market: { code: "vn" } }),
    marketFact({ id: "primary", displayOrder: 100, isPrimary: true, market: { code: "vn" } }),
  ], "vn");

  assert.equal(selected[0].id, "primary");
});

test("placeholder sources do not render", () => {
  assert.equal(isPlaceholderSourceUrl("https://example.com/terms"), true);
  assert.equal(
    getReviewScopedBrokerFacts([marketFact({ sourceUrl: "https://example.com/terms" })], "vn").length,
    0,
  );
});

test("partial score average is one-decimal and counted", () => {
  const score = getBrokerReviewScoreSummary({
    regulationTrustScore: { toString: () => "4.2" },
    costsScore: { toString: () => "3.5" },
    tradingExperienceScore: null,
    depositsWithdrawalsScore: null,
    supportEducationScore: null,
    regulationTrustRationale: null,
    costsRationale: null,
    tradingExperienceRationale: null,
    depositsWithdrawalsRationale: null,
    supportEducationRationale: null,
    reviewerName: "Reviewer",
    reviewedAt: new Date(),
    methodologyVersion: "broker-review-v1",
  });

  assert.deepEqual(score, { average: 3.9, assessedCount: 2, totalCriteria: 5 });
});

test("no assessment scores have no average", () => {
  const score = getBrokerReviewScoreSummary(null);
  assert.equal(score.average, null);
  assert.equal(score.assessedCount, 0);
});
