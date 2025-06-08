import { NextRequest, NextResponse } from 'next/server';
import { pauseWorkflow } from '@/lib/workflow/scheduler';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    pauseWorkflow(id);
    return NextResponse.json({ success: true, message: `Workflow ${id} paused.` });
  } catch (error) {
    console.error('Error pausing workflow:', error);
    return NextResponse.json(
      { error: 'Failed to pause workflow', details: (error as Error).message },
      { status: 500 }
    );
  }
} 