"use server";

import { AdminSecurityEventType } from "@prisma/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  assertAuthConfigured,
  decryptSecret,
  keyedHash,
  timingSafeEqualText,
  verifyPassword,
  verifyTotp,
} from "@/lib/admin/crypto";
import {
  clearLoginChallenge,
  createAdminSession,
  createLoginChallenge,
  getLoginChallenge,
  requireAdminMutation,
  revokeCurrentSession,
  sanitizeAdminReturnTo,
} from "@/lib/admin/session";
import { prisma } from "@/lib/db";

export type LoginActionState = { error?: string };

const GENERIC_LOGIN_ERROR = "The sign-in details were not accepted.";
const DUMMY_PASSWORD_HASH =
  "$pbkdf2-sha256$600000$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

async function assertSameOrigin() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  const host = requestHeaders.get("host") ?? requestHeaders.get("x-forwarded-host");
  const fetchSite = requestHeaders.get("sec-fetch-site");
  if (
    !origin ||
    !host ||
    new URL(origin).host !== host ||
    (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none")
  ) {
    throw new Error("Cross-site request blocked.");
  }
}

async function requestNetworkHash() {
  const requestHeaders = await headers();
  const address =
    requestHeaders.get("cf-connecting-ip") ??
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "local";
  return keyedHash(`network:${address}`);
}

async function isRateLimited(accountKeyHash: string, networkKeyHash: string) {
  const since = new Date(Date.now() - 15 * 60 * 1000);
  const attempts = await prisma.adminLoginAttempt.count({
    where: {
      succeeded: false,
      createdAt: { gte: since },
      OR: [{ accountKeyHash }, { networkKeyHash }],
    },
  });
  return attempts >= 10;
}

async function recordAttempt(
  accountKeyHash: string,
  networkKeyHash: string,
  succeeded: boolean,
) {
  await prisma.adminLoginAttempt.create({
    data: { accountKeyHash, networkKeyHash, succeeded },
  });
}

export async function beginLoginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  try {
    assertAuthConfigured();
    await assertSameOrigin();
    if (field(formData, "company")) return { error: GENERIC_LOGIN_ERROR };

    const username = field(formData, "username").toLowerCase();
    const password = String(formData.get("password") ?? "");
    const returnTo = sanitizeAdminReturnTo(field(formData, "returnTo"));
    const accountKeyHash = await keyedHash(`account:${username}`);
    const networkKeyHash = await requestNetworkHash();

    if (await isRateLimited(accountKeyHash, networkKeyHash)) {
      await prisma.adminSecurityEvent.create({
        data: { type: AdminSecurityEventType.LOGIN_BLOCKED, networkKeyHash },
      });
      return { error: "Too many attempts. Wait 15 minutes and try again." };
    }

    const account = await prisma.adminAccount.findFirst({ where: { isActive: true } });
    const passwordMatches = await verifyPassword(
      password,
      account?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );
    const usernameMatches = Boolean(
      account && timingSafeEqualText(username, account.username.toLowerCase()),
    );
    const locked = Boolean(account?.lockedUntil && account.lockedUntil > new Date());

    if (!account || !passwordMatches || !usernameMatches || locked) {
      await recordAttempt(accountKeyHash, networkKeyHash, false);
      if (account && usernameMatches) {
        const failures = account.failedLoginCount + 1;
        const lockMinutes = failures >= 5 ? Math.min(15, 2 ** (failures - 5)) : 0;
        await prisma.adminAccount.update({
          where: { id: account.id },
          data: {
            failedLoginCount: failures,
            lockedUntil: lockMinutes
              ? new Date(Date.now() + lockMinutes * 60 * 1000)
              : account.lockedUntil,
          },
        });
      }
      await prisma.adminSecurityEvent.create({
        data: {
          accountId: account && usernameMatches ? account.id : null,
          type: locked
            ? AdminSecurityEventType.LOGIN_BLOCKED
            : AdminSecurityEventType.LOGIN_FAILED,
          networkKeyHash,
        },
      });
      return { error: GENERIC_LOGIN_ERROR };
    }

    await recordAttempt(accountKeyHash, networkKeyHash, true);
    await prisma.adminLoginChallenge.deleteMany({ where: { accountId: account.id } });
    await createLoginChallenge(account.id);
    await prisma.adminSecurityEvent.create({
      data: {
        accountId: account.id,
        type: AdminSecurityEventType.PASSWORD_VERIFIED,
        networkKeyHash,
      },
    });
    redirect(`/admin/login/verify/?returnTo=${encodeURIComponent(returnTo)}`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    return { error: "Admin sign-in is temporarily unavailable." };
  }
}

export async function verifyTwoFactorAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  try {
    assertAuthConfigured();
    await assertSameOrigin();
    const challenge = await getLoginChallenge();
    if (!challenge) return { error: "This verification request expired. Sign in again." };

    const networkKeyHash = await requestNetworkHash();
    const recentFailures = await prisma.adminSecurityEvent.count({
      where: {
        accountId: challenge.accountId,
        type: AdminSecurityEventType.TWO_FACTOR_FAILED,
        createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
      },
    });
    if (recentFailures >= 5) {
      await clearLoginChallenge(challenge.accountId);
      return { error: "Too many verification attempts. Wait 15 minutes and sign in again." };
    }

    const code = field(formData, "code").toUpperCase();
    const normalizedRecoveryCode = code.replaceAll(/[^A-Z0-9]/gu, "");
    let verified = false;
    let usedRecoveryCode = false;

    if (normalizedRecoveryCode.length === 12 && !/^\d{6}$/u.test(code)) {
      const codeHash = await keyedHash(`recovery:${normalizedRecoveryCode}`);
      const result = await prisma.adminRecoveryCode.updateMany({
        where: { accountId: challenge.accountId, codeHash, usedAt: null },
        data: { usedAt: new Date() },
      });
      verified = result.count === 1;
      usedRecoveryCode = verified;
    } else {
      const secret = await decryptSecret(challenge.account.totpSecretCiphertext);
      const counter = await verifyTotp(secret, code, challenge.account.totpLastCounter);
      if (counter !== null) {
        const result = await prisma.adminAccount.updateMany({
          where: {
            id: challenge.accountId,
            OR: [{ totpLastCounter: null }, { totpLastCounter: { lt: counter } }],
          },
          data: { totpLastCounter: counter },
        });
        verified = result.count === 1;
      }
    }

    if (!verified) {
      await prisma.adminSecurityEvent.create({
        data: {
          accountId: challenge.accountId,
          type: AdminSecurityEventType.TWO_FACTOR_FAILED,
          networkKeyHash,
        },
      });
      return { error: "The verification code was not accepted." };
    }

    await prisma.adminAccount.update({
      where: { id: challenge.accountId },
      data: { failedLoginCount: 0, lockedUntil: null },
    });
    await createAdminSession(challenge.accountId);
    await clearLoginChallenge(challenge.accountId);
    await prisma.adminSecurityEvent.create({
      data: {
        accountId: challenge.accountId,
        type: usedRecoveryCode
          ? AdminSecurityEventType.RECOVERY_CODE_USED
          : AdminSecurityEventType.TWO_FACTOR_SUCCEEDED,
        networkKeyHash,
      },
    });
    redirect(sanitizeAdminReturnTo(field(formData, "returnTo")));
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    return { error: "Verification is temporarily unavailable." };
  }
}

export async function logoutAction(formData: FormData) {
  const auth = await requireAdminMutation(formData);
  await revokeCurrentSession();
  await prisma.adminSecurityEvent.create({
    data: { accountId: auth.account.id, type: AdminSecurityEventType.LOGOUT },
  });
  redirect("/admin/login/");
}
