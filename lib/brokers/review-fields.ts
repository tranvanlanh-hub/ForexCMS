export const brokerRatingFields = [
  { name: "overallRating", label: "Overall rating" },
  { name: "trustSafetyRating", label: "Trust & safety" },
  { name: "feesRating", label: "Commissions & fees" },
  { name: "researchEducationRating", label: "Research & education" },
  { name: "tradingToolsRating", label: "Trading tools" },
  { name: "tradingPlatformsRating", label: "Trading platforms" },
  { name: "customerSupportRating", label: "Customer support" },
  { name: "accountTypesRating", label: "Account types" },
  { name: "specialFeaturesRating", label: "Special features" },
  { name: "accountOpeningRating", label: "Account opening" },
] as const;

export type BrokerRatingFieldName = (typeof brokerRatingFields)[number]["name"];
