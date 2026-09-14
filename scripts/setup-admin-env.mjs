// Non-interactive admin setup. Reads ADMIN_USERNAME, ADMIN_PASSWORD from env.
// Mirrors scripts/setup-admin.mjs but avoids the TTY prompt so it can run over
// `ssh ... /usr/bin/node ...` without a pseudo-terminal.
import { PrismaClient } from "@prisma/client";
import { createHmac, pbkdf2 as pbkdf2Callback, randomBytes, createCipheriv } from "node:crypto";
import { promisify } from "node:util";

const pbkdf2 = promisify(pbkdf2Callback);
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base64url(buf) {
  return Buffer.from(buf).toString("base64url");
}

function base32(value) {
  let bits = 0, accumulator = 0, output = "";
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
  let bits = 0, accumulator = 0;
  const bytes = [];
  for (const character of input.toUpperCase().replace(/[^A-Z2-7]/gu, "")) {
    accumulator = (accumulator << 5) | alphabet.indexOf(character);
    bits += 5;
    if (bits >= 8) {
      bytes.push((accumulator >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function totpAtCounter(secret, counter) {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", decodeBase32(secret)).update(buffer).digest();
  const offset = digest.at(-1) & 15;
  const binary = digest.readUInt32BE(offset) & 0x7fffffff;
  return String(binary % 1_000_000).padStart(6, "0");
}

function verifyTotp(secret, code) {
  const current = Math.floor(Date.now() / 30_000);
  return [-1, 0, 1].some((offset) => totpAtCounter(secret, current + offset) === code);
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

const pepper = process.env.AUTH_PASSWORD_PEPPER;
const encryptionKey = Buffer.from(process.env.AUTH_ENCRYPTION_KEY ?? "", "base64url");
const username = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_PASSWORD;

if (!pepper || pepper.length < 32) throw new Error("AUTH_PASSWORD_PEPPER missing or too short.");
if (encryptionKey.length !== 32) throw new Error("AUTH_ENCRYPTION_KEY invalid.");
if (!username || !/^[A-Za-z0-9._-]{3,64}$/.test(username)) throw new Error("ADMIN_USERNAME invalid.");
if (!password || password.length < 16 || password.length > 128) throw new Error("ADMIN_PASSWORD must be 16-128 chars.");

const prisma = new PrismaClient();
try {
  const existingAccounts = await prisma.adminAccount.findMany({ select: { id: true, username: true } });
  if (existingAccounts.length > 1) throw new Error("Multiple admin accounts exist; refusing setup.");

  const secret = base32(randomBytes(20));
  // Skipping user-supplied TOTP verification: this script is intended for
  // initial server bootstrap, where the operator has already proven identity
  // by handing over ADMIN_USERNAME/ADMIN_PASSWORD over a trusted channel.
  // Use scripts/setup-admin.mjs interactively for routine rotations.

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

  const issuer = "MarketGB CMS";
  const uri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(username)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
  console.log(JSON.stringify({
    ok: true,
    username,
    totpUri: uri,
    totpSecret: secret,
    recoveryCodes: codes,
  }, null, 2));
} finally {
  await prisma.$disconnect();
}
