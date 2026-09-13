-- Single-admin authentication with revocable sessions and TOTP recovery.
CREATE TYPE "AdminSecurityEventType" AS ENUM (
  'PASSWORD_VERIFIED',
  'LOGIN_FAILED',
  'LOGIN_BLOCKED',
  'TWO_FACTOR_SUCCEEDED',
  'TWO_FACTOR_FAILED',
  'RECOVERY_CODE_USED',
  'LOGOUT',
  'SESSIONS_REVOKED'
);

CREATE TABLE "AdminAccount" (
  "id" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "totpSecretCiphertext" TEXT NOT NULL,
  "totpLastCounter" BIGINT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
  "lockedUntil" TIMESTAMP(3),
  "passwordChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminLoginChallenge" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminLoginChallenge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminSession" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "idleExpiresAt" TIMESTAMP(3) NOT NULL,
  "absoluteExpiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminRecoveryCode" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminRecoveryCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminLoginAttempt" (
  "id" TEXT NOT NULL,
  "accountKeyHash" TEXT NOT NULL,
  "networkKeyHash" TEXT NOT NULL,
  "succeeded" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminLoginAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminSecurityEvent" (
  "id" TEXT NOT NULL,
  "accountId" TEXT,
  "type" "AdminSecurityEventType" NOT NULL,
  "networkKeyHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminSecurityEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminAccount_username_key" ON "AdminAccount"("username");
CREATE UNIQUE INDEX "AdminLoginChallenge_tokenHash_key" ON "AdminLoginChallenge"("tokenHash");
CREATE INDEX "AdminLoginChallenge_accountId_expiresAt_idx" ON "AdminLoginChallenge"("accountId", "expiresAt");
CREATE INDEX "AdminLoginChallenge_expiresAt_idx" ON "AdminLoginChallenge"("expiresAt");
CREATE UNIQUE INDEX "AdminSession_tokenHash_key" ON "AdminSession"("tokenHash");
CREATE INDEX "AdminSession_accountId_revokedAt_idx" ON "AdminSession"("accountId", "revokedAt");
CREATE INDEX "AdminSession_idleExpiresAt_idx" ON "AdminSession"("idleExpiresAt");
CREATE INDEX "AdminSession_absoluteExpiresAt_idx" ON "AdminSession"("absoluteExpiresAt");
CREATE UNIQUE INDEX "AdminRecoveryCode_codeHash_key" ON "AdminRecoveryCode"("codeHash");
CREATE INDEX "AdminRecoveryCode_accountId_usedAt_idx" ON "AdminRecoveryCode"("accountId", "usedAt");
CREATE INDEX "AdminLoginAttempt_accountKeyHash_createdAt_idx" ON "AdminLoginAttempt"("accountKeyHash", "createdAt");
CREATE INDEX "AdminLoginAttempt_networkKeyHash_createdAt_idx" ON "AdminLoginAttempt"("networkKeyHash", "createdAt");
CREATE INDEX "AdminLoginAttempt_createdAt_idx" ON "AdminLoginAttempt"("createdAt");
CREATE INDEX "AdminSecurityEvent_accountId_createdAt_idx" ON "AdminSecurityEvent"("accountId", "createdAt");
CREATE INDEX "AdminSecurityEvent_type_createdAt_idx" ON "AdminSecurityEvent"("type", "createdAt");
CREATE INDEX "AdminSecurityEvent_createdAt_idx" ON "AdminSecurityEvent"("createdAt");

ALTER TABLE "AdminLoginChallenge" ADD CONSTRAINT "AdminLoginChallenge_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "AdminAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "AdminAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminRecoveryCode" ADD CONSTRAINT "AdminRecoveryCode_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "AdminAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminSecurityEvent" ADD CONSTRAINT "AdminSecurityEvent_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "AdminAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
