# Proposal: Broker list frontend link

## Goal

Let editors open a broker's public review directly from Broker Manager.

## Scope

- Add a `Frontend` column to the broker list.
- Resolve only a linked, published `BROKER_REVIEW` content item.
- Open an available public review in a new tab.
- Show `No page` when no public broker review exists.

## Safety

- Never link to draft content or construct an unregistered URL.
- Do not expose a broker merely because its Broker status is active.
- Do not create a new public broker-profile route as part of this change.

## Acceptance

- Published broker reviews display a working `View` action.
- Brokers without a published review display `No page` and never lead to 404.
- Existing content, facts and affiliate counts remain unchanged.
