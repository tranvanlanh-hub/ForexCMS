INSERT OR IGNORE INTO "Market" (
  "id",
  "code",
  "name",
  "languageCode",
  "locale",
  "isGlobal",
  "status",
  "createdAt",
  "updatedAt"
) VALUES (
  'market_global',
  'global',
  'Global',
  'en',
  'en',
  true,
  'ACTIVE',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO "Template" (
  "id",
  "key",
  "name",
  "kind",
  "description",
  "requiredBlocks",
  "allowedBlocks",
  "schemaTypes",
  "ctaSlots",
  "internalLinkSlots",
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES
(
  'template_article',
  'article',
  'Article',
  'ARTICLE',
  'Default editorial article template.',
  '["intro","body"]',
  '["intro","body","faq","summary"]',
  '["Article","BreadcrumbList"]',
  '[]',
  '[]',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'template_guide',
  'guide',
  'Guide',
  'GUIDE',
  'Default guide template.',
  '["intro","steps","summary"]',
  '["intro","steps","faq","summary"]',
  '["Article","BreadcrumbList","FAQPage"]',
  '[]',
  '[]',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'template_review',
  'broker-review',
  'Broker Review',
  'BROKER_REVIEW',
  'Default review template.',
  '["intro","facts","verdict"]',
  '["intro","facts","pros_cons","verdict","faq"]',
  '["Review","BreadcrumbList"]',
  '["top","middle","bottom"]',
  '[]',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
