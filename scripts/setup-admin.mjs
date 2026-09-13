import { PrismaClient } from "@prisma/client";
import { createHmac, pbkdf2 as pbkdf2Callback, randomBytes, createCipheriv } from "node:crypto";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { promisify } from "node:util";
import { createInterface } from "node:readline/promises";
import qrcode from "qrcode-terminal";

for (const envFile of [".env.local", ".env"]) {
  if (existsSync(envFile)) loadEnvFile(envFile);
}

const prisma = new PrismaClient();
const pbkdf2 = promisify(pbkdf2Callback);
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

function base32(value) {
  let bits = 0;
  let accumulator = 0;
  let output = "";
  for (const byte of value) {
    accumulator = (accumulator << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(accumulator >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits) output += alphabet[(accumulator << (5 - bits)) & 31];
  return output;
}

function decodeBase32(input) {
  let bits = 0;
  let accumulator = 0;
  const bytes = [];
  for (const character of input) {
    accumulator = (accumulator << 5) | alphabet.indexOf(character);
    bits += 5;
    if (bits >= 8) {
      bytes.push((accumulator >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function totp(secret, counter = Math.floor(Date.now() / 30_000)) {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", decodeBase32(secret)).update(buffer).digest();
  const offset = digest.at(-1) & 15;
  const binary = digest.readUInt32BE(offset) & 0x7fffffff;
  return String(binary % 1_000_000).padStart(6, "0");
}

function verifyTotp(secret, code) {
  const current = Math.floor(Date.now() / 30_000);
  return [-1, 0, 1].some((offset) => totp(secret, current + offset) === code);
}

function encryptSecret(secret, key) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${base64url(iv)}.${base64url(Buffer.concat([ciphertext, tag]))}`;
}

function recoveryHash(code, pepper) {
  return createHmac("sha256", pepper)
    .update(`recovery:${code.replaceAll(/[^A-Z0-9]/gu, "")}`)
    .digest("base64url");
}

async function passwordHash(password, pepper) {
  const salt = randomBytes(16);
  const hash = await pbkdf2(`${password}\0${pepper}`, salt, 100_000, 32, "sha256");
  return `$pbkdf2-sha256$100000$${base64url(salt)}$${base64url(hash)}`;
}

function recoveryCodes() {
  return Array.from({ length: 10 }, () => {
    const raw = randomBytes(6).toString("hex").toUpperCase();
    return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8)}`;
  });
}

async function hiddenPrompt(label) {
  if (!process.stdin.isTTY || !process.stdin.setRawMode) {
    throw new Error("A TTY is required for the hidden password prompt.");
  }
  process.stdout.write(label);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise((resolve, reject) => {
    let value = "";
    const onData = (chunk) => {
      const character = chunk.toString("utf8");
      if (character === "\u0003") {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        reject(new Error("Setup cancelled."));
      } else if (character === "\r" || character === "\n") {
        process.stdin.off("data", onData);
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdout.write("\n");
        resolve(value);
      } else if (character === "\u007f" || character === "\b") {
        value = value.slice(0, -1);
      } else if (/^[\x20-\x7E]+$/u.test(character)) {
        value += character;
      }
    };
    process.stdin.on("data", onData);
  });
}

async function main() {
  const pepper = process.env.AUTH_PASSWORD_PEPPER;
  const encryptionKey = Buffer.from(process.env.AUTH_ENCRYPTION_KEY ?? "", "base64url");
  if (!pepper || pepper.length < 32) throw new Error("Set AUTH_PASSWORD_PEPPER to at least 32 random characters first.");
  if (encryptionKey.length !== 32) throw new Error("Set AUTH_ENCRYPTION_KEY to a base64url-encoded 32-byte key first.");

  const existingAccounts = await prisma.adminAccount.findMany({ select: { id: true, username: true } });
  if (existingAccounts.length > 1) throw new Error("More than one admin account exists; refusing singleton setup.");

  const prompts = createInterface({ input: process.stdin, output: process.stdout });
  const username = (await prompts.question(`Admin username [${existingAccounts[0]?.username ?? "admin"}]: `)).trim() || existingAccounts[0]?.username || "admin";
  prompts.close();
  if (!/^[A-Za-z0-9._-]{3,64}$/u.test(username)) throw new Error("Username must be 3-64 characters using letters, numbers, dot, underscore, or hyphen.");
  const password = await hiddenPrompt("New password (16-128 characters): ");
  const confirmation = await hiddenPrompt("Confirm password: ");
  if (password !== confirmation) throw new Error("Passwords do not match.");
  if (password.length < 16 || password.length > 128) throw new Error("Password must be between 16 and 128 characters.");

  const secret = base32(randomBytes(20));
  const issuer = "MarketGB CMS";
  const uri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(username)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
  console.log("\nScan this QR code with your authenticator app:\n");
  qrcode.generate(uri, { small: true });
  console.log(`Manual key: ${secret}\n`);
  const verifyPrompts = createInterface({ input: process.stdin, output: process.stdout });
  const verificationCode = (await verifyPrompts.question("Enter the current 6-digit code: ")).trim();
  verifyPrompts.close();
  if (!verifyTotp(secret, verificationCode)) throw new Error("The TOTP code was not valid. Nothing was changed.");

  const codes = recoveryCodes();
  const accountData = {
    username,
    passwordHash: await passwordHash(password, pepper),
    totpSecretCiphertext: encryptSecret(secret, encryptionKey),
    totpLastCounter: null,
    isActive: true,
    failedLoginCount: 0,
    lockedUntil: null,
    passwordChangedAt: new Date(),
  };

  await prisma.$transaction(async (transaction) => {
    const account = existingAccounts[0]
      ? await transaction.adminAccount.update({ where: { id: existingAccounts[0].id }, data: accountData })
      : await transaction.adminAccount.create({ data: accountData });
    await transaction.adminSession.deleteMany({ where: { accountId: account.id } });
    await transaction.adminLoginChallenge.deleteMany({ where: { accountId: account.id } });
    await transaction.adminRecoveryCode.deleteMany({ where: { accountId: account.id } });
    await transaction.adminRecoveryCode.createMany({
      data: codes.map((code) => ({ accountId: account.id, codeHash: recoveryHash(code, pepper) })),
    });
  });

  console.log("\nAdmin account secured. Existing sessions were revoked.");
  console.log("Store these one-time recovery codes offline; they will not be shown again:\n");
  for (const code of codes) console.log(`  ${code}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Admin setup failed.");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
