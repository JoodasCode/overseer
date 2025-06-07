import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { stripeService } from '@/lib/billing/stripe-service';
import { creditSystem } from '@/lib/ai/credit-system';
import { prisma } from '@/lib/db/prisma';
import { ErrorHandler } from '@/lib/error-handler';

/**
 * GET /api/billing/checkout/verify
 * 
 * Verify a checkout session and add credits if payment was successful
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID from session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get session ID from query params
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Retrieve checkout session from Stripe
    const checkoutSession = await stripeService.getCheckoutSession(sessionId);

    if (!checkoutSession) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
    }

    // Verify that the session belongs to the authenticated user
    if (checkoutSession.metadata?.userId !== user.id) {
      return NextResponse.json({ error: 'Session does not belong to the authenticated user' }, { status: 403 });
    }

    // Check if payment was successful
    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json({
        success: false,
        status: checkoutSession.payment_status,
        message: 'Payment has not been completed',
      });
    }

    // Extract credit amount from metadata
    const creditAmount = parseInt(checkoutSession.metadata?.creditAmount || '0', 10);

    if (!creditAmount) {
      return NextResponse.json({ error: 'Invalid credit amount in session metadata' }, { status: 400 });
    }

    // Check if credits have already been added for this session
    const existingAuditLog = await prisma.creditAuditLog.findFirst({
      where: {
        userId: user.id,
        operationType: 'add',
        metadata: {
          path: ['sessionId'],
          equals: sessionId,
        },
      },
    });

    // If credits have already been added, return success without adding again
    if (existingAuditLog) {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        creditAmount,
        message: 'Credits have already been added to your account',
      });
    }

    // Add credits to the user's account
    await creditSystem.addCredits(
      user.id,
      creditAmount,
      process.env.ADMIN_API_KEY,
      'stripe_purchase',
      { sessionId, paymentIntent: checkoutSession.payment_intent }
    );

    return NextResponse.json({
      success: true,
      creditAmount,
      message: `${creditAmount} credits have been added to your account`,
    });
  } catch (error: any) {
    ErrorHandler.logError({
      errorCode: 'verify_checkout_session_error',
      errorMessage: error.message,
      payload: { error: error.stack }
    });
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
