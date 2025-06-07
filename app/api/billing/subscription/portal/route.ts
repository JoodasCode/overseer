/**
 * Customer Portal API
 * Endpoint for creating Stripe Customer Portal sessions for subscription management
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripeService } from '@/lib/billing/stripe-service';
import { prisma } from '@/lib/db/prisma';
import { ErrorHandler } from '@/lib/error-handler';

/**
 * POST /api/billing/subscription/portal
 * Create a customer portal session for subscription management
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
    
    // Get user's Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripe_customer_id: true },
    });
    
    if (!user || !user.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    
    // Get return URL
    const returnUrl = body.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/billing`;
    
    // Create customer portal session
    const portalSession = await stripeService.createCustomerPortalSession(
      user.stripe_customer_id,
      returnUrl
    );
    
    if (!portalSession) {
      return NextResponse.json(
        { error: 'Failed to create customer portal session' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(portalSession);
  } catch (error: any) {
    ErrorHandler.logError({
      errorCode: 'create_portal_session_error',
      errorMessage: `Failed to create customer portal session: ${error.message}`,
      payload: { error: error.message }
    });
    
    return NextResponse.json(
      { error: 'Failed to create customer portal session' },
      { status: 500 }
    );
  }
}
