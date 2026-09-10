# Design: Broker data, review, and comparison foundation

## BrokerFact

`BrokerFact` stores one source-backed claim per row. All facts require `sourceName` and `sourceUrl`, including regulation/license, minimum deposit, spread, leverage, platforms, account types, deposit/withdrawal methods, support languages, restricted countries, and other future fact types.

Optional `marketId` lets a fact apply to a specific market. A null market is treated as global broker-level data. Public pages may show global facts plus facts for the current market.

## Admin editing

Broker Manager keeps the existing broker identity form and adds a structured fact textarea for MVP speed. Each fact line uses:

```text
CATEGORY | label | value | unit | source name | source URL | market code | applies to | citation text | primary
```

The server action validates category and source URL before saving. Updating a broker replaces its fact rows atomically after the broker identity is saved.

## BrokerReview rendering

BrokerReview pages receive broker fact rows through the existing content resolver. The template renderer adds a cited facts section for attached brokers and only displays rows that have source fields.

## Comparison foundation

The comparison route parses `broker-a-vs-broker-b`, loads active brokers, filters facts to global/current-market facts, and renders a source-backed comparison table. Affiliate CTAs still use broker/market/language/campaign tokens.

## Schema

BrokerReview pages emit Review JSON-LD with `itemReviewed` as a schema.org Organization. No rating is emitted until a first-class rating model exists.

Broker comparison pages emit ItemList JSON-LD for the compared brokers.
