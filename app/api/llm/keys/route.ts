import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { llmKeyManager, LLMProvider } from '@/lib/ai/key-manager';
import { prisma } from '@/lib/db/prisma';
import { ErrorHandler } from '@/lib/error-handler';

/**
 * GET /api/llm/keys
 * 
 * List all LLM API keys for the authenticated user
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

    // Get all API keys for this user
    const keys = await llmKeyManager.listApiKeys(user.id);
    
    return NextResponse.json({ keys });
  } catch (error: any) {
    ErrorHandler.logError(
      ErrorHandler.createCustomError({
        errorCode: 'list_llm_keys_error',
        errorMessage: error.message,
        payload: { error: error.stack }
      })
    );
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/llm/keys
 * 
 * Create a new LLM API key
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
    const { provider, keyName, apiKey, isDefault = false } = body;

    // Validate required fields
    if (!provider || !keyName || !apiKey) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate provider
    const validProviders = ['openai', 'anthropic', 'google', 'mistral'];
    if (!validProviders.includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    // Store the API key
    const keyId = await llmKeyManager.storeApiKey(
      user.id,
      provider as LLMProvider,
      keyName,
      apiKey,
      isDefault
    );

    return NextResponse.json({ id: keyId, success: true });
  } catch (error: any) {
    ErrorHandler.logError(
      ErrorHandler.createCustomError({
        errorCode: 'create_llm_key_error',
        errorMessage: error.message,
        payload: { error: error.stack }
      })
    );
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
