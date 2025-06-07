import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { creditSystem } from '@/lib/ai/credit-system';
import { prisma } from '@/lib/db/prisma';
import { ErrorHandler } from '@/lib/error-handler';

/**
 * GET /api/billing/credits
 * 
 * Get credit usage information for the authenticated user
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
      select: { id: true, plan_tier: true, credits_used: true, credits_added: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get credit summary
    const creditSummary = await creditSystem.getUserCreditSummary(user.id);
    
    return NextResponse.json(creditSummary);
  } catch (error: any) {
    ErrorHandler.logError({
      errorCode: 'get_credits_error',
      errorMessage: error.message,
      payload: { error: error.stack }
    });
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/billing/credits/add
 * 
 * Add credits to the user's account (admin only or via payment)
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
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse request body
    const body = await req.json();
    const { credits, targetUserId, adminKey } = body;

    // Validate credits
    if (!credits || typeof credits !== 'number' || credits <= 0) {
      return NextResponse.json({ error: 'Invalid credit amount' }, { status: 400 });
    }

    // If adding credits to another user, verify admin status
    if (targetUserId && targetUserId !== user.id) {
      // Check if user is admin by verifying admin key
      const isAdmin = adminKey === process.env.ADMIN_API_KEY;
      
      if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized admin action' }, { status: 403 });
      }
      
      // Add credits to target user
      await creditSystem.addCredits(targetUserId, credits);
      
      return NextResponse.json({ success: true });
    }

    // Add credits to the authenticated user (this would typically be after payment)
    // In a real implementation, this would verify payment was successful
    await creditSystem.addCredits(user.id, credits);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    ErrorHandler.logError({
      errorCode: 'add_credits_error',
      errorMessage: error.message,
      payload: { error: error.stack }
    });
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
