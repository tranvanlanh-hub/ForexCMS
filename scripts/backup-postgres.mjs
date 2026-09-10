import { mkdirSync } from "node:fs";
import { basename, join } from "node:path";
import { spawnSync } from "node:child_process";

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    console.error(`${name} is required.`);
    process.exit(1);
  }

  return value;
}

const databaseUrl = requireEnv("DATABASE_URL");
const backupDir = process.env.BACKUP_DIR || join(process.cwd(), "backups", "postgres");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const output = join(backupDir, `forexcms-${stamp}.dump`);

mkdirSync(backupDir, { recursive: true });

const result = spawnSync(
  "pg_dump",
  ["--format=custom", "--no-owner", "--no-acl", "--file", output, databaseUrl],
  { stdio: "inherit" },
);

if (result.error) {
  console.error(`pg_dump could not start: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  console.error("PostgreSQL backup failed.");
  process.exit(result.status ?? 1);
}

console.log(`PostgreSQL backup created: ${basename(output)}`);
