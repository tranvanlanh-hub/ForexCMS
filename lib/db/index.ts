import { PrismaClient, type Prisma } from "@prisma/client";

// Single PrismaClient shared across all requests in this Node process.
// Using globalThis to survive Next.js dev hot-reload; in production the
// process is long-lived so a module-level singleton is sufficient.
const globalForPrisma = globalThis as unknown as {
  __marketgb_prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const log = (
    process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  ) satisfies Prisma.LogLevel[];
  return new PrismaClient({ log });
}

export const prisma: PrismaClient =
  globalForPrisma.__marketgb_prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__marketgb_prisma = prisma;
}

// Graceful shutdown so Postgres connections close cleanly on restart/reload.
function disconnectOnExit(signal: NodeJS.Signals) {
  process.once(signal, () => {
    prisma
      .$disconnect()
      .catch((err) => console.error("prisma disconnect error", err))
      .finally(() => process.exit(0));
  });
}
disconnectOnExit("SIGINT");
disconnectOnExit("SIGTERM");

export function getDatabaseConfig(): { url: string } {
  return { url: process.env.DATABASE_URL ?? "" };
}

export type { Prisma } from "@prisma/client";
