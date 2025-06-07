/**
 * Subscription Cancellation API
 * Endpoint for canceling active subscriptions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripeService, SUBSCRIPTION_PLANS } from '@/lib/billing/stripe-service';
import { prisma } from '@/lib/db/prisma';
import { ErrorHandler } from '@/lib/error-handler';

/**
 * POST /api/billing/subscription/cancel
 * Cancel an active subscription
 */
export async function POST(req: NextRequest) {
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
    
    // Get user's current subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        plan_tier: true,
        stripe_customer_id: true,
        stripe_subscription_id: true,
        subscription_status: true,
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if user has an active subscription
    if (!user.stripe_subscription_id || user.subscription_status !== 'active') {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    
    // Check if cancellation should be immediate or at period end
    const cancelAtPeriodEnd = body.cancelAtPeriodEnd !== false;
    
    // Cancel subscription
    const canceledSubscription = await stripeService.cancelSubscription(
      user.stripe_subscription_id,
      cancelAtPeriodEnd
    );
    
    if (!canceledSubscription) {
      return NextResponse.json(
        { error: 'Failed to cancel subscription' },
        { status: 500 }
      );
    }
    
    // Update user record
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscription_status: cancelAtPeriodEnd ? 'active' : 'canceled',
        // If immediate cancellation, reset to FREE plan
        ...(cancelAtPeriodEnd ? {} : { plan_tier: 'FREE' }),
      },
    });
    
    // Log the cancellation
    ErrorHandler.logError({
      errorCode: 'subscription_canceled',
      errorMessage: `Subscription ${cancelAtPeriodEnd ? 'scheduled for cancellation' : 'canceled immediately'} for user ${userId}`,
      userId,
      payload: { 
        subscriptionId: user.stripe_subscription_id,
        cancelAtPeriodEnd,
        previousPlan: user.plan_tier
      }
    });
    
    // If immediate cancellation, reset credits to FREE plan
    if (!cancelAtPeriodEnd) {
      const freeCredits = SUBSCRIPTION_PLANS.FREE.monthlyCredits;
      
      // Import creditSystem here to avoid circular dependency
      const { creditSystem } = await import('@/lib/ai/credit-system');
      
      await creditSystem.resetMonthlyCredits(
        userId,
        freeCredits,
        process.env.ADMIN_API_KEY
      );
    }
    
    return NextResponse.json({
      success: true,
      message: cancelAtPeriodEnd 
        ? 'Subscription will be canceled at the end of the billing period' 
        : 'Subscription has been canceled immediately',
      cancelAtPeriodEnd,
    });
  } catch (error: any) {
    ErrorHandler.logError({
      errorCode: 'cancel_subscription_error',
      errorMessage: `Failed to cancel subscription: ${error.message}`,
      payload: { error: error.message }
    });
    
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
