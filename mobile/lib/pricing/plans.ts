export type PricingPlanCode = "free" | "pro" | "business" | "enterprise";

export type PricingPlan = {
  code: PricingPlanCode;
  nameKey: string;
  priceKey: string;
  taglineKey: string;
  highlighted?: boolean;
  features: string[];
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    code: "free",
    nameKey: "Pricing Plan Free",
    priceKey: "Pricing Price Free",
    taglineKey: "Pricing Tagline Free",
    features: [
      "Pricing Feature Appointments",
      "Pricing Feature Clients",
      "Pricing Feature Basic Analytics",
    ],
  },
  {
    code: "pro",
    nameKey: "Pricing Plan Pro",
    priceKey: "Pricing Price Pro",
    taglineKey: "Pricing Tagline Pro",
    features: [
      "Pricing Feature AI Forecast",
      "Pricing Feature Growth Insights",
      "Pricing Feature Risk Center",
    ],
  },
  {
    code: "business",
    nameKey: "Pricing Plan Business",
    priceKey: "Pricing Price Business",
    taglineKey: "Pricing Tagline Business",
    highlighted: true,
    features: [
      "Pricing Feature Mission Control",
      "Pricing Feature Revenue Simulator",
      "Pricing Feature Opportunity Matrix",
    ],
  },
  {
    code: "enterprise",
    nameKey: "Pricing Plan Enterprise",
    priceKey: "Pricing Price Enterprise",
    taglineKey: "Pricing Tagline Enterprise",
    features: [
      "Pricing Feature Multi Location",
      "Pricing Feature Advanced AI",
      "Pricing Feature Priority Support",
    ],
  },
];
