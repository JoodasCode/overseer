export interface BillingInfo {
  plan: string;
  status: string;
  credits: number;
  usage: number;
}

export interface PlanLimits {
  maxAgents: number;
  maxCredits: number;
  maxStorage: number;
  maxIntegrations: number;
}

export type PlanTier = 'FREE' | 'PRO' | 'TEAMS' | 'ENTERPRISE';

export interface SubscriptionInfo {
  planTier: PlanTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodEnd: Date;
  trialEnd?: Date;
} 