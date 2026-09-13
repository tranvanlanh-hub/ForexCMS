import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const envFile = resolve(".env.cloudflare");
if (!existsSync(envFile)) {
  console.error("Missing .env.cloudflare. Copy .env.cloudflare.example and fill it first.");
  process.exit(1);
}

const env = { ...process.env };
for (const line of readFileSync(envFile, "utf8").split(/\r?\n/u)) {
  const match = line.trim().match(/^([^#][^=]+)=(.*)$/u);
  if (!match) continue;
  const key = match[1].trim();
  let value = match[2].trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
  env[key] = value;
}

const build = spawnSync(process.execPath, [resolve("scripts", "build-vinext-safe.mjs")], { env, stdio: "inherit" });
if ((build.status ?? 1) !== 0) process.exit(build.status ?? 1);

// The custom domain is managed in Cloudflare and remains declared in the source
// config. This token can edit Workers but cannot rewrite zone routes, so omit the
// already-attached route from the generated upload config.
const generatedConfig = resolve("dist", "server", "wrangler.json");
const deployConfig = resolve("dist", "server", "wrangler.deploy.json");
const config = JSON.parse(readFileSync(generatedConfig, "utf8"));
delete config.routes;
writeFileSync(deployConfig, `${JSON.stringify(config)}\n`, "utf8");

try {
  const deploy = spawnSync(process.execPath, [resolve("node_modules", "wrangler", "bin", "wrangler.js"), "deploy", "--config", deployConfig], { env, stdio: "inherit" });
  process.exitCode = deploy.status ?? 1;
} finally {
  if (existsSync(deployConfig)) unlinkSync(deployConfig);
}
