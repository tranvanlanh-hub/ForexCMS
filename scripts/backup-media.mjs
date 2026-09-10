import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    console.error(`${name} is required.`);
    process.exit(1);
  }

  return value;
}

const endpoint = requireEnv("S3_ENDPOINT");
const bucket = requireEnv("S3_BUCKET");
requireEnv("S3_ACCESS_KEY_ID");
requireEnv("S3_SECRET_ACCESS_KEY");

const backupDir =
  process.env.MEDIA_BACKUP_DIR || join(process.cwd(), "backups", "media", bucket);

mkdirSync(backupDir, { recursive: true });

const result = spawnSync(
  "aws",
  ["s3", "sync", `s3://${bucket}`, backupDir, "--endpoint-url", endpoint],
  {
    env: {
      ...process.env,
      AWS_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
      AWS_DEFAULT_REGION: process.env.S3_REGION || "auto",
    },
    stdio: "inherit",
  },
);

if (result.error) {
  console.error(`aws CLI could not start: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  console.error("Media backup failed.");
  process.exit(result.status ?? 1);
}

console.log(`Media backup completed for bucket ${bucket}.`);
