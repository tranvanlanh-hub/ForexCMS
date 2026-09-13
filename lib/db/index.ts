import { PrismaClient as NodePrismaClient, type PrismaClient, type Prisma } from "@prisma/client";
import { PrismaClient as EdgePrismaClient } from "../../node_modules/.prisma/client-edge/wasm.js";
import { PrismaNeon } from "@prisma/adapter-neon";
import { cache } from "react";
import { logEvent } from "@/lib/observability/logging";

const globalForPrisma = globalThis as unknown as {
  prisma?: Promise<PrismaClient>;
};

function createPrismaClient() {
  const log = (
    process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  ) satisfies Prisma.LogLevel[];
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const shouldUseNeonAdapter =
    process.env.APP_ENV === "preview" || process.env.APP_ENV === "production";

  if (shouldUseNeonAdapter && databaseUrl.includes(".neon.tech")) {
    logEvent("info", "database_neon_adapter_enabled", {
      appEnv: process.env.APP_ENV,
      host: new URL(databaseUrl).hostname,
    });

    return new EdgePrismaClient({
      adapter: new PrismaNeon({ connectionString: databaseUrl }),
      log,
    }) as PrismaClient;
  }

  return new NodePrismaClient({ log });
}

const getRequestPrismaClient = cache(() => Promise.resolve(createPrismaClient()));

function getPrismaClient() {
  if (process.env.APP_ENV === "preview" || process.env.APP_ENV === "production") {
    return getRequestPrismaClient();
  }

  globalForPrisma.prisma ??= Promise.resolve(createPrismaClient());
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
    url: process.env.DATABASE_URL ?? "",
  };
}

export type { Prisma } from "@prisma/client";
