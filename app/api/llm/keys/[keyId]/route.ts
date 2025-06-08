import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { llmKeyManager } from '@/lib/ai/key-manager';
import { prisma } from '@/lib/db/prisma';
import { ErrorHandler } from '@/lib/error-handler';

/**
 * GET /api/llm/keys/[keyId]
 * 
 * Get details of a specific LLM API key (without the actual key)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { keyId: string } }
) {
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

    // Get the key details (without the actual key)
    const key = await prisma.lLMApiKey.findFirst({
      where: {
        id: params.keyId,
        user_id: user.id, // Ensure user owns this key
      },
      select: {
        id: true,
        provider: true,
        key_name: true,
        is_default: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!key) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    return NextResponse.json(key);
  } catch (error: any) {
    ErrorHandler.logError(
      ErrorHandler.createCustomError({
        errorCode: 'get_llm_key_error',
        errorMessage: error.message,
        payload: { error: error.stack }
      })
    );
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/llm/keys/[keyId]
 * 
 * Update an LLM API key (name or default status)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { keyId: string } }
) {
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
    const { keyName, isDefault } = body;

    // Check if key exists and belongs to user
    const existingKey = await prisma.lLMApiKey.findFirst({
      where: {
        id: params.keyId,
        user_id: user.id,
      },
    });

    if (!existingKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    // Update data object
    const updateData: any = {};
    if (keyName !== undefined) {
      updateData.key_name = keyName;
    }

    // Update the key
    await prisma.lLMApiKey.update({
      where: {
        id: params.keyId,
      },
      data: updateData,
    });

    // If setting as default, handle that separately
    if (isDefault === true) {
      await llmKeyManager.setDefaultKey(params.keyId, user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    ErrorHandler.logError(
      ErrorHandler.createCustomError({
        errorCode: 'update_llm_key_error',
        errorMessage: error.message,
        payload: { error: error.stack }
      })
    );
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/llm/keys/[keyId]
 * 
 * Delete an LLM API key
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { keyId: string } }
) {
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

    // Delete the key
    const success = await llmKeyManager.deleteApiKey(params.keyId, user.id);

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete API key' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    ErrorHandler.logError(
      ErrorHandler.createCustomError({
        errorCode: 'delete_llm_key_error',
        errorMessage: error.message,
        payload: { error: error.stack }
      })
    );
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
