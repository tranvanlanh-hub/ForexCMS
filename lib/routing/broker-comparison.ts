import { BrokerStatus, MarketStatus } from "@prisma/client";
import { normalizeSlug } from "@/lib/content";
import { prisma } from "@/lib/db";

export function parseBrokerComparisonPair(pair: string) {
  const normalizedPair = normalizeSlug(pair);
  const parts = normalizedPair.split("-vs-").filter(Boolean);

  if (parts.length !== 2 || parts[0] === parts[1]) {
    return null;
  }

  return {
    brokerA: parts[0],
    brokerB: parts[1],
    pair: `${parts[0]}-vs-${parts[1]}`,
  };
}

export async function getBrokerComparisonByRoute(args: {
  market: string;
  pair: string;
}) {
  const marketCode = normalizeSlug(args.market);
  const parsedPair = parseBrokerComparisonPair(args.pair);

  if (!marketCode || !parsedPair) {
    return null;
  }

  try {
    const market = await prisma.market.findFirst({
      where: {
        code: marketCode,
        status: MarketStatus.ACTIVE,
      },
    });

    if (!market) {
      return null;
    }

    const brokers = await prisma.broker.findMany({
      where: {
        slug: {
          in: [parsedPair.brokerA, parsedPair.brokerB],
        },
        status: BrokerStatus.ACTIVE,
      },
      include: {
        factItems: {
          where: {
            OR: [
              {
                marketId: null,
              },
              {
                marketId: market.id,
              },
            ],
          },
          include: {
            market: true,
          },
          orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    if (brokers.length !== 2) {
      return null;
    }

    const orderedBrokers = [parsedPair.brokerA, parsedPair.brokerB]
      .map((slug) => brokers.find((broker) => broker.slug === slug))
      .filter((broker): broker is (typeof brokers)[number] => Boolean(broker));

    if (orderedBrokers.length !== 2) {
      return null;
    }

    return {
      market,
      brokers: orderedBrokers,
      canonicalPath: `/${market.code}/compare/${parsedPair.pair}/`,
    };
  } catch {
    return null;
  }
}
