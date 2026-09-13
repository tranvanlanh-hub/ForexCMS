import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, renameSync, readdirSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";

const localEnv = resolve(".env.local");
const heldEnv = resolve(".env.codex-safe-build-hold.local");
const sensitiveNames = new Set([
  "DATABASE_URL",
  "ADMIN_PASSWORD",
  "AUTH_PASSWORD_PEPPER",
  "AUTH_ENCRYPTION_KEY",
  "S3_SECRET_ACCESS_KEY",
]);

function readSensitiveValues(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split(/\r?\n/u)
    .map((line) => line.match(/^([^#][^=]+)=(.*)$/u))
    .filter(Boolean)
    .map((match) => ({
      name: match[1].trim(),
      value: match[2].trim().replace(/^(['"])(.*)\1$/u, "$2"),
    }))
    .filter(({ name, value }) => sensitiveNames.has(name) && value.length >= 8);
}

function filesUnder(path) {
  if (!existsSync(path)) return [];
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name);
    return entry.isDirectory() ? filesUnder(child) : [child];
  });
}

if (existsSync(heldEnv)) {
  console.error("Safe build hold file already exists; refusing to overwrite it.");
  process.exit(1);
}

const secrets = readSensitiveValues(localEnv);
let moved = false;
let exitCode = 1;

try {
  // Vinext can otherwise reuse Next/Vite artifacts from a previous source tree,
  // producing mismatched server and client bundles that fail only after deploy.
  for (const outputDirectory of [resolve("dist"), resolve(".next")]) {
    rmSync(outputDirectory, { recursive: true, force: true });
  }

  if (existsSync(localEnv)) {
    renameSync(localEnv, heldEnv);
    moved = true;
  }
  const result = spawnSync(
    process.execPath,
    [resolve("node_modules", "vinext", "dist", "cli.js"), "build"],
    { stdio: "inherit", env: { ...process.env } },
  );
  exitCode = result.status ?? 1;
  if (exitCode === 0 && secrets.length) {
    const outputFiles = filesUnder(resolve("dist"));
    const leakedNames = secrets
      .filter(({ value }) => outputFiles.some((file) => {
        try {
          return readFileSync(file).includes(Buffer.from(value));
        } catch {
          return false;
        }
      }))
      .map(({ name }) => name);
    if (leakedNames.length) {
      console.error(`Safe build failed: generated output contains ${leakedNames.join(", ")}.`);
      exitCode = 1;
    }
  }
} finally {
  if (moved) renameSync(heldEnv, localEnv);
}

process.exit(exitCode);
