# Design

36: Capture Git inventory and exclude only generated artifacts. Propose commit groups; do not commit.
37: Inspect environment metadata without printing secrets; verify PostgreSQL migration history and existing seed data before considering any writes. Run required audits, fixing failures before advancing.
38: Exercise real preview HTTP routes, authentication, canonical and sitemap origins. Compare database-backed paths with responses; report skipped conditional checks explicitly.
39: Record launch gates with evidence and manual owners. Production requires explicit approval.
40: Plan draft-only batches of at most 50 and staged publishing with editorial and indexing gates.

Never print credentials or authenticated HTML. Remote secret presence is not proof of its exact value; distinguish runtime evidence from configuration inference. Preserve historical documentation but put current results first.
