import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { stripeService, CREDIT_PACKAGES } from '@/lib/billing/stripe-service';
import { prisma } from '@/lib/db/prisma';
import { ErrorHandler } from '@/lib/error-handler';

/**
 * GET /api/billing/checkout
 * 
 * Get available credit packages
 */
export async function GET() {
  try {
    return NextResponse.json({
      packages: CREDIT_PACKAGES,
    });
  } catch (error: any) {
    ErrorHandler.logError({
      errorCode: 'get_credit_packages_error',
      errorMessage: error.message,
      payload: { error: error.stack }
    });
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/billing/checkout
 * 
 * Create a checkout session for credit purchase
 */
export async function POST(req: NextRequest) {
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

    // Parse request body
    const body = await req.json();
    const { packageId, successUrl, cancelUrl } = body;

    // Validate package ID
    if (!packageId || !CREDIT_PACKAGES.some(pkg => pkg.id === packageId)) {
      return NextResponse.json({ error: 'Invalid package ID' }, { status: 400 });
    }

    // Validate URLs
    if (!successUrl || !cancelUrl) {
      return NextResponse.json({ error: 'Success and cancel URLs are required' }, { status: 400 });
    }

    // Create checkout session
    const checkoutSession = await stripeService.createCheckoutSession(
      user.id,
      packageId,
      successUrl,
      cancelUrl
    );

    if (!checkoutSession) {
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }

    return NextResponse.json(checkoutSession);
  } catch (error: any) {
    ErrorHandler.logError({
      errorCode: 'create_checkout_session_error',
      errorMessage: error.message,
      payload: { error: error.stack }
    });
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
