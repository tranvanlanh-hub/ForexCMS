import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { keyedHash, randomToken, sha256, timingSafeEqualText } from "@/lib/admin/crypto";

const IDLE_MILLISECONDS = 30 * 60 * 1000;
const ABSOLUTE_MILLISECONDS = 8 * 60 * 60 * 1000;
const REFRESH_AFTER_MILLISECONDS = 5 * 60 * 1000;

export function getSessionCookieName() {
  return process.env.APP_ENV === "production" || process.env.APP_ENV === "preview"
    ? "__Host-forexcms_admin_session"
    : "forexcms_admin_session";
}

export function getChallengeCookieName() {
  return process.env.APP_ENV === "production" || process.env.APP_ENV === "preview"
    ? "__Host-forexcms_admin_challenge"
    : "forexcms_admin_challenge";
}

function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.APP_ENV === "production" || process.env.APP_ENV === "preview",
    sameSite: "strict" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export async function createLoginChallenge(accountId: string) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await prisma.adminLoginChallenge.create({
    data: { accountId, tokenHash: await sha256(token), expiresAt },
  });
  (await cookies()).set(getChallengeCookieName(), token, cookieOptions(5 * 60));
}

export async function getLoginChallenge() {
  const token = (await cookies()).get(getChallengeCookieName())?.value;
  if (!token) return null;
  return prisma.adminLoginChallenge.findFirst({
    where: { tokenHash: await sha256(token), expiresAt: { gt: new Date() } },
    include: { account: true },
  });
}

export async function clearLoginChallenge(accountId?: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(getChallengeCookieName())?.value;
  if (token) {
    await prisma.adminLoginChallenge.deleteMany({
      where: accountId ? { accountId } : { tokenHash: await sha256(token) },
    });
  }
  cookieStore.delete(getChallengeCookieName());
}

export async function createAdminSession(accountId: string) {
  const token = randomToken();
  const now = new Date();
  await prisma.adminSession.create({
    data: {
      accountId,
      tokenHash: await sha256(token),
      lastSeenAt: now,
      idleExpiresAt: new Date(now.getTime() + IDLE_MILLISECONDS),
      absoluteExpiresAt: new Date(now.getTime() + ABSOLUTE_MILLISECONDS),
    },
  });
  (await cookies()).set(
    getSessionCookieName(),
    token,
    cookieOptions(ABSOLUTE_MILLISECONDS / 1000),
  );
}

export async function readAdminSession({ refresh = false } = {}) {
  const token = (await cookies()).get(getSessionCookieName())?.value;
  if (!token) return null;
  const now = new Date();
  const session = await prisma.adminSession.findFirst({
    where: {
      tokenHash: await sha256(token),
      revokedAt: null,
      idleExpiresAt: { gt: now },
      absoluteExpiresAt: { gt: now },
      account: { isActive: true },
    },
    include: { account: true },
  });
  if (!session) return null;
  if (refresh && now.getTime() - session.lastSeenAt.getTime() >= REFRESH_AFTER_MILLISECONDS) {
    const idleExpiresAt = new Date(
      Math.min(now.getTime() + IDLE_MILLISECONDS, session.absoluteExpiresAt.getTime()),
    );
    await prisma.adminSession.update({
      where: { id: session.id },
      data: { lastSeenAt: now, idleExpiresAt },
    });
  }
  return { session, account: session.account, token };
}

export async function getCsrfToken() {
  const auth = await readAdminSession();
  if (!auth) return "";
  return keyedHash(`csrf:${auth.token}`);
}

export async function requireAdminSession() {
  const auth = await readAdminSession({ refresh: true });
  if (!auth) redirect("/admin/login/");
  return auth;
}

export async function requireAdminMutation(formData: FormData) {
  const auth = await requireAdminSession();
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  const host = requestHeaders.get("host") ?? requestHeaders.get("x-forwarded-host");
  const fetchSite = requestHeaders.get("sec-fetch-site");
  if (!origin || !host) throw new Error("Request origin could not be verified.");
  const parsedOrigin = new URL(origin);
  if (
    parsedOrigin.host !== host ||
    (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none")
  ) {
    throw new Error("Cross-site request blocked.");
  }
  const suppliedToken = String(formData.get("_csrf") ?? "");
  const expectedToken = await keyedHash(`csrf:${auth.token}`);
  if (!suppliedToken || !timingSafeEqualText(suppliedToken, expectedToken)) {
    throw new Error("Security token is missing or expired. Refresh and try again.");
  }
  return auth;
}

export async function requireAdminApiMutation(request: Request) {
  const auth = await readAdminSession({ refresh: true });
  if (!auth) throw new Error("UNAUTHORIZED");
  const origin = request.headers.get("origin");
  const host = request.headers.get("host") ?? request.headers.get("x-forwarded-host");
  if (!origin || !host || new URL(origin).host !== host) throw new Error("INVALID_ORIGIN");
  const suppliedToken = request.headers.get("x-csrf-token") ?? "";
  const expectedToken = await keyedHash(`csrf:${auth.token}`);
  if (!suppliedToken || !timingSafeEqualText(suppliedToken, expectedToken)) throw new Error("INVALID_CSRF");
  return auth;
}

export async function revokeCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  if (token) {
    await prisma.adminSession.updateMany({
      where: { tokenHash: await sha256(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  cookieStore.delete(getSessionCookieName());
}

export function sanitizeAdminReturnTo(value: string | null | undefined) {
  if (!value || !value.startsWith("/admin") || value.startsWith("//")) return "/admin/";
  try {
    const url = new URL(value, "https://forexcms.invalid");
    return url.origin === "https://forexcms.invalid" && url.pathname.startsWith("/admin")
      ? `${url.pathname}${url.search}`
      : "/admin/";
  } catch {
    return "/admin/";
  }
}
