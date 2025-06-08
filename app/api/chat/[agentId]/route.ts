import { NextRequest } from 'next/server';
import { aiService } from '@/lib/ai/service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/chat/[agentId]
 * Stream a chat response from an agent
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Verify agent exists and user has access
    const agent = await prisma.agent.findUnique({
      where: { id: params.agentId },
      include: { workspace: true },
    });

    if (!agent) {
      return new Response('Agent not found', { status: 404 });
    }

    // Check workspace access
    const hasAccess = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: agent.workspaceId,
        userId: session.user.id,
      },
    });

    if (!hasAccess) {
      return new Response('Forbidden', { status: 403 });
    }

    // Get request body
    const { message, options } = await request.json();

    // Create streaming response
    const response = await aiService.createStreamingResponse(
      params.agentId,
      message,
      options
    );

    return response;
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
