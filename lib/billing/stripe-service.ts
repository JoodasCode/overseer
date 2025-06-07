/**
 * Stripe Payment Service
 * Handles payment processing for add-on credits and subscription management
 */

import Stripe from 'stripe';
import { ErrorHandler } from '../error-handler';

// Initialize Stripe with API key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
});

// Credit package options for one-time purchases
export const CREDIT_PACKAGES = [
  { id: 'credits_100', name: '100 Credits', amount: 100, price: 5.00 },
  { id: 'credits_500', name: '500 Credits', amount: 500, price: 20.00 },
  { id: 'credits_1000', name: '1000 Credits', amount: 1000, price: 35.00 },
  { id: 'credits_5000', name: '5000 Credits', amount: 5000, price: 150.00 },
];

// Subscription plan tiers
export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'plan_free',
    name: 'Free',
    priceId: '', // No price ID for free plan
    monthlyCredits: 25,
    price: 0,
    features: ['25 credits/month', 'Basic AI access', '1 app deploy/day'],
    trialDays: 0,
  },
  PRO: {
    id: 'plan_pro',
    name: 'Pro',
    priceId: process.env.STRIPE_PRICE_PRO || 'price_pro',
    monthlyCredits: 500,
    price: 15,
    features: ['500 credits/month', 'All AI models', '5 app deploys/day', 'Priority support'],
    trialDays: 14,
  },
  TEAMS: {
    id: 'plan_teams',
    name: 'Teams',
    priceId: process.env.STRIPE_PRICE_TEAMS || 'price_teams',
    monthlyCredits: 500, // per user
    price: 30, // per user
    features: ['500 credits/user/month', 'Team workspace', 'Usage analytics', 'Central billing'],
    trialDays: 14,
  },
  ENTERPRISE: {
    id: 'plan_enterprise',
    name: 'Enterprise',
    priceId: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise',
    monthlyCredits: 1000, // per user
    price: 60, // per user
    features: ['1000 credits/user/month', 'SSO integration', 'RBAC', 'Custom integrations', 'Dedicated support'],
    trialDays: 30,
  },
};

export type SubscriptionPlanType = 'FREE' | 'PRO' | 'TEAMS' | 'ENTERPRISE';

export interface SubscriptionDetails {
  id: string;
  customerId: string;
  status: Stripe.Subscription.Status;
  planType: SubscriptionPlanType;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  quantity: number;
  trialEnd?: number | null;
}

export class StripeService {
  /**
   * Create a checkout session for one-time credit purchase
   */
  public async createCheckoutSession(
    userId: string,
    packageId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<{ sessionId: string; url: string } | null> {
    try {
      // Find the selected package
      const selectedPackage = CREDIT_PACKAGES.find(pkg => pkg.id === packageId);
      
      if (!selectedPackage) {
        throw new Error('Invalid package selected');
      }
      
      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: selectedPackage.name,
                description: `${selectedPackage.amount} Overseer AI Credits`,
              },
              unit_amount: Math.round(selectedPackage.price * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        metadata: {
          userId,
          packageId,
          creditAmount: selectedPackage.amount.toString(),
          type: 'add_on_credits',
        },
      });
      
      return {
        sessionId: session.id,
        url: session.url || '',
      };
    } catch (error: any) {
      ErrorHandler.logError({
        errorCode: 'create_checkout_session_error',
        errorMessage: `Failed to create checkout session: ${error.message}`,
        userId,
        payload: { error: error.message, packageId }
      });
      
      return null;
    }
  }
  
  /**
   * Create a subscription checkout session
   */
  public async createSubscriptionSession(
    userId: string,
    email: string,
    planType: SubscriptionPlanType,
    quantity: number = 1,
    successUrl: string,
    cancelUrl: string
  ): Promise<{ sessionId: string; url: string } | null> {
    try {
      if (planType === 'FREE') {
        throw new Error('Cannot create subscription for free plan');
      }
      
      const plan = SUBSCRIPTION_PLANS[planType];
      
      if (!plan || !plan.priceId) {
        throw new Error('Invalid plan selected');
      }
      
      // Create checkout session for subscription
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: plan.priceId,
            quantity,
          },
        ],
        mode: 'subscription',
        subscription_data: {
          trial_period_days: plan.trialDays,
          metadata: {
            userId,
            planType,
          },
        },
        customer_email: email,
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        metadata: {
          userId,
          planType,
          quantity: quantity.toString(),
          type: 'subscription',
        },
      });
      
      return {
        sessionId: session.id,
        url: session.url || '',
      };
    } catch (error: any) {
      ErrorHandler.logError({
        errorCode: 'create_subscription_session_error',
        errorMessage: `Failed to create subscription session: ${error.message}`,
        userId,
        payload: { error: error.message, planType, quantity }
      });
      
      return null;
    }
  }
  
  /**
   * Handle webhook events from Stripe
   */
  public async handleWebhookEvent(
    payload: Buffer,
    signature: string
  ): Promise<{ success: boolean; event?: Stripe.Event }> {
    try {
      // Verify webhook signature
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
      
      return { success: true, event };
    } catch (error: any) {
      ErrorHandler.logError({
        errorCode: 'webhook_signature_error',
        errorMessage: `Webhook signature verification failed: ${error.message}`,
        payload: { error: error.message }
      });
      
      return { success: false };
    }
  }
  
  /**
   * Get checkout session details
   */
  public async getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session | null> {
    try {
      return await stripe.checkout.sessions.retrieve(sessionId);
    } catch (error: any) {
      ErrorHandler.logError({
        errorCode: 'get_checkout_session_error',
        errorMessage: `Error retrieving checkout session: ${error.message}`,
        payload: { error: error.message, sessionId }
      });
      
      return null;
    }
  }
  
  /**
   * Get subscription details
   */
  public async getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
    try {
      return await stripe.subscriptions.retrieve(subscriptionId);
    } catch (error: any) {
      ErrorHandler.logError({
        errorCode: 'get_subscription_error',
        errorMessage: `Error retrieving subscription: ${error.message}`,
        payload: { error: error.message, subscriptionId }
      });
      
      return null;
    }
  }
  
  /**
   * Get customer details
   */
  public async getCustomer(customerId: string): Promise<Stripe.Customer | null> {
    try {
      return await stripe.customers.retrieve(customerId) as Stripe.Customer;
    } catch (error: any) {
      ErrorHandler.logError({
        errorCode: 'get_customer_error',
        errorMessage: `Error retrieving customer: ${error.message}`,
        payload: { error: error.message, customerId }
      });
      
      return null;
    }
  }
  
  /**
   * Create a customer portal session for subscription management
   */
  public async createCustomerPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<{ url: string } | null> {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
      
      return { url: session.url };
    } catch (error: any) {
      ErrorHandler.logError({
        errorCode: 'create_portal_session_error',
        errorMessage: `Error creating customer portal session: ${error.message}`,
        payload: { error: error.message, customerId }
      });
      
      return null;
    }
  }
  
  /**
   * Update subscription quantity
   */
  public async updateSubscriptionQuantity(
    subscriptionId: string,
    quantity: number
  ): Promise<Stripe.Subscription | null> {
    try {
      return await stripe.subscriptions.update(subscriptionId, {
        items: [
          {
            id: (await this.getSubscription(subscriptionId))?.items.data[0].id,
            quantity,
          },
        ],
      });
    } catch (error: any) {
      ErrorHandler.logError({
        errorCode: 'update_subscription_quantity_error',
        errorMessage: `Error updating subscription quantity: ${error.message}`,
        payload: { error: error.message, subscriptionId, quantity }
      });
      
      return null;
    }
  }
  
  /**
   * Cancel subscription
   */
  public async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<Stripe.Subscription | null> {
    try {
      if (cancelAtPeriodEnd) {
        // Cancel at period end
        return await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      } else {
        // Cancel immediately
        return await stripe.subscriptions.cancel(subscriptionId);
      }
    } catch (error: any) {
      ErrorHandler.logError({
        errorCode: 'cancel_subscription_error',
        errorMessage: `Error canceling subscription: ${error.message}`,
        payload: { error: error.message, subscriptionId }
      });
      
      return null;
    }
  }
  
  /**
   * Parse subscription details into a standardized format
   */
  public parseSubscriptionDetails(subscription: Stripe.Subscription): SubscriptionDetails | null {
    try {
      const metadata = subscription.metadata || {};
      const planType = metadata.planType as SubscriptionPlanType || 'PRO';
      
      // Type assertion for Stripe subscription properties
      const subscriptionAny = subscription as any;
      
      return {
        id: subscription.id,
        customerId: typeof subscription.customer === 'string' 
          ? subscription.customer 
          : (subscription.customer as Stripe.Customer).id,
        status: subscription.status,
        planType,
        currentPeriodStart: subscriptionAny.current_period_start,
        currentPeriodEnd: subscriptionAny.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        quantity: subscription.items.data[0]?.quantity || 1,
        trialEnd: subscription.trial_end,
      };
    } catch (error: any) {
      ErrorHandler.logError({
        errorCode: 'parse_subscription_error',
        errorMessage: `Error parsing subscription details: ${error.message}`,
        payload: { error: error.message, subscriptionId: subscription.id }
      });
      
      return null;
    }
  }
}

// Singleton instance
export const stripeService = new StripeService();
