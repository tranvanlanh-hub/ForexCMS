# Design: Broker profile and editorial review fields

## Data model

The fixed one-to-one profile fields live on `Broker`; they do not need separate
rows and are edited with the broker identity. New fields are nullable except
`priority`, which defaults to 100 so existing rows remain compatible.

Company/contact fields:

- `priority`
- `foundedYear`
- `headquartersCountry`
- `headquartersAddress`
- `supportEmail`
- `supportPhone`
- `contactPageUrl`

`websiteUrl` and `legalName` already exist and are exposed in the same section.

Editorial review fields use PostgreSQL `DECIMAL(2,1)` and a 0–5 scale:

- `overallRating`
- `trustSafetyRating`
- `feesRating`
- `researchEducationRating`
- `tradingToolsRating`
- `tradingPlatformsRating`
- `customerSupportRating`
- `accountTypesRating`
- `specialFeaturesRating`
- `accountOpeningRating`
- `ratingSummary`
- `ratingReviewedAt`

## Boundaries

Contact/profile fields are broker identity data. Factual claims such as licenses,
spreads, leverage, account conditions, and restricted countries remain sourced
`BrokerFact` rows. Affiliate destinations remain centralized in `AffiliateLink`.

Scores are MarketGB editorial assessments. The form explains that editors must
apply an approved methodology and review date; scores are not imported from a
broker marketing page.

## Validation

- URLs must use HTTP or HTTPS.
- Email uses a conservative address-shape check and a 254-character limit.
- Phone is optional, limited to 50 characters, and may contain common dialing
  punctuation only.
- Founded year is between 1800 and the current UTC year.
- Priority is an integer from 1 through 9999.
- Scores are optional numbers from 0 through 5 with at most one decimal place.
- Rating summary is limited to 1,000 characters.

## Admin presentation

Create/edit receives separate English sections for Company & contact details,
Editorial review scores, Identity, Publishing, and Sourced broker facts. The list
orders by priority ascending and shows priority, overall rating, and contact
completeness.
