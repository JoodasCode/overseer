// Centralized pricing and token configuration
export const PRICING_PLANS = {
  FREE: {
    name: 'Free',
    tokenQuota: 20,
    price: 0,
    features: [
      'Access to all agents',
      '20 tokens per month',
      'Basic analytics',
      'Community support'
    ]
  },
  PRO: {
    name: 'Pro',
    tokenQuota: 1000,
    price: 29,
    features: [
      'Access to all agents',
      '1,000 tokens per month',
      'Advanced analytics',
      'Priority support',
      'Custom workflows'
    ]
  },
  TEAMS: {
    name: 'Teams',
    tokenQuota: 5000,
    price: 99,
    features: [
      'Access to all agents',
      '5,000 tokens per month',
      'Team collaboration',
      'Advanced analytics',
      'Priority support',
      'Custom integrations'
    ]
  },
  ENTERPRISE: {
    name: 'Enterprise',
    tokenQuota: 15000,
    price: 299,
    features: [
      'Access to all agents',
      '15,000 tokens per month',
      'Unlimited team members',
      'Custom analytics',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee'
    ]
  }
} as const

export type PlanType = keyof typeof PRICING_PLANS

// Helper function to get token quota by plan
export function getTokenQuotaByPlan(plan: string): number {
  const upperPlan = plan.toUpperCase() as PlanType
  return PRICING_PLANS[upperPlan]?.tokenQuota || PRICING_PLANS.FREE.tokenQuota
}

// Helper function to get plan details
export function getPlanDetails(plan: string) {
  const upperPlan = plan.toUpperCase() as PlanType
  return PRICING_PLANS[upperPlan] || PRICING_PLANS.FREE
}

// Default plan for new users
export const DEFAULT_PLAN: PlanType = 'FREE'
export const DEFAULT_TOKEN_QUOTA = PRICING_PLANS.FREE.tokenQuota 