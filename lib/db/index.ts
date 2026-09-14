import { PrismaClient, type Prisma } from "@prisma/client";
import { cache } from "react";

function createPrismaClient() {
  const log = (
    process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  ) satisfies Prisma.LogLevel[];
  return new PrismaClient({ log });
}

const getRequestPrismaClient = cache(() => Promise.resolve(createPrismaClient()));

function getPrismaClient() {
  return getRequestPrismaClient();
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
