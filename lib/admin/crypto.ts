import "server-only";

const encoder = new TextEncoder();
const PASSWORD_ALGORITHM = "pbkdf2-sha256";
// Keep this within the CPU budget of Cloudflare Workers Free. Online attempts
// are additionally protected by the account/network rate limiter and a secret pepper.
const PASSWORD_ITERATIONS = 100_000;
const PASSWORD_BYTES = 32;

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function base64UrlToBytes(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(normalized + padding);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function randomToken(byteLength = 32) {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

export function timingSafeEqual(left: Uint8Array, right: Uint8Array) {
  const length = Math.max(left.length, right.length);
  let mismatch = left.length === right.length ? 0 : 1;
  for (let index = 0; index < length; index += 1) {
    mismatch |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }
  return mismatch === 0;
}

export function timingSafeEqualText(left: string, right: string) {
  return timingSafeEqual(encoder.encode(left), encoder.encode(right));
}

function getPepper() {
  const pepper = process.env.AUTH_PASSWORD_PEPPER;
  if (!pepper || pepper.length < 32) {
    throw new Error("AUTH_PASSWORD_PEPPER must contain at least 32 characters.");
  }
  return pepper;
}

function getEncryptionKeyBytes() {
  const encoded = process.env.AUTH_ENCRYPTION_KEY;
  if (!encoded) throw new Error("AUTH_ENCRYPTION_KEY is required.");
  const bytes = base64UrlToBytes(encoded);
  if (bytes.length !== 32) {
    throw new Error("AUTH_ENCRYPTION_KEY must be a base64url-encoded 32-byte key.");
  }
  return bytes;
}

export function assertAuthConfigured() {
  getPepper();
  getEncryptionKeyBytes();
}

async function derivePassword(password: string, salt: Uint8Array, iterations: number) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(`${password}\u0000${getPepper()}`),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    keyMaterial,
    PASSWORD_BYTES * 8,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string) {
  if (password.length < 16 || password.length > 128) {
    throw new Error("Admin password must be between 16 and 128 characters.");
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePassword(password, salt, PASSWORD_ITERATIONS);
  return `$${PASSWORD_ALGORITHM}$${PASSWORD_ITERATIONS}$${bytesToBase64Url(salt)}$${bytesToBase64Url(hash)}`;
}

export async function verifyPassword(password: string, encodedHash: string) {
  if (!password || password.length > 128) return false;
  const parts = encodedHash.split("$");
  if (parts.length !== 5 || parts[1] !== PASSWORD_ALGORITHM) return false;
  const iterations = Number(parts[2]);
  if (!Number.isSafeInteger(iterations) || iterations < PASSWORD_ITERATIONS) return false;
  try {
    const salt = base64UrlToBytes(parts[3]);
    const expected = base64UrlToBytes(parts[4]);
    const actual = await derivePassword(password, salt, iterations);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(digest));
}

export async function keyedHash(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getPepper()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function encryptSecret(plaintext: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    getEncryptionKeyBytes(),
    "AES-GCM",
    false,
    ["encrypt"],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    encoder.encode(plaintext),
  );
  return `v1.${bytesToBase64Url(iv)}.${bytesToBase64Url(new Uint8Array(ciphertext))}`;
}

export async function decryptSecret(payload: string) {
  const [version, encodedIv, encodedCiphertext] = payload.split(".");
  if (version !== "v1" || !encodedIv || !encodedCiphertext) {
    throw new Error("Unsupported encrypted secret format.");
  }
  const key = await crypto.subtle.importKey(
    "raw",
    getEncryptionKeyBytes(),
    "AES-GCM",
    false,
    ["decrypt"],
  );
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64UrlToBytes(encodedIv) as BufferSource },
    key,
    base64UrlToBytes(encodedCiphertext) as BufferSource,
  );
  return new TextDecoder().decode(plaintext);
}

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function bytesToBase32(bytes: Uint8Array) {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

function base32ToBytes(input: string) {
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  for (const character of input.toUpperCase().replace(/[^A-Z2-7]/gu, "")) {
    const index = BASE32_ALPHABET.indexOf(character);
    if (index < 0) throw new Error("Invalid base32 value.");
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(output);
}

export function generateTotpSecret() {
  return bytesToBase32(crypto.getRandomValues(new Uint8Array(20)));
}

async function totpAtCounter(secret: string, counter: bigint) {
  const counterBytes = new Uint8Array(8);
  let remainder = counter;
  for (let index = 7; index >= 0; index -= 1) {
    counterBytes[index] = Number(remainder & BigInt(255));
    remainder >>= BigInt(8);
  }
  const key = await crypto.subtle.importKey(
    "raw",
    base32ToBytes(secret),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, counterBytes));
  const offset = digest[digest.length - 1] & 15;
  const binary =
    ((digest[offset] & 127) << 24) |
    ((digest[offset + 1] & 255) << 16) |
    ((digest[offset + 2] & 255) << 8) |
    (digest[offset + 3] & 255);
  return String(binary % 1_000_000).padStart(6, "0");
}

export async function verifyTotp(secret: string, code: string, lastCounter: bigint | null) {
  const normalized = code.replaceAll(/\s|-/gu, "");
  if (!/^\d{6}$/u.test(normalized)) return null;
  const current = BigInt(Math.floor(Date.now() / 30_000));
  for (const offset of [BigInt(-1), BigInt(0), BigInt(1)]) {
    const counter = current + offset;
    if (lastCounter !== null && counter <= lastCounter) continue;
    if (timingSafeEqualText(await totpAtCounter(secret, counter), normalized)) return counter;
  }
  return null;
}

export function generateRecoveryCodes(count = 10) {
  return Array.from({ length: count }, () => {
    const raw = Array.from(crypto.getRandomValues(new Uint8Array(6)))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
    return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
  });
}
