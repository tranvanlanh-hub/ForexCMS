import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    console.error(`${name} is required.`);
    process.exit(1);
  }

  return value;
}

function readFileArg() {
  const index = process.argv.indexOf("--file");
  const value = index >= 0 ? process.argv[index + 1] : "";

  if (!value) {
    console.error("Usage: npm.cmd run restore:postgres -- --file <dump-file>");
    process.exit(1);
  }

  const file = resolve(value);

  if (!existsSync(file)) {
    console.error(`Dump file was not found: ${file}`);
    process.exit(1);
  }

  return file;
}

const databaseUrl = requireEnv("DATABASE_URL");
const dumpFile = readFileArg();

const result = spawnSync(
  "pg_restore",
  ["--clean", "--if-exists", "--no-owner", "--no-acl", "--dbname", databaseUrl, dumpFile],
  { stdio: "inherit" },
);

if (result.error) {
  console.error(`pg_restore could not start: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  console.error("PostgreSQL restore failed.");
  process.exit(result.status ?? 1);
}

console.log("PostgreSQL restore completed.");
