/**
 * Subscription Management API
 * Endpoints for creating and managing subscription plans
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripeService, SUBSCRIPTION_PLANS, SubscriptionPlanType } from '@/lib/billing/stripe-service';
import { prisma } from '@/lib/db/prisma';
import { ErrorHandler } from '@/lib/error-handler';

/**
 * GET /api/billing/subscription
 * Get available subscription plans and current subscription status
 */
export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Get user's current subscription from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        plan_tier: true,
        stripe_customer_id: true,
        stripe_subscription_id: true,
        subscription_status: true,
        subscription_period_end: true,
        subscription_quantity: true,
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Get subscription details from Stripe if available
    let subscriptionDetails = null;
    if (user.stripe_subscription_id) {
      const subscription = await stripeService.getSubscription(user.stripe_subscription_id);
      if (subscription) {
        subscriptionDetails = stripeService.parseSubscriptionDetails(subscription);
      }
    }
    
    // Return subscription plans and current subscription status
    return NextResponse.json({
      plans: SUBSCRIPTION_PLANS,
      currentPlan: user.plan_tier || 'FREE',
      subscription: subscriptionDetails || {
        status: user.subscription_status || 'inactive',
        periodEnd: user.subscription_period_end,
        quantity: user.subscription_quantity || 1,
      },
    });
  } catch (error: any) {
    ErrorHandler.logError({
      errorCode: 'get_subscription_plans_error',
      errorMessage: `Failed to get subscription plans: ${error.message}`,
      payload: { error: error.message }
    });
    
    return NextResponse.json(
      { error: 'Failed to get subscription plans' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/billing/subscription
 * Create a subscription checkout session
 */
export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const userEmail = session.user.email;
    
    // Parse request body
    const body = await req.json();
    
    // Validate request
    if (!body.planType) {
      return NextResponse.json(
        { error: 'Plan type is required' },
        { status: 400 }
      );
    }
    
    const planType = body.planType as SubscriptionPlanType;
    const quantity = parseInt(body.quantity || '1', 10);
    
    if (planType === 'FREE') {
      // Handle free plan upgrade directly without Stripe
      await prisma.user.update({
        where: { id: userId },
        data: {
          plan_tier: 'FREE',
          subscription_status: 'active',
        },
      });
      
      return NextResponse.json({
        success: true,
        message: 'Successfully switched to Free plan',
      });
    }
    
    // Get success and cancel URLs
    const successUrl = body.successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`;
    const cancelUrl = body.cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/billing/cancel`;
    
    // Create subscription checkout session
    const checkoutSession = await stripeService.createSubscriptionSession(
      userId,
      userEmail,
      planType,
      quantity,
      successUrl,
      cancelUrl
    );
    
    if (!checkoutSession) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(checkoutSession);
  } catch (error: any) {
    ErrorHandler.logError({
      errorCode: 'create_subscription_session_error',
      errorMessage: `Failed to create subscription session: ${error.message}`,
      payload: { error: error.message }
    });
    
    return NextResponse.json(
      { error: 'Failed to create subscription session' },
      { status: 500 }
    );
  }
}
