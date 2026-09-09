import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const envFile = resolve(".env.cloudflare");

if (!existsSync(envFile)) {
  console.error("Missing .env.cloudflare. Copy .env.cloudflare.example and fill it first.");
  process.exit(1);
}

const env = { ...process.env };

for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;

  const match = trimmed.match(/^([^=]+)=(.*)$/);
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

const cliPath = resolve("node_modules", "@vinext", "cloudflare", "dist", "cli.js");
const child = spawn(
  process.execPath,
  [cliPath, "deploy", "--config", "dist/server/wrangler.json"],
  {
  env,
  stdio: "inherit",
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`Deploy stopped by signal ${signal}.`);
    process.exit(1);
  }

  process.exit(code ?? 1);
});
