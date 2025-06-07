/**
 * Subscription Quantity Management API
 * Endpoints for updating subscription quantities for Teams and Enterprise plans
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripeService, SUBSCRIPTION_PLANS } from '@/lib/billing/stripe-service';
import { prisma } from '@/lib/db/prisma';
import { ErrorHandler } from '@/lib/error-handler';

/**
 * PATCH /api/billing/subscription/quantity
 * Update subscription quantity for Teams and Enterprise plans
 */
export async function PATCH(req: NextRequest) {
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
        subscription_quantity: true,
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
    
    // Check if plan is Teams or Enterprise
    if (user.plan_tier !== 'TEAMS' && user.plan_tier !== 'ENTERPRISE') {
      return NextResponse.json(
        { error: 'Quantity updates are only available for Teams and Enterprise plans' },
        { status: 400 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    
    // Validate quantity
    const quantity = parseInt(body.quantity, 10);
    if (isNaN(quantity) || quantity < 1) {
      return NextResponse.json(
        { error: 'Invalid quantity. Must be a positive integer.' },
        { status: 400 }
      );
    }
    
    // Update subscription quantity
    const updatedSubscription = await stripeService.updateSubscriptionQuantity(
      user.stripe_subscription_id,
      quantity
    );
    
    if (!updatedSubscription) {
      return NextResponse.json(
        { error: 'Failed to update subscription quantity' },
        { status: 500 }
      );
    }
    
    // Update user record
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscription_quantity: quantity,
      },
    });
    
    // Calculate new credit allocation based on updated quantity
    const subscriptionDetails = stripeService.parseSubscriptionDetails(updatedSubscription);
    if (subscriptionDetails && subscriptionDetails.planType) {
      const planType = subscriptionDetails.planType;
      const planCredits = SUBSCRIPTION_PLANS[planType].monthlyCredits * quantity;
      
      // Log the quantity update
      ErrorHandler.logError({
        errorCode: 'subscription_quantity_updated',
        errorMessage: `Updated subscription quantity to ${quantity} for user ${userId}`,
        userId,
        payload: { 
          planType,
          oldQuantity: user.subscription_quantity || 1,
          newQuantity: quantity,
          newCreditAllocation: planCredits,
          subscriptionId: user.stripe_subscription_id
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Subscription quantity updated successfully',
      quantity,
    });
  } catch (error: any) {
    ErrorHandler.logError({
      errorCode: 'update_subscription_quantity_error',
      errorMessage: `Failed to update subscription quantity: ${error.message}`,
      payload: { error: error.message }
    });
    
    return NextResponse.json(
      { error: 'Failed to update subscription quantity' },
      { status: 500 }
    );
  }
}
