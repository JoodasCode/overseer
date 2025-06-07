import { NextRequest, NextResponse } from 'next/server';
import { stripeService, SUBSCRIPTION_PLANS } from '@/lib/billing/stripe-service';
import { creditSystem } from '@/lib/ai/credit-system';
import { ErrorHandler } from '@/lib/error-handler';
import { prisma } from '@/lib/db/prisma';

/**
 * POST /api/billing/webhook
 * 
 * Handle Stripe webhook events
 */
export async function POST(req: NextRequest) {
  try {
    // Get the signature from the header
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }
    
    // Get the raw body
    const payload = await req.text();
    
    // Verify webhook signature and parse event
    const { success, event } = await stripeService.handleWebhookEvent(
      Buffer.from(payload),
      signature
    );
    
    if (!success || !event) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }
    
    // Handle the event based on its type
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        
        // Verify that payment was successful
        if (session.payment_status === 'paid') {
          // Extract metadata
          const userId = session.metadata?.userId;
          const creditAmount = parseInt(session.metadata?.creditAmount || '0', 10);
          const mode = session.mode;
          
          if (!userId) {
            throw new Error('Missing userId in session metadata');
          }
          
          if (mode === 'payment' && creditAmount) {
            // Handle one-time credit purchase
            await creditSystem.addCredits(
              userId,
              creditAmount,
              process.env.ADMIN_API_KEY,
              'stripe_purchase'
            );
            
            // Log successful credit purchase
            ErrorHandler.logError({
              errorCode: 'credit_purchase_success',
              errorMessage: `Successfully added ${creditAmount} credits to user ${userId}`,
              userId,
              payload: { 
                creditAmount, 
                sessionId: session.id,
                paymentIntent: session.payment_intent
              }
            });
          } else if (mode === 'subscription') {
            // For subscription checkouts, the subscription is created but we'll handle
            // the actual subscription details in the subscription.created event
            ErrorHandler.logError({
              errorCode: 'subscription_checkout_completed',
              errorMessage: `Subscription checkout completed for user ${userId}`,
              userId,
              payload: { 
                sessionId: session.id,
                subscriptionId: session.subscription
              }
            });
          }
        }
        break;
      }
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;
        
        // Find user with this Stripe customer ID
        const user = await prisma.user.findFirst({
          where: { stripe_customer_id: customerId },
        });
        
        if (!user) {
          throw new Error(`No user found with Stripe customer ID: ${customerId}`);
        }
        
        // Get subscription details
        const subscriptionDetails = stripeService.parseSubscriptionDetails(subscription);
        
        if (!subscriptionDetails) {
          throw new Error(`Failed to parse subscription details for subscription ID: ${subscription.id}`);
        }
        
        const planType = subscriptionDetails.planType;
        
        if (!planType || !SUBSCRIPTION_PLANS[planType]) {
          throw new Error(`Invalid plan type: ${planType}`);
        }
        
        // Update user's subscription details
        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan_tier: planType,
            stripe_subscription_id: subscription.id,
            subscription_status: subscriptionDetails.status,
            subscription_period_end: new Date(subscription.current_period_end * 1000),
            subscription_quantity: subscriptionDetails.quantity || 1,
          },
        });
        
        // Reset monthly credits based on the plan
        if (subscriptionDetails.status === 'active') {
          const planCredits = SUBSCRIPTION_PLANS[planType].monthlyCredits * (subscriptionDetails.quantity || 1);
          
          // Add the plan's monthly credits
          await creditSystem.resetMonthlyCredits(
            user.id,
            planCredits,
            process.env.ADMIN_API_KEY
          );
          
          ErrorHandler.logError({
            errorCode: 'subscription_credits_reset',
            errorMessage: `Reset monthly credits to ${planCredits} for user ${user.id}`,
            userId: user.id,
            payload: { 
              planType,
              planCredits,
              subscriptionId: subscription.id
            }
          });
        }
        
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;
        
        // Find user with this Stripe customer ID
        const user = await prisma.user.findFirst({
          where: { stripe_customer_id: customerId },
        });
        
        if (!user) {
          throw new Error(`No user found with Stripe customer ID: ${customerId}`);
        }
        
        // Update user's subscription details
        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan_tier: 'FREE',
            subscription_status: 'canceled',
            // Keep the subscription_id for reference
          },
        });
        
        // Reset to free plan credits
        await creditSystem.resetMonthlyCredits(
          user.id,
          SUBSCRIPTION_PLANS.FREE.monthlyCredits,
          process.env.ADMIN_API_KEY
        );
        
        ErrorHandler.logError({
          errorCode: 'subscription_canceled',
          errorMessage: `Subscription canceled for user ${user.id}`,
          userId: user.id,
          payload: { 
            subscriptionId: subscription.id
          }
        });
        
        break;
      }
      
      case 'invoice.paid': {
        const invoice = event.data.object as any;
        const customerId = invoice.customer;
        const subscriptionId = invoice.subscription;
        
        if (!subscriptionId) {
          // Not a subscription invoice
          break;
        }
        
        // Find user with this Stripe customer ID
        const user = await prisma.user.findFirst({
          where: { stripe_customer_id: customerId },
        });
        
        if (!user) {
          throw new Error(`No user found with Stripe customer ID: ${customerId}`);
        }
        
        // Get subscription details
        const subscription = await stripeService.getSubscription(subscriptionId);
        if (!subscription) {
          throw new Error(`Could not retrieve subscription: ${subscriptionId}`);
        }
        
        const subscriptionDetails = stripeService.parseSubscriptionDetails(subscription);
        if (!subscriptionDetails) {
          throw new Error(`Failed to parse subscription details for subscription ID: ${subscriptionId}`);
        }
        
        const planType = subscriptionDetails.planType;
        
        if (!planType || !SUBSCRIPTION_PLANS[planType]) {
          throw new Error(`Invalid plan type: ${planType}`);
        }
        
        // Reset monthly credits based on the plan for recurring invoices
        const planCredits = SUBSCRIPTION_PLANS[planType].monthlyCredits * (subscriptionDetails.quantity || 1);
        
        await creditSystem.resetMonthlyCredits(
          user.id,
          planCredits,
          process.env.ADMIN_API_KEY
        );
        
        ErrorHandler.logError({
          errorCode: 'subscription_renewed',
          errorMessage: `Subscription renewed for user ${user.id}`,
          userId: user.id,
          payload: { 
            planType,
            planCredits,
            subscriptionId,
            invoiceId: invoice.id
          }
        });
        
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const customerId = invoice.customer;
        const subscriptionId = invoice.subscription;
        
        if (!subscriptionId) {
          // Not a subscription invoice
          break;
        }
        
        // Find user with this Stripe customer ID
        const user = await prisma.user.findFirst({
          where: { stripe_customer_id: customerId },
        });
        
        if (!user) {
          throw new Error(`No user found with Stripe customer ID: ${customerId}`);
        }
        
        // Update subscription status to reflect payment failure
        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscription_status: 'past_due',
          },
        });
        
        ErrorHandler.logError({
          errorCode: 'subscription_payment_failed',
          errorMessage: `Subscription payment failed for user ${user.id}`,
          userId: user.id,
          payload: { 
            subscriptionId,
            invoiceId: invoice.id
          }
        });
        
        break;
      }
    }
    
    // Return a 200 response to acknowledge receipt of the event
    return NextResponse.json({ received: true });
  } catch (error: any) {
    ErrorHandler.logError({
      errorCode: 'webhook_handler_error',
      errorMessage: error.message,
      payload: { error: error.stack }
    });
    
    // Still return a 200 to prevent Stripe from retrying
    return NextResponse.json({ error: error.message }, { status: 200 });
  }
}

// Disable body parsing for webhook endpoint to get raw body
export const config = {
  api: {
    bodyParser: false,
  },
};
