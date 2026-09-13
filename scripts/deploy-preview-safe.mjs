import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const previewWorker = "content-hub-cms-preview";
const previewUrl =
  "https://content-hub-cms-preview.content-hub-stack.workers.dev";
const envFile = resolve(".env.cloudflare");
const dryRun = process.argv.includes("--dry-run");

if (!existsSync(envFile)) {
  console.error("Missing .env.cloudflare. Copy .env.cloudflare.example and fill it first.");
  process.exit(1);
}

const env = { ...process.env };

for (const line of readFileSync(envFile, "utf8").split(/\r?\n/u)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;

  const match = trimmed.match(/^([^=]+)=(.*)$/u);
  if (!match) continue;

  const key = match[1].trim();
  let value = match[2].trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  env[key] = value;
}

const build = spawnSync(
  process.execPath,
  [resolve("scripts", "build-vinext-safe.mjs")],
  { env, stdio: "inherit" },
);

if ((build.status ?? 1) !== 0) process.exit(build.status ?? 1);

const wranglerArgs = [
  resolve("node_modules", "wrangler", "bin", "wrangler.js"),
  "deploy",
  "--config",
  resolve("dist", "server", "wrangler.json"),
  "--name",
  previewWorker,
  "--var",
  "APP_ENV:preview",
  "--var",
  `APP_URL:${previewUrl}`,
  "--keep-vars",
];

if (dryRun) wranglerArgs.push("--dry-run");

const deploy = spawnSync(process.execPath, wranglerArgs, {
  env,
  stdio: "inherit",
});

process.exit(deploy.status ?? 1);
