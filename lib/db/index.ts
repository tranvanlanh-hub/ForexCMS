import { PrismaClient, type Prisma } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

const globalForPrisma = globalThis as unknown as {
  prisma?: Promise<PrismaClient>;
};

async function createPrismaClient() {
  const log = (
    process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  ) satisfies Prisma.LogLevel[];
  const cloudflare = await import("cloudflare:workers").catch(() => undefined);
  const d1 = (cloudflare?.env as { DB?: D1Database } | undefined)?.DB;

  if (d1) {
    return new PrismaClient({
      adapter: new PrismaD1(d1),
      log,
    });
  }

  return new PrismaClient({ log });
}

function getPrismaClient() {
  globalForPrisma.prisma ??= createPrismaClient();
  return globalForPrisma.prisma;
}

function createPrismaProxy(path: PropertyKey[] = []): unknown {
  return new Proxy(() => undefined, {
    get(_target, prop) {
      if (prop === "then") return undefined;
      return createPrismaProxy([...path, prop]);
    },
    apply(_target, _thisArg, args) {
      return getPrismaClient().then((client) => {
        const receiver = path.slice(0, -1).reduce<unknown>(
          (value, key) => (value as Record<PropertyKey, unknown>)[key],
          client,
        );
        const method = (receiver as Record<PropertyKey, unknown>)[path.at(-1) ?? ""];

        return (method as (...methodArgs: unknown[]) => unknown).apply(receiver, args);
      });
    },
  });
}

export const prisma = createPrismaProxy() as PrismaClient;

export type DatabaseConfig = {
  url: string;
};

export function getDatabaseConfig(): DatabaseConfig {
  return {
    url: process.env.DATABASE_URL ?? "Cloudflare D1 binding: DB",
  };
}

export type { Prisma } from "@prisma/client";
