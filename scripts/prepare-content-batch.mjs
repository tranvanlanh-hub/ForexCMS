import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const outputPath = join("data", "ai-content", "batch-250-plan.json");
const markets = ["global", "us", "uk", "au", "vn"];
const clusters = [
  "forex-basics",
  "account-opening",
  "broker-research",
  "broker-reviews",
  "best-broker-lists",
  "risk-management",
  "platform-guides",
  "country-hubs",
  "payment-methods",
  "forex-faq",
];

const plan = [];
let index = 1;

for (const market of markets) {
  for (const cluster of clusters) {
    for (let slot = 1; slot <= 5; slot += 1) {
      plan.push({
        id: `planned-${String(index).padStart(3, "0")}`,
        status: "PLANNED_ONLY",
        market,
        topicCluster: cluster,
        suggestedContentType: cluster === "country-hubs" ? "COUNTRY_HUB" : slot % 5 === 0 ? "BEST_BROKER_LIST" : slot % 4 === 0 ? "BROKER_REVIEW" : slot % 3 === 0 ? "GUIDE" : "ARTICLE",
        briefSource: "Generate only after DB-backed AI import, SEO, internal link, and affiliate validation pass.",
      });
      index += 1;
    }
  }
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(plan, null, 2)}\n`);

console.log(`Prepared ${plan.length} planned batch rows at ${outputPath}.`);
console.log("No real draft articles were created by this planner.");
